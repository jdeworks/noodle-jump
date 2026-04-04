/** Title screen rendering and interaction. */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { loadHighScore } from "../systems/Score";
import { ParallaxBackground } from "../systems/Parallax";
import { createZoneState, getInterpolatedTheme } from "../systems/Zone";
import { initAudio, playMusic, playTitleMusic, stopMusic, applyMusicVolume } from "../systems/Audio";
import { createSettingsToggles } from "./SettingsToggles";
import { requestFullscreen } from "../utils/wakeLock";
import { ExplanationScreen } from "./ExplanationScreen";
import { CustomRunScreen } from "./CustomRunScreen";
import { CustomizeScreen } from "./CustomizeScreen";
import { loadStats } from "./StatsPanel";
import { drawCharacter, CHARACTERS } from "../rendering/PlayerCharacters";
import { getSelectedCharacter, setSelectedCharacter } from "../systems/CharacterSettings";
import type { RunConfig } from "../systems/CustomRunConfig";
import { MultiplayerMenu } from "../multiplayer/MultiplayerMenu";
import { loadCosmetics, TINT_COLORS } from "../systems/Cosmetics";
import { getUITheme } from "./ThemeUI";

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

  const uiTheme = getUITheme();
  const dimOverlay = new Graphics();
  dimOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  dimOverlay.fill({ color: uiTheme.bg, alpha: 0.6 });
  titleContainer.addChild(dimOverlay);

  // Content group — hidden when sub-menus (How to Play / Custom Run) open
  const contentGroup = new Container();
  titleContainer.addChild(contentGroup);

  // ── Flowing layout — cursorY prevents overlaps ─────────────────────
  let cursorY = 8;

  // Title text
  const titleText = new Text({
    text: "NOODLE\nJUMP",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 48,
      fill: uiTheme.accent,
      fontWeight: "bold",
      align: "center",
      lineHeight: 52,
      stroke: { color: "#000000", width: 4 },
    }),
  });
  titleText.x = GAME_WIDTH / 2;
  titleText.y = cursorY;
  titleText.anchor.set(0.5, 0);
  contentGroup.addChild(titleText);
  cursorY += 108;

  // Subtitle
  const subtitleText = new Text({
    text: "A pasta-themed endless jumper",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 13,
      fill: uiTheme.text,
      fontWeight: "bold",
      align: "center",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  subtitleText.x = GAME_WIDTH / 2;
  subtitleText.y = cursorY;
  subtitleText.anchor.set(0.5, 0);
  contentGroup.addChild(subtitleText);
  cursorY += 20;

  // High score
  const highScore = loadHighScore();
  if (highScore > 0) {
    const hsText = new Text({
      text: `Best: ${highScore}`,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 18,
        fill: uiTheme.accent,
        fontWeight: "bold",
        stroke: { color: "#000000", width: 3 },
      }),
    });
    hsText.x = GAME_WIDTH / 2;
    hsText.y = cursorY;
    hsText.anchor.set(0.5, 0);
    contentGroup.addChild(hsText);
    cursorY += 24;
  }

  // Animated character with left/right arrows to cycle
  const chefGfx = new Graphics();
  chefGfx.x = GAME_WIDTH / 2 - 16;
  chefGfx.y = cursorY;
  drawCharacter(chefGfx, 32, 40, getSelectedCharacter());
  const cosm = loadCosmetics();
  chefGfx.tint = TINT_COLORS[cosm.equipped.tint ?? "tint_none"] ?? 0xffffff;
  contentGroup.addChild(chefGfx);
  const chefBaseY = cursorY;

  const charName = new Text({ text: CHARACTERS.find(c => c.id === getSelectedCharacter())?.name ?? "Chef",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: uiTheme.accent,
      stroke: { color: "#000000", width: 2 } }) });
  charName.x = GAME_WIDTH / 2; charName.y = cursorY + 42; charName.anchor.set(0.5, 0);
  contentGroup.addChild(charName);

  const arrowStyle = new TextStyle({ fontFamily: "monospace", fontSize: 20, fill: "#999999",
    stroke: { color: "#000000", width: 2 } });
  const leftArrow = new Text({ text: "◀", style: arrowStyle });
  leftArrow.x = GAME_WIDTH / 2 - 50; leftArrow.y = cursorY + 28; leftArrow.anchor.set(0.5, 0.5);
  leftArrow.eventMode = "static"; leftArrow.cursor = "pointer";
  contentGroup.addChild(leftArrow);
  const rightArrow = new Text({ text: "▶", style: arrowStyle });
  rightArrow.x = GAME_WIDTH / 2 + 50; rightArrow.y = cursorY + 28; rightArrow.anchor.set(0.5, 0.5);
  rightArrow.eventMode = "static"; rightArrow.cursor = "pointer";
  contentGroup.addChild(rightArrow);

  const cycleChar = (dir: number) => {
    const idx = CHARACTERS.findIndex(c => c.id === getSelectedCharacter());
    const next = CHARACTERS[(idx + dir + CHARACTERS.length) % CHARACTERS.length];
    setSelectedCharacter(next.id);
    charName.text = next.name;
  };
  leftArrow.on("pointertap", (e: Event) => { e.stopPropagation(); cycleChar(-1); });
  rightArrow.on("pointertap", (e: Event) => { e.stopPropagation(); cycleChar(1); });
  cursorY += 60;

  // ── Vertical button stack ─────────────────────────────────────────
  const btnW = Math.min(260, GAME_WIDTH - 40);
  const btnX = (GAME_WIDTH - btnW) / 2;
  const btnH = 36;
  const btnSpacing = 6;

  // Helper: create a styled button
  function makeButton(
    label: string, y: number,
    fillColor: number, textColor: string, fontSize: number,
  ): { bg: Graphics; text: Text } {
    const bg = new Graphics();
    bg.roundRect(btnX, y, btnW, btnH, 10);
    bg.fill({ color: fillColor, alpha: 0.7 });
    bg.roundRect(btnX, y, btnW, btnH, 10);
    bg.stroke({ width: 1.5, color: uiTheme.buttonBorder, alpha: 0.6 });
    bg.eventMode = "static";
    bg.cursor = "pointer";
    contentGroup.addChild(bg);

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
    text.eventMode = "static";
    text.cursor = "pointer";
    contentGroup.addChild(text);
    return { bg, text };
  }

  const playButton = makeButton("Tap to Play", cursorY, uiTheme.buttonBg, uiTheme.text, 20);
  const promptText = playButton.text;
  cursorY += btnH + btnSpacing;
  const mpButton = makeButton("Multiplayer", cursorY, uiTheme.buttonBg, uiTheme.accent, 16);
  cursorY += btnH + btnSpacing;
  const howButton = makeButton("How to Play", cursorY, uiTheme.buttonBg, uiTheme.text, 15);
  const howBtnBg = howButton.bg;
  const howBtn = howButton.text;
  cursorY += btnH + btnSpacing;
  const customButton = makeButton("Custom Run", cursorY, uiTheme.buttonBg, uiTheme.text, 15);
  const customBtnBg = customButton.bg;
  const customBtn = customButton.text;
  cursorY += btnH + btnSpacing;
  const custButton = makeButton("Customize", cursorY, uiTheme.buttonBg, uiTheme.accent, 15);
  cursorY += btnH + btnSpacing;

  // 4. Fullscreen (iOS doesn't support Fullscreen API — suggest PWA install)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isPWA = window.matchMedia("(display-mode: standalone)").matches;
  const fsLabel = isIOS && !isPWA ? "Add to Home Screen for fullscreen" : "Fullscreen";
  const fsButton = makeButton(fsLabel, cursorY, uiTheme.buttonBg, uiTheme.textDim, isIOS ? 11 : 13);
  const handleFs = (e: Event) => {
    e.stopPropagation();
    if (isIOS && !isPWA) {
      fsButton.text.text = "Safari → Share → Add to Home Screen";
      fsButton.text.style.fill = "#ffcc44";
    } else { requestFullscreen(); }
  };
  fsButton.bg.on("pointertap", handleFs);
  fsButton.text.eventMode = "static";
  fsButton.text.on("pointertap", handleFs);
  cursorY += btnH + btnSpacing + 4;

  // Input hint — device-appropriate
  const kbHint = new Text({
    text: "ontouchstart" in window ? "Tilt or tap left/right to move" : "Arrow keys / WASD to move",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 12,
      fill: "#ddccbb",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  kbHint.x = GAME_WIDTH / 2; kbHint.y = cursorY; kbHint.anchor.set(0.5, 0);
  contentGroup.addChild(kbHint);
  cursorY += 38;

  // Settings toggles
  const settingsContainer = createSettingsToggles();
  settingsContainer.y = cursorY - 5;
  contentGroup.addChild(settingsContainer);

  // Explanation screen
  const explanationScreen = new ExplanationScreen();
  const showHelp = (e: Event) => { e.stopPropagation(); contentGroup.visible = false; explanationScreen.show(); };
  howBtnBg.on("pointertap", showHelp);
  howBtn.eventMode = "static";
  howBtn.on("pointertap", showHelp);

  // Custom run screen
  const customRunScreen = new CustomRunScreen();
  const showCustom = (e: Event) => {
    e.stopPropagation();
    contentGroup.visible = false;
    customRunScreen.show((config: RunConfig) => {
      // Start game with custom config
      app.canvas.removeEventListener("click", startGame);
      app.canvas.removeEventListener("touchstart", startGame);
      window.removeEventListener("keydown", startGame);
      initAudio();
      playMusic(0);
      app.ticker.remove(titleTicker);
      titleDestroyed = true; parallax.destroy();
      app.stage.removeChild(titleContainer);
      titleContainer.destroy({ children: true });
      onStartGame(config);
    });
  };
  customBtnBg.on("pointertap", showCustom);
  customBtn.eventMode = "static";
  customBtn.on("pointertap", showCustom);

  // Customize screen
  const customizeScreen = new CustomizeScreen();
  const showCust = (e: Event) => { e.stopPropagation(); contentGroup.visible = false; customizeScreen.show(); };
  custButton.bg.on("pointertap", showCust);
  custButton.text.eventMode = "static";
  custButton.text.on("pointertap", showCust);

  // Multiplayer
  let mpMenu: MultiplayerMenu | null = null;
  const cleanupTitle = () => {
    app.ticker.remove(titleTicker);
    // Remove the Enter/Space keyboard listener that starts a single-player game —
    // without this, pressing Enter in multiplayer menus launches a hidden solo game.
    window.removeEventListener("keydown", handleKey);
    titleDestroyed = true; parallax.destroy();
    app.stage.removeChild(titleContainer);
    titleContainer.destroy({ children: true });
  };
  const showMultiplayer = (e: Event) => {
    e.stopPropagation();
    contentGroup.visible = false;
    mpMenu = new MultiplayerMenu(app, () => {
      contentGroup.visible = true;
      if (mpMenu) { app.stage.removeChild(mpMenu.container); mpMenu = null; }
    }, cleanupTitle);
    // Add to app.stage (not titleContainer) so cleanupTitle doesn't destroy it
    app.stage.addChild(mpMenu.container);
  };
  mpButton.bg.on("pointertap", showMultiplayer);
  mpButton.text.eventMode = "static";
  mpButton.text.on("pointertap", showMultiplayer);

  // Restore content when sub-menus close
  explanationScreen.onClose = () => { contentGroup.visible = true; };
  customRunScreen.onClose = () => { contentGroup.visible = true; };
  customizeScreen.onClose = () => {
    // Rebuild entire title screen to pick up theme changes
    app.ticker.remove(titleTicker);
    titleDestroyed = true; parallax.destroy();
    app.stage.removeChild(titleContainer);
    titleContainer.destroy({ children: true });
    showTitleScreen(app, onStartGame);
  };

  titleContainer.addChild(explanationScreen.container);
  titleContainer.addChild(customRunScreen.container);
  titleContainer.addChild(customizeScreen.container);

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
    statsText.y = cursorY + 160;
    statsText.anchor.set(0.5, 0);
    contentGroup.addChild(statsText);
  }

  let scrollY = 0;
  let animTick = 0;
  let titleDestroyed = false;
  const titleTicker = () => {
    if (titleDestroyed) return;
    scrollY -= 4;
    parallax.update(scrollY);
    const pulse = 0.85 + Math.sin(Date.now() * 0.004) * 0.15;
    promptText.alpha = pulse;
    animTick++;
    chefGfx.clear();
    drawCharacter(chefGfx, 32, 40, getSelectedCharacter());
    chefGfx.y = chefBaseY + Math.sin(animTick * 0.05) * 4;
    explanationScreen.update();
  };
  app.ticker.add(titleTicker);

  // Game only starts via the play button — no accidental starts from other taps

  let started = false;
  const startGame = async () => {
    if (started) return;
    if (explanationScreen.isActive() || customRunScreen.isActive() || customizeScreen.isActive()) return;
    started = true;

    window.removeEventListener("keydown", handleKey);

    initAudio();
    stopMusic();
    playMusic(0);
    applyMusicVolume();

    app.ticker.remove(titleTicker);
    titleDestroyed = true; parallax.destroy();
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
    if (explanationScreen.isActive() || customRunScreen.isActive() || customizeScreen.isActive()) return;
    if (e.key === "Enter" || e.key === " ") startGame();
  };
  window.addEventListener("keydown", handleKey);
}
