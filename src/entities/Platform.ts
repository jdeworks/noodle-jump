/** Pure platform logic — no PixiJS imports. */

import {
  PLATFORM_WIDTH_MIN,
  PLATFORM_WIDTH_MAX,
  PLATFORM_HEIGHT,
  PLATFORM_GAP_MIN,
  PLATFORM_GAP_MAX,
  PLATFORM_HORIZONTAL_MARGIN,
  PLATFORM_BREAK_CHANCE,
  PLATFORM_BRITTLE_CHANCE,
  PLATFORM_MOVING_CHANCE,
  PLATFORM_MOVING_SPEED,
  PLATFORM_MOVING_RANGE,
  GAME_WIDTH,
} from "../config/constants";
import type { DifficultyParams } from "../systems/Difficulty";

export type PlatformType =
  | "static"
  | "breaking"
  | "brittle"
  | "moving"
  | "lasagna";

/** Whether a platform can support a landing (player won't fall through). */
export function isSolid(type: PlatformType): boolean {
  return (
    type === "static" ||
    type === "moving" ||
    type === "breaking" ||
    type === "lasagna"
  );
}

export interface PlatformState {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  broken: boolean;
  id: number;
  originX: number;
  moveDirection: number;
}

let nextPlatformId = 0;

function randomWidth(): number {
  return (
    PLATFORM_WIDTH_MIN +
    Math.random() * (PLATFORM_WIDTH_MAX - PLATFORM_WIDTH_MIN)
  );
}

export function createPlatform(
  x: number,
  y: number,
  type: PlatformType = "static",
): PlatformState {
  return {
    x,
    y,
    width: randomWidth(),
    height: PLATFORM_HEIGHT,
    type,
    broken: false,
    id: nextPlatformId++,
    originX: x,
    moveDirection: Math.random() > 0.5 ? 1 : -1,
  };
}

/** Create a full-width ground floor so the player can't die at the start. */
export function createGroundPlatform(gameHeight: number): PlatformState {
  return {
    x: 0,
    y: gameHeight - 50,
    width: GAME_WIDTH,
    height: PLATFORM_HEIGHT,
    type: "static",
    broken: false,
    id: nextPlatformId++,
    originX: 0,
    moveDirection: 0,
  };
}

/** Update moving platforms. Call each tick. speedMultiplier scales with difficulty. */
export function updatePlatforms(
  platforms: PlatformState[],
  speedMultiplier = 1,
): PlatformState[] {
  return platforms.map((p) => {
    if (p.type !== "moving") return p;

    let { x, moveDirection } = p;

    x += PLATFORM_MOVING_SPEED * speedMultiplier * moveDirection;

    if (x + p.width > GAME_WIDTH) {
      x = GAME_WIDTH - p.width;
      moveDirection = -1;
    } else if (x < 0) {
      x = 0;
      moveDirection = 1;
    } else if (x > p.originX + PLATFORM_MOVING_RANGE) {
      x = p.originX + PLATFORM_MOVING_RANGE;
      moveDirection = -1;
    } else if (x < p.originX - PLATFORM_MOVING_RANGE) {
      x = p.originX - PLATFORM_MOVING_RANGE;
      moveDirection = 1;
    }

    return { ...p, x, moveDirection };
  });
}

function rollType(difficulty?: DifficultyParams): PlatformType {
  const breakChance = difficulty?.breakChance ?? PLATFORM_BREAK_CHANCE;
  const brittleChance = difficulty?.brittleChance ?? PLATFORM_BRITTLE_CHANCE;
  const roll = Math.random();
  if (roll < breakChance) return "breaking";
  if (roll < breakChance + brittleChance) return "brittle";
  if (roll < breakChance + brittleChance + PLATFORM_MOVING_CHANCE)
    return "moving";
  return "static";
}

/**
 * Generate a batch of platforms above the highest existing one.
 * Guarantees the game is always possible: never two consecutive
 * unlandable (brittle) platforms — at least every other platform is solid.
 */
export function generatePlatforms(
  highestY: number,
  count: number,
  difficulty?: DifficultyParams,
): PlatformState[] {
  const platforms: PlatformState[] = [];
  let y = highestY;
  let lastWasUnlandable = false;

  const widthMin = difficulty?.platformWidthMin ?? PLATFORM_WIDTH_MIN;
  const widthMax = difficulty?.platformWidthMax ?? PLATFORM_WIDTH_MAX;
  const gapMin = difficulty?.gapMin ?? PLATFORM_GAP_MIN;
  const gapMax = difficulty?.gapMax ?? PLATFORM_GAP_MAX;

  for (let i = 0; i < count; i++) {
    const maxGap = lastWasUnlandable ? gapMin + 20 : gapMax;
    const gap = gapMin + Math.random() * (maxGap - gapMin);
    y -= gap;

    const width = widthMin + Math.random() * (widthMax - widthMin);
    const maxX = GAME_WIDTH - width - PLATFORM_HORIZONTAL_MARGIN;
    const x = PLATFORM_HORIZONTAL_MARGIN + Math.random() * Math.max(0, maxX);

    let type = rollType(difficulty);

    if (lastWasUnlandable && !isSolid(type)) {
      type = "static";
    }

    lastWasUnlandable = !isSolid(type);

    platforms.push({
      x,
      y,
      width,
      height: PLATFORM_HEIGHT,
      type,
      broken: false,
      id: nextPlatformId++,
      originX: x,
      moveDirection: Math.random() > 0.5 ? 1 : -1,
    });
  }

  return platforms;
}

/** Mark a breaking platform as broken. Returns updated platform. */
export function breakPlatform(platform: PlatformState): PlatformState {
  return { ...platform, broken: true };
}

/** Remove platforms that are far below the camera. */
export function pruneBelow(
  platforms: PlatformState[],
  threshold: number,
): PlatformState[] {
  return platforms.filter((p) => p.y < threshold);
}

/** Reset the ID counter (useful for tests). */
export function resetPlatformIds(): void {
  nextPlatformId = 0;
}
