/** Title screen rendering and interaction. */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { loadHighScore } from "../systems/Score";
import { ParallaxBackground } from "../systems/Parallax";
import { createZoneState, getInterpolatedTheme } from "../systems/Zone";
import { initAudio, playMusic, playTitleMusic, stopMusic, applyMusicVolume } from "../systems/Audio";
import { createSettingsToggles } from "./SettingsToggles";
import { requestFullscreen } from "../utils/wakeLock";
import { loadStats } from "./StatsPanel";
import { drawCharacter, CHARACTERS } from "../rendering/PlayerCharacters";
import { getSelectedCharacter, setSelectedCharacter } from "../systems/CharacterSettings";
import type { RunConfig } from "../systems/CustomRunConfig";
import { loadCosmetics, TINT_COLORS } from "../systems/Cosmetics";
import { getUITheme } from "./ThemeUI";
import { setupTitleMenus } from "./TitleScreenMenus";

export function showTitleScreen(
  app: Application, onStartGame: (runConfig?: RunConfig) => Promise<void>,
): void {
  const titleContainer = new Container();
  app.stage.addChild(titleContainer);

  const parallax = new ParallaxBackground();
  titleContainer.addChild(parallax.container);
  const zoneState = createZoneState();
  const theme = getInterpolatedTheme(0);
  parallax.applyTheme(theme, zoneState.currentZone);
  document.body.style.backgroundColor = "#" + theme.background.toString(16).padStart(6, "0");

  const uiT = getUITheme();
  const dimOverlay = new Graphics();
  dimOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  dimOverlay.fill({ color: uiT.bg, alpha: 0.6 });
  titleContainer.addChild(dimOverlay);

  const contentGroup = new Container();
  titleContainer.addChild(contentGroup);

  let cursorY = 8;

  // Title
  const titleText = new Text({ text: "NOODLE\nJUMP", style: new TextStyle({
    fontFamily: "monospace", fontSize: 48, fill: uiT.accent, fontWeight: "bold",
    align: "center", lineHeight: 52, stroke: { color: "#000000", width: 4 },
  }) });
  titleText.x = GAME_WIDTH / 2; titleText.y = cursorY; titleText.anchor.set(0.5, 0);
  contentGroup.addChild(titleText);
  cursorY += 108;

  // Subtitle
  const sub = new Text({ text: "A pasta-themed endless jumper", style: new TextStyle({
    fontFamily: "monospace", fontSize: 13, fill: uiT.text, fontWeight: "bold",
    align: "center", stroke: { color: "#000000", width: 2 },
  }) });
  sub.x = GAME_WIDTH / 2; sub.y = cursorY; sub.anchor.set(0.5, 0);
  contentGroup.addChild(sub);
  cursorY += 20;

  // High score
  const highScore = loadHighScore();
  if (highScore > 0) {
    const hs = new Text({ text: `Best: ${highScore}`, style: new TextStyle({
      fontFamily: "monospace", fontSize: 18, fill: uiT.accent, fontWeight: "bold",
      stroke: { color: "#000000", width: 3 },
    }) });
    hs.x = GAME_WIDTH / 2; hs.y = cursorY; hs.anchor.set(0.5, 0);
    contentGroup.addChild(hs);
    cursorY += 24;
  }

  // Character selector
  const chefGfx = new Graphics();
  chefGfx.x = GAME_WIDTH / 2 - 16; chefGfx.y = cursorY;
  drawCharacter(chefGfx, 32, 40, getSelectedCharacter());
  const cosm = loadCosmetics();
  chefGfx.tint = TINT_COLORS[cosm.equipped.tint ?? "tint_none"] ?? 0xffffff;
  contentGroup.addChild(chefGfx);
  const chefBaseY = cursorY;

  const charName = new Text({ text: CHARACTERS.find(c => c.id === getSelectedCharacter())?.name ?? "Chef",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: uiT.accent, stroke: { color: "#000000", width: 2 } }) });
  charName.x = GAME_WIDTH / 2; charName.y = cursorY + 42; charName.anchor.set(0.5, 0);
  contentGroup.addChild(charName);

  const arrowSt = new TextStyle({ fontFamily: "monospace", fontSize: 20, fill: "#999999", stroke: { color: "#000000", width: 2 } });
  const leftArr = new Text({ text: "\u25C0", style: arrowSt });
  leftArr.x = GAME_WIDTH / 2 - 50; leftArr.y = cursorY + 28; leftArr.anchor.set(0.5, 0.5);
  leftArr.eventMode = "static"; leftArr.cursor = "pointer"; contentGroup.addChild(leftArr);
  const rightArr = new Text({ text: "\u25B6", style: arrowSt });
  rightArr.x = GAME_WIDTH / 2 + 50; rightArr.y = cursorY + 28; rightArr.anchor.set(0.5, 0.5);
  rightArr.eventMode = "static"; rightArr.cursor = "pointer"; contentGroup.addChild(rightArr);

  const cycleChar = (dir: number) => {
    const idx = CHARACTERS.findIndex(c => c.id === getSelectedCharacter());
    const next = CHARACTERS[(idx + dir + CHARACTERS.length) % CHARACTERS.length];
    setSelectedCharacter(next.id); charName.text = next.name;
  };
  leftArr.on("pointertap", (e: Event) => { e.stopPropagation(); cycleChar(-1); });
  rightArr.on("pointertap", (e: Event) => { e.stopPropagation(); cycleChar(1); });
  cursorY += 60;

  // ── Button stack ──────────────────────────────────────────────────────
  const btnW = Math.min(260, GAME_WIDTH - 40), btnX = (GAME_WIDTH - btnW) / 2;
  const btnH = 36, btnSp = 6;
  function mkBtn(label: string, y: number, fc: number, tc: string, fs: number) {
    const bg = new Graphics();
    bg.roundRect(btnX, y, btnW, btnH, 10); bg.fill({ color: fc, alpha: 0.7 });
    bg.roundRect(btnX, y, btnW, btnH, 10); bg.stroke({ width: 1.5, color: uiT.buttonBorder, alpha: 0.6 });
    bg.eventMode = "static"; bg.cursor = "pointer"; contentGroup.addChild(bg);
    const t = new Text({ text: label, style: new TextStyle({ fontFamily: "monospace", fontSize: fs,
      fill: tc, fontWeight: "bold", stroke: { color: "#000000", width: 2 } }) });
    t.x = GAME_WIDTH / 2; t.y = y + btnH / 2; t.anchor.set(0.5, 0.5);
    t.eventMode = "static"; t.cursor = "pointer"; contentGroup.addChild(t);
    return { bg, text: t };
  }

  const playBtn = mkBtn("Tap to Play", cursorY, uiT.buttonBg, uiT.text, 20);
  const promptText = playBtn.text; cursorY += btnH + btnSp;
  const dailyBtn = mkBtn("Daily Challenge", cursorY, uiT.buttonBg, uiT.accent, 15); cursorY += btnH + btnSp;
  const mpBtn = mkBtn("Multiplayer", cursorY, uiT.buttonBg, uiT.accent, 16); cursorY += btnH + btnSp;
  const howBtn = mkBtn("How to Play", cursorY, uiT.buttonBg, uiT.text, 15); cursorY += btnH + btnSp;
  const customBtn = mkBtn("Custom Run", cursorY, uiT.buttonBg, uiT.text, 15); cursorY += btnH + btnSp;
  const custBtn = mkBtn("Customize", cursorY, uiT.buttonBg, uiT.accent, 15); cursorY += btnH + btnSp;

  // Fullscreen icon (top-right corner)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isPWA = window.matchMedia("(display-mode: standalone)").matches;
  const fsIcon = new Text({ text: isIOS && !isPWA ? "" : "\u26F6", style: new TextStyle({
    fontFamily: "monospace", fontSize: 20, fill: uiT.textDim, stroke: { color: "#000000", width: 2 },
  }) });
  if (!isIOS || isPWA) {
    fsIcon.x = GAME_WIDTH - 14; fsIcon.y = 10; fsIcon.anchor.set(1, 0);
    fsIcon.eventMode = "static"; fsIcon.cursor = "pointer";
    fsIcon.on("pointertap", (e: Event) => { e.stopPropagation(); requestFullscreen(); });
    contentGroup.addChild(fsIcon);
  }

  // Input hint
  const hint = "ontouchstart" in window ? "Tilt or tap left/right to move" : "Arrow keys / WASD to move";
  const hintT = new Text({ text: hint, style: new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#ddccbb", stroke: { color: "#000000", width: 2 } }) });
  hintT.x = GAME_WIDTH / 2; hintT.y = cursorY; hintT.anchor.set(0.5, 0);
  contentGroup.addChild(hintT); cursorY += 38;

  // Settings
  const stCont = createSettingsToggles(); stCont.y = cursorY - 5; contentGroup.addChild(stCont);

  // Stats
  const stats = loadStats();
  if (stats.totalGames > 0) {
    const sl = `Games: ${stats.totalGames}  \u00B7  Meatballs: ${stats.totalMeatballs}  \u00B7  Best Zone: ${stats.maxZone + 1}`;
    const st = new Text({ text: sl, style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#ccbbaa", stroke: { color: "#000000", width: 2 } }) });
    st.x = GAME_WIDTH / 2; st.y = cursorY + 160; st.anchor.set(0.5, 0); contentGroup.addChild(st);
  }

  // ── State & ticker ────────────────────────────────────────────────────
  let scrollY = 0, animTick = 0, titleDestroyed = false;
  const titleTicker = () => {
    if (titleDestroyed || !chefGfx.context) { app.ticker.remove(titleTicker); return; }
    scrollY -= 4; parallax.update(scrollY);
    promptText.alpha = 0.85 + Math.sin(Date.now() * 0.004) * 0.15;
    animTick++; chefGfx.clear(); drawCharacter(chefGfx, 32, 40, getSelectedCharacter());
    chefGfx.y = chefBaseY + Math.sin(animTick * 0.05) * 4;
    menus.explanationScreen.update();
  };
  app.ticker.add(titleTicker);

  // ── Sub-menu wiring (extracted) ───────────────────────────────────────
  const menus = setupTitleMenus(
    { app, titleContainer, contentGroup, parallax, onStartGame,
      getTitleTicker: () => titleTicker, getHandleKey: () => handleKey,
      setTitleDestroyed: () => { titleDestroyed = true; } },
    { howBg: howBtn.bg, howText: howBtn.text, customBg: customBtn.bg, customText: customBtn.text,
      custBg: custBtn.bg, custText: custBtn.text, dailyBg: dailyBtn.bg, dailyText: dailyBtn.text,
      mpBg: mpBtn.bg, mpText: mpBtn.text },
  );

  // ── Play button + keyboard ────────────────────────────────────────────
  let started = false;
  const startGame = async () => {
    if (started) return;
    if (menus.explanationScreen.isActive() || menus.customRunScreen.isActive() ||
        menus.customizeScreen.isActive() || menus.dailyChallengeScreen.isActive()) return;
    started = true;
    window.removeEventListener("keydown", handleKey);
    initAudio(); stopMusic(); playMusic(0); applyMusicVolume();
    app.ticker.remove(titleTicker); titleDestroyed = true; parallax.destroy();
    app.stage.removeChild(titleContainer); titleContainer.destroy({ children: true });
    await onStartGame();
  };

  let titleMusicStarted = false;
  const startTitleMusic = () => { if (titleMusicStarted) return; titleMusicStarted = true; initAudio(); playTitleMusic(); };
  app.canvas.addEventListener("click", startTitleMusic, { once: true });
  app.canvas.addEventListener("touchstart", startTitleMusic, { once: true });

  playBtn.bg.on("pointertap", () => startGame());
  promptText.eventMode = "static"; promptText.on("pointertap", () => startGame());

  const handleKey = (e: KeyboardEvent) => {
    if (menus.explanationScreen.isActive() || menus.customRunScreen.isActive() ||
        menus.customizeScreen.isActive() || menus.dailyChallengeScreen.isActive()) return;
    if (e.key === "Enter" || e.key === " ") startGame();
  };
  window.addEventListener("keydown", handleKey);
}
