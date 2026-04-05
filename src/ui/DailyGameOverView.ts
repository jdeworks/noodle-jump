/** Daily Challenge game-over screen — medal display, streak, share. */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { getUITheme } from "./ThemeUI";
import { releaseWakeLock } from "../utils/wakeLock";
import { formatTime } from "../utils/format";
import type { Medal } from "../systems/DailyChallengeState";

const MEDAL_COLORS: Record<Medal, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#88ddff",
  diamond: "#bb66ff",
};

export interface DailyGameOverStats {
  score: number;
  bestScore: number;
  height: number;
  seconds: number;
  meatballs: number;
  powerUps: number;
  bestCombo: number;
  bestStreak: number;
  platforms: number;
  medal: Medal | null;
  thresholds: { bronze: number; silver: number; gold: number; platinum: number; diamond: number };
  streak: number;
  isNewBest: boolean;
}

export function showDailyGameOver(
  app: Application,
  stats: DailyGameOverStats,
  onRestart: () => void,
  onHome: () => void,
  achievements?: string[],
): void {
  releaseWakeLock();

  const uiT = getUITheme();
  const dim = new Graphics();
  dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  dim.fill({ color: uiT.bg, alpha: 0.7 });
  dim.eventMode = "static";
  app.stage.addChild(dim);

  let y = GAME_HEIGHT * 0.08;

  // Title
  const titleStr = stats.isNewBest
    ? "NEW DAILY BEST!"
    : stats.medal
      ? `Daily Challenge — ${stats.medal.charAt(0).toUpperCase() + stats.medal.slice(1)}!`
      : "Daily Challenge Complete";
  const title = new Text({
    text: titleStr,
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 20,
      fill: stats.medal ? MEDAL_COLORS[stats.medal] : uiT.text,
      fontWeight: "bold",
      stroke: { color: "#000000", width: 3 },
    }),
  });
  title.x = GAME_WIDTH / 2;
  title.y = y;
  title.anchor.set(0.5, 0);
  app.stage.addChild(title);
  y += 36;

  // Score (this run + best today)
  const scoreLabel = stats.bestScore > stats.score
    ? `Score: ${stats.score}  |  Best: ${stats.bestScore}`
    : `Score: ${stats.score}`;
  const scoreText = new Text({
    text: scoreLabel,
    style: new TextStyle({
      fontFamily: "monospace", fontSize: stats.bestScore > stats.score ? 17 : 22,
      fill: uiT.accent, fontWeight: "bold", stroke: { color: "#000000", width: 2 },
    }),
  });
  scoreText.x = GAME_WIDTH / 2; scoreText.y = y; scoreText.anchor.set(0.5, 0);
  app.stage.addChild(scoreText);
  y += 34;

  // Medal thresholds with checkmarks
  const medals: Medal[] = ["bronze", "silver", "gold", "platinum", "diamond"];
  for (const m of medals) {
    const threshold = stats.thresholds[m];
    const achieved = stats.score >= threshold;
    const check = achieved ? "[x]" : "[ ]";
    const label = m.charAt(0).toUpperCase() + m.slice(1);
    const row = new Text({
      text: `${check} ${label}: ${threshold.toLocaleString()}`,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 14,
        fill: achieved ? MEDAL_COLORS[m] : uiT.textDim,
        fontWeight: achieved ? "bold" : "normal",
      }),
    });
    row.x = GAME_WIDTH / 2;
    row.y = y;
    row.anchor.set(0.5, 0);
    app.stage.addChild(row);
    y += 22;
  }
  y += 10;

  // Stats breakdown
  const lines = [
    `Height    ${stats.height}`,
    `Time      ${formatTime(stats.seconds)}`,
    `Meatballs ${stats.meatballs}`,
    `Combo     ${stats.bestCombo}x`,
    `Streak    ${stats.bestStreak}`,
  ];
  const breakdown = new Text({
    text: lines.join("\n"),
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 13,
      fill: uiT.text,
      lineHeight: 20,
    }),
  });
  breakdown.x = GAME_WIDTH / 2;
  breakdown.y = y;
  breakdown.anchor.set(0.5, 0);
  app.stage.addChild(breakdown);
  y += lines.length * 20 + 12;

  // Streak display
  if (stats.streak > 0) {
    const streakText = new Text({
      text: `Daily Streak: ${stats.streak} day${stats.streak > 1 ? "s" : ""}`,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 15,
        fill: uiT.accent,
        fontWeight: "bold",
      }),
    });
    streakText.x = GAME_WIDTH / 2;
    streakText.y = y;
    streakText.anchor.set(0.5, 0);
    app.stage.addChild(streakText);
    y += 26;
  }

  // Achievements
  if (achievements && achievements.length > 0) {
    const achText = new Text({
      text: "UNLOCKED: " + achievements.join(", "),
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 13,
        fill: uiT.accent,
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
        wordWrap: true,
        wordWrapWidth: GAME_WIDTH - 40,
        align: "center",
      }),
    });
    achText.x = GAME_WIDTH / 2;
    achText.y = y;
    achText.anchor.set(0.5, 0);
    app.stage.addChild(achText);
    y += 26;
  }
  y += 4;

  // Buttons
  let buttonTapped = false;
  const suppress = () => {
    buttonTapped = true;
    setTimeout(() => {
      buttonTapped = false;
    }, 300);
  };

  // Share
  const shareText = new Text({
    text: "Share Score",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 14,
      fill: "#44aaff",
      fontWeight: "bold",
    }),
  });
  shareText.x = GAME_WIDTH / 2;
  shareText.y = y;
  shareText.anchor.set(0.5, 0);
  shareText.eventMode = "static";
  shareText.cursor = "pointer";
  shareText.on("pointertap", (e: Event) => {
    e.stopPropagation();
    suppress();
    const medalStr = stats.medal ? ` (${stats.medal} medal)` : "";
    const msg = `Daily Challenge${medalStr}: ${stats.score} pts | Height: ${stats.height} | Streak: ${stats.streak}`;
    navigator.clipboard.writeText(msg).then(
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
  y += 30;

  // Play Again
  const restartBg = new Graphics();
  restartBg.roundRect(GAME_WIDTH / 2 - 100, y - 2, 200, 36, 8);
  restartBg.fill({ color: uiT.buttonBg, alpha: 0.7 });
  restartBg.roundRect(GAME_WIDTH / 2 - 100, y - 2, 200, 36, 8);
  restartBg.stroke({ width: 1.5, color: uiT.buttonBorder, alpha: 0.5 });
  restartBg.eventMode = "static";
  restartBg.cursor = "pointer";
  app.stage.addChild(restartBg);
  const restartText = new Text({
    text: "Play Again",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 18,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  restartText.x = GAME_WIDTH / 2;
  restartText.y = y + 16;
  restartText.anchor.set(0.5, 0.5);
  restartText.eventMode = "static";
  restartText.cursor = "pointer";
  app.stage.addChild(restartText);
  y += 44;

  // Home
  const homeText = new Text({
    text: "Home",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 16,
      fill: uiT.text,
      fontWeight: "bold",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  homeText.x = GAME_WIDTH / 2;
  homeText.y = y;
  homeText.anchor.set(0.5, 0);
  homeText.eventMode = "static";
  homeText.cursor = "pointer";
  app.stage.addChild(homeText);

  let acted = false;
  const handleRestart = () => {
    if (buttonTapped || acted) return;
    acted = true;
    onRestart();
  };
  const handleHome = (e: Event) => {
    e.stopPropagation();
    suppress();
    if (acted) return;
    acted = true;
    onHome();
  };

  setTimeout(() => {
    app.canvas.addEventListener("pointerup", handleRestart);
    window.addEventListener("keydown", handleRestart);
    restartBg.on("pointertap", handleRestart);
    restartText.on("pointertap", handleRestart);
    homeText.on("pointertap", handleHome);
  }, 300);
}
