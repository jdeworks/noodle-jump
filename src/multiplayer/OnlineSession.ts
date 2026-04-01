/** Online multiplayer session — wires networking to the game loop. */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GameScene } from "../scenes/GameScene";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { playMusic, stopMusic, killBossMusic } from "../systems/Audio";
import { resetPlatformIds } from "../entities/Platform";
import { resetPowerUpIds } from "../entities/PowerUp";
import { resetCollectibleIds } from "../entities/Collectible";
import { resetEnemyIds } from "../entities/Enemy";
import { resetProjectileIds } from "../entities/Projectile";
import { resetRNG } from "../systems/RNG";
import { resetRendererState } from "../scenes/EntityRenderer";
import { createDefaultRunConfig, type RunConfig } from "../systems/CustomRunConfig";
import { DEBUG_MODE } from "../config/constants";
import { showTitleScreen } from "../ui/TitleScreenView";
import { launchGame } from "../scenes/GameLauncher";
import { ConnectionManager } from "./ConnectionManager";
import { GameSync, type PlayerSyncState, type GameSyncEvent } from "./GameSync";
import { InterpolationBuffer } from "./InterpolationBuffer";
import { RemotePlayerRenderer } from "./RemotePlayerRenderer";
import { LobbyScreen } from "./LobbyScreen";

export type OnlineRole = "host" | "guest";

interface OnlineSessionConfig {
  app: Application;
  connection: ConnectionManager;
  seed: number;
  role: OnlineRole;
}

export class OnlineSession {
  private app: Application;
  private connection: ConnectionManager;
  private sync: GameSync;
  private scene: GameScene;
  private remoteRenderer: RemotePlayerRenderer;
  private interpolation = new InterpolationBuffer();
  private role: OnlineRole;
  private seed: number;

  private localDead = false;
  private remoteDead = false;
  private localDeathHeight = 0;
  private remoteDeathHeight = 0;
  private gameLoop: (() => void) | null = null;

  // Toast
  private deathToast: Text;
  private toastTimer = 0;

  // FPS counter
  private fpsText: Text | null = null;
  private fpsFrames = 0;
  private fpsLast = performance.now();

  // Countdown overlay
  private countdownDim: Graphics | null = null;
  private countdownText: Text | null = null;
  private spectateText: Text | null = null;
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;
  private resultsShown = false;

  constructor(config: OnlineSessionConfig) {
    this.app = config.app;
    this.connection = config.connection;
    this.role = config.role;
    this.seed = config.seed;
    this.sync = new GameSync();

    // Create game scene with shared seed
    const runConfig: RunConfig = { ...createDefaultRunConfig(), seed: config.seed };
    this.scene = new GameScene(runConfig);
    this.scene.initInput(this.app.canvas);
    this.app.stage.addChild(this.scene.container);

    // Remote player overlay
    this.remoteRenderer = new RemotePlayerRenderer();
    this.remoteRenderer.hide();
    this.app.stage.addChild(this.remoteRenderer.container);

    this.deathToast = this.makeToast();
    this.app.stage.addChild(this.deathToast);
    this.fpsText = this.makeFps();
    if (this.fpsText) this.app.stage.addChild(this.fpsText);
    this.makeCountdown();
    this.setupSync();
  }

  private setupSync(): void {
    // Wire up GameSync callbacks
    this.sync.on({
      onRemotePosition: (state: PlayerSyncState) => {
        this.interpolation.pushUpdate(state.x, state.y, state.vx, state.vy, state.state);
      },
      onRemoteEvent: (event: GameSyncEvent) => {
        this.handleRemoteEvent(event);
      },
    });

    // Initialize sync based on connection mode
    const mode = this.connection.getMode();
    if (mode === "nostr") {
      const room = this.connection.getRoom();
      if (room) this.sync.initWithRoom(room);
    } else {
      const channel = this.connection.getChannel();
      if (channel) this.sync.initWithChannel(channel);
    }
  }

  start(): void {
    this.scene.startCountdown();
    this.sync.startSending();
    playMusic(0);

    // Re-add FPS text on top of everything
    if (this.fpsText) {
      this.app.stage.removeChild(this.fpsText);
      this.app.stage.addChild(this.fpsText);
    }

    // Escape to forfeit
    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTimeout(() => this.goHome(), 0);
    };
    window.addEventListener("keydown", this.escapeHandler);

