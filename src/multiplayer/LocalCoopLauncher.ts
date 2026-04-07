/**
 * Local co-op launcher — two side-by-side game views on one PC.
 * Player 1: WASD, Player 2: Arrow keys.
 * Uses a single PixiJS Application with a wider canvas (800x700).
 */

import { Application, Graphics } from "pixi.js";
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
import { setDebugConfig, createDebugConfig } from "../config/debug";
import { LocalInput } from "./LocalInput";
import { showTitleScreen } from "../ui/TitleScreenView";
import { launchGame } from "../scenes/GameLauncher";
import { showLocalCoopResults } from "./ResultsScreen";
import { CountdownAnim } from "./CountdownAnim";
import { setSelectedCharacter } from "../systems/CharacterSettings";
import { createCoopHUD, createTimerText } from "./LocalCoopUI";

const SPLIT_WIDTH = GAME_WIDTH * 2;

export type LocalCoopMode = "best-height" | "first-to-die" | "timed-2min";

export async function launchLocalCoop(
  app: Application,
  seed: number,
  mode: LocalCoopMode = "best-height",
  p1Char = "chef",
  p2Char = "chef",
  runConfig?: RunConfig,
): Promise<void> {
  app.renderer.resize(SPLIT_WIDTH, GAME_HEIGHT);
  const canvas = app.canvas;
  canvas.style.maxWidth = "1000px";
  canvas.style.aspectRatio = `${SPLIT_WIDTH} / ${GAME_HEIGHT}`;

  const input = new LocalInput();
  input.init();

  const config: RunConfig = runConfig
    ? { ...runConfig, seed }
    : { ...createDefaultRunConfig(), seed };

  if (!runConfig) setDebugConfig(createDebugConfig());

  const scene1 = new GameScene(config);
  const scene2 = new GameScene(config);

  if (mode === "timed-2min") {
    scene1.enableTimedRespawn();
    scene2.enableTimedRespawn();
  }

  let p1Rng = seededRandom(seed);
  let p2Rng = seededRandom(seed);

  scene1.container.x = 0;
  scene2.container.x = GAME_WIDTH;

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

  // Create all HUD elements
  const hud = createCoopHUD(app, SPLIT_WIDTH, GAME_WIDTH);
  if (mode === "timed-2min") hud.timerText = createTimerText(app, SPLIT_WIDTH);

  const countdownAnim = new CountdownAnim();

  scene1.startCountdown();
  scene2.startCountdown();
  playMusic(0);

  // Escape to pause/unpause
  const { PauseOverlay } = await import("./PauseOverlay");
  const pauseOvl = new PauseOverlay(app, SPLIT_WIDTH, GAME_HEIGHT, () => {
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
      showTitleScreen(app, (rc) => launchGame(app, rc));
    }, 0);
  });
  const doPause = () => {
    if (!gameEnded) pauseOvl.toggle();
  };
  pauseOvl.onPauseTap(doPause);
  const midGameEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") doPause();
  };
  window.addEventListener("keydown", midGameEscape);

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

  const timerDurationMs = mode === "timed-2min" ? 120_000 : -1;
  const timerStartTime = performance.now();

  let gameEnded = false;
  let p1Dead = false;
  let p2Dead = false;
  let p1DeathHeight = 0;
  let p2DeathHeight = 0;
  let p1LastHeight = 0;
  let p2LastHeight = 0;
  let toastTimer = 0;

  const endGame = () => {
    if (gameEnded) return;
    gameEnded = true;
    scene1.forceStop();
    scene2.forceStop();
    app.ticker.remove(gameLoop);
    window.removeEventListener("keydown", midGameEscape);
    stopMusic();
    killBossMusic();
    if (hud.timerText) hud.timerText.visible = false;
    showResults();
  };

  const gameLoop = () => {
    if (gameEnded || pauseOvl.paused) return;
    input.update();

    if (!scene1.isGameOver()) {
      setSelectedCharacter(p1Char);
      setRNGFunction(p1Rng);
      if (input.p1Fire) scene1.autoAimThrow();
      scene1.updateWithInput(input.p1InputX);
      p1Rng = getRNGFunction();
    }
    if (!scene2.isGameOver()) {
      setSelectedCharacter(p2Char);
      setRNGFunction(p2Rng);
      if (input.p2Fire) scene2.autoAimThrow();
      scene2.updateWithInput(input.p2InputX);
      p2Rng = getRNGFunction();
    }

    hud.p1Height.text = `H: ${scene1.getMaxHeight()}`;
    hud.p2Height.text = `H: ${scene2.getMaxHeight()}`;

    if (timerDurationMs > 0) {
      const elapsedMs = performance.now() - timerStartTime;
      const remainMs = Math.max(0, timerDurationMs - elapsedMs);
      const secs = Math.ceil(remainMs / 1000);
      const m = Math.floor(secs / 60),
        s = secs % 60;
      if (hud.timerText) hud.timerText.text = `${m}:${s.toString().padStart(2, "0")}`;
      if (remainMs <= 0 && !gameEnded) {
        p1DeathHeight = scene1.getHeight();
        p2DeathHeight = scene2.getHeight();
        endGame();
        return;
      }
    }

    if (mode !== "timed-2min") {
      if (!p1Dead && scene1.getState().isDying) {
        p1Dead = true;
        p1DeathHeight = scene1.getHeight();
        showToast(`P1 died at ${p1DeathHeight}m!`);
        if (mode === "best-height" && !p2Dead) scene1.enableGhostMode();
      }
      if (!p2Dead && scene2.getState().isDying) {
        p2Dead = true;
        p2DeathHeight = scene2.getHeight();
        showToast(`P2 died at ${p2DeathHeight}m!`);
        if (mode === "best-height" && !p1Dead) scene2.enableGhostMode();
      }
    } else {
      const h1Now = scene1.getMaxHeight();
      const h2Now = scene2.getMaxHeight();
      if (h1Now < p1LastHeight) showToast(`P1 died! Height: ${h1Now}m (-10%)`);
      if (h2Now < p2LastHeight) showToast(`P2 died! Height: ${h2Now}m (-10%)`);
      p1LastHeight = h1Now;
      p2LastHeight = h2Now;
    }

    if (mode === "best-height" && p1Dead && !p2Dead) {
      hud.spectateOverlay.visible = false;
      hud.spectateLabel.visible = true;
      hud.spectateLabel.x = GAME_WIDTH / 2;
      hud.spectateLabel.y = 22;
      hud.spectateLabel.text = `GHOST · ${p1DeathHeight}m`;
    } else if (mode === "best-height" && p2Dead && !p1Dead) {
      hud.spectateOverlay.visible = false;
      hud.spectateLabel.visible = true;
      hud.spectateLabel.x = GAME_WIDTH + GAME_WIDTH / 2;
      hud.spectateLabel.y = 22;
      hud.spectateLabel.text = `GHOST · ${p2DeathHeight}m`;
    } else {
      hud.spectateOverlay.visible = false;
      hud.spectateLabel.visible = false;
    }

    countdownAnim.update(scene1.getCountdownSeconds(), hud.countdownText, hud.countdownDim);

    if (hud.fpsText) {
      hud.fpsFrames++;
      const now = performance.now();
      if (now - hud.fpsLast >= 500) {
        hud.fpsText.text = `FPS: ${Math.round(hud.fpsFrames / ((now - hud.fpsLast) / 1000))}`;
        hud.fpsFrames = 0;
        hud.fpsLast = now;
      }
    }

    if (toastTimer > 0) {
      toastTimer--;
      if (toastTimer === 0) hud.deathToast.visible = false;
    }

    let shouldEnd = false;
    if (mode === "first-to-die") shouldEnd = p1Dead || p2Dead;
    else if (mode === "best-height") shouldEnd = p1Dead && p2Dead;
    if (shouldEnd) endGame();
  };

  function showToast(msg: string): void {
    hud.deathToast.text = msg;
    hud.deathToast.visible = true;
    toastTimer = 180;
  }

  function showResults(): void {
    document.removeEventListener("visibilitychange", visHandler);
    if (paused) {
      paused = false;
      app.ticker.start();
    }
    hud.spectateOverlay.visible = false;
    hud.spectateLabel.visible = false;
    hud.countdownText.visible = false;
    hud.countdownDim.visible = false;
    hud.deathToast.visible = false;
    showLocalCoopResults({
      app,
      scene1,
      scene2,
      p1DeathHeight,
      p2DeathHeight,
      mode,
      p1Dead,
      p2Dead,
      cleanupAndReset: () => {
        cleanupLocalCoop(app, scene1, scene2, input, gameLoop);
        const newSeed = Math.floor(Math.random() * 0xffffffff);
        launchLocalCoop(app, newSeed, mode, p1Char, p2Char, runConfig);
      },
      cleanupAndGoHome: () => {
        cleanupLocalCoop(app, scene1, scene2, input, gameLoop);
        app.renderer.resize(GAME_WIDTH, GAME_HEIGHT);
        app.canvas.style.maxWidth = "500px";
        app.canvas.style.aspectRatio = "400 / 700";
        showTitleScreen(app, (rc) => launchGame(app, rc));
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

  if (scene1.container.parent) scene1.container.parent.removeChild(scene1.container);
  if (scene2.container.parent) scene2.container.parent.removeChild(scene2.container);
  scene1.destroy();
  scene2.destroy();

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
