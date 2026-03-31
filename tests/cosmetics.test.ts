import { describe, test, expect } from "vitest";
import {
  COSMETICS,
  unlockCosmetic,
  equipCosmetic,
  syncCosmeticsWithAchievements,
  getCosmeticsByType,
  type CosmeticState,
} from "../src/systems/Cosmetics";

function defaultState(): CosmeticState {
  return {
    unlocked: new Set(["chef_default", "skin_default", "trail_none", "mb_default"]),
    equipped: {
      outfit: "chef_default",
      platform_skin: "skin_default",
      trail: "trail_none",
      meatball_variant: "mb_default",
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
    const updated = unlockCosmetic(state, "chef_pirate");
    expect(updated.unlocked.has("chef_pirate")).toBe(true);
  });

  test("unlockCosmetic is idempotent", () => {
    const state = defaultState();
    const u1 = unlockCosmetic(state, "chef_pirate");
    const u2 = unlockCosmetic(u1, "chef_pirate");
    expect(u2).toBe(u1); // same reference
  });

  test("equipCosmetic changes equipped for correct type", () => {
    let state = defaultState();
    state = unlockCosmetic(state, "chef_pirate");
    state = equipCosmetic(state, "chef_pirate");
    expect(state.equipped.outfit).toBe("chef_pirate");
  });

  test("equipCosmetic does nothing for locked items", () => {
    const state = defaultState();
    const updated = equipCosmetic(state, "chef_pirate"); // not unlocked
    expect(updated.equipped.outfit).toBe("chef_default");
  });

  test("syncCosmeticsWithAchievements unlocks earned cosmetics", () => {
    const state = defaultState();
    const achievements = new Set(["zone_2", "score_10k"]);
    const synced = syncCosmeticsWithAchievements(state, achievements);
    expect(synced.unlocked.has("chef_pirate")).toBe(true); // zone_2
    expect(synced.unlocked.has("skin_neon")).toBe(true);   // score_10k
    expect(synced.unlocked.has("chef_space")).toBe(false);  // zone_3 not unlocked
  });

  test("getCosmeticsByType filters correctly", () => {
    const outfits = getCosmeticsByType("outfit");
    expect(outfits.length).toBeGreaterThan(0);
    for (const c of outfits) {
      expect(c.type).toBe("outfit");
    }
  });

  test("free cosmetics have null unlockAchievement", () => {
    const free = COSMETICS.filter((c) => c.unlockAchievement === null);
    expect(free.length).toBeGreaterThanOrEqual(4); // at least one per type
  });
});
