/**
 * Online multiplayer session — wires networking to the game loop.
 * Local player ticks normally, remote player position comes from network.
 * Handles death events, ghost mode, game over, and death toasts.
 */

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
import { showTitleScreen } from "../ui/TitleScreenView";
import { launchGame } from "../scenes/GameLauncher";
import { ConnectionManager } from "./ConnectionManager";
import { GameSync, type PlayerSyncState, type GameSyncEvent } from "./GameSync";
import { InterpolationBuffer } from "./InterpolationBuffer";
import { RemotePlayerRenderer } from "./RemotePlayerRenderer";

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

    // Death toast
    this.deathToast = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 16,
        fill: "#ff6666",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 3 },
      }),
    });
    this.deathToast.x = GAME_WIDTH / 2;
    this.deathToast.y = GAME_HEIGHT * 0.15;
    this.deathToast.anchor.set(0.5, 0.5);
    this.deathToast.visible = false;
    this.app.stage.addChild(this.deathToast);

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

    this.gameLoop = () => {
      this.tick();
    };
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

    // Track local death
    if (!this.localDead && state.isDying) {
      this.localDead = true;
      this.localDeathHeight = state.scoreState.height;
      this.sync.sendGameEvent({
        type: "death",
        payload: { height: this.localDeathHeight },
      });
    }

    // Render remote player
    if (this.interpolation.isReady) {
      const remoteState = this.interpolation.getState();
      this.remoteRenderer.update(remoteState, state.camera.y);
    }

    // Toast timer
    if (this.toastTimer > 0) {
      this.toastTimer--;
      if (this.toastTimer === 0) this.deathToast.visible = false;
    }

    // Game over check — both dead
    if (state.gameOver && this.remoteDead) {
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
    if (this.gameLoop) {
      this.app.ticker.remove(this.gameLoop);
      this.gameLoop = null;
    }
    this.sync.stopSending();

    const h1 = this.localDeathHeight;
    const h2 = this.remoteDeathHeight;
    const localLabel = this.role === "host" ? "You (Host)" : "You (Guest)";
    const remoteLabel = this.role === "host" ? "Opponent" : "Opponent";
    const winner = h1 > h2 ? "You Win!" : h2 > h1 ? "You Lose!" : "It's a Tie!";

    // Overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.fill({ color: 0x000000, alpha: 0.7 });
    this.app.stage.addChild(overlay);

    const winnerText = new Text({
      text: winner,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 28,
        fill: h1 > h2 ? "#44ff44" : h2 > h1 ? "#ff6666" : "#ffdd44",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 4 },
      }),
    });
    winnerText.x = GAME_WIDTH / 2;
    winnerText.y = GAME_HEIGHT * 0.25;
    winnerText.anchor.set(0.5, 0.5);
    this.app.stage.addChild(winnerText);

    const compStyle = new TextStyle({
      fontFamily: "monospace",
      fontSize: 14,
      fill: "#ffffff",
      stroke: { color: "#000000", width: 2 },
    });

    const lines = [
      `${localLabel}: ${h1}m  |  ${remoteLabel}: ${h2}m`,
      `Score: ${this.scene.getScore()}`,
    ];

    lines.forEach((line, i) => {
      const t = new Text({ text: line, style: compStyle });
      t.x = GAME_WIDTH / 2;
      t.y = GAME_HEIGHT * 0.36 + i * 22;
      t.anchor.set(0.5, 0.5);
      this.app.stage.addChild(t);
    });

    // Rematch button
    const btnStyle = new TextStyle({
      fontFamily: "monospace",
      fontSize: 18,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 2 },
    });

    const rematchBg = new Graphics();
    rematchBg.roundRect(GAME_WIDTH / 2 - 90, GAME_HEIGHT * 0.5 - 18, 180, 36, 10);
    rematchBg.fill({ color: 0x1a3355, alpha: 0.9 });
    rematchBg.roundRect(GAME_WIDTH / 2 - 90, GAME_HEIGHT * 0.5 - 18, 180, 36, 10);
    rematchBg.stroke({ width: 1.5, color: 0x6688bb, alpha: 0.5 });
    rematchBg.eventMode = "static";
    rematchBg.cursor = "pointer";
    this.app.stage.addChild(rematchBg);

    const rematchText = new Text({ text: "Rematch", style: btnStyle });
    rematchText.x = GAME_WIDTH / 2;
    rematchText.y = GAME_HEIGHT * 0.5;
    rematchText.anchor.set(0.5, 0.5);
    rematchText.eventMode = "static";
    rematchText.cursor = "pointer";
    this.app.stage.addChild(rematchText);

    const doRematch = () => {
      // Signal rematch, generate new seed, restart
      const newSeed = Math.floor(Math.random() * 0xffffffff);
      this.sync.sendGameEvent({
        type: "seed",
        payload: { seed: newSeed },
      });
      this.restart(newSeed);
    };
    rematchBg.on("pointertap", doRematch);
    rematchText.on("pointertap", doRematch);

    // Home button
    const homeBg = new Graphics();
    homeBg.roundRect(GAME_WIDTH / 2 - 90, GAME_HEIGHT * 0.58 - 16, 180, 32, 10);
    homeBg.fill({ color: 0x222244, alpha: 0.9 });
    homeBg.eventMode = "static";
    homeBg.cursor = "pointer";
    this.app.stage.addChild(homeBg);

    const homeText = new Text({
      text: "Leave",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 15,
        fill: "#aaccff",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    homeText.x = GAME_WIDTH / 2;
    homeText.y = GAME_HEIGHT * 0.58;
    homeText.anchor.set(0.5, 0.5);
    homeText.eventMode = "static";
    homeText.cursor = "pointer";
    this.app.stage.addChild(homeText);

    homeBg.on("pointertap", () => this.goHome());
    homeText.on("pointertap", () => this.goHome());
  }

  private restart(newSeed: number): void {
    this.cleanup();
    this.seed = newSeed;
    this.localDead = false;
    this.remoteDead = false;
    this.localDeathHeight = 0;
    this.remoteDeathHeight = 0;
    this.interpolation.reset();

    const runConfig: RunConfig = { ...createDefaultRunConfig(), seed: newSeed };
    this.scene = new GameScene(runConfig);
    this.scene.initInput(this.app.canvas);
    this.app.stage.addChild(this.scene.container);

    this.remoteRenderer = new RemotePlayerRenderer();
    this.remoteRenderer.hide();
    this.app.stage.addChild(this.remoteRenderer.container);

    this.deathToast = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 16,
        fill: "#ff6666",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 3 },
      }),
    });
    this.deathToast.x = GAME_WIDTH / 2;
    this.deathToast.y = GAME_HEIGHT * 0.15;
    this.deathToast.anchor.set(0.5, 0.5);
    this.deathToast.visible = false;
    this.app.stage.addChild(this.deathToast);

    this.setupSync();
    this.start();
  }

  private cleanup(): void {
    if (this.gameLoop) {
      this.app.ticker.remove(this.gameLoop);
      this.gameLoop = null;
    }
    this.sync.stopSending();
    this.scene.destroy();
    this.remoteRenderer.destroy();

    while (this.app.stage.children.length > 0) {
      const child = this.app.stage.children[0];
      this.app.stage.removeChild(child);
      child.destroy({ children: true });
    }

    resetPlatformIds();
    resetPowerUpIds();
    resetCollectibleIds();
    resetEnemyIds();
    resetProjectileIds();
    resetRNG();
    resetRendererState();
  }

  private goHome(): void {
    this.cleanup();
    this.sync.destroy();
    this.connection.disconnect();
    stopMusic();
    killBossMusic();
    showTitleScreen(this.app, (runConfig) => launchGame(this.app, runConfig));
  }
}
