/** Daily Challenge screen — shows today's config, medals, streak, and play button. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { getDailySeed, seedToCode } from "../systems/DailyChallenge";
import {
  generateDailyConfig,
  getMedalThresholds,
  getDailyConfigSummary,
  getTodayDateKey,
  loadDailyData,
  type Medal,
} from "../systems/DailyChallengeState";
import type { RunConfig } from "../systems/CustomRunConfig";
import { getUITheme } from "./ThemeUI";

const MEDAL_COLORS: Record<Medal, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#88ddff",
  diamond: "#bb66ff",
};
const MEDAL_LABELS: Record<Medal, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
};

export class DailyChallengeScreen {
  readonly container = new Container();
  onClose: (() => void) | null = null;
  private active = false;

  show(onPlay: (config: RunConfig) => void): void {
    this.active = true;
    this.container.visible = true;
    this.container.removeChildren();

    const uiT = getUITheme();
    const seed = getDailySeed();
    const config = generateDailyConfig(seed);
    const thresholds = getMedalThresholds(config);
    const summary = getDailyConfigSummary(config, seed);
    const dateKey = getTodayDateKey();
    const data = loadDailyData();
    const todayResult = data.results[dateKey];

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: uiT.bg, alpha: 0.95 });
    bg.eventMode = "static";
    this.container.addChild(bg);

    let y = 30;

    // Title
    const title = new Text({
      text: "DAILY CHALLENGE",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 24,
        fill: uiT.accent,
        fontWeight: "bold",
        stroke: { color: "#000000", width: 3 },
      }),
    });
    title.x = GAME_WIDTH / 2;
    title.y = y;
    title.anchor.set(0.5, 0);
    this.container.addChild(title);
    y += 36;

    // Date & seed code
    const dateText = new Text({
      text: `${dateKey}  |  Seed: ${seedToCode(seed)}`,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 12,
        fill: uiT.textDim,
      }),
    });
    dateText.x = GAME_WIDTH / 2;
    dateText.y = y;
    dateText.anchor.set(0.5, 0);
    this.container.addChild(dateText);
    y += 24;

    // Config summary
    const summaryText = new Text({
      text: summary,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 13,
        fill: uiT.text,
        wordWrap: true,
        wordWrapWidth: GAME_WIDTH - 40,
        align: "center",
      }),
    });
    summaryText.x = GAME_WIDTH / 2;
    summaryText.y = y;
    summaryText.anchor.set(0.5, 0);
    this.container.addChild(summaryText);
    y += 40;

    // Medal thresholds
    const medalTypes: Medal[] = ["bronze", "silver", "gold", "platinum", "diamond"];
    for (const m of medalTypes) {
      this.addMedalRow(MEDAL_LABELS[m], thresholds[m], todayResult, m, uiT.text, y);
      y += m === "gold" ? 28 : 24; // extra space after gold (success threshold)
    }
    y += 12;

    // Today's best
    if (todayResult) {
      const medalStr = todayResult.medal ? ` — ${MEDAL_LABELS[todayResult.medal]} Medal!` : "";
      const bestText = new Text({
        text: `Today's Best: ${todayResult.score} pts${medalStr}`,
        style: new TextStyle({
          fontFamily: "monospace",
          fontSize: 15,
          fontWeight: "bold",
          fill: todayResult.medal ? MEDAL_COLORS[todayResult.medal] : uiT.text,
        }),
      });
      bestText.x = GAME_WIDTH / 2;
      bestText.y = y;
      bestText.anchor.set(0.5, 0);
      this.container.addChild(bestText);
      y += 28;
    }

    // Streak
    const streak = data.currentStreak;
    if (streak > 0) {
      const streakText = new Text({
        text: `Streak: ${streak} day${streak > 1 ? "s" : ""}`,
        style: new TextStyle({
          fontFamily: "monospace",
          fontSize: 14,
          fill: uiT.accent,
          fontWeight: "bold",
        }),
      });
      streakText.x = GAME_WIDTH / 2;
      streakText.y = y;
      streakText.anchor.set(0.5, 0);
      this.container.addChild(streakText);
      y += 24;
    }

    // Best streak
    if (data.bestStreak > 1) {
      const bestStreakText = new Text({
        text: `Best Streak: ${data.bestStreak} days`,
        style: new TextStyle({
          fontFamily: "monospace",
          fontSize: 12,
          fill: uiT.textDim,
        }),
      });
      bestStreakText.x = GAME_WIDTH / 2;
      bestStreakText.y = y;
      bestStreakText.anchor.set(0.5, 0);
      this.container.addChild(bestStreakText);
      y += 24;
    }

    // Past 7 days mini-display
    y += 8;
    this.addPastWeek(data.results, dateKey, y, uiT);
    y += 36;

    // Play button
    const playBg = new Graphics();
    playBg.roundRect(GAME_WIDTH / 2 - 120, y, 240, 42, 10);
    playBg.fill({ color: uiT.buttonBg, alpha: 0.8 });
    playBg.roundRect(GAME_WIDTH / 2 - 120, y, 240, 42, 10);
    playBg.stroke({ width: 2, color: uiT.buttonBorder, alpha: 0.7 });
    playBg.eventMode = "static";
    playBg.cursor = "pointer";
    this.container.addChild(playBg);

    const playText = new Text({
      text: "Play Today's Challenge",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 16,
        fill: uiT.accent,
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    playText.x = GAME_WIDTH / 2;
    playText.y = y + 21;
    playText.anchor.set(0.5, 0.5);
    playText.eventMode = "static";
    playText.cursor = "pointer";
    this.container.addChild(playText);

    const handlePlay = (e: Event) => {
      e.stopPropagation();
      this.hide();
      onPlay(config);
    };
    playBg.on("pointertap", handlePlay);
    playText.on("pointertap", handlePlay);
    y += 54;

    // Back button
    const backText = new Text({
      text: "[Back]",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 14,
        fill: uiT.textDim,
      }),
    });
    backText.x = GAME_WIDTH / 2;
    backText.y = y;
    backText.anchor.set(0.5, 0);
    backText.eventMode = "static";
    backText.cursor = "pointer";
    backText.on("pointertap", (e: Event) => {
      e.stopPropagation();
      this.hide();
    });
    this.container.addChild(backText);
  }

  private addMedalRow(
    label: string,
    threshold: number,
    todayResult: { score: number; medal: Medal | null } | undefined,
    medalType: Medal,
    textColor: string,
    y: number,
  ): void {
    const achieved = todayResult && todayResult.score >= threshold;
    const check = achieved ? " [x]" : " [ ]";
    const text = new Text({
      text: `${MEDAL_LABELS[medalType]}${check}  ${threshold.toLocaleString()} pts`,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 14,
        fill: achieved ? MEDAL_COLORS[medalType] : textColor,
        fontWeight: achieved ? "bold" : "normal",
      }),
    });
    text.x = GAME_WIDTH / 2;
    text.y = y;
    text.anchor.set(0.5, 0);
    this.container.addChild(text);
  }

  private addPastWeek(
    results: Record<string, { medal: Medal | null }>,
    todayKey: string,
    y: number,
    uiT: { textDim: string },
  ): void {
    const d = new Date(todayKey + "T00:00:00Z");
    const dots: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const check = new Date(d);
      check.setUTCDate(check.getUTCDate() - i);
      const key = `${check.getUTCFullYear()}-${String(check.getUTCMonth() + 1).padStart(2, "0")}-${String(check.getUTCDate()).padStart(2, "0")}`;
      const r = results[key];
      if (!r) dots.push("-");
      else if (r.medal === "gold") dots.push("G");
      else if (r.medal === "silver") dots.push("S");
      else if (r.medal === "bronze") dots.push("B");
      else dots.push("*");
    }
    const weekText = new Text({
      text: `Past 7 days: ${dots.join("  ")}`,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 12,
        fill: uiT.textDim,
      }),
    });
    weekText.x = GAME_WIDTH / 2;
    weekText.y = y;
    weekText.anchor.set(0.5, 0);
    this.container.addChild(weekText);
  }

  hide(): void {
    this.active = false;
    this.container.visible = false;
    this.container.removeChildren();
    if (this.onClose) this.onClose();
  }

  isActive(): boolean {
    return this.active;
  }
}
