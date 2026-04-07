/** Online multiplayer session — wires networking to the game loop. Supports N peers. */
import type { Application, Graphics, Text } from "pixi.js";
import type { GameScene } from "../scenes/GameScene";
import { playMusic, stopMusic, killBossMusic } from "../systems/Audio";
import type { RunConfig } from "../systems/CustomRunConfig";
import { showTitleScreen } from "../ui/TitleScreenView";
import { launchGame } from "../scenes/GameLauncher";
import type { ConnectionManager } from "./ConnectionManager";
import { GameSync, type PlayerSyncState, type GameSyncEvent } from "./GameSync";
import type { RemoteCosmetics } from "./RemotePlayerRenderer";
import { LobbyScreen, getPlayerName } from "./LobbyScreen";
import { electHost } from "./HostElection";
import { selfId } from "./NostrSignaling";
import { setTouchControlsForced } from "../systems/TiltSettings";
import { CountdownAnim } from "./CountdownAnim";
import type { LiveLeaderboard } from "./LiveLeaderboard";
import {
  type RemotePeer,
  addPeer,
  doShowResults,
  doCleanup,
  initNewGame,
  createSyncForConnection,
  makeTimerText,
  makeSpectateText,
  setupPause,
  tickHUD,
  allRemoteDead,
} from "./OnlineSessionHelpers";

export type OnlineRole = "host" | "guest";

export interface OnlineSessionConfig {
  app: Application;
  connection: ConnectionManager;
  seed: number;
  role: OnlineRole;
  mode?: string;
  touchControls?: boolean;
  remotePeers?: Map<string, { character: string; cosmetics?: RemoteCosmetics; name?: string }>;
  sync?: GameSync;
  sharedRunConfig?: RunConfig;
  localName?: string;
}

export class OnlineSession {
  private app: Application;
  private connection: ConnectionManager;
  private sync: GameSync;
  private scene!: GameScene;
  private peers = new Map<string, RemotePeer>();
  private touchControls: boolean;
  private mode: string;
  private localName: string;
  private timerDurationMs = -1;
  private timerStartTime = 0;
  private timerText: Text | null = null;
  private countdownAnim = new CountdownAnim();
  private leaderboard!: LiveLeaderboard;

  private localDead = false;
  private localDeathHeight = 0;
  private gameLoop: (() => void) | null = null;
  private deathToast!: Text;
  private toastTimer = 0;
  private fps = { frames: 0, last: performance.now(), text: null as Text | null };
  private countdownDim: Graphics | null = null;
  private countdownText: Text | null = null;
  private spectateText: Text | null = null;
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;
  private pause: import("./PauseOverlay").PauseOverlay | null = null;
  private resultsShown = false;
  private connDot: Graphics | null = null;
  private nextColorIndex = { value: 0 };

  constructor(config: OnlineSessionConfig) {
    this.app = config.app;
    this.connection = config.connection;
    this.touchControls = config.touchControls ?? false;
    this.mode = config.mode ?? "best-height";
    this.localName = config.localName ?? "";
    this.sync = config.sync ?? new GameSync();
    const bail = () => {
      if (!this.resultsShown) setTimeout(() => this.goHome(), 0);
    };
    this.connection.on({
      onStateChange: (s) => {
        if (s === "failed" || s === "disconnected") bail();
      },
      onError: bail,
      onDataChannel: () => {},
      onRoom: () => {},
    });

    this.applyInit(
      initNewGame(
        this.app,
        config.seed,
        this.mode,
        this.touchControls,
        this.localName,
        this.peers,
        this.nextColorIndex,
        config.remotePeers,
        config.sharedRunConfig,
      ),
    );
    this.setupSync();
  }

  private applyInit(i: import("./OnlineSessionHelpers").NewGameInit): void {
    this.scene = i.scene;
    this.leaderboard = i.leaderboard;
    this.deathToast = i.deathToast;
    this.fps.text = i.fpsText;
    this.connDot = i.connDot;
    this.countdownDim = i.countdownDim;
    this.countdownText = i.countdownText;
  }

