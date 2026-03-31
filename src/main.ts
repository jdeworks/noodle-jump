import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GameScene } from "./scenes/GameScene";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./config/constants";
import { FireworkDisplay } from "./rendering/fireworks";
import { loadHighScore } from "./systems/Score";
import { ParallaxBackground } from "./systems/Parallax";
import { createZoneState, getInterpolatedTheme } from "./systems/Zone";
import {
  initAudio,
  playMusic,
  stopMusic,
  playSfxHighScore,
  isSfxEnabled,
  isMusicEnabled,
  setSfxEnabled,
  setMusicEnabled,
  getSfxVolume,
  setSfxVolume,
  getMusicVolume,
  setMusicVolume,
} from "./systems/Audio";
import { resetPlatformIds } from "./entities/Platform";
import { resetPowerUpIds } from "./entities/PowerUp";
import { resetCollectibleIds } from "./entities/Collectible";
import { resetEnemyIds } from "./entities/Enemy";
import { resetProjectileIds } from "./entities/Projectile";
import { isEnemiesEnabled, setEnemiesEnabled } from "./systems/EnemySettings";

// Lock to portrait via Screen Orientation API
const orient = screen.orientation as
  | { lock?: (o: string) => Promise<void> }
  | undefined;
orient?.lock?.("portrait").catch(() => {});

// Keep screen awake during gameplay (motion-controlled, no touch interaction)
let wakeLock: WakeLockSentinel | null = null;
async function requestWakeLock(): Promise<void> {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    }
  } catch {
    // Wake lock request failed (e.g. tab not visible)
  }
}
function releaseWakeLock(): void {
  wakeLock?.release();
  wakeLock = null;
}
// Re-acquire after tab becomes visible again (auto-released on hide)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !wakeLock) {
    requestWakeLock();
  }
});

function requestFullscreen(): void {
  const doc = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };
  (
    doc.requestFullscreen?.() ??
    doc.webkitRequestFullscreen?.() ??
    doc.msRequestFullscreen?.() ??
    Promise.resolve()
  ).catch(() => {});
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function main() {
  const app = new Application();
  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    background: "#fff8e7",
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  const container = document.getElementById("game");
  if (!container) throw new Error("Missing #game element");
  container.appendChild(app.canvas);

  showTitleScreen(app);
}

// ── Title Screen ──────────────────────────────────────────────────────────

