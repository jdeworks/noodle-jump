/** Game Over screen rendering. */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { FireworkDisplay } from "../rendering/fireworks";
import { releaseWakeLock, requestFullscreen } from "../utils/wakeLock";
import { formatTime } from "../utils/format";

export interface GameOverStats {
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

export function showGameOver(
  app: Application,
  stats: GameOverStats,
  onRestart: () => void,
  achievements?: string[],
): void {
  // Remove fullscreen listeners so game-over taps don't trigger fullscreen
  app.canvas.removeEventListener("touchstart", requestFullscreen);
  app.canvas.removeEventListener("click", requestFullscreen);
  releaseWakeLock();

  const isNewRecord = stats.score >= stats.highScore && stats.score > 0;

  const dim = new Graphics();
  dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  dim.fill({ color: 0x000000, alpha: 0.5 });
  dim.eventMode = "static";
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

  // Achievement unlocks
  if (achievements && achievements.length > 0) {
    const achText = new Text({
      text: "UNLOCKED: " + achievements.join(", "),
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 11,
        fill: "#ffdd44",
        fontWeight: "bold",
        wordWrap: true,
        wordWrapWidth: GAME_WIDTH - 40,
        align: "center",
      }),
    });
    achText.x = GAME_WIDTH / 2;
    achText.y = GAME_HEIGHT * 0.62;
    achText.anchor.set(0.5, 0.5);
    app.stage.addChild(achText);
  }

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

    onRestart();
  };

  setTimeout(
    () => {
      app.canvas.addEventListener("click", restart);
      app.canvas.addEventListener("touchstart", restart);
      window.addEventListener("keydown", restart);
      // Also handle pixi tap on the dim overlay
      dim.on("pointertap", () => restart());
      restartText.eventMode = "static";
      restartText.cursor = "pointer";
      restartText.on("pointertap", () => restart());
    },
    isNewRecord ? 1500 : 300,
  );
}
