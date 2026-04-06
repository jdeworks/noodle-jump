/** Online multiplayer session — wires networking to the game loop. Supports N peers. */
import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GameScene } from "../scenes/GameScene";
import { GAME_WIDTH, GAME_HEIGHT, DEBUG_MODE } from "../config/constants";
import { playMusic, stopMusic, killBossMusic } from "../systems/Audio";
import { resetPlatformIds } from "../entities/Platform";
import { resetPowerUpIds } from "../entities/PowerUp";
import { resetCollectibleIds } from "../entities/Collectible";
import { resetEnemyIds } from "../entities/Enemy";
import { resetProjectileIds } from "../entities/Projectile";
import { resetRNG } from "../systems/RNG";
import { resetRendererState } from "../scenes/EntityRenderer";
import { createDefaultRunConfig, type RunConfig } from "../systems/CustomRunConfig";
import { createDebugConfig, setDebugConfig } from "../config/debug";
import { showTitleScreen } from "../ui/TitleScreenView";
import { launchGame } from "../scenes/GameLauncher";
import { ConnectionManager } from "./ConnectionManager";
import { GameSync, type PlayerSyncState, type GameSyncEvent } from "./GameSync";
import { InterpolationBuffer } from "./InterpolationBuffer";
import { RemotePlayerRenderer, type RemoteCosmetics } from "./RemotePlayerRenderer";
import { LobbyScreen, getPlayerName } from "./LobbyScreen";
import { setTouchControlsForced } from "../systems/TiltSettings";
import { CountdownAnim } from "./CountdownAnim";
import { showOnlineResults, getPeerColor, type PlayerResult } from "./OnlineResults";
import { LiveLeaderboard } from "./LiveLeaderboard";

export type OnlineRole = "host" | "guest";

interface RemotePeer {
  renderer: RemotePlayerRenderer;
  interpolation: InterpolationBuffer;
  dead: boolean;
  deathHeight: number;
  lastKnownHeight: number; // continuously updated from interpolation
  character: string;
  cosmetics?: RemoteCosmetics;
  colorIndex: number;
  name: string;
}

export interface OnlineSessionConfig {
  app: Application;
  connection: ConnectionManager;
  seed: number;
  role: OnlineRole;
  mode?: string;
  touchControls?: boolean;
  /** Map of peerId → { character, cosmetics, name } for all known remote peers. */
  remotePeers?: Map<string, { character: string; cosmetics?: RemoteCosmetics; name?: string }>;
  sync?: GameSync;
  sharedRunConfig?: RunConfig;
  localName?: string;
}

export class OnlineSession {
  private app: Application;
  private connection: ConnectionManager;
  private sync: GameSync;
  private scene: GameScene;
  private peers = new Map<string, RemotePeer>();
  private role: OnlineRole;
  private seed: number;
  private touchControls: boolean;
  private mode: string;
  private localName: string;
  private timerDurationMs = -1;
  private timerStartTime = 0;
  private timerText: Text | null = null;
  private countdownAnim = new CountdownAnim();
  private leaderboard: LiveLeaderboard;

  private localDead = false;
  private localDeathHeight = 0;
  private gameLoop: (() => void) | null = null;
  private deathToast: Text;
  private toastTimer = 0;
  private fpsText: Text | null = null;
  private fpsFrames = 0;
  private fpsLast = performance.now();

  private countdownDim: Graphics | null = null;
  private countdownText: Text | null = null;
  private spectateText: Text | null = null;
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;
  private pause: import("./PauseOverlay").PauseOverlay | null = null;
  private resultsShown = false;
  private connDot: Graphics | null = null;
  private nextColorIndex = 0;

