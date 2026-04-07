/** Game launch, game loop ticker, and restart logic. */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GameScene } from "./GameScene";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { playMusic } from "../systems/Audio";
import { isEnemiesEnabled } from "../systems/EnemySettings";
import { resetPlatformIds } from "../entities/Platform";
import { resetPowerUpIds } from "../entities/PowerUp";
import { resetCollectibleIds } from "../entities/Collectible";
import { resetEnemyIds } from "../entities/Enemy";
import { resetProjectileIds } from "../entities/Projectile";
import { requestWakeLock } from "../utils/wakeLock";
import { Tutorial } from "../ui/Tutorial";
import { HUD } from "../ui/HUD";
import type { RunConfig } from "../systems/CustomRunConfig";
import { resetRNG } from "../systems/RNG";
import { resetRendererState } from "./EntityRenderer";
import { stopMusic, killBossMusic } from "../systems/Audio";
import { showTitleScreen } from "../ui/TitleScreenView";
import { createGameLoopTicker } from "./GameLoopTicker";
import { resetDebugConfig, setDebugConfig, getDebugConfig } from "../config/debug";
import { createPauseMenu } from "./PauseMenu";
import { generateDailyDebugConfig } from "../systems/DailyChallengeState";
import {
  createShadowRecorder,
  loadShadow,
  getShadowSlot,
  type ShadowRecorder as ShadowRecorderType,
  type ShadowMode,
} from "../systems/ShadowRecorder";
import { createShadowPlayback, type ShadowPlayback } from "../systems/ShadowPlayback";
import { RemotePlayerRenderer } from "../multiplayer/RemotePlayerRenderer";
import { getTodayDateKey } from "../systems/DailyChallengeState";

// ── Active session tracking ──────────────────────────────────────────────

let activeScene: GameScene | null = null;
let activeGameTicker: (() => void) | null = null;
let activeOrientationCleanup: (() => void) | null = null;
let activeEscHandler: ((e: KeyboardEvent) => void) | null = null;
let activeRunConfig: RunConfig | undefined;
let activeShadowRecorder: ShadowRecorderType | null = null;
let activeShadowPlayback: ShadowPlayback | null = null;
let activeShadowRenderer: RemotePlayerRenderer | null = null;
let activeShadowMode: ShadowMode = "normal";
let activeShadowQualifier = "";

export function cleanupAndRestart(app: Application): void {
  if (activeEscHandler) {
    window.removeEventListener("keydown", activeEscHandler);
    activeEscHandler = null;
  }
  if (activeGameTicker) {
    app.ticker.remove(activeGameTicker);
    activeGameTicker = null;
  }
  if (activeOrientationCleanup) {
    activeOrientationCleanup();
    activeOrientationCleanup = null;
  }
  if (activeShadowRenderer) {
    activeShadowRenderer.destroy();
    activeShadowRenderer = null;
  }
  activeShadowRecorder = null;
  activeShadowPlayback = null;
  if (activeScene) {
    activeScene.destroy();
    activeScene = null;
  }
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
  app.ticker.start();
  playMusic(0);
  launchGame(app, activeRunConfig);
}

export function cleanupAndGoHome(app: Application): void {
  activeRunConfig = undefined; // clear so normal play doesn't reuse custom settings
  if (activeEscHandler) {
    window.removeEventListener("keydown", activeEscHandler);
    activeEscHandler = null;
  }
  if (activeGameTicker) {
    app.ticker.remove(activeGameTicker);
    activeGameTicker = null;
  }
  if (activeOrientationCleanup) {
    activeOrientationCleanup();
    activeOrientationCleanup = null;
  }
  if (activeShadowRenderer) {
    activeShadowRenderer.destroy();
    activeShadowRenderer = null;
  }
  activeShadowRecorder = null;
  activeShadowPlayback = null;
  if (activeScene) {
    activeScene.destroy();
    activeScene = null;
  }
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
  stopMusic();
  killBossMusic();
  app.ticker.start();
  showTitleScreen(app, (runConfig) => launchGame(app, runConfig));
}

// ── Game Launch ──────────────────────────────────────────────────────────

/** Get the active shadow context (for GameLoopTicker). */
export function getShadowContext() {
  return {
    recorder: activeShadowRecorder,
    playback: activeShadowPlayback,
    renderer: activeShadowRenderer,
    mode: activeShadowMode,
    qualifier: activeShadowQualifier,
  };
}