    this.gameLoop = () => { this.tick(); };
    this.app.ticker.add(this.gameLoop);
  }

  private tick(): void {
    // Update local game
    this.scene.update();
    const state = this.scene.getState();

    // Feed local position to sync
    this.sync.updateLocalState(
      state.player.x,
      state.player.y,
      state.player.vx,
      state.player.vy,
      this.localDead ? (state.gameOver ? 2 : 1) : 0,
    );

    // Track local death → enable ghost mode
    if (!this.localDead && state.isDying) {
      this.localDead = true;
      this.localDeathHeight = state.scoreState.height;
      this.scene.enableGhostMode();
      this.sync.sendGameEvent({ type: "death", payload: { height: this.localDeathHeight } });
    }

    // Render remote player + spectate mode
    if (this.interpolation.isReady) {
      const remoteState = this.interpolation.getState();
      if (state.gameOver && !this.remoteDead) {
        // Spectating: show remote player with label
        this.remoteRenderer.update(remoteState, state.camera.y, state.player.y);
        if (!this.spectateText) {
          this.spectateText = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace",
            fontSize: 16, fill: "#ffdd44", fontWeight: "bold", align: "center",
            stroke: { color: "#000000", width: 3 } }) });
          this.spectateText.x = GAME_WIDTH / 2; this.spectateText.y = 50;
          this.spectateText.anchor.set(0.5, 0.5); this.app.stage.addChild(this.spectateText);
        }
        const rh = Math.abs(Math.round(remoteState.y / 10));
        this.spectateText.text = `Spectating opponent — H: ${rh}`;
      } else {
        this.remoteRenderer.update(remoteState, state.camera.y, state.player.y);
      }
    }

    // Countdown overlay
    const cd = this.scene.getCountdownSeconds();
    if (cd !== undefined && cd >= 0 && this.countdownText && this.countdownDim) {
      this.countdownText.text = cd > 0 ? `${cd}` : "GO!";
      this.countdownText.visible = true; this.countdownDim.visible = true;
    } else if (this.countdownText) {
      this.countdownText.visible = false;
      if (this.countdownDim) this.countdownDim.visible = false;
    }

    // FPS counter
    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsLast >= 500 && this.fpsText) {
      this.fpsText.text = `FPS: ${Math.round(this.fpsFrames / ((now - this.fpsLast) / 1000))}`;
      this.fpsFrames = 0;
      this.fpsLast = now;
    }

    // Toast timer
    if (this.toastTimer > 0) {
      this.toastTimer--;
      if (this.toastTimer === 0) this.deathToast.visible = false;
    }

    // Game over — both players have died
    if (this.localDead && this.remoteDead && !this.resultsShown) {
      this.resultsShown = true;
      this.showResults();
    }
  }

  private handleRemoteEvent(event: GameSyncEvent): void {
    if (event.type === "death") {
      this.remoteDead = true;
      this.remoteDeathHeight = (event.payload.height as number) || 0;
      this.showToast(`Opponent died at ${this.remoteDeathHeight}m!`);
    }
  }

  private showToast(msg: string): void {
    this.deathToast.text = msg;
    this.deathToast.visible = true;
    this.toastTimer = 180;
  }

  private showResults(): void {
    if (this.gameLoop) { this.app.ticker.remove(this.gameLoop); this.gameLoop = null; }
    this.sync.stopSending();
    const h1 = this.localDeathHeight, h2 = this.remoteDeathHeight;
    const label = this.role === "host" ? "You (Host)" : "You (Guest)";
    const winner = h1 > h2 ? "You Win!" : h2 > h1 ? "You Lose!" : "It's a Tie!";
    const cx = GAME_WIDTH / 2;

    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT); bg.fill({ color: 0x000000, alpha: 0.7 });
    this.app.stage.addChild(bg);

    const wt = new Text({ text: winner, style: new TextStyle({ fontFamily: "monospace",
      fontSize: 28, fill: h1 > h2 ? "#44ff44" : h2 > h1 ? "#ff6666" : "#ffdd44",
      fontWeight: "bold", stroke: { color: "#000000", width: 4 } }) });
    wt.x = cx; wt.y = GAME_HEIGHT * 0.25; wt.anchor.set(0.5, 0.5);
    this.app.stage.addChild(wt);

    const cs = new TextStyle({ fontFamily: "monospace", fontSize: 14,
      fill: "#ffffff", stroke: { color: "#000000", width: 2 } });
    [`${label}: ${h1}m  |  Opponent: ${h2}m`, `Score: ${this.scene.getScore()}`].forEach((ln, i) => {
      const t = new Text({ text: ln, style: cs });
      t.x = cx; t.y = GAME_HEIGHT * 0.36 + i * 22; t.anchor.set(0.5, 0.5);
      this.app.stage.addChild(t);
    });

    // Rematch button
    const rbg = this.makeButton(cx, GAME_HEIGHT * 0.5, 180, 36, 0x1a3355, true);
    const rtx = this.makeLabel("Rematch", cx, GAME_HEIGHT * 0.5, 18, "#ffffff");
    const doRematch = () => setTimeout(() => this.returnToLobby(), 0);
    rbg.on("pointertap", doRematch); rtx.on("pointertap", doRematch);

    // Leave button
    const hbg = this.makeButton(cx, GAME_HEIGHT * 0.58, 180, 32, 0x222244, false);
    const htx = this.makeLabel("Leave", cx, GAME_HEIGHT * 0.58, 15, "#aaccff");
    const doHome = () => setTimeout(() => this.goHome(), 0);
    hbg.on("pointertap", doHome); htx.on("pointertap", doHome);
  }

  private makeButton(x: number, y: number, w: number, h: number, color: number, stroke: boolean): Graphics {
    const g = new Graphics();
    g.roundRect(x - w / 2, y - h / 2, w, h, 10); g.fill({ color, alpha: 0.9 });
    if (stroke) { g.roundRect(x - w / 2, y - h / 2, w, h, 10); g.stroke({ width: 1.5, color: 0x6688bb, alpha: 0.5 }); }
    g.eventMode = "static"; g.cursor = "pointer"; this.app.stage.addChild(g); return g;
  }

  private makeLabel(text: string, x: number, y: number, size: number, fill: string): Text {
    const t = new Text({ text, style: new TextStyle({ fontFamily: "monospace", fontSize: size,
      fill, fontWeight: "bold", stroke: { color: "#000000", width: 2 } }) });
    t.x = x; t.y = y; t.anchor.set(0.5, 0.5); t.eventMode = "static"; t.cursor = "pointer";
    this.app.stage.addChild(t); return t;
  }

  /** Return to lobby for rematch — reuses existing connection. */
  private returnToLobby(): void {
    this.cleanup();

    // Create a fresh GameSync on the same connection
    const sync = new GameSync();
    const mode = this.connection.getMode();
    if (mode === "nostr") {
      const room = this.connection.getRoom();
      if (room) sync.initWithRoom(room);
    } else {
      const channel = this.connection.getChannel();
      if (channel) sync.initWithChannel(channel);
    }

    const lobby = new LobbyScreen(this.role, sync, {
      onStart: (seed) => {
        this.app.stage.removeChild(lobby.container);
        lobby.destroy();
        this.startNewGame(seed, sync);
      },
    });
    this.app.stage.addChild(lobby.container);
  }

  /** Start a new game after lobby ready-up. */
  private startNewGame(newSeed: number, sync: GameSync): void {
    this.seed = newSeed;
    this.localDead = false;
    this.remoteDead = false;
    this.localDeathHeight = 0;
    this.remoteDeathHeight = 0;
    this.resultsShown = false;
    this.interpolation.reset();
    this.sync = sync;

    const runConfig: RunConfig = { ...createDefaultRunConfig(), seed: newSeed };
    this.scene = new GameScene(runConfig);
    this.scene.initInput(this.app.canvas);
    this.app.stage.addChild(this.scene.container);

    this.remoteRenderer = new RemotePlayerRenderer();
    this.remoteRenderer.hide();
    this.app.stage.addChild(this.remoteRenderer.container);

    this.deathToast = this.makeToast();
    this.app.stage.addChild(this.deathToast);
    this.fpsText = this.makeFps();
    if (this.fpsText) this.app.stage.addChild(this.fpsText);
    this.makeCountdown();
    this.setupSync();
    this.start();
  }

  private makeToast(): Text {
    const t = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace",
      fontSize: 16, fill: "#ff6666", fontWeight: "bold", stroke: { color: "#000000", width: 3 } }) });
    t.x = GAME_WIDTH / 2; t.y = GAME_HEIGHT * 0.15; t.anchor.set(0.5, 0.5); t.visible = false;
    return t;
  }

  private makeFps(): Text | null {
    if (!DEBUG_MODE) return null;
    const t = new Text({ text: "FPS: --", style: new TextStyle({ fontFamily: "monospace",
      fontSize: 11, fill: "#00ff00", stroke: { color: "#000000", width: 2 } }) });
    t.x = 10; t.y = GAME_HEIGHT - 16;
    return t;
  }

  private makeCountdown(): void {
    this.countdownDim = new Graphics();
    this.countdownDim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.countdownDim.fill({ color: 0x000000, alpha: 0.4 });
    this.app.stage.addChild(this.countdownDim);
    this.countdownText = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace",
      fontSize: 48, fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 4 } }) });
    this.countdownText.x = GAME_WIDTH / 2; this.countdownText.y = GAME_HEIGHT * 0.4;
    this.countdownText.anchor.set(0.5, 0.5); this.app.stage.addChild(this.countdownText);
  }

  private cleanup(): void {
    if (this.gameLoop) { this.app.ticker.remove(this.gameLoop); this.gameLoop = null; }
    this.sync.stopSending();
    if (this.scene.container.parent) this.scene.container.parent.removeChild(this.scene.container);
    this.scene.destroy();
    this.remoteRenderer.destroy();
    while (this.app.stage.children.length > 0) {
      const c = this.app.stage.children[0];
      this.app.stage.removeChild(c);
      c.destroy({ children: true });
    }
    resetPlatformIds(); resetPowerUpIds(); resetCollectibleIds();
    resetEnemyIds(); resetProjectileIds(); resetRNG(); resetRendererState();
  }

  private goHome(): void {
    if (this.escapeHandler) { window.removeEventListener("keydown", this.escapeHandler); this.escapeHandler = null; }
    this.cleanup(); this.sync.destroy(); this.connection.disconnect();
    stopMusic(); killBossMusic();
    showTitleScreen(this.app, (rc) => launchGame(this.app, rc));
  }
}