function showTitleScreen(app: Application): void {
  const titleContainer = new Container();
  app.stage.addChild(titleContainer);

  // Scrolling parallax background (zone 1 theme)
  const parallax = new ParallaxBackground();
  titleContainer.addChild(parallax.container);
  const zoneState = createZoneState();
  const theme = getInterpolatedTheme(0);
  parallax.applyTheme(theme, zoneState.currentZone);

  // Set background color
  const bgHex = "#" + theme.background.toString(16).padStart(6, "0");
  document.body.style.backgroundColor = bgHex;

  // Dim overlay so text is readable
  const dimOverlay = new Graphics();
  dimOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  dimOverlay.fill({ color: 0x000000, alpha: 0.25 });
  titleContainer.addChild(dimOverlay);

  // Title text
  const titleText = new Text({
    text: "NOODLE\nJUMP",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 48,
      fill: "#e94560",
      fontWeight: "bold",
      align: "center",
      lineHeight: 52,
      stroke: { color: "#000000", width: 4 },
    }),
  });
  titleText.x = GAME_WIDTH / 2;
  titleText.y = GAME_HEIGHT * 0.2;
  titleText.anchor.set(0.5, 0);
  titleContainer.addChild(titleText);

  // Subtitle
  const subtitleText = new Text({
    text: "A pasta-themed endless jumper",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 12,
      fill: "#d4a574",
      align: "center",
    }),
  });
  subtitleText.x = GAME_WIDTH / 2;
  subtitleText.y = GAME_HEIGHT * 0.2 + 115;
  subtitleText.anchor.set(0.5, 0);
  titleContainer.addChild(subtitleText);

  // High score
  const highScore = loadHighScore();
  if (highScore > 0) {
    const hsText = new Text({
      text: `Best: ${highScore}`,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 18,
        fill: "#ffdd44",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    hsText.x = GAME_WIDTH / 2;
    hsText.y = GAME_HEIGHT * 0.52;
    hsText.anchor.set(0.5, 0.5);
    titleContainer.addChild(hsText);
  }

  // "Tap to play" prompt
  const promptText = new Text({
    text: "Tap to play",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 20,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  promptText.x = GAME_WIDTH / 2;
  promptText.y = GAME_HEIGHT * 0.65;
  promptText.anchor.set(0.5, 0.5);
  titleContainer.addChild(promptText);

  // Keyboard hint for desktop
  const kbHint = new Text({
    text: "Arrow keys / WASD to move",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 11,
      fill: "#999999",
    }),
  });
  kbHint.x = GAME_WIDTH / 2;
  kbHint.y = GAME_HEIGHT * 0.72;
  kbHint.anchor.set(0.5, 0);
  titleContainer.addChild(kbHint);

  // Settings toggles — prominent panel
  const settingsContainer = createSettingsToggles();
  settingsContainer.y = GAME_HEIGHT * 0.78;
  titleContainer.addChild(settingsContainer);

  // Animate parallax + pulse prompt
  let scrollY = 0;
  const titleTicker = () => {
    scrollY -= 4;
    parallax.update(scrollY);
    const pulse = 0.85 + Math.sin(Date.now() * 0.004) * 0.15;
    promptText.alpha = pulse;
  };
  app.ticker.add(titleTicker);

  // Start game on input — ignore taps on the settings area
  let settingsClicked = false;
  const settingsBounds = {
    left: GAME_WIDTH / 2 - 130,
    right: GAME_WIDTH / 2 + 130,
    top: GAME_HEIGHT * 0.78 - 8,
    bottom: GAME_HEIGHT * 0.78 + 122,
  };

  const isInSettings = (e: MouseEvent | TouchEvent): boolean => {
    const rect = app.canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return false;
    }
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return (
      x >= settingsBounds.left &&
      x <= settingsBounds.right &&
      y >= settingsBounds.top &&
      y <= settingsBounds.bottom
    );
  };

  const startGame = async (e: Event) => {
    if (e instanceof MouseEvent || e instanceof TouchEvent) {
      if (isInSettings(e)) return;
    }

    app.canvas.removeEventListener("click", startGame);
    app.canvas.removeEventListener("touchstart", startGame);
    window.removeEventListener("keydown", startGame);

    initAudio();
    playMusic(0);

    app.ticker.remove(titleTicker);
    parallax.destroy();
    app.stage.removeChild(titleContainer);
    titleContainer.destroy({ children: true });

    await launchGame(app);
  };

  app.canvas.addEventListener("click", startGame);
  app.canvas.addEventListener("touchstart", startGame);
  window.addEventListener("keydown", startGame);
}

// ── State-based restart ──────────────────────────────────────────────────

// Track active game session for clean restart
let activeScene: GameScene | null = null;
let activeGameTicker: (() => void) | null = null;
let activeOrientationCleanup: (() => void) | null = null;

function cleanupAndRestart(app: Application): void {
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

// ── Game Launch ───────────────────────────────────────────────────────────

async function launchGame(app: Application): Promise<void> {
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
      showGameOver(app, {
        score: scene.getScore(),
        height: scene.getHeight(),
        seconds: scene.getElapsedSeconds(),
        highScore: scene.getHighScore(),
        meatballs: scene.getMeatballsCollected(),
        powerUps: scene.getPowerUpsCollected(),
        bestCombo: scene.getBestCombo(),
        bestStreak: scene.getBestStreak(),
        platforms: scene.getPlatformsPassed(),
      });
    }
  };
  activeGameTicker = gameLoopTicker;
  app.ticker.add(gameLoopTicker);
}

// ── Settings Toggles ──────────────────────────────────────────────────────

