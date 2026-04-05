import { describe, test, expect } from "vitest";
import {
  generateDailyConfig,
  getMedalThresholds,
  getMedal,
  recordDailyResult,
  calculateStreak,
  getDailyConfigSummary,
  getTodayDateKey,
  getMedalsInRange,
  createDailyData,
  type DailyResult,
} from "../src/systems/DailyChallengeState";

describe("DailyChallengeState", () => {
  test("generateDailyConfig produces valid RunConfig", () => {
    const config = generateDailyConfig(12345);
    expect(config.isDailyChallenge).toBe(true);
    expect(config.seed).toBe(12345);
    expect(config.startingZone).toBeGreaterThanOrEqual(0);
    expect(config.startingZone).toBeLessThanOrEqual(3);
    expect(config.difficultyMultiplier).toBeGreaterThan(0);
    expect(config.enabledPowerUps.size).toBeGreaterThan(0);
    expect(config.practiceMode).toBe(false);
  });

  test("generateDailyConfig is deterministic", () => {
    const a = generateDailyConfig(99999);
    const b = generateDailyConfig(99999);
    expect(a.startingZone).toBe(b.startingZone);
    expect(a.difficultyMultiplier).toBe(b.difficultyMultiplier);
    expect(a.enemiesEnabled).toBe(b.enemiesEnabled);
    expect([...a.enabledPowerUps]).toEqual([...b.enabledPowerUps]);
  });

  test("different seeds produce different configs", () => {
    const a = generateDailyConfig(11111);
    const b = generateDailyConfig(22222);
    // At least one field should differ (statistically guaranteed)
    const differs =
      a.startingZone !== b.startingZone ||
      a.difficultyMultiplier !== b.difficultyMultiplier ||
      a.enemiesEnabled !== b.enemiesEnabled ||
      a.enabledPowerUps.size !== b.enabledPowerUps.size;
    expect(differs).toBe(true);
  });

  test("getMedalThresholds returns bronze < silver < gold", () => {
    const config = generateDailyConfig(42);
    const t = getMedalThresholds(config);
    expect(t.bronze).toBeLessThan(t.silver);
    expect(t.silver).toBeLessThan(t.gold);
    expect(t.bronze).toBeGreaterThan(0);
  });

  test("harder configs have lower thresholds", () => {
    const easy = generateDailyConfig(42);
    easy.difficultyMultiplier = 0.8;
    easy.startingZone = 0;
    const hard = generateDailyConfig(42);
    hard.difficultyMultiplier = 1.5;
    hard.startingZone = 3;
    const te = getMedalThresholds(easy);
    const th = getMedalThresholds(hard);
    expect(th.gold).toBeLessThan(te.gold);
  });

  test("getMedal returns correct medal", () => {
    const t = { bronze: 3000, silver: 10000, gold: 25000 };
    expect(getMedal(0, t)).toBeNull();
    expect(getMedal(2999, t)).toBeNull();
    expect(getMedal(3000, t)).toBe("bronze");
    expect(getMedal(9999, t)).toBe("bronze");
    expect(getMedal(10000, t)).toBe("silver");
    expect(getMedal(25000, t)).toBe("gold");
    expect(getMedal(99999, t)).toBe("gold");
  });

  test("recordDailyResult updates best score", () => {
    let data = createDailyData();
    const t = { bronze: 3000, silver: 10000, gold: 25000 };
    data = recordDailyResult(data, "2026-04-05", 5000, 200, t);
    expect(data.results["2026-04-05"].score).toBe(5000);
    expect(data.results["2026-04-05"].medal).toBe("bronze");
    // Higher score replaces
    data = recordDailyResult(data, "2026-04-05", 12000, 400, t);
    expect(data.results["2026-04-05"].score).toBe(12000);
    expect(data.results["2026-04-05"].medal).toBe("silver");
    // Lower score doesn't replace
    data = recordDailyResult(data, "2026-04-05", 4000, 100, t);
    expect(data.results["2026-04-05"].score).toBe(12000);
  });

  test("calculateStreak counts consecutive days", () => {
    const results: Record<string, DailyResult> = {
      "2026-04-05": { date: "2026-04-05", score: 100, height: 10, medal: null },
      "2026-04-04": { date: "2026-04-04", score: 100, height: 10, medal: null },
      "2026-04-03": { date: "2026-04-03", score: 100, height: 10, medal: null },
    };
    expect(calculateStreak(results, "2026-04-05")).toBe(3);
  });

  test("calculateStreak resets on gap", () => {
    const results: Record<string, DailyResult> = {
      "2026-04-05": { date: "2026-04-05", score: 100, height: 10, medal: null },
      // Gap on 04-04
      "2026-04-03": { date: "2026-04-03", score: 100, height: 10, medal: null },
    };
    expect(calculateStreak(results, "2026-04-05")).toBe(1);
  });

  test("getDailyConfigSummary produces readable string", () => {
    const config = generateDailyConfig(42);
    const summary = getDailyConfigSummary(config);
    expect(summary).toContain("|");
    expect(summary.length).toBeGreaterThan(10);
  });

  test("getTodayDateKey returns YYYY-MM-DD format", () => {
    const key = getTodayDateKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("getMedalsInRange collects medal types", () => {
    const results: Record<string, DailyResult> = {
      "2026-04-05": { date: "2026-04-05", score: 30000, height: 500, medal: "gold" },
      "2026-04-04": { date: "2026-04-04", score: 5000, height: 200, medal: "bronze" },
      "2026-04-03": { date: "2026-04-03", score: 12000, height: 300, medal: "silver" },
    };
    const medals = getMedalsInRange(results, "2026-04-05", 7);
    expect(medals.size).toBe(3);
    expect(medals.has("gold")).toBe(true);
    expect(medals.has("silver")).toBe(true);
    expect(medals.has("bronze")).toBe(true);
  });

  test("recordDailyResult tracks streak correctly", () => {
    let data = createDailyData();
    const t = { bronze: 1000, silver: 5000, gold: 10000 };
    data = recordDailyResult(data, "2026-04-03", 2000, 100, t);
    expect(data.currentStreak).toBe(1);
    data = recordDailyResult(data, "2026-04-04", 3000, 150, t);
    expect(data.currentStreak).toBe(2);
    data = recordDailyResult(data, "2026-04-05", 4000, 200, t);
    expect(data.currentStreak).toBe(3);
    expect(data.bestStreak).toBe(3);
  });
});
