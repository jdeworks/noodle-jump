/** Game launch, game loop ticker, and restart logic. */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
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
import { createGameLoopTicker } from "./GameLoopTicker";

// ── Active session tracking ──────────────────────────────────────────────

let activeScene: GameScene | null = null;
let activeGameTicker: (() => void) | null = null;
let activeOrientationCleanup: (() => void) | null = null;

export function cleanupAndRestart(app: Application): void {
  if (activeGameTicker) {
    app.ticker.remove(activeGameTicker);
    activeGameTicker = null;
  }
  if (activeOrientationCleanup) {
    activeOrientationCleanup();
    activeOrientationCleanup = null;
  }
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
  playMusic(0);
  launchGame(app);
}

// ── Game Launch ──────────────────────────────────────────────────────────

export async function launchGame(app: Application, runConfig?: RunConfig): Promise<void> {
  requestWakeLock();
  const scene = new GameScene(runConfig);
  activeScene = scene;
  scene.initInput(app.canvas);
  app.stage.addChild(scene.container);

  // ── HUD ──────────────────────────────────────────────────────────────────
  const hud = new HUD();
  app.stage.addChild(hud.container);

  // Pause — handled by HUD's built-in button

  // Fullscreen handled by HUD button — no auto-fullscreen on tap

  // ── Tilt permission ──────────────────────────────────────────────────────
  if (scene.input.needsTiltPermission) {
    await scene.input.requestTiltPermission();
  }

  // ── Knife throw on click/tap (enemies mode) ───────────────────────────
  const handleThrow = (e: MouseEvent | TouchEvent) => {
    if (!isEnemiesEnabled() && !scene.isInBossFight()) return;
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
    scene.handleThrow(
      (clientX - rect.left) * scaleX,
      (clientY - rect.top) * scaleY,
    );
  };
  app.canvas.addEventListener("click", handleThrow);
  app.canvas.addEventListener("touchstart", handleThrow);

  // ── Orientation pause ─────────────────────────────────────────────────────
  const orientationQuery = window.matchMedia(
    "(orientation: landscape) and (max-height: 500px)",
  );
  let pausedByOrientation = false;
  const checkOrientation = () => {
    if (orientationQuery.matches && !pausedByOrientation) {
      pausedByOrientation = true;
      app.ticker.stop();
    } else if (!orientationQuery.matches && pausedByOrientation) {
      pausedByOrientation = false;
      if (!scene.isGameOver()) app.ticker.start();
    }
  };
  orientationQuery.addEventListener("change", checkOrientation);
  activeOrientationCleanup = () => {
    orientationQuery.removeEventListener("change", checkOrientation);
  };
  checkOrientation();

  // ── Effect timer bar ──────────────────────────────────────────────────────
  const effectTimerBar = new Graphics();
  const effectTimerLabel = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace", fontSize: 14,
      fill: "#ffffff", fontWeight: "bold",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  effectTimerLabel.anchor.set(0.5, 1);
  effectTimerLabel.x = GAME_WIDTH / 2;
  effectTimerLabel.y = GAME_HEIGHT - 8;
  app.stage.addChild(effectTimerBar, effectTimerLabel);

  // ── Pause overlay ──────────────────────────────────────────────────────
  const pauseOverlay = new Container();
  pauseOverlay.visible = false;
  const pauseDim = new Graphics();
  pauseDim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  pauseDim.fill({ color: 0x000000, alpha: 0.5 });
  pauseOverlay.addChild(pauseDim);
  const pauseText = new Text({
    text: "PAUSED\n\nTap to resume",
    style: new TextStyle({
      fontFamily: "monospace", fontSize: 24,
      fill: "#ffffff", fontWeight: "bold",
      align: "center", lineHeight: 32,
    }),
  });
  pauseText.x = GAME_WIDTH / 2;
  pauseText.y = GAME_HEIGHT * 0.4;
  pauseText.anchor.set(0.5, 0.5);
  pauseOverlay.addChild(pauseText);
  app.stage.addChild(pauseOverlay);

  hud.onPause = () => {
    scene.togglePause();
    pauseOverlay.visible = scene.isPaused();
  };
  pauseDim.eventMode = "static";
  pauseDim.on("pointertap", () => {
    if (scene.isPaused()) {
      scene.togglePause();
      pauseOverlay.visible = false;
    }
  });

  // ── Countdown ──────────────────────────────────────────────────────────
  const countdownText = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace", fontSize: 48,
      fill: "#ffffff", fontWeight: "bold",
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
    let lastAdvance = 0;
    const advanceTutorial = () => {
      const now = Date.now();
      if (now - lastAdvance < 300) return; // debounce — prevent double-fire
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
  );
  activeGameTicker = gameLoopTicker;
  app.ticker.add(gameLoopTicker);
}
