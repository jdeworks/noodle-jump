/** Game Over screen rendering. */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { FireworkDisplay } from "../rendering/fireworks";
import { getUITheme } from "./ThemeUI";
import { releaseWakeLock } from "../utils/wakeLock";
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
  isCustomRun?: boolean;
}

export function showGameOver(
  app: Application,
  stats: GameOverStats,
  onRestart: () => void,
  onHome: () => void,
  achievements?: string[],
): void {
  releaseWakeLock();

  const isCustom = stats.isCustomRun ?? false;
  const isNewRecord = !isCustom && stats.score >= stats.highScore && stats.score > 0;

  const dim = new Graphics();
  dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const uiT = getUITheme();
  dim.fill({ color: uiT.bg, alpha: 0.6 });
  dim.eventMode = "static";
  app.stage.addChild(dim);

  // Fireworks — don't stop ticker when done, just clean up
  let fireworks: FireworkDisplay | null = null;
  let fireworkTicker: (() => void) | null = null;
  if (isNewRecord) {
    fireworks = new FireworkDisplay(10);
    app.stage.addChild(fireworks.container);
    fireworkTicker = () => {
      if (fireworks && !fireworks.update()) {
        if (fireworkTicker) app.ticker.remove(fireworkTicker);
        fireworks.destroy();
        fireworks = null;
        fireworkTicker = null;
      }
    };
    app.ticker.add(fireworkTicker);
    app.ticker.start();
  }

  // Title
  let titleStr = "Game Over!";
  if (isNewRecord) titleStr = "NEW HIGH SCORE!";
  else if (isCustom) titleStr = "Custom Run Complete!";

  const title = new Text({
    text: titleStr,
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: isNewRecord ? 22 : 24,
      fill: isNewRecord ? uiT.accent : uiT.text,
      fontWeight: "bold",
      stroke: { color: "#000000", width: 3 },
    }),
  });
  title.x = GAME_WIDTH / 2;
  title.y = GAME_HEIGHT * 0.14;
  title.anchor.set(0.5, 0.5);
  app.stage.addChild(title);

  // Custom run notice
  if (isCustom) {
    const notice = new Text({
      text: "(scores not saved to leaderboard)",
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 11,
        fill: "#aa9988",
      }),
    });
    notice.x = GAME_WIDTH / 2;
    notice.y = GAME_HEIGHT * 0.19;
    notice.anchor.set(0.5, 0.5);
    app.stage.addChild(notice);
  }

  // Score breakdown
  const breakdownLines = [
    `Score     ${stats.score}`,
    ...(isCustom ? [] : [`Best      ${stats.highScore}`]),
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
      fontFamily: "monospace", fontSize: 13,
      fill: uiT.text, lineHeight: 20,
    }),
  });
  breakdown.x = GAME_WIDTH / 2;
  breakdown.y = GAME_HEIGHT * 0.40;
  breakdown.anchor.set(0.5, 0.5);
  app.stage.addChild(breakdown);

  // Achievement unlocks
  if (achievements && achievements.length > 0) {
    const achText = new Text({
      text: "UNLOCKED: " + achievements.join(", "),
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 13,
        fill: uiT.accent, fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
        wordWrap: true, wordWrapWidth: GAME_WIDTH - 40,
        align: "center",
      }),
    });
    achText.x = GAME_WIDTH / 2;
    achText.y = GAME_HEIGHT * 0.60;
    achText.anchor.set(0.5, 0.5);
    app.stage.addChild(achText);
  }

  // Suppress restart briefly when a button is tapped
  let buttonTapped = false;
  const suppressRestart = () => {
    buttonTapped = true;
    setTimeout(() => { buttonTapped = false; }, 300);
  };

  // Share button
  const shareBg = new Graphics();
  shareBg.roundRect(GAME_WIDTH / 2 - 80, GAME_HEIGHT * 0.66 - 16, 160, 32, 8);
  shareBg.fill({ color: 0x224466, alpha: 0.6 });
  shareBg.eventMode = "static";
  app.stage.addChild(shareBg);

  const shareText = new Text({
    text: "Share Score",
    style: new TextStyle({
      fontFamily: "monospace", fontSize: 16,
      fill: "#44aaff", fontWeight: "bold",
    }),
  });
  shareText.x = GAME_WIDTH / 2;
  shareText.y = GAME_HEIGHT * 0.66;
  shareText.anchor.set(0.5, 0.5);
  shareText.eventMode = "static";
  shareText.cursor = "pointer";
  const handleShare = (e: Event) => {
    e.stopPropagation();
    suppressRestart();
    const msg = `I scored ${stats.score} on Noodle Jump!\nHeight: ${stats.height} | Meatballs: ${stats.meatballs} | Combo: ${stats.bestCombo}x`;
    navigator.clipboard.writeText(msg).then(
      () => { shareText.text = "Copied!"; shareText.style.fill = "#66cc66"; },
      () => { shareText.text = "Copy failed"; },
    );
  };
  shareText.on("pointertap", handleShare);
  shareBg.on("pointertap", handleShare);
  app.stage.addChild(shareText);

  // Play Again button
  const restartBg = new Graphics();
  restartBg.roundRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.74 - 18, 200, 36, 8);
  restartBg.fill({ color: uiT.buttonBg, alpha: 0.7 });
  restartBg.roundRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.74 - 18, 200, 36, 8);
  restartBg.stroke({ width: 1.5, color: uiT.buttonBorder, alpha: 0.5 });
  restartBg.eventMode = "static";
  restartBg.cursor = "pointer";
  app.stage.addChild(restartBg);

  const restartText = new Text({
    text: "Play Again",
    style: new TextStyle({
      fontFamily: "monospace", fontSize: 20,
      fill: "#ffffff", fontWeight: "bold",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  restartText.x = GAME_WIDTH / 2;
  restartText.y = GAME_HEIGHT * 0.74;
  restartText.anchor.set(0.5, 0.5);
  restartText.eventMode = "static";
  restartText.cursor = "pointer";
  app.stage.addChild(restartText);

  // Home button
  const homeBg = new Graphics();
  homeBg.roundRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.82 - 16, 200, 32, 8);
  homeBg.fill({ color: uiT.buttonBg, alpha: 0.7 });
  homeBg.eventMode = "static";
  homeBg.cursor = "pointer";
  app.stage.addChild(homeBg);

  const homeText = new Text({
    text: "Home",
    style: new TextStyle({
      fontFamily: "monospace", fontSize: 16,
      fill: uiT.text, fontWeight: "bold",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  homeText.x = GAME_WIDTH / 2;
  homeText.y = GAME_HEIGHT * 0.82;
  homeText.anchor.set(0.5, 0.5);
  homeText.eventMode = "static";
  homeText.cursor = "pointer";
  app.stage.addChild(homeText);

  // Clear data — with confirmation
  const clearText = new Text({
    text: "[Clear saved data]",
    style: new TextStyle({
      fontFamily: "monospace", fontSize: 12,
      fill: "#887766",
    }),
  });
  clearText.x = GAME_WIDTH / 2;
  clearText.y = GAME_HEIGHT * 0.92;
  clearText.anchor.set(0.5, 0.5);
  clearText.eventMode = "static";
  clearText.cursor = "pointer";
  let clearConfirming = false;
  clearText.on("pointertap", (e: Event) => {
    e.stopPropagation();
    suppressRestart();
    if (!clearConfirming) {
      clearConfirming = true;
      clearText.text = "Tap again to confirm";
      clearText.style.fill = "#ff6644";
      setTimeout(() => {
        if (clearConfirming) {
          clearConfirming = false;
          clearText.text = "[Clear saved data]";
          clearText.style.fill = "#887766";
        }
      }, 3000);
    } else {
      localStorage.clear();
      clearText.text = "Data cleared!";
      clearText.style.fill = "#66cc66";
      clearConfirming = false;
    }
  });
  app.stage.addChild(clearText);

  // Cleanup helper
  const cleanup = () => {
    if (fireworkTicker) app.ticker.remove(fireworkTicker);
    if (fireworks) { fireworks.destroy(); fireworks = null; }
    app.canvas.removeEventListener("pointerup", handleRestart);
    window.removeEventListener("keydown", handleRestart);
  };

  let acted = false;
  const handleRestart = () => {
    if (buttonTapped || acted) return;
    acted = true;
    cleanup();
    onRestart();
  };

  const handleHome = () => {
    if (acted) return;
    acted = true;
    cleanup();
    onHome();
  };

  setTimeout(
    () => {
      app.canvas.addEventListener("pointerup", handleRestart);
      window.addEventListener("keydown", handleRestart);
      restartBg.on("pointertap", handleRestart);
      restartText.on("pointertap", handleRestart);
      homeBg.on("pointertap", (e: Event) => { e.stopPropagation(); suppressRestart(); handleHome(); });
      homeText.on("pointertap", (e: Event) => { e.stopPropagation(); suppressRestart(); handleHome(); });
    },
    isNewRecord ? 1500 : 300,
  );
}