  constructor(config: OnlineSessionConfig) {
    this.app = config.app;
    this.connection = config.connection;
    this.role = config.role;
    this.seed = config.seed;
    this.touchControls = config.touchControls ?? false;
    this.mode = config.mode ?? "best-height";
    this.localName = config.localName ?? "";
    this.sync = config.sync ?? new GameSync();
    this.leaderboard = new LiveLeaderboard();

    this.connection.on({
      onStateChange: (s) => { if ((s === "failed" || s === "disconnected") && !this.resultsShown) setTimeout(() => this.goHome(), 0); },
      onError: () => { if (!this.resultsShown) setTimeout(() => this.goHome(), 0); },
      onDataChannel: () => {}, onRoom: () => {},
    });

    if (!config.sharedRunConfig) setDebugConfig(createDebugConfig());
    const runConfig: RunConfig = config.sharedRunConfig
      ? { ...config.sharedRunConfig, seed: config.seed }
      : { ...createDefaultRunConfig(), seed: config.seed };
    this.scene = new GameScene(runConfig);

    // Apply theme from first peer's cosmetics (host sets it)
    const firstPeerCos = config.remotePeers?.values().next().value;
    if (firstPeerCos?.cosmetics?.theme) this.scene.setCosmeticTheme(firstPeerCos.cosmetics.theme as string);
    if (this.mode === "timed-2min") this.scene.enableTimedRespawn();
    else this.scene.enableGhostMode();
    this.scene.initInput(this.app.canvas);
    setTouchControlsForced(this.touchControls);
    if (!this.touchControls && this.scene.input.needsTiltPermission) this.scene.input.requestTiltPermission();
    this.app.stage.addChild(this.scene.container);

    // Initialize remote peers
    if (config.remotePeers) {
      for (const [peerId, info] of config.remotePeers) {
        this.addPeer(peerId, info.character, info.cosmetics, info.name);
      }
    }

    // Local player in leaderboard
    const localLabel = config.localName || "You";
    this.leaderboard.addPlayer("__local__", localLabel, this.nextColorIndex++, true);

    this.deathToast = this.makeToast();
    this.fpsText = this.makeFps();
    this.connDot = new Graphics();
    this.connDot.circle(GAME_WIDTH - 15, 15, 6); this.connDot.fill(0x44ff44);
    this.makeCountdown();
    this.app.stage.addChild(this.deathToast);
    if (this.fpsText) this.app.stage.addChild(this.fpsText);
    this.app.stage.addChild(this.connDot);
    this.app.stage.addChild(this.leaderboard.container);
    this.setupSync();
  }

  private addPeer(peerId: string, character = "chef", cosmetics?: RemoteCosmetics, name?: string): RemotePeer {
    if (this.peers.has(peerId)) return this.peers.get(peerId)!;
    const colorIndex = this.nextColorIndex++;
    const disableTrail = this.peers.size >= 7;
    const cos = disableTrail ? { tint: cosmetics?.tint } : cosmetics;
    const renderer = new RemotePlayerRenderer(character, cos);
    renderer.hide();
    this.app.stage.addChild(renderer.container);
    const label = name || peerId.slice(0, 6);
    const peer: RemotePeer = {
      renderer, interpolation: new InterpolationBuffer(),
      dead: false, deathHeight: 0, lastKnownHeight: 0,
      character, cosmetics, colorIndex, name: label,
    };
    this.peers.set(peerId, peer);
    this.leaderboard.addPlayer(peerId, label, colorIndex, false);
    return peer;
  }

