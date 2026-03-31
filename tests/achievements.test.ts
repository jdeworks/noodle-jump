import { describe, test, expect } from "vitest";
import {
  checkAchievements,
  getAchievement,
  ACHIEVEMENTS,
  type AchievementState,
} from "../src/systems/Achievements";
import type { PlayerStats } from "../src/ui/StatsPanel";

function makeStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    totalGames: 0,
    totalMeatballs: 0,
    bestHeight: 0,
    bestScore: 0,
    bestCombo: 0,
    maxZone: 0,
    totalPlayTimeSeconds: 0,
    ...overrides,
  };
}

function emptyState(): AchievementState {
  return { unlocked: new Set() };
}

describe("Achievements", () => {
  test("all achievements have unique IDs", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("all achievements have name and description", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.name.length, `${a.id} name`).toBeGreaterThan(0);
      expect(a.description.length, `${a.id} desc`).toBeGreaterThan(0);
    }
  });

  test("checkAchievements unlocks first_flight after 1 game", () => {
    const stats = makeStats({ totalGames: 1 });
    const result = checkAchievements(emptyState(), stats);
    expect(result.newlyUnlocked).toContain("first_flight");
    expect(result.state.unlocked.has("first_flight")).toBe(true);
  });

  test("checkAchievements unlocks meatball milestones", () => {
    const stats = makeStats({ totalMeatballs: 150 });
    const result = checkAchievements(emptyState(), stats);
    expect(result.newlyUnlocked).toContain("meatball_10");
    expect(result.newlyUnlocked).toContain("meatball_100");
    expect(result.newlyUnlocked).not.toContain("meatball_1000");
  });

  test("checkAchievements unlocks zone milestones", () => {
    const stats = makeStats({ maxZone: 3 });
    const result = checkAchievements(emptyState(), stats);
    expect(result.newlyUnlocked).toContain("zone_2");
    expect(result.newlyUnlocked).toContain("zone_3");
    expect(result.newlyUnlocked).toContain("zone_4");
    expect(result.newlyUnlocked).not.toContain("zone_5");
  });

  test("checkAchievements does not double-unlock", () => {
    const stats = makeStats({ totalGames: 5 });
    const state: AchievementState = { unlocked: new Set(["first_flight"]) };
    const result = checkAchievements(state, stats);
    expect(result.newlyUnlocked).not.toContain("first_flight");
  });

  test("checkAchievements returns empty for fresh stats", () => {
    const result = checkAchievements(emptyState(), makeStats());
    expect(result.newlyUnlocked).toHaveLength(0);
  });

  test("per-game achievement checks gameStats", () => {
    const stats = makeStats();
    const gameStats = {
      score: 100, height: 60, meatballs: 5, combo: 1,
      zone: 0, powerUps: 0, platforms: 20, seconds: 30,
      streak: 15, enemiesKilled: 0,
    };
    const result = checkAchievements(emptyState(), stats, gameStats);
    expect(result.newlyUnlocked).toContain("perfect_start");
  });

  test("getAchievement returns correct achievement", () => {
    const a = getAchievement("zone_3");
    expect(a).toBeDefined();
    expect(a!.name).toBe("Space Chef");
  });

  test("getAchievement returns undefined for unknown ID", () => {
    expect(getAchievement("nonexistent")).toBeUndefined();
  });
});
