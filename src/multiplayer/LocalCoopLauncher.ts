/**
 * Local co-op launcher — two side-by-side game views on one PC.
 * Player 1: WASD, Player 2: Arrow keys.
 * Uses a single PixiJS Application with a wider canvas (800x700).
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
import { resetRNG, getRNGFunction, setRNGFunction } from "../systems/RNG";
import { seededRandom } from "../systems/DailyChallenge";
import { resetRendererState } from "../scenes/EntityRenderer";
import { createDefaultRunConfig, type RunConfig } from "../systems/CustomRunConfig";
import { DEBUG_MODE } from "../config/constants";
import { setDebugConfig, createDebugConfig } from "../config/debug";
import { LocalInput } from "./LocalInput";
import { showTitleScreen } from "../ui/TitleScreenView";
import { launchGame } from "../scenes/GameLauncher";
import { showLocalCoopResults } from "./ResultsScreen";
import { CountdownAnim } from "./CountdownAnim";

const SPLIT_WIDTH = GAME_WIDTH * 2;
const DIVIDER_WIDTH = 2;

export type LocalCoopMode = "best-height" | "first-to-die" | "timed-2min";

export async function launchLocalCoop(
  app: Application,
  seed: number,
  mode: LocalCoopMode = "best-height",
): Promise<void> {
  // Resize canvas for split-screen and override CSS constraints
  app.renderer.resize(SPLIT_WIDTH, GAME_HEIGHT);
  const canvas = app.canvas;
  canvas.style.maxWidth = "1000px";
  canvas.style.aspectRatio = `${SPLIT_WIDTH} / ${GAME_HEIGHT}`;

  const input = new LocalInput();
  input.init();

  const config: RunConfig = { ...createDefaultRunConfig(), seed };

  // Reset debug config so multiplayer isn't affected by custom run presets
  setDebugConfig(createDebugConfig());

  const scene1 = new GameScene(config);
  const scene2 = new GameScene(config);

  // Best-height: ghost mode is enabled on the FIRST player to die (not both upfront),
  // so the surviving player continues normally and their death ends the game.
  // Timed: practice mode (instant respawn, scoring continues, + height penalty on death)
  if (mode === "timed-2min") { scene1.enableTimedRespawn(); scene2.enableTimedRespawn(); }

  // Create separate RNG streams for each player's ongoing gameplay.
  // Without this, both scenes share the global RNG and their worlds diverge.
  let p1Rng = seededRandom(seed);
  let p2Rng = seededRandom(seed);

  // Position scenes side by side
  scene1.container.x = 0;
  scene2.container.x = GAME_WIDTH;

  // Create masks so each scene only renders in its half
  const mask1 = new Graphics();
  mask1.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  mask1.fill(0xffffff);
  scene1.container.mask = mask1;

  const mask2 = new Graphics();
  mask2.rect(GAME_WIDTH, 0, GAME_WIDTH, GAME_HEIGHT);
  mask2.fill(0xffffff);
  scene2.container.mask = mask2;

  app.stage.addChild(mask1, mask2);
  app.stage.addChild(scene1.container, scene2.container);

  // Divider line
  const divider = new Graphics();
  divider.rect(GAME_WIDTH - DIVIDER_WIDTH / 2, 0, DIVIDER_WIDTH, GAME_HEIGHT);
  divider.fill({ color: 0x000000, alpha: 0.6 });
  app.stage.addChild(divider);

  // Player labels
  const labelStyle = new TextStyle({ fontFamily: "monospace", fontSize: 12,
    fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 2 } });
  const p1Label = new Text({ text: "P1 (WASD)", style: labelStyle });
  p1Label.x = 8; p1Label.y = 4; app.stage.addChild(p1Label);
  const p2Label = new Text({ text: "P2 (Arrows)", style: labelStyle });
  p2Label.x = GAME_WIDTH + 8; p2Label.y = 4; app.stage.addChild(p2Label);

  // Height displays
  const heightStyle = new TextStyle({ fontFamily: "monospace", fontSize: 14,
    fill: "#ffdd44", fontWeight: "bold", stroke: { color: "#000000", width: 2 } });
  const p1Height = new Text({ text: "H: 0", style: heightStyle });
  p1Height.x = GAME_WIDTH - 8; p1Height.y = 4; p1Height.anchor.set(1, 0);
  app.stage.addChild(p1Height);
  const p2Height = new Text({ text: "H: 0", style: heightStyle });
  p2Height.x = SPLIT_WIDTH - 8; p2Height.y = 4; p2Height.anchor.set(1, 0);
  app.stage.addChild(p2Height);

  // Death toast
  const deathToast = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace",
    fontSize: 16, fill: "#ff6666", fontWeight: "bold", stroke: { color: "#000000", width: 3 } }) });
  deathToast.x = SPLIT_WIDTH / 2; deathToast.y = GAME_HEIGHT * 0.15;
  deathToast.anchor.set(0.5, 0.5); deathToast.visible = false;
  app.stage.addChild(deathToast);
  let toastTimer = 0;

  // Spectate overlay (shown on the dead player's side)
  const spectateOverlay = new Graphics();
  spectateOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  spectateOverlay.fill({ color: 0x000000, alpha: 0.5 });
  spectateOverlay.visible = false; app.stage.addChild(spectateOverlay);
  const spectateLabel = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace",
    fontSize: 18, fill: "#ffdd44", fontWeight: "bold", align: "center",
    stroke: { color: "#000000", width: 3 } }) });
  spectateLabel.x = GAME_WIDTH / 2; spectateLabel.y = GAME_HEIGHT * 0.4;
  spectateLabel.anchor.set(0.5, 0.5); app.stage.addChild(spectateLabel);

  // FPS counter (debug only)
  let fpsText: Text | null = null, fpsFrames = 0, fpsLast = performance.now();
  if (DEBUG_MODE) {
    fpsText = new Text({ text: "FPS: --", style: new TextStyle({ fontFamily: "monospace",
      fontSize: 11, fill: "#00ff00", stroke: { color: "#000000", width: 2 } }) });
    fpsText.x = SPLIT_WIDTH / 2; fpsText.y = GAME_HEIGHT - 16; fpsText.anchor.set(0.5, 0);
    app.stage.addChild(fpsText);
  }

  const countdownAnim = new CountdownAnim();

  // Countdown overlay with dim background
  const countdownDim = new Graphics();
  countdownDim.rect(0, 0, SPLIT_WIDTH, GAME_HEIGHT);
  countdownDim.fill({ color: 0x000000, alpha: 0.4 });
  app.stage.addChild(countdownDim);
  const countdownText = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace",
    fontSize: 48, fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 4 } }) });
  countdownText.x = SPLIT_WIDTH / 2; countdownText.y = GAME_HEIGHT * 0.4;
  countdownText.anchor.set(0.5, 0.5); app.stage.addChild(countdownText);

  scene1.startCountdown();
  scene2.startCountdown();

  playMusic(0);

  // Escape to quit mid-game
  let quitRequested = false;
  const midGameEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !quitRequested) {
      quitRequested = true;
      gameEnded = true;
      scene1.forceStop();
      scene2.forceStop();
      app.ticker.remove(gameLoop);
      window.removeEventListener("keydown", midGameEscape);
      setTimeout(() => {
        cleanupLocalCoop(app, scene1, scene2, input, gameLoop);
        app.renderer.resize(GAME_WIDTH, GAME_HEIGHT);
        app.canvas.style.maxWidth = "500px";
        app.canvas.style.aspectRatio = "400 / 700";
        showTitleScreen(app, (runConfig) => launchGame(app, runConfig));
      }, 0);
    }
  };
  window.addEventListener("keydown", midGameEscape);

  // Pause both scenes when tab/app is hidden (prevent desync)
  let paused = false;
  const visHandler = () => {
    if (document.hidden && !paused && !gameEnded) {
      paused = true;
      app.ticker.stop();
    } else if (!document.hidden && paused) {
      paused = false;
      app.ticker.start();
    }
  };
  document.addEventListener("visibilitychange", visHandler);

  // Timer for timed mode (2 min = 7200 ticks at 60fps)
  let timerCleanup: (() => void) | null = null;
  let timerText: Text | null = null;
  let timerTicks = mode === "timed-2min" ? 120 * 60 : -1; // -1 = no timer
  if (mode === "timed-2min") {
    timerText = new Text({ text: "2:00", style: new TextStyle({ fontFamily: "monospace",
      fontSize: 20, fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 3 } }) });
    timerText.x = SPLIT_WIDTH / 2; timerText.y = 22; timerText.anchor.set(0.5, 0.5);
    app.stage.addChild(timerText);
    timerCleanup = () => { if (timerText) { timerText.visible = false; } };
  }

  let gameEnded = false;
  let p1Dead = false;
  let p2Dead = false;
  let p1DeathHeight = 0;
  let p2DeathHeight = 0;
  let p1LastHeight = 0;
  let p2LastHeight = 0;

  // Game loop
  const endGame = () => {
    if (gameEnded) return;
    gameEnded = true;
    scene1.forceStop();
    scene2.forceStop();
    app.ticker.remove(gameLoop);
    window.removeEventListener("keydown", midGameEscape);
    stopMusic();
    killBossMusic();
    if (timerCleanup) timerCleanup();
    showResults();
  };

  const gameLoop = () => {
    if (gameEnded) return;
    input.update();

    // Tick scenes with split keyboard input and separate RNG streams
    if (!scene1.isGameOver()) {
      setRNGFunction(p1Rng);
      if (input.p1Fire) scene1.autoAimThrow();
      scene1.updateWithInput(input.p1InputX);
      p1Rng = getRNGFunction();
    }
    if (!scene2.isGameOver()) {
      setRNGFunction(p2Rng);
      if (input.p2Fire) scene2.autoAimThrow();
      scene2.updateWithInput(input.p2InputX);
      p2Rng = getRNGFunction();
    }

    // Update height displays
    p1Height.text = `H: ${scene1.getMaxHeight()}`;
    p2Height.text = `H: ${scene2.getMaxHeight()}`;

    // Timed mode countdown
    if (timerTicks > 0) {
      timerTicks--;
      const secs = Math.ceil(timerTicks / 60);
      const m = Math.floor(secs / 60), s = secs % 60;
      if (timerText) timerText.text = `${m}:${s.toString().padStart(2, "0")}`;
      if (timerTicks <= 0 && !gameEnded) {
        p1DeathHeight = scene1.getHeight(); p2DeathHeight = scene2.getHeight();
        endGame(); return;
      }
    }

    // Track deaths (timed mode: deaths are just penalties, no tracking)
    if (mode !== "timed-2min") {
      if (!p1Dead && scene1.getState().isDying) {
        p1Dead = true;
        p1DeathHeight = scene1.getHeight();
        showToast(`P1 died at ${p1DeathHeight}m!`);
        // Best-height: first to die becomes ghost, second player continues normally
        if (mode === "best-height" && !p2Dead) scene1.enableGhostMode();
      }
      if (!p2Dead && scene2.getState().isDying) {
        p2Dead = true;
        p2DeathHeight = scene2.getHeight();
        showToast(`P2 died at ${p2DeathHeight}m!`);
        // Best-height: first to die becomes ghost, second player continues normally
        if (mode === "best-height" && !p1Dead) scene2.enableGhostMode();
      }
    } else {
      // Timed mode: detect death by height penalty (practice mode rescue is instant, isDying is never set)
      const h1Now = scene1.getMaxHeight();
      const h2Now = scene2.getMaxHeight();
      if (h1Now < p1LastHeight) showToast(`P1 died! Height: ${h1Now}m (-10%)`);
      if (h2Now < p2LastHeight) showToast(`P2 died! Height: ${h2Now}m (-10%)`);
      p1LastHeight = h1Now;
      p2LastHeight = h2Now;
    }
    // Show ghost indicator on dead player's side (not for timed mode)
    // Best-height: ghost player keeps playing, so only show a small label (no dark overlay)
    // First-to-die: game ends immediately, no spectate needed
    if (mode === "best-height" && p1Dead && !p2Dead) {
      spectateOverlay.visible = false;
      spectateLabel.visible = true;
      spectateLabel.x = GAME_WIDTH / 2;
      spectateLabel.y = 22;
      spectateLabel.text = `GHOST · ${p1DeathHeight}m`;
    } else if (mode === "best-height" && p2Dead && !p1Dead) {
      spectateOverlay.visible = false;
      spectateLabel.visible = true;
      spectateLabel.x = GAME_WIDTH + GAME_WIDTH / 2;
      spectateLabel.y = 22;
      spectateLabel.text = `GHOST · ${p2DeathHeight}m`;
    } else { spectateOverlay.visible = false; spectateLabel.visible = false; }

    // Countdown display with animated "GO!"
    countdownAnim.update(scene1.getCountdownSeconds(), countdownText, countdownDim);

    // FPS counter (debug only)
    if (fpsText) {
      fpsFrames++;
      const now = performance.now();
      if (now - fpsLast >= 500) {
        fpsText.text = `FPS: ${Math.round(fpsFrames / ((now - fpsLast) / 1000))}`;
        fpsFrames = 0; fpsLast = now;
      }
    }

    // Toast timer
    if (toastTimer > 0) {
      toastTimer--;
      if (toastTimer === 0) deathToast.visible = false;
    }

    // End condition depends on mode (timed mode ends ONLY from timer, not deaths)
    let shouldEnd = false;
    if (mode === "first-to-die") shouldEnd = (p1Dead || p2Dead);
    else if (mode === "best-height") shouldEnd = (p1Dead && p2Dead);
    // timed-2min: shouldEnd stays false — timer handles it above
    if (shouldEnd) endGame();
  };

  function showToast(msg: string): void {
    deathToast.text = msg;
    deathToast.visible = true;
    toastTimer = 180; // 3 seconds
  }

  function showResults(): void {
    document.removeEventListener("visibilitychange", visHandler);
    if (paused) { paused = false; app.ticker.start(); }
    spectateOverlay.visible = false; spectateLabel.visible = false;
    countdownText.visible = false; countdownDim.visible = false;
    deathToast.visible = false;
    showLocalCoopResults({
      app, scene1, scene2,
      p1DeathHeight, p2DeathHeight, mode, p1Dead, p2Dead,
      cleanupAndReset: () => {
        cleanupLocalCoop(app, scene1, scene2, input, gameLoop);
        const newSeed = Math.floor(Math.random() * 0xffffffff);
        launchLocalCoop(app, newSeed, mode);
      },
      cleanupAndGoHome: () => {
        cleanupLocalCoop(app, scene1, scene2, input, gameLoop);
        app.renderer.resize(GAME_WIDTH, GAME_HEIGHT);
        app.canvas.style.maxWidth = "500px";
        app.canvas.style.aspectRatio = "400 / 700";
        showTitleScreen(app, (runConfig) => launchGame(app, runConfig));
      },
    });
  }

  app.ticker.add(gameLoop);
}

function cleanupLocalCoop(
  app: Application,
  scene1: GameScene,
  scene2: GameScene,
  input: LocalInput,
  gameLoop: () => void,
): void {
  app.ticker.remove(gameLoop);
  input.destroy();

  // Remove scene containers from stage before destroying them
  if (scene1.container.parent) scene1.container.parent.removeChild(scene1.container);
  if (scene2.container.parent) scene2.container.parent.removeChild(scene2.container);
  scene1.destroy();
  scene2.destroy();

  // Clear remaining stage children (overlays, masks, labels, results)
  while (app.stage.children.length > 0) {
    const child = app.stage.children[0];
    app.stage.removeChild(child);
    child.destroy({ children: true });
  }

  resetPlatformIds();
  resetPowerUpIds();
  resetCollectibleIds();
  resetEnemyIds();
  resetProjectileIds();
  resetRNG();
  resetRendererState();
  stopMusic();
  killBossMusic();
}
