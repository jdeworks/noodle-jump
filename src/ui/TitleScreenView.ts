/** Title screen rendering and interaction. */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { loadHighScore } from "../systems/Score";
import { ParallaxBackground } from "../systems/Parallax";
import { createZoneState, getInterpolatedTheme } from "../systems/Zone";
import { initAudio, playMusic, playTitleMusic, stopMusic } from "../systems/Audio";
import { createSettingsToggles } from "./SettingsToggles";
import { ExplanationScreen } from "./ExplanationScreen";
import { CustomRunScreen } from "./CustomRunScreen";
import { PowerUpEncyclopedia } from "./PowerUpEncyclopedia";
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

  // Animated chef character
  const chefGfx = new Graphics();
  chefGfx.x = GAME_WIDTH / 2 - 16;
  chefGfx.y = GAME_HEIGHT * 0.42;
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

  // How to Play button
  const howBtn = new Text({
    text: "[How to Play]",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 13,
      fill: "#88aaff",
      fontWeight: "bold",
    }),
  });
  howBtn.x = GAME_WIDTH * 0.28;
  howBtn.y = GAME_HEIGHT * 0.75;
  howBtn.anchor.set(0.5, 0.5);
  howBtn.eventMode = "static";
  howBtn.cursor = "pointer";
  titleContainer.addChild(howBtn);

  // Custom Run button
  const customBtn = new Text({
    text: "[Custom Run]",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 13,
      fill: "#88aaff",
      fontWeight: "bold",
    }),
  });
  customBtn.x = GAME_WIDTH * 0.72;
  customBtn.y = GAME_HEIGHT * 0.75;
  customBtn.anchor.set(0.5, 0.5);
  customBtn.eventMode = "static";
  customBtn.cursor = "pointer";
  titleContainer.addChild(customBtn);

  // Explanation screen
  const explanationScreen = new ExplanationScreen();
  titleContainer.addChild(explanationScreen.container);
  howBtn.on("pointertap", (e: Event) => {
    e.stopPropagation();
    explanationScreen.show();
  });

  // Custom run screen
  const customRunScreen = new CustomRunScreen();
  titleContainer.addChild(customRunScreen.container);
  customBtn.on("pointertap", (e: Event) => {
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
  });

  // Power-up Encyclopedia
  const encyclopedia = new PowerUpEncyclopedia();
  titleContainer.addChild(encyclopedia.container);

  // Stats display (below subtitle)
  const stats = loadStats();
  if (stats.totalGames > 0) {
    const statsText = new Text({
      text: `Games: ${stats.totalGames} | Meatballs: ${stats.totalMeatballs} | Zone: ${stats.maxZone + 1}`,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 10,
        fill: "#888888",
      }),
    });
    statsText.x = GAME_WIDTH / 2;
    statsText.y = GAME_HEIGHT * 0.58;
    statsText.anchor.set(0.5, 0.5);
    titleContainer.addChild(statsText);
  }

  // Encyclopedia button (below keyboard hint)
  const encBtn = new Text({
    text: "[Encyclopedia]",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 11,
      fill: "#999999",
    }),
  });
  encBtn.x = GAME_WIDTH / 2;
  encBtn.y = GAME_HEIGHT * 0.72 + 14;
  encBtn.anchor.set(0.5, 0);
  encBtn.eventMode = "static";
  encBtn.cursor = "pointer";
  encBtn.on("pointertap", (e: Event) => {
    e.stopPropagation();
    encyclopedia.show();
  });
  titleContainer.addChild(encBtn);

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
    chefGfx.y = GAME_HEIGHT * 0.42 + Math.sin(animTick * 0.05) * 4;
  };
  app.ticker.add(titleTicker);

  // Start game on input — ignore taps on the settings/buttons area
  const settingsBounds = {
    left: 0,
    right: GAME_WIDTH,
    top: GAME_HEIGHT * 0.73,
    bottom: GAME_HEIGHT,
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
    // Don't start if an overlay is open
    if (explanationScreen.isActive() || customRunScreen.isActive() || encyclopedia.isActive()) return;
    if (e instanceof MouseEvent || e instanceof TouchEvent) {
      if (isInSettings(e)) return;
    }

    app.canvas.removeEventListener("click", startGame);
    app.canvas.removeEventListener("touchstart", startGame);
    window.removeEventListener("keydown", startGame);

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

  app.canvas.addEventListener("click", startGame);
  app.canvas.addEventListener("touchstart", startGame);
  window.addEventListener("keydown", startGame);
}
