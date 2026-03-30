import { describe, test, expect } from "vitest";
import { getDifficulty } from "../src/systems/Difficulty";
import {
  PLATFORM_WIDTH_MIN,
  PLATFORM_WIDTH_MAX,
  PLATFORM_GAP_MAX,
  DIFFICULTY_RAMP_PLATFORMS,
  DIFFICULTY_PLATFORM_WIDTH_MIN_HARD,
  DIFFICULTY_GAP_MAX_HARD,
  DIFFICULTY_NEGATIVE_CHANCE_HARD,
} from "../src/config/constants";

describe("Difficulty", () => {
  test("returns baseline values at 0 platforms", () => {
    const d = getDifficulty(0);
    expect(d.platformWidthMin).toBe(PLATFORM_WIDTH_MIN);
    expect(d.platformWidthMax).toBe(PLATFORM_WIDTH_MAX);
    expect(d.gapMax).toBe(PLATFORM_GAP_MAX);
    expect(d.negativeSpawnChance).toBeCloseTo(0.3);
  });

  test("returns harder values at max ramp", () => {
    const d = getDifficulty(DIFFICULTY_RAMP_PLATFORMS);
    expect(d.platformWidthMin).toBeCloseTo(DIFFICULTY_PLATFORM_WIDTH_MIN_HARD);
    expect(d.gapMax).toBeCloseTo(DIFFICULTY_GAP_MAX_HARD);
    expect(d.negativeSpawnChance).toBeCloseTo(DIFFICULTY_NEGATIVE_CHANCE_HARD);
  });

  test("caps at max difficulty beyond ramp", () => {
    const d1 = getDifficulty(DIFFICULTY_RAMP_PLATFORMS);
    const d2 = getDifficulty(DIFFICULTY_RAMP_PLATFORMS * 2);
    expect(d2.platformWidthMin).toBeCloseTo(d1.platformWidthMin);
    expect(d2.gapMax).toBeCloseTo(d1.gapMax);
  });

  test("difficulty increases monotonically", () => {
    const d0 = getDifficulty(0);
    const d100 = getDifficulty(100);
    const d300 = getDifficulty(300);
    // Platforms should get narrower
    expect(d100.platformWidthMin).toBeLessThan(d0.platformWidthMin);
    expect(d300.platformWidthMin).toBeLessThan(d100.platformWidthMin);
    // Gaps should get wider
    expect(d100.gapMax).toBeGreaterThan(d0.gapMax);
    // More negative power-ups
    expect(d300.negativeSpawnChance).toBeGreaterThan(d0.negativeSpawnChance);
  });
});