  private removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    peer.renderer.destroy();
    this.peers.delete(peerId);
    this.leaderboard.removePlayer(peerId);
  }

  private setupSync(): void {
    this.sync.on({
      onRemotePosition: (state: PlayerSyncState, peerId: string) => {
        let peer = this.peers.get(peerId);
        if (!peer) peer = this.addPeer(peerId);
        peer.interpolation.pushUpdate(state.x, state.y, state.vx, state.vy, state.state);
      },
      onRemoteEvent: (event: GameSyncEvent, peerId: string) => {
        this.handleRemoteEvent(event, peerId);
      },
    });
  }

  async start(): Promise<void> {
    this.scene.startCountdown();
    this.sync.startSending();
    playMusic(0);
    if (this.touchControls) this.showToast("Touch controls enabled for fairness");

    if (this.mode === "timed-2min") {
      this.timerDurationMs = 120_000;
      this.timerStartTime = performance.now();
      this.timerText = new Text({ text: "2:00", style: new TextStyle({ fontFamily: "monospace",
        fontSize: 18, fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 3 } }) });
      this.timerText.x = GAME_WIDTH / 2; this.timerText.y = 20; this.timerText.anchor.set(0.5, 0.5);
      this.app.stage.addChild(this.timerText);
    }

    if (this.fpsText) { this.app.stage.removeChild(this.fpsText); this.app.stage.addChild(this.fpsText); }

    const { PauseOverlay } = await import("./PauseOverlay");
    this.pause = new PauseOverlay(this.app, GAME_WIDTH, GAME_HEIGHT, () => this.goHome());
    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !this.resultsShown && this.pause) {
        this.pause.toggle();
        this.sync.sendGameEvent({ type: "ready", payload: { paused: this.pause.paused } });
      }
    };
    window.addEventListener("keydown", this.escapeHandler);
    this.gameLoop = () => { this.tick(); };
    this.app.ticker.add(this.gameLoop);
  }

  private tick(): void {
    if (this.resultsShown || this.pause?.paused) return;
    this.scene.update();
    const state = this.scene.getState();

    this.sync.updateLocalState(state.player.x, state.player.y, state.player.vx, state.player.vy,
      this.localDead ? (state.gameOver ? 2 : 1) : 0);

    if (!this.localDead && state.isDying) {
      this.localDead = true;
      this.localDeathHeight = state.scoreState.height;
      this.sync.sendGameEvent({ type: "death", payload: { height: this.localDeathHeight } });
      this.leaderboard.setDead("__local__", true);
    }

    // Update leaderboard with local height
    this.leaderboard.updateHeight("__local__", state.scoreState.height);

    // Render all remote peers + track live height
    for (const [peerId, peer] of this.peers) {
      if (!peer.interpolation.isReady) continue;
      const rs = peer.interpolation.getState();
      peer.renderer.update(rs, state.camera.y, state.player.y);
      const h = Math.abs(Math.round(rs.y / 10));
      peer.lastKnownHeight = Math.max(peer.lastKnownHeight, h);
      this.leaderboard.updateHeight(peerId, peer.lastKnownHeight);
    }

    // Spectate mode label
    if (state.gameOver && !this.allRemoteDead()) {
      if (!this.spectateText) {
        this.spectateText = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace", fontSize: 16, fill: "#ffdd44", fontWeight: "bold", align: "center", stroke: { color: "#000000", width: 3 } }) });
        this.spectateText.x = GAME_WIDTH / 2; this.spectateText.y = 50; this.spectateText.anchor.set(0.5, 0.5); this.app.stage.addChild(this.spectateText);
      }
      const alive = [...this.peers.values()].filter((p) => !p.dead).length;
      this.spectateText.text = `Spectating — ${alive} player${alive !== 1 ? "s" : ""} remaining`;
    }
    if (this.countdownText && this.countdownDim) this.countdownAnim.update(this.scene.getCountdownSeconds(), this.countdownText, this.countdownDim);

    // Timed mode countdown
    if (this.timerDurationMs > 0) {
      const elapsed = performance.now() - this.timerStartTime;
      const remain = Math.max(0, this.timerDurationMs - elapsed);
      const secs = Math.ceil(remain / 1000);
      const m = Math.floor(secs / 60), s = secs % 60;
      if (this.timerText) this.timerText.text = `${m}:${s.toString().padStart(2, "0")}`;
      if (remain <= 0 && !this.resultsShown) { this.resultsShown = true; this.showResults(); return; }
    }

    // Connection quality (worst of all peers)
    if (this.connDot) {
      let worstMs = 0;
      for (const p of this.peers.values()) worstMs = Math.max(worstMs, p.interpolation.msSinceLastUpdate);
      const c = worstMs < 200 ? 0x44ff44 : worstMs < 500 ? 0xffcc00 : 0xff4444;
      this.connDot.clear(); this.connDot.circle(GAME_WIDTH - 15, 15, 6); this.connDot.fill(c);
    }
    this.fpsFrames++; const now = performance.now();
    if (now - this.fpsLast >= 500 && this.fpsText) { this.fpsText.text = `FPS: ${Math.round(this.fpsFrames / ((now - this.fpsLast) / 1000))}`; this.fpsFrames = 0; this.fpsLast = now; }
    if (this.toastTimer > 0 && --this.toastTimer === 0) this.deathToast.visible = false;
    this.leaderboard.tick();
    if (this.mode !== "timed-2min" && this.localDead && this.allRemoteDead() && !this.resultsShown) { this.resultsShown = true; this.showResults(); }
  }

  private allRemoteDead(): boolean {
    if (this.peers.size === 0) return false;
    for (const p of this.peers.values()) if (!p.dead) return false; return true;
  }

  private handleRemoteEvent(event: GameSyncEvent, peerId: string): void {
    if (event.type === "death") {
      let peer = this.peers.get(peerId);
      if (!peer) peer = this.addPeer(peerId);
      peer.dead = true;
      peer.deathHeight = (event.payload.height as number) || peer.lastKnownHeight;
      this.leaderboard.setDead(peerId, true);
      this.showToast(`${peer.name} died at ${peer.deathHeight}m!`);
    }
    if (event.type === "ready" && event.payload.paused !== undefined && this.pause) {
      const shouldPause = event.payload.paused as boolean;
      if (shouldPause !== this.pause.paused) this.pause.toggle();
    }
  }

  private showToast(msg: string): void { this.deathToast.text = msg; this.deathToast.visible = true; this.toastTimer = 180; }

  private showResults(): void {
    if (this.gameLoop) { this.app.ticker.remove(this.gameLoop); this.gameLoop = null; }
    this.scene.forceStop(); this.sync.stopSending();
    const localH = this.localDead ? this.localDeathHeight : this.scene.getMaxHeight();
    const results: PlayerResult[] = [{
      peerId: "__local__", label: this.localName || `You (${this.role})`, height: localH,
      score: this.scene.getScore(), isLocal: true, color: getPeerColor(0),
    }];
    for (const [id, p] of this.peers) {
      // Use deathHeight if dead, otherwise lastKnownHeight from live tracking
      const h = p.dead ? (p.deathHeight || p.lastKnownHeight) : p.lastKnownHeight;
      results.push({ peerId: id, label: p.name, height: h, score: 0, isLocal: false, color: getPeerColor(p.colorIndex) });
    }
    showOnlineResults(this.app, results, this.mode, () => this.returnToLobby(), () => this.goHome());
  }

  private returnToLobby(): void {
    this.cleanup();
    const sync = new GameSync();
    const mode = this.connection.getMode();
    if (mode === "nostr") { const room = this.connection.getRoom(); if (room) sync.initWithRoom(room); }
    else { const ch = this.connection.getChannel(); if (ch) sync.initWithChannel(ch); }

    const lobby = new LobbyScreen(this.role, sync, {
      onStart: (seed, _mode, _tc, rp, sharedRunConfig) => {
        this.app.stage.removeChild(lobby.container); lobby.destroy();
        this.localName = getPlayerName();
        this.startNewGame(seed, sync, _mode, _tc, rp, sharedRunConfig);
      },
    });
    this.app.stage.addChild(lobby.container);
  }

  private startNewGame(
    newSeed: number, sync: GameSync, mode: string, tc: boolean,
    remotePeers?: Map<string, { character: string; cosmetics?: RemoteCosmetics; name?: string }>, sharedRunConfig?: RunConfig,
  ): void {
    this.seed = newSeed; this.localDead = false; this.localDeathHeight = 0;
    this.resultsShown = false; this.sync = sync; this.mode = mode;
    this.touchControls = tc; this.nextColorIndex = 0; this.peers.clear();
    setDebugConfig(createDebugConfig());
    const rc = sharedRunConfig ? { ...sharedRunConfig, seed: newSeed } : { ...createDefaultRunConfig(), seed: newSeed };
    this.scene = new GameScene(rc);
    const firstCos = remotePeers?.values().next().value;
    if (firstCos?.cosmetics?.theme) this.scene.setCosmeticTheme(firstCos.cosmetics.theme as string);
    this.scene.enableGhostMode(); this.scene.initInput(this.app.canvas);
    if (tc) setTouchControlsForced(true);
    else if (this.scene.input.needsTiltPermission) this.scene.input.requestTiltPermission();
    this.app.stage.addChild(this.scene.container);
    this.leaderboard = new LiveLeaderboard();
    this.leaderboard.addPlayer("__local__", this.localName || "You", this.nextColorIndex++, true);
    if (remotePeers) for (const [pid, info] of remotePeers) this.addPeer(pid, info.character, info.cosmetics, info.name);
    this.deathToast = this.makeToast(); this.fpsText = this.makeFps();
    this.connDot = new Graphics(); this.connDot.circle(GAME_WIDTH - 15, 15, 6); this.connDot.fill(0x44ff44);
    this.makeCountdown(); this.app.stage.addChild(this.deathToast);
    if (this.fpsText) this.app.stage.addChild(this.fpsText);
    this.app.stage.addChild(this.connDot); this.app.stage.addChild(this.leaderboard.container);
    this.setupSync(); this.start();
  }

  private makeToast(): Text {
    const t = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace", fontSize: 16, fill: "#ff6666", fontWeight: "bold", stroke: { color: "#000000", width: 3 } }) });
    t.x = GAME_WIDTH / 2; t.y = GAME_HEIGHT * 0.15; t.anchor.set(0.5, 0.5); t.visible = false; return t;
  }
  private makeFps(): Text | null {
    if (!DEBUG_MODE) return null;
    const t = new Text({ text: "FPS: --", style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#00ff00", stroke: { color: "#000000", width: 2 } }) });
    t.x = 10; t.y = GAME_HEIGHT - 16; return t;
  }
  private makeCountdown(): void {
    this.countdownDim = new Graphics(); this.countdownDim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.countdownDim.fill({ color: 0x000000, alpha: 0.4 }); this.app.stage.addChild(this.countdownDim);
    this.countdownText = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace", fontSize: 48, fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 4 } }) });
    this.countdownText.x = GAME_WIDTH / 2; this.countdownText.y = GAME_HEIGHT * 0.4;
    this.countdownText.anchor.set(0.5, 0.5); this.app.stage.addChild(this.countdownText);
  }
  private cleanup(): void {
    if (this.gameLoop) { this.app.ticker.remove(this.gameLoop); this.gameLoop = null; }
    this.sync.stopSending();
    if (this.scene.container.parent) this.scene.container.parent.removeChild(this.scene.container);
    this.scene.destroy();
    for (const peer of this.peers.values()) peer.renderer.destroy();
    this.peers.clear();
    this.leaderboard.destroy();
    while (this.app.stage.children.length > 0) {
      const c = this.app.stage.children[0]; this.app.stage.removeChild(c); c.destroy({ children: true });
    }
    resetPlatformIds(); resetPowerUpIds(); resetCollectibleIds();
    resetEnemyIds(); resetProjectileIds(); resetRNG(); resetRendererState();
  }
  private goHome(): void {
    if (this.escapeHandler) { window.removeEventListener("keydown", this.escapeHandler); this.escapeHandler = null; }
    if (this.touchControls) setTouchControlsForced(false);
    this.cleanup(); this.sync.destroy(); this.connection.disconnect();
    stopMusic(); killBossMusic();
    showTitleScreen(this.app, (rc) => launchGame(this.app, rc));
  }
}
