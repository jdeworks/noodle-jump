import { describe, test, expect } from "vitest";
import { tryCode, markCodeUsed, isAllUnlocked } from "../src/systems/UnlockCodes";
import { COSMETICS, UNLOCKABLE_CHARACTERS, type CosmeticState } from "../src/systems/Cosmetics";

function emptyState(): CosmeticState {
  return {
    unlocked: new Set(["trail_none", "tint_none", "theme_default"]),
    equipped: {
      trail: "trail_none",
      tint: "tint_none",
      theme: "theme_default",
    },
  };
}

describe("UnlockCodes", () => {
  test("master code unlocks all cosmetics and characters", () => {
    const result = tryCode("I love Jdeworks", emptyState());
    expect(result).not.toBeNull();
    for (const c of COSMETICS) {
      expect(result!.cosmetics.unlocked.has(c.id), c.id).toBe(true);
    }
    for (const ch of UNLOCKABLE_CHARACTERS) {
      expect(result!.unlockedCharacters).toContain(ch.id);
    }
  });

  test("master code is case-insensitive", () => {
    const result = tryCode("i LOVE jdeworks", emptyState());
    expect(result).not.toBeNull();
  });

  test("per-item phrase unlocks specific cosmetic", () => {
    const result = tryCode("neon dreams", emptyState());
    expect(result).not.toBeNull();
    expect(result!.cosmetics.unlocked.has("theme_neon")).toBe(true);
  });

  test("per-character phrase unlocks character", () => {
    const result = tryCode("nyan nyan nyan", emptyState());
    expect(result).not.toBeNull();
    expect(result!.unlockedCharacters).toContain("nyan_cat");
  });

  test("invalid code returns null", () => {
    expect(tryCode("wrong code", emptyState())).toBeNull();
    expect(tryCode("", emptyState())).toBeNull();
  });

  test("markCodeUsed and isAllUnlocked", () => {
    let state = { usedCodes: new Set<string>() };
    expect(isAllUnlocked(state)).toBe(false);
    state = markCodeUsed(state, "I love Jdeworks");
    expect(isAllUnlocked(state)).toBe(true);
  });
});
