/** Title screen rendering and interaction. */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { loadHighScore } from "../systems/Score";
import { ParallaxBackground } from "../systems/Parallax";
import { createZoneState, getInterpolatedTheme } from "../systems/Zone";
import { initAudio, playMusic, playTitleMusic, stopMusic } from "../systems/Audio";
import { createSettingsToggles } from "./SettingsToggles";
import { requestFullscreen } from "../utils/wakeLock";
import { ExplanationScreen } from "./ExplanationScreen";
import { CustomRunScreen } from "./CustomRunScreen";
import { loadStats } from "./StatsPanel";
import { drawChef } from "../rendering/sprites";
import type { RunConfig } from "../systems/CustomRunConfig";

export function showTitleScreen(
  app: Application,
  onStartGame: (runConfig?: RunConfig) => Promise<void>,
): void {
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

  // Dim overlay — dark enough for white/colored text to read (4.5:1+)
  const dimOverlay = new Graphics();
  dimOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  dimOverlay.fill({ color: 0x1a1008, alpha: 0.55 });
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
  titleText.y = GAME_HEIGHT * 0.06;
  titleText.anchor.set(0.5, 0);
  titleContainer.addChild(titleText);

  // Subtitle
  const subtitleText = new Text({
    text: "A pasta-themed endless jumper",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 13,
      fill: "#ffddbb",
      fontWeight: "bold",
      align: "center",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  subtitleText.x = GAME_WIDTH / 2;
  subtitleText.y = GAME_HEIGHT * 0.06 + 110;
  subtitleText.anchor.set(0.5, 0);
  titleContainer.addChild(subtitleText);

  // Animated chef character
  const chefGfx = new Graphics();
  chefGfx.x = GAME_WIDTH / 2 - 16;
  chefGfx.y = GAME_HEIGHT * 0.30;
  drawChef(chefGfx, 32, 40);
  titleContainer.addChild(chefGfx);

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
        stroke: { color: "#000000", width: 3 },
      }),
    });
    hsText.x = GAME_WIDTH / 2;
    hsText.y = GAME_HEIGHT * 0.06 + 130;
    hsText.anchor.set(0.5, 0.5);
    titleContainer.addChild(hsText);
  }

  // ── Vertical button stack under chef ─────────────────────────────────
  const btnW = Math.min(260, GAME_WIDTH - 40);
  const btnX = (GAME_WIDTH - btnW) / 2;
  const btnH = 36;
  const btnSpacing = 6;
  let btnTop = GAME_HEIGHT * 0.39;

  // Helper: create a styled button
  function makeButton(
    label: string, y: number,
    fillColor: number, textColor: string, fontSize: number,
  ): { bg: Graphics; text: Text } {
    const bg = new Graphics();
    bg.roundRect(btnX, y, btnW, btnH, 10);
    bg.fill({ color: fillColor, alpha: 0.7 });
    bg.roundRect(btnX, y, btnW, btnH, 10);
    bg.stroke({ width: 1.5, color: 0x6688bb, alpha: 0.5 });
    bg.eventMode = "static";
    bg.cursor = "pointer";
    titleContainer.addChild(bg);

    const text = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: "monospace", fontSize,
        fill: textColor, fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    text.x = GAME_WIDTH / 2;
    text.y = y + btnH / 2;
    text.anchor.set(0.5, 0.5);
    titleContainer.addChild(text);
    return { bg, text };
  }

  // 1. Tap to Play (primary — brighter)
  const playButton = makeButton("Tap to Play", btnTop, 0x1a3355, "#ffffff", 20);
  const promptText = playButton.text;
  btnTop += btnH + btnSpacing;

  // 2. How to Play
  const howButton = makeButton("How to Play", btnTop, 0x222244, "#aaccff", 15);
  const howBtnBg = howButton.bg;
  const howBtn = howButton.text;
  btnTop += btnH + btnSpacing;

  // 3. Custom Run
  const customButton = makeButton("Custom Run", btnTop, 0x222244, "#aaccff", 15);
  const customBtnBg = customButton.bg;
  const customBtn = customButton.text;
  btnTop += btnH + btnSpacing;

  // 4. Fullscreen
  const fsButton = makeButton("Fullscreen", btnTop, 0x222233, "#aaaaaa", 13);
  fsButton.bg.on("pointertap", (e: Event) => { e.stopPropagation(); requestFullscreen(); });
  fsButton.text.eventMode = "static";
  fsButton.text.on("pointertap", (e: Event) => { e.stopPropagation(); requestFullscreen(); });
  btnTop += btnH + btnSpacing + 4;

  // Keyboard hint
  const kbHint = new Text({
    text: "Arrow keys / WASD to move",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 12,
      fill: "#ddccbb",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  kbHint.x = GAME_WIDTH / 2;
  kbHint.y = btnTop;
  kbHint.anchor.set(0.5, 0);
  titleContainer.addChild(kbHint);

  // Settings toggles — pushed to bottom area
  const settingsContainer = createSettingsToggles();
  settingsContainer.y = btnTop + 50;
  titleContainer.addChild(settingsContainer);

  // Explanation screen
  const explanationScreen = new ExplanationScreen();
  const showHelp = (e: Event) => { e.stopPropagation(); explanationScreen.show(); };
  howBtnBg.on("pointertap", showHelp);
  howBtn.eventMode = "static";
  howBtn.on("pointertap", showHelp);

  // Custom run screen
  const customRunScreen = new CustomRunScreen();
  const showCustom = (e: Event) => {
    e.stopPropagation();
    customRunScreen.show((config: RunConfig) => {
      // Start game with custom config
      app.canvas.removeEventListener("click", startGame);
      app.canvas.removeEventListener("touchstart", startGame);
      window.removeEventListener("keydown", startGame);
      initAudio();
      playMusic(0);
      app.ticker.remove(titleTicker);
      parallax.destroy();
      app.stage.removeChild(titleContainer);
      titleContainer.destroy({ children: true });
      onStartGame(config);
    });
  };
  customBtnBg.on("pointertap", showCustom);
  customBtn.eventMode = "static";
  customBtn.on("pointertap", showCustom);

  // Add overlay containers LAST so they render on top of everything
  titleContainer.addChild(explanationScreen.container);
  titleContainer.addChild(customRunScreen.container);

  // Stats display — below settings panel
  const stats = loadStats();
  if (stats.totalGames > 0) {
    const statsLines = [
      `Games: ${stats.totalGames}`,
      `Meatballs: ${stats.totalMeatballs}`,
      `Best Zone: ${stats.maxZone + 1}`,
    ].join("  ·  ");
    const statsText = new Text({
      text: statsLines,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 11,
        fill: "#ccbbaa",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    statsText.x = GAME_WIDTH / 2;
    statsText.y = settingsContainer.y + 160;
    statsText.anchor.set(0.5, 0);
    titleContainer.addChild(statsText);
  }

  // Animate parallax + pulse prompt + chef
  let scrollY = 0;
  let animTick = 0;
  const titleTicker = () => {
    scrollY -= 4;
    parallax.update(scrollY);
    const pulse = 0.85 + Math.sin(Date.now() * 0.004) * 0.15;
    promptText.alpha = pulse;
    animTick++;
    chefGfx.clear();
    drawChef(chefGfx, 32, 40);
    chefGfx.y = GAME_HEIGHT * 0.30 + Math.sin(animTick * 0.05) * 4;
    explanationScreen.update();
  };
  app.ticker.add(titleTicker);

  // Game only starts via the play button — no accidental starts from other taps

  let started = false;
  const startGame = async () => {
    if (started) return;
    if (explanationScreen.isActive() || customRunScreen.isActive()) return;
    started = true;

    window.removeEventListener("keydown", handleKey);

    initAudio();
    stopMusic();
    playMusic(0);

    app.ticker.remove(titleTicker);
    parallax.destroy();
    app.stage.removeChild(titleContainer);
    titleContainer.destroy({ children: true });

    await onStartGame();
  };

  // Start title music on first interaction
  let titleMusicStarted = false;
  const startTitleMusic = () => {
    if (titleMusicStarted) return;
    titleMusicStarted = true;
    initAudio();
    playTitleMusic();
  };
  app.canvas.addEventListener("click", startTitleMusic, { once: true });
  app.canvas.addEventListener("touchstart", startTitleMusic, { once: true });

  // Only the play button starts the game (no canvas-wide click)
  playButton.bg.on("pointertap", () => startGame());
  promptText.eventMode = "static";
  promptText.on("pointertap", () => startGame());

  // Keyboard still works
  const handleKey = (e: KeyboardEvent) => {
    if (explanationScreen.isActive() || customRunScreen.isActive()) return;
    if (e.key === "Enter" || e.key === " ") startGame();
  };
  window.addEventListener("keydown", handleKey);
}
