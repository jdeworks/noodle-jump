/** Game launch, game loop ticker, and restart logic. */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GameScene } from "./GameScene";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config/constants";
import { FireworkDisplay } from "../rendering/fireworks";
import { playMusic, stopMusic, playSfxHighScore } from "../systems/Audio";
import { isEnemiesEnabled } from "../systems/EnemySettings";
import { resetPlatformIds } from "../entities/Platform";
import { resetPowerUpIds } from "../entities/PowerUp";
import { resetCollectibleIds } from "../entities/Collectible";
import { resetEnemyIds } from "../entities/Enemy";
import { resetProjectileIds } from "../entities/Projectile";
import { requestWakeLock, requestFullscreen } from "../utils/wakeLock";
import { formatTime } from "../utils/format";
import { showGameOver } from "../ui/GameOverView";

// ── Active session tracking ──────────────────────────────────────────────

let activeScene: GameScene | null = null;
let activeGameTicker: (() => void) | null = null;
let activeOrientationCleanup: (() => void) | null = null;

export function cleanupAndRestart(app: Application): void {
  // Remove game loop ticker
  if (activeGameTicker) {
    app.ticker.remove(activeGameTicker);
    activeGameTicker = null;
  }
  // Clean up orientation listener
  if (activeOrientationCleanup) {
    activeOrientationCleanup();
    activeOrientationCleanup = null;
  }
  // Destroy scene
  if (activeScene) {
    activeScene.destroy();
    activeScene = null;
  }
  // Clear stage
  while (app.stage.children.length > 0) {
    const child = app.stage.children[0];
    app.stage.removeChild(child);
    child.destroy({ children: true });
  }
  // Reset entity ID counters
  resetPlatformIds();
  resetPowerUpIds();
  resetCollectibleIds();
  resetEnemyIds();
  resetProjectileIds();

  // Relaunch
  playMusic(0);
  launchGame(app);
}

// ── Game Launch ──────────────────────────────────────────────────────────