  private setupSync(): void {
    this.sync.on({
      onRemotePosition: (state: PlayerSyncState, peerId: string) => {
        let peer = this.peers.get(peerId);
        if (!peer)
          peer = addPeer(peerId, this.peers, this.app, this.leaderboard, this.nextColorIndex);
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
      this.timerText = makeTimerText();
      this.app.stage.addChild(this.timerText);
    }
    if (this.fps.text) {
      this.app.stage.removeChild(this.fps.text);
      this.app.stage.addChild(this.fps.text);
    }

    const p = await setupPause(
      this.app,
      () => this.goHome(),
      (paused) => {
        if (!this.resultsShown) this.sync.sendGameEvent({ type: "ready", payload: { paused } });
      },
    );
    this.pause = p.pause;
    this.escapeHandler = p.escapeHandler;
    this.gameLoop = () => this.tick();
    this.app.ticker.add(this.gameLoop);
  }

  private tick(): void {
    if (this.resultsShown || this.pause?.paused) return;
    this.scene.update();
    const state = this.scene.getState();
    this.sync.updateLocalState(
      state.player.x,
      state.player.y,
      state.player.vx,
      state.player.vy,
      this.localDead ? (state.gameOver ? 2 : 1) : 0,
    );
    if (!this.localDead && state.isDying) {
      this.localDead = true;
      this.localDeathHeight = state.scoreState.height;
      this.sync.sendGameEvent({ type: "death", payload: { height: this.localDeathHeight } });
      this.leaderboard.setDead("__local__", true);
      if (this.mode === "first-to-die" && !this.resultsShown) {
        this.resultsShown = true;
        this.showResults();
        return;
      }
    }
    this.leaderboard.updateHeight("__local__", state.scoreState.height);
    this.tickRemotePeers(state);
    if (this.countdownText && this.countdownDim)
      this.countdownAnim.update(
        this.scene.getCountdownSeconds(),
        this.countdownText,
        this.countdownDim,
      );
    if (this.timerDurationMs > 0) {
      const elapsed = performance.now() - this.timerStartTime;
      const remain = Math.max(0, this.timerDurationMs - elapsed);
      const secs = Math.ceil(remain / 1000);
      const m = Math.floor(secs / 60),
        s = secs % 60;
      if (this.timerText) this.timerText.text = `${m}:${s.toString().padStart(2, "0")}`;
      if (remain <= 0 && !this.resultsShown) {
        this.resultsShown = true;
        this.showResults();
        return;
      }
    }
    tickHUD(this.connDot, this.peers, this.fps);
    if (this.toastTimer > 0 && --this.toastTimer === 0) this.deathToast.visible = false;
    this.leaderboard.tick();
    if (
      this.mode === "best-height" &&
      this.localDead &&
      allRemoteDead(this.peers) &&
      !this.resultsShown
    ) {
      this.resultsShown = true;
      this.showResults();
    }
  }

  private tickRemotePeers(state: ReturnType<GameScene["getState"]>): void {
    for (const [peerId, peer] of this.peers) {
      if (
        !peer.disconnected &&
        peer.interpolation.isReady &&
        peer.interpolation.msSinceLastUpdate > 3000
      ) {
        peer.disconnected = true;
        peer.dead = true;
        peer.renderer.hide();
        this.leaderboard.setDisconnected(peerId);
        this.showToast(`${peer.name} left`);
        if (this.mode === "first-to-die" && !this.resultsShown) {
          this.resultsShown = true;
          this.showResults();
          return;
        }
      }
      if (peer.disconnected || !peer.interpolation.isReady) continue;
      const rs = peer.interpolation.getState();
      peer.renderer.update(rs, state.camera.y, state.player.y);
      const h = Math.abs(Math.round(rs.y / 10));
      peer.lastKnownHeight = Math.max(peer.lastKnownHeight, h);
      this.leaderboard.updateHeight(peerId, peer.lastKnownHeight);
    }
    if (state.gameOver && !allRemoteDead(this.peers)) {
      if (!this.spectateText) {
        this.spectateText = makeSpectateText();
        this.app.stage.addChild(this.spectateText);
      }
      const alive = [...this.peers.values()].filter((p) => !p.dead && !p.disconnected).length;
      this.spectateText.text = `Spectating \u2014 ${alive} player${alive !== 1 ? "s" : ""} remaining`;
    }
  }

  private handleRemoteEvent(event: GameSyncEvent, peerId: string): void {
    if (event.type === "death") {
      let peer = this.peers.get(peerId);
      if (!peer)
        peer = addPeer(peerId, this.peers, this.app, this.leaderboard, this.nextColorIndex);
      peer.dead = true;
      peer.deathHeight = (event.payload.height as number) || peer.lastKnownHeight;
      this.leaderboard.setDead(peerId, true);
      this.showToast(`${peer.name} died at ${peer.deathHeight}m!`);
      if (this.mode === "first-to-die" && !this.resultsShown) {
        this.resultsShown = true;
        this.showResults();
        return;
      }
    }
    if (event.type === "ready" && event.payload.paused !== undefined && this.pause) {
      const shouldPause = event.payload.paused as boolean;
      if (shouldPause !== this.pause.paused) this.pause.toggle();
    }
  }

  private showToast(msg: string): void {
    this.deathToast.text = msg;
    this.deathToast.visible = true;
    this.toastTimer = 180;
  }

  private showResults(): void {
    this.gameLoop = doShowResults(
      this.app,
      this.scene,
      this.sync,
      this.peers,
      this.localDead,
      this.localDeathHeight,
      this.localName,
      this.mode,
      this.gameLoop,
      () => this.returnToLobby(),
      () => this.goHome(),
    );
  }

  private returnToLobby(): void {
    const connected = [
      selfId,
      ...[...this.peers.keys()].filter((id) => !this.peers.get(id)?.disconnected),
    ];
    const role: OnlineRole = electHost(connected) === selfId ? "host" : "guest";
    this.cleanup();
    const sync = createSyncForConnection(this.connection);
    const lobby = new LobbyScreen(role, sync, {
      onStart: (seed, _mode, _tc, rp, sharedRunConfig) => {
        this.connection.setOnPeerLeave(null);
        this.app.stage.removeChild(lobby.container);
        lobby.destroy();
        this.localName = getPlayerName();
        this.startNewGame(seed, sync, _mode, _tc, rp, sharedRunConfig);
      },
    });
    this.connection.setOnPeerLeave((id) => lobby.handlePeerLeave(id));
    this.app.stage.addChild(lobby.container);
  }

  private startNewGame(
    newSeed: number,
    sync: GameSync,
    mode: string,
    tc: boolean,
    remotePeers?: Map<string, { character: string; cosmetics?: RemoteCosmetics; name?: string }>,
    sharedRunConfig?: RunConfig,
  ): void {
    Object.assign(this, {
      localDead: false,
      localDeathHeight: 0,
      resultsShown: false,
      sync,
      mode,
      timerDurationMs: -1,
      timerStartTime: 0,
      timerText: null,
      touchControls: tc,
      spectateText: null,
    });
    this.nextColorIndex = { value: 0 };
    this.peers.clear();
    this.applyInit(
      initNewGame(
        this.app,
        newSeed,
        mode,
        tc,
        this.localName,
        this.peers,
        this.nextColorIndex,
        remotePeers,
        sharedRunConfig,
      ),
    );
    this.setupSync();
    this.start();
  }

  private cleanup(): void {
    this.gameLoop = doCleanup(
      this.app,
      this.scene,
      this.sync,
      this.peers,
      this.leaderboard,
      this.gameLoop,
    );
  }

  private goHome(): void {
    if (this.escapeHandler) {
      window.removeEventListener("keydown", this.escapeHandler);
      this.escapeHandler = null;
    }
    if (this.touchControls) setTouchControlsForced(false);
    this.cleanup();
    this.sync.destroy();
    this.connection.disconnect();
    stopMusic();
    killBossMusic();
    showTitleScreen(this.app, (rc) => launchGame(this.app, rc));
  }
}
