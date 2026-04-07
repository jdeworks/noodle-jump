import { describe, test, expect } from "vitest";
import {
  COSMETICS,
  UNLOCKABLE_CHARACTERS,
  unlockCosmetic,
  equipCosmetic,
  syncCosmeticsWithAchievements,
  getCosmeticsByType,
  isCharacterUnlocked,
  TINT_COLORS,
  type CosmeticState,
} from "../src/systems/Cosmetics";

function defaultState(): CosmeticState {
  return {
    unlocked: new Set(["trail_none", "tint_none", "theme_default"]),
    equipped: {
      trail: "trail_none",
      tint: "tint_none",
      theme: "theme_default",
    },
  };
}

describe("Cosmetics", () => {
  test("all cosmetics have unique IDs", () => {
    const ids = COSMETICS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("all cosmetics have name and description", () => {
    for (const c of COSMETICS) {
      expect(c.name.length, `${c.id} name`).toBeGreaterThan(0);
      expect(c.description.length, `${c.id} desc`).toBeGreaterThan(0);
    }
  });

  test("unlockCosmetic adds to unlocked set", () => {
    const state = defaultState();
    const updated = unlockCosmetic(state, "trail_fire");
    expect(updated.unlocked.has("trail_fire")).toBe(true);
  });

  test("unlockCosmetic is idempotent", () => {
    const state = defaultState();
    const u1 = unlockCosmetic(state, "trail_fire");
    const u2 = unlockCosmetic(u1, "trail_fire");
    expect(u2).toBe(u1);
  });

  test("equipCosmetic changes equipped for correct type", () => {
    let state = defaultState();
    state = unlockCosmetic(state, "trail_fire");
    state = equipCosmetic(state, "trail_fire");
    expect(state.equipped.trail).toBe("trail_fire");
  });

  test("equipCosmetic does nothing for locked items", () => {
    const state = defaultState();
    const updated = equipCosmetic(state, "trail_fire");
    expect(updated.equipped.trail).toBe("trail_none");
  });

  test("syncCosmeticsWithAchievements unlocks earned cosmetics", () => {
    const state = defaultState();
    const achievements = new Set(["meatball_100", "score_100k"]);
    const synced = syncCosmeticsWithAchievements(state, achievements);
    expect(synced.unlocked.has("trail_sparkle")).toBe(true);
    expect(synced.unlocked.has("trail_rainbow")).toBe(true);
    expect(synced.unlocked.has("trail_fire")).toBe(false);
  });

  test("getCosmeticsByType filters correctly", () => {
    const trails = getCosmeticsByType("trail");
    expect(trails.length).toBeGreaterThan(0);
    for (const c of trails) expect(c.type).toBe("trail");
  });

  test("free cosmetics have null unlockAchievement", () => {
    const free = COSMETICS.filter((c) => c.unlockAchievement === null);
    expect(free.length).toBeGreaterThanOrEqual(3);
  });

  test("all tint IDs have a color entry", () => {
    const tints = getCosmeticsByType("tint");
    for (const t of tints) {
      expect(TINT_COLORS[t.id], `missing color for ${t.id}`).toBeDefined();
    }
  });

  test("base characters are always unlocked", () => {
    const achievements = new Set<string>();
    expect(isCharacterUnlocked("chef", achievements)).toBe(true);
    expect(isCharacterUnlocked("ninja", achievements)).toBe(true);
  });

  test("unlockable characters require achievements", () => {
    const empty = new Set<string>();
    expect(isCharacterUnlocked("neon_chef", empty)).toBe(false);
    expect(isCharacterUnlocked("nyan_cat", empty)).toBe(false);
    expect(isCharacterUnlocked("skeleton", empty)).toBe(false);
  });

  test("unlockable characters unlock with correct achievement", () => {
    for (const ch of UNLOCKABLE_CHARACTERS) {
      if (!ch.unlockAchievement) continue;
      const achs = new Set([ch.unlockAchievement]);
      expect(isCharacterUnlocked(ch.id, achs), ch.id).toBe(true);
    }
  });
});
