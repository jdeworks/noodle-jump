/** Difficulty scaling — pure logic, no PixiJS. */

import {
  PLATFORM_WIDTH_MIN,
  PLATFORM_WIDTH_MAX,
  PLATFORM_GAP_MIN,
  PLATFORM_GAP_MAX,
  PLATFORM_BREAK_CHANCE,
  PLATFORM_BRITTLE_CHANCE,
  DIFFICULTY_RAMP_PLATFORMS,
  DIFFICULTY_PLATFORM_WIDTH_MIN_HARD,
  DIFFICULTY_PLATFORM_WIDTH_MAX_HARD,
  DIFFICULTY_GAP_MAX_HARD,
  DIFFICULTY_NEGATIVE_CHANCE_HARD,
  DIFFICULTY_BREAK_CHANCE_HARD,
  DIFFICULTY_BRITTLE_CHANCE_HARD,
} from "../config/constants";

export interface DifficultyParams {
  platformWidthMin: number;
  platformWidthMax: number;
  gapMin: number;
  gapMax: number;
  negativeSpawnChance: number;
  breakChance: number;
  brittleChance: number;
  movingSpeedMultiplier: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Get difficulty parameters based on how many platforms the player has passed. */
export function getDifficulty(platformsPassed: number): DifficultyParams {
  const t = Math.min(1, platformsPassed / DIFFICULTY_RAMP_PLATFORMS);

  return {
    platformWidthMin: lerp(
      PLATFORM_WIDTH_MIN,
      DIFFICULTY_PLATFORM_WIDTH_MIN_HARD,
      t,
    ),
    platformWidthMax: lerp(
      PLATFORM_WIDTH_MAX,
      DIFFICULTY_PLATFORM_WIDTH_MAX_HARD,
      t,
    ),
    gapMin: PLATFORM_GAP_MIN,
    gapMax: lerp(PLATFORM_GAP_MAX, DIFFICULTY_GAP_MAX_HARD, t),
    negativeSpawnChance: lerp(0.3, DIFFICULTY_NEGATIVE_CHANCE_HARD, t),
    breakChance: lerp(PLATFORM_BREAK_CHANCE, DIFFICULTY_BREAK_CHANCE_HARD, t),
    brittleChance: lerp(
      PLATFORM_BRITTLE_CHANCE,
      DIFFICULTY_BRITTLE_CHANCE_HARD,
      t,
    ),
    movingSpeedMultiplier: lerp(1, 2.5, t),
  };
}
