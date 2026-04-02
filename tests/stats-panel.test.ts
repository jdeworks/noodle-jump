import { describe, test, expect } from "vitest";
import { updateStatsAfterGame } from "../src/ui/StatsPanel";
import { POWER_UP_INFO } from "../src/ui/PowerUpDescriptions";

describe("StatsPanel", () => {
  test("updateStatsAfterGame increments total games", () => {
    const stats = {
      totalGames: 5,
      totalMeatballs: 100,
      bestHeight: 200,
      bestScore: 5000,
      bestCombo: 3,
      maxZone: 1,
      totalPlayTimeSeconds: 600,
    };
    const result = updateStatsAfterGame(stats, {
      score: 3000,
      height: 150,
      meatballs: 10,
      combo: 2,
      zone: 1,
      seconds: 60,
    });
    expect(result.totalGames).toBe(6);
    expect(result.totalMeatballs).toBe(110);
    expect(result.totalPlayTimeSeconds).toBe(660);
  });

  test("updateStatsAfterGame updates bests only when exceeded", () => {
    const stats = {
      totalGames: 0,
      totalMeatballs: 0,
      bestHeight: 200,
      bestScore: 5000,
      bestCombo: 4,
      maxZone: 2,
      totalPlayTimeSeconds: 0,
    };
    const result = updateStatsAfterGame(stats, {
      score: 3000, // lower
      height: 300, // higher
      meatballs: 5,
      combo: 2,    // lower
      zone: 3,     // higher
      seconds: 30,
    });
    expect(result.bestScore).toBe(5000); // kept old
    expect(result.bestHeight).toBe(300); // updated
    expect(result.bestCombo).toBe(4);    // kept old
    expect(result.maxZone).toBe(3);      // updated
  });
});

describe("PowerUpDescriptions", () => {
  test("all power-up types have descriptions", () => {
    const expected = [
      "spaghetti_spring", "fusilli_tornado", "ravioli_rocket",
      "lasagna_layers", "pepper_sneeze", "meatball_magnet",
      "pasta_shield",
      "gnocchi_bounce", "minestrone_soup",
      "chili_pepper", "soggy_noodle", "garlic_breath", "burnt_toast",
    ];
    for (const type of expected) {
      const info = POWER_UP_INFO[type];
      expect(info, `Missing info for ${type}`).toBeDefined();
      expect(info.name.length).toBeGreaterThan(0);
      expect(info.description.length).toBeGreaterThan(0);
      expect(info.shortDesc.length).toBeGreaterThan(0);
    }
  });

  test("negative power-ups marked as not positive", () => {
    expect(POWER_UP_INFO["chili_pepper"].positive).toBe(false);
    expect(POWER_UP_INFO["soggy_noodle"].positive).toBe(false);
    expect(POWER_UP_INFO["garlic_breath"].positive).toBe(false);
    expect(POWER_UP_INFO["burnt_toast"].positive).toBe(false);
  });

  test("positive power-ups marked as positive", () => {
    expect(POWER_UP_INFO["spaghetti_spring"].positive).toBe(true);
    expect(POWER_UP_INFO["pasta_shield"].positive).toBe(true);
    expect(POWER_UP_INFO["gnocchi_bounce"].positive).toBe(true);
  });
});