function createSettingsToggles(): Container {
  const container = new Container();

  // Background panel — taller for volume controls
  const bg = new Graphics();
  bg.roundRect(GAME_WIDTH / 2 - 130, -8, 260, 130, 8);
  bg.fill({ color: 0x000000, alpha: 0.4 });
  container.addChild(bg);

  const headerStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 12,
    fill: "#888888",
    align: "center",
  });
  const header = new Text({ text: "SETTINGS", style: headerStyle });
  header.x = GAME_WIDTH / 2;
  header.y = -2;
  header.anchor.set(0.5, 0);
  container.addChild(header);

  const labelStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 13,
    fill: "#ffffff",
    fontWeight: "bold",
  });
  const smallStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 13,
    fill: "#88aaff",
    fontWeight: "bold",
  });
  const valueOn = "#44ff44";
  const valueOff = "#666666";
  const valueStyle = (on: boolean) =>
    new TextStyle({
      fontFamily: "monospace",
      fontSize: 13,
      fill: on ? valueOn : valueOff,
      fontWeight: "bold",
    });

  /** Create a volume row with -/+ buttons and percentage display. */
  function addVolumeRow(
    y: number,
    label: string,
    getVal: () => number,
    setVal: (v: number) => void,
  ): void {
    const lbl = new Text({ text: label, style: labelStyle });
    lbl.x = GAME_WIDTH / 2 - 120;
    lbl.y = y;
    container.addChild(lbl);

    const valText = new Text({
      text: `${getVal()}%`,
      style: new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#ffffff", fontWeight: "bold" }),
    });
    valText.x = GAME_WIDTH / 2 + 30;
    valText.y = y;
    container.addChild(valText);

    const minus = new Text({ text: "[-]", style: smallStyle });
    minus.x = GAME_WIDTH / 2 + 70;
    minus.y = y;
    minus.eventMode = "static";
    minus.cursor = "pointer";
    minus.on("pointertap", (e: Event) => {
      e.stopPropagation();
      setVal(Math.max(0, getVal() - 10));
      valText.text = `${getVal()}%`;
    });
    container.addChild(minus);

    const plus = new Text({ text: "[+]", style: smallStyle });
    plus.x = GAME_WIDTH / 2 + 100;
    plus.y = y;
    plus.eventMode = "static";
    plus.cursor = "pointer";
    plus.on("pointertap", (e: Event) => {
      e.stopPropagation();
      setVal(Math.min(100, getVal() + 10));
      valText.text = `${getVal()}%`;
    });
    container.addChild(plus);
  }

  // SFX volume
  addVolumeRow(18, "SFX:", getSfxVolume, (v) => {
    setSfxVolume(v);
    setSfxEnabled(v > 0);
  });

  // Music volume
  addVolumeRow(38, "Music:", getMusicVolume, (v) => {
    setMusicVolume(v);
    setMusicEnabled(v > 0);
  });

  // Enemies toggle
  const enemyLabel = new Text({ text: "Enemies: ", style: labelStyle });
  enemyLabel.x = GAME_WIDTH / 2 - 120;
  enemyLabel.y = 60;
  container.addChild(enemyLabel);

  const enemyValue = new Text({
    text: isEnemiesEnabled() ? "ON" : "OFF",
    style: valueStyle(isEnemiesEnabled()),
  });
  enemyValue.x = GAME_WIDTH / 2 + 30;
  enemyValue.y = 60;
  container.addChild(enemyValue);

  const enemyHit = new Graphics();
  enemyHit.rect(GAME_WIDTH / 2 - 130, 56, 260, 22);
  enemyHit.fill({ color: 0x000000, alpha: 0.001 });
  enemyHit.eventMode = "static";
  enemyHit.cursor = "pointer";
  enemyHit.on("pointertap", (e: Event) => {
    e.stopPropagation();
    setEnemiesEnabled(!isEnemiesEnabled());
    enemyValue.text = isEnemiesEnabled() ? "ON" : "OFF";
    enemyValue.style = valueStyle(isEnemiesEnabled());
  });
  container.addChild(enemyHit);

  // Make the container interactive so taps on it don't start the game
  bg.eventMode = "static";
  bg.on("pointertap", (e: Event) => e.stopPropagation());

  return container;
}

interface GameOverStats {
  score: number;
  height: number;
  seconds: number;
  highScore: number;
  meatballs: number;
  powerUps: number;
  bestCombo: number;
  bestStreak: number;
  platforms: number;
}