export async function launchGame(app: Application): Promise<void> {
  requestWakeLock();
  const scene = new GameScene();
  activeScene = scene;
  scene.initInput(app.canvas);
  app.stage.addChild(scene.container);

  // ── HUD ──────────────────────────────────────────────────────────────────
  const hudContainer = new Container();
  app.stage.addChild(hudContainer);

  const hudBg = new Graphics();
  hudBg.rect(0, 0, GAME_WIDTH, 36);
  hudBg.fill({ color: 0x000000, alpha: 0.3 });
  hudContainer.addChild(hudBg);

  const hudStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 14,
    fill: "#ffffff",
    fontWeight: "bold",
  });

  const timerText = new Text({ text: "0:00", style: hudStyle });
  timerText.x = 10;
  timerText.y = 9;

  const heightText = new Text({ text: "H: 0", style: hudStyle });
  heightText.x = GAME_WIDTH / 2;
  heightText.anchor.set(0.5, 0);
  heightText.y = 9;

  const scoreText = new Text({ text: "0", style: hudStyle });
  scoreText.x = GAME_WIDTH - 10;
  scoreText.anchor.set(1, 0);
  scoreText.y = 9;

  // Pause button
  const pauseBtn = new Text({
    text: "II",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 16,
      fill: "#ffffff",
      fontWeight: "bold",
    }),
  });
  pauseBtn.x = GAME_WIDTH - 10;
  pauseBtn.y = 26;
  pauseBtn.anchor.set(1, 0);
  pauseBtn.eventMode = "static";
  pauseBtn.cursor = "pointer";
  pauseBtn.visible = true;

  // Zone progress bar
  const zoneBar = new Graphics();
  const zoneLabel = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 11,
      fill: "#ffffff",
      fontWeight: "bold",
    }),
  });
  zoneLabel.x = GAME_WIDTH / 2;
  zoneLabel.y = 36;
  zoneLabel.anchor.set(0.5, 0);

  hudContainer.addChild(
    timerText,
    heightText,
    scoreText,
    pauseBtn,
    zoneBar,
    zoneLabel,
  );

  // ── Fullscreen on first tap ──────────────────────────────────────────────
  app.canvas.addEventListener("touchstart", requestFullscreen, { once: true });
  app.canvas.addEventListener("click", requestFullscreen, { once: true });

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
    const screenX = (clientX - rect.left) * scaleX;
    const screenY = (clientY - rect.top) * scaleY;
    scene.handleThrow(screenX, screenY);
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
      fontFamily: "monospace",
      fontSize: 13,
      fill: "#ffffff",
      fontWeight: "bold",
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
      fontFamily: "monospace",
      fontSize: 24,
      fill: "#ffffff",
      fontWeight: "bold",
      align: "center",
      lineHeight: 32,
    }),
  });
  pauseText.x = GAME_WIDTH / 2;
  pauseText.y = GAME_HEIGHT * 0.4;
  pauseText.anchor.set(0.5, 0.5);
  pauseOverlay.addChild(pauseText);
  app.stage.addChild(pauseOverlay);

  pauseBtn.on("pointertap", () => {
    scene.togglePause();
    pauseOverlay.visible = scene.isPaused();
  });
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

  // ── In-game fireworks for beating high score ─────────────────────────────
  let inGameFireworks: FireworkDisplay | null = null;
  let inGameHighScoreLabel: Text | null = null;

  // ── Game loop ────────────────────────────────────────────────────────────
  let goTextTicks = 0;
  const gameLoopTicker = () => {
    scene.update();

    // Countdown display
    const cd = scene.getCountdownSeconds();
    if (cd !== undefined && cd > 0) {
      countdownText.text = `${cd}`;
      countdownText.visible = true;
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
      countdownText.scale.set(pulse);
      goTextTicks = 40; // queue "GO!" for when countdown ends
    } else if (goTextTicks > 0) {
      countdownText.text = "GO!";
      countdownText.visible = true;
      countdownText.scale.set(1 + (40 - goTextTicks) * 0.02);
      countdownText.alpha = goTextTicks / 40;
      goTextTicks--;
    } else if (countdownText.visible) {
      countdownText.visible = false;
      countdownText.alpha = 1;
    }

    timerText.text = formatTime(scene.getElapsedSeconds());
    heightText.text = `H: ${scene.getHeight()}`;
    scoreText.text = `${scene.getScore()}`;

    // Check for new high score during gameplay
    if (scene.checkNewHighScore() && !inGameFireworks) {
      playSfxHighScore();
      inGameFireworks = new FireworkDisplay(10);
      app.stage.addChild(inGameFireworks.container);

      inGameHighScoreLabel = new Text({
        text: "NEW HIGH SCORE!",
        style: new TextStyle({
          fontFamily: "monospace",
          fontSize: 18,
          fill: "#ffdd44",
          fontWeight: "bold",
          stroke: { color: "#000000", width: 3 },
          align: "center",
        }),
      });
      inGameHighScoreLabel.x = GAME_WIDTH / 2;
      inGameHighScoreLabel.y = GAME_HEIGHT * 0.15;
      inGameHighScoreLabel.anchor.set(0.5, 0.5);
      app.stage.addChild(inGameHighScoreLabel);
    }

    // Animate in-game fireworks
    if (inGameFireworks) {
      if (!inGameFireworks.update()) {
        inGameFireworks.destroy();
        inGameFireworks = null;
        if (inGameHighScoreLabel) {
          app.stage.removeChild(inGameHighScoreLabel);
          inGameHighScoreLabel.destroy();
          inGameHighScoreLabel = null;
        }
      } else if (inGameHighScoreLabel) {
        const pulse = 0.9 + Math.sin(Date.now() * 0.008) * 0.1;
        inGameHighScoreLabel.scale.set(pulse);
      }
    }

    // Effect timer bar
    effectTimerBar.clear();
    const effectName = scene.getActiveEffectName();
    const effectProgress = scene.getActiveEffectProgress();
    if (effectName && effectProgress > 0) {
      const barW = (GAME_WIDTH - 40) * effectProgress;
      const color = COLORS.powerups[effectName] ?? 0xffffff;
      effectTimerBar.rect(20, GAME_HEIGHT - 6, GAME_WIDTH - 40, 4);
      effectTimerBar.fill({ color: 0x333333, alpha: 0.5 });
      effectTimerBar.rect(20, GAME_HEIGHT - 6, barW, 4);
      effectTimerBar.fill(color);
      effectTimerLabel.text = effectName.replace("_", " ").toUpperCase();
      effectTimerLabel.visible = true;
    } else {
      effectTimerLabel.visible = false;
    }

    // Zone progress bar
    zoneBar.clear();
    const zoneNames = ["Kitchen", "Ocean", "Space", "Freezer", "Volcano", "Candy", "Final Kitchen"];
    const zone = scene.getZone();
    const zp = scene.getZoneProgress();
    const barTop = 36;
    if (zp < 1) {
      zoneBar.rect(0, barTop, GAME_WIDTH, 3);
      zoneBar.fill({ color: 0x333333, alpha: 0.3 });
      zoneBar.rect(0, barTop, GAME_WIDTH * zp, 3);
      zoneBar.fill({ color: 0xffdd44, alpha: 0.6 });
      zoneLabel.text = `${zoneNames[zone] ?? "Zone " + (zone + 1)}`;
      zoneLabel.visible = true;
    } else {
      zoneLabel.text = zoneNames[zone] ?? "Zone " + (zone + 1);
      zoneLabel.visible = true;
    }

    if (scene.isGameOver()) {
      stopMusic();
      app.ticker.stop();
      showGameOver(
        app,
        {
          score: scene.getScore(),
          height: scene.getHeight(),
          seconds: scene.getElapsedSeconds(),
          highScore: scene.getHighScore(),
          meatballs: scene.getMeatballsCollected(),
          powerUps: scene.getPowerUpsCollected(),
          bestCombo: scene.getBestCombo(),
          bestStreak: scene.getBestStreak(),
          platforms: scene.getPlatformsPassed(),
        },
        () => cleanupAndRestart(app),
      );
    }
  };
  activeGameTicker = gameLoopTicker;
  app.ticker.add(gameLoopTicker);
}
