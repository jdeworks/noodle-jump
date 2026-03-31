import { describe, test, expect } from "vitest";
import {
  getDailySeed,
  getSeedFromString,
  seededRandom,
  seedToCode,
  codeToSeed,
} from "../src/systems/DailyChallenge";

describe("DailyChallenge", () => {
  test("getDailySeed returns a positive number", () => {
    const seed = getDailySeed();
    expect(seed).toBeGreaterThanOrEqual(0);
  });

  test("getSeedFromString is deterministic", () => {
    const a = getSeedFromString("test-seed-123");
    const b = getSeedFromString("test-seed-123");
    expect(a).toBe(b);
  });

  test("different strings produce different seeds", () => {
    const a = getSeedFromString("alpha");
    const b = getSeedFromString("beta");
    expect(a).not.toBe(b);
  });

  test("seededRandom produces values in [0, 1)", () => {
    const rng = seededRandom(12345);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  test("seededRandom is deterministic — same seed same sequence", () => {
    const rng1 = seededRandom(42);
    const rng2 = seededRandom(42);
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  test("different seeds produce different sequences", () => {
    const rng1 = seededRandom(100);
    const rng2 = seededRandom(200);
    let same = 0;
    for (let i = 0; i < 20; i++) {
      if (rng1() === rng2()) same++;
    }
    expect(same).toBeLessThan(3); // very unlikely to have many matches
  });

  test("seedToCode and codeToSeed are inverse", () => {
    const seed = 123456789;
    const code = seedToCode(seed);
    expect(codeToSeed(code)).toBe(seed);
  });

  test("seedToCode produces 8-char hex string", () => {
    const code = seedToCode(0);
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[0-9A-F]+$/);
  });
});