export async function launchGame(app: Application, runConfig?: RunConfig): Promise<void> {
  activeRunConfig = runConfig; // remember for restart
  // Reset debug config for normal play so custom run presets don't leak
  if (!runConfig) resetDebugConfig();
  // Daily challenge: apply generated modifiers (game speed, platform type, spawn rates, etc.)
  if (runConfig?.isDailyChallenge) {
    const dailyOverrides = generateDailyDebugConfig(runConfig.seed);
    setDebugConfig({ ...getDebugConfig(), ...dailyOverrides });
  }
  requestWakeLock();
  const scene = new GameScene(runConfig);
  activeScene = scene;
  scene.initInput(app.canvas);
  app.stage.addChild(scene.container);

  // ── Shadow replay (mode-based) ──────────────────────────────────────────
  activeShadowRecorder = createShadowRecorder();
  const slot = getShadowSlot(runConfig);
  activeShadowMode = slot.mode;
  activeShadowQualifier = slot.mode === "daily" ? getTodayDateKey() : slot.qualifier;
  const shadowRec = loadShadow(activeShadowMode, activeShadowQualifier);
  if (shadowRec) {
    activeShadowPlayback = createShadowPlayback(shadowRec);
    activeShadowRenderer = new RemotePlayerRenderer("chef", {
      tint: "tint_none",
    });
    activeShadowRenderer.container.alpha = 0.35;
    scene.container.addChild(activeShadowRenderer.container);
  } else {
    activeShadowPlayback = null;
    activeShadowRenderer = null;
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  const hud = new HUD();
  app.stage.addChild(hud.container);

  // ── Tilt permission ──────────────────────────────────────────────────────
  if (scene.input.needsTiltPermission) {
    await scene.input.requestTiltPermission();
  }

  // ── Knife throw on click/tap (enemies mode) ───────────────────────────
  let lastThrowTime = 0;
  const handleThrow = (e: MouseEvent | TouchEvent) => {
    if (!isEnemiesEnabled() && !scene.isInBossFight()) return;
    // Debounce — touchstart + click fire for the same tap
    const now = Date.now();
    if (now - lastThrowTime < 200) return;
    lastThrowTime = now;

    const rect = app.canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    } else {
      return;
    }
    scene.handleThrow((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
  };
  app.canvas.addEventListener("click", handleThrow);
  app.canvas.addEventListener("touchstart", handleThrow);

  // ── Orientation pause ─────────────────────────────────────────────────────
  const orientationQuery = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
  let pausedByOrientation = false;
  const checkOrientation = () => {
    if (orientationQuery.matches && !pausedByOrientation) {
      pausedByOrientation = true;
      if (!scene.isPaused()) scene.togglePause();
    } else if (!orientationQuery.matches && pausedByOrientation) {
      pausedByOrientation = false;
      if (scene.isPaused()) scene.togglePause();
    }
  };
  orientationQuery.addEventListener("change", checkOrientation);
  // Pause when app/tab is hidden (prevent dying while away)
  let pausedByVisibility = false;
  const visHandler = () => {
    if (document.hidden && !pausedByVisibility && !scene.isGameOver()) {
      pausedByVisibility = true;
      if (!scene.isPaused()) scene.togglePause();
    } else if (!document.hidden && pausedByVisibility) {
      pausedByVisibility = false;
      // Leave paused — player can unpause manually when ready
    }
  };
  document.addEventListener("visibilitychange", visHandler);

  activeOrientationCleanup = () => {
    orientationQuery.removeEventListener("change", checkOrientation);
    document.removeEventListener("visibilitychange", visHandler);
  };
  checkOrientation();

  // ── Effect timer bar ──────────────────────────────────────────────────────
  const effectTimerBar = new Graphics();
  const effectTimerLabel = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 14,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  effectTimerLabel.anchor.set(0.5, 1);
  effectTimerLabel.x = GAME_WIDTH / 2;
  effectTimerLabel.y = GAME_HEIGHT - 8;
  app.stage.addChild(effectTimerBar, effectTimerLabel);

  // ── Pause overlay ────────────────────────────────────────────────────
  const resumeGame = () => {
    if (scene.isPaused()) {
      scene.togglePause();
      pauseOverlay.visible = false;
    }
  };
  const pauseOverlay = createPauseMenu(resumeGame, () => cleanupAndGoHome(app));
  app.stage.addChild(pauseOverlay);

  hud.onPause = () => {
    scene.togglePause();
    pauseOverlay.visible = scene.isPaused();
  };
  activeEscHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !scene.isGameOver()) {
      scene.togglePause();
      pauseOverlay.visible = scene.isPaused();
    }
  };
  window.addEventListener("keydown", activeEscHandler);

  // ── Countdown ──────────────────────────────────────────────────────────
  const countdownText = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 48,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 4 },
    }),
  });
  countdownText.x = GAME_WIDTH / 2;
  countdownText.y = GAME_HEIGHT * 0.4;
  countdownText.anchor.set(0.5, 0.5);
  app.stage.addChild(countdownText);
  scene.startCountdown();

  // ── Tutorial (first play) — pauses game while active ──────────────────
  const tutorial = new Tutorial();
  app.stage.addChild(tutorial.container);
  if (tutorial.shouldShow()) {
    tutorial.show();
    scene.togglePause(); // pause game during tutorial
    let lastAdvance = Date.now(); // block the tap that launched the game
    const advanceTutorial = () => {
      const now = Date.now();
      if (now - lastAdvance < 400) return; // debounce — prevent double-fire
      lastAdvance = now;
      if (tutorial.isActive()) {
        if (!tutorial.advance()) {
          app.canvas.removeEventListener("click", advanceTutorial);
          app.canvas.removeEventListener("touchstart", advanceTutorial);
          scene.togglePause(); // unpause when tutorial ends
        }
      }
    };
    app.canvas.addEventListener("click", advanceTutorial);
    app.canvas.addEventListener("touchstart", advanceTutorial);
  }

  // ── Game loop ────────────────────────────────────────────────────────────
  const gameLoopTicker = createGameLoopTicker(
    app,
    scene,
    hud,
    { effectTimerBar, effectTimerLabel, countdownText },
    () => cleanupAndRestart(app),
    () => cleanupAndGoHome(app),
  );
  activeGameTicker = gameLoopTicker;
  app.ticker.add(gameLoopTicker);

  // Ensure FPS counter is always the topmost element on stage
  const fpsContainer = hud.getFpsContainer();
  if (fpsContainer) {
    hud.container.removeChild(fpsContainer);
    app.stage.addChild(fpsContainer);
  }
}