function showGameOver(app: Application, stats: GameOverStats): void {
  // Remove fullscreen listeners so game-over taps don't trigger fullscreen
  app.canvas.removeEventListener("touchstart", requestFullscreen);
  app.canvas.removeEventListener("click", requestFullscreen);
  releaseWakeLock();

  const isNewRecord = stats.score >= stats.highScore && stats.score > 0;

  const dim = new Graphics();
  dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  dim.fill({ color: 0x000000, alpha: 0.5 });
  app.stage.addChild(dim);

  if (isNewRecord) {
    const fireworks = new FireworkDisplay(10);
    app.stage.addChild(fireworks.container);
    const fireworkTicker = () => {
      if (!fireworks.update()) {
        app.ticker.remove(fireworkTicker);
        fireworks.destroy();
        app.ticker.stop();
      }
    };
    app.ticker.add(fireworkTicker);
    app.ticker.start();
  }

  // Title
  const title = new Text({
    text: isNewRecord ? "NEW HIGH SCORE!" : "Game Over!",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: isNewRecord ? 22 : 24,
      fill: isNewRecord ? "#ffdd44" : "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 3 },
    }),
  });
  title.x = GAME_WIDTH / 2;
  title.y = GAME_HEIGHT * 0.18;
  title.anchor.set(0.5, 0.5);
  app.stage.addChild(title);

  // Score breakdown
  const breakdownLines = [
    `Score     ${stats.score}`,
    `Best      ${stats.highScore}`,
    "",
    `Height    ${stats.height}`,
    `Time      ${formatTime(stats.seconds)}`,
    `Platforms ${stats.platforms}`,
    "",
    `Meatballs ${stats.meatballs}`,
    `Power-ups ${stats.powerUps}`,
    `Combo     ${stats.bestCombo}x`,
    `Streak    ${stats.bestStreak}`,
  ];

  const breakdown = new Text({
    text: breakdownLines.join("\n"),
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 13,
      fill: "#cccccc",
      lineHeight: 20,
    }),
  });
  breakdown.x = GAME_WIDTH / 2;
  breakdown.y = GAME_HEIGHT * 0.42;
  breakdown.anchor.set(0.5, 0.5);
  app.stage.addChild(breakdown);

  // Suppress restart briefly when a button is tapped
  let buttonTapped = false;

  // Share button
  const shareText = new Text({
    text: "[Share Score]",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 14,
      fill: "#44aaff",
      fontWeight: "bold",
    }),
  });
  shareText.x = GAME_WIDTH / 2;
  shareText.y = GAME_HEIGHT * 0.68;
  shareText.anchor.set(0.5, 0.5);
  shareText.eventMode = "static";
  shareText.cursor = "pointer";
  shareText.on("pointertap", (e: Event) => {
    e.stopPropagation();
    buttonTapped = true;
    setTimeout(() => { buttonTapped = false; }, 200);
    const shareMsg =
      `I scored ${stats.score} on Noodle Jump!\n` +
      `Height: ${stats.height} | Meatballs: ${stats.meatballs} | ` +
      `Best combo: ${stats.bestCombo}x`;
    navigator.clipboard.writeText(shareMsg).then(
      () => {
        shareText.text = "Copied!";
        shareText.style.fill = "#66cc66";
      },
      () => {
        shareText.text = "Copy failed";
      },
    );
  });
  app.stage.addChild(shareText);

  // Tap to restart
  const restartText = new Text({
    text: "Tap to restart",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 16,
      fill: "#ffffff",
      fontWeight: "bold",
    }),
  });
  restartText.x = GAME_WIDTH / 2;
  restartText.y = GAME_HEIGHT * 0.78;
  restartText.anchor.set(0.5, 0.5);
  app.stage.addChild(restartText);

  // Clear data
  const clearText = new Text({
    text: "[Clear saved data]",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 11,
      fill: "#666666",
    }),
  });
  clearText.x = GAME_WIDTH / 2;
  clearText.y = GAME_HEIGHT * 0.88;
  clearText.anchor.set(0.5, 0.5);
  clearText.eventMode = "static";
  clearText.cursor = "pointer";
  clearText.on("pointertap", (e: Event) => {
    e.stopPropagation();
    buttonTapped = true;
    setTimeout(() => { buttonTapped = false; }, 200);
    localStorage.clear();
    clearText.text = "Data cleared!";
    clearText.style.fill = "#66cc66";
  });
  app.stage.addChild(clearText);

  const restart = () => {
    if (buttonTapped) return;
    app.canvas.removeEventListener("click", restart);
    app.canvas.removeEventListener("touchstart", restart);
    window.removeEventListener("keydown", restart);

    // State-based restart — clean up and relaunch without page reload
    cleanupAndRestart(app);
  };

  setTimeout(
    () => {
      app.canvas.addEventListener("click", restart);
      app.canvas.addEventListener("touchstart", restart);
      window.addEventListener("keydown", restart);
    },
    isNewRecord ? 1500 : 300,
  );
}

main();
