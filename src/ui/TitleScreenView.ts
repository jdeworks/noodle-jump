/** Title screen rendering and interaction. */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { loadHighScore } from "../systems/Score";
import { ParallaxBackground } from "../systems/Parallax";
import { createZoneState, getInterpolatedTheme } from "../systems/Zone";
import { initAudio, playMusic } from "../systems/Audio";
import { createSettingsToggles } from "./SettingsToggles";

export function showTitleScreen(
  app: Application,
  onStartGame: () => Promise<void>,
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

    await onStartGame();
  };

  app.canvas.addEventListener("click", startGame);
  app.canvas.addEventListener("touchstart", startGame);
  window.addEventListener("keydown", startGame);
}
