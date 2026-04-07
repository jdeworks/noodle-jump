/** Pure platform logic — no PixiJS imports. */

import { random } from "../systems/RNG";
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
  PLATFORM_CONVEYOR_CHANCE,
  PLATFORM_SPRING_CHANCE,
  PLATFORM_ICE_CHANCE,
  PLATFORM_CRUMBLING_CHANCE,
  PLATFORM_TELEPORT_CHANCE,
  PLATFORM_WEIGHTED_CHANCE,
  GAME_WIDTH,
} from "../config/constants";
import type { DifficultyParams } from "../systems/Difficulty";

export type PlatformType =
  | "static"
  | "breaking"
  | "brittle"
  | "moving"
  | "lasagna"
  | "conveyor"
  | "spring"
  | "ice"
  | "crumbling"
  | "teleport"
  | "weighted";

/** Whether a platform can support a landing (player won't fall through). */
export function isSolid(type: PlatformType): boolean {
  return (
    type === "static" ||
    type === "moving" ||
    type === "breaking" ||
    type === "lasagna" ||
    type === "conveyor" ||
    type === "spring" ||
    type === "ice" ||
    type === "crumbling" ||
    type === "teleport" ||
    type === "weighted"
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
  /** Elapsed ms when this platform was spawned (used for timed self-destruct). */
  spawnTimeMs?: number;
  /** Conveyor push direction: -1 = left, 1 = right. */
  conveyorDir?: -1 | 1;
  /** Crumbling countdown timer (ticks remaining, starts on landing). */
  crumbleTimer?: number;
  /** Weighted platform tilt angle in radians. */
  tiltAngle?: number;
  /** Teleport target platform ID (paired teleport). */
  teleportTargetId?: number;
  /** Original width at creation (used by tentacle attacks). */
  initialWidth?: number;
}

let nextPlatformId = 0;

function randomWidth(): number {
  return PLATFORM_WIDTH_MIN + random() * (PLATFORM_WIDTH_MAX - PLATFORM_WIDTH_MIN);
}

export function createPlatform(x: number, y: number, type: PlatformType = "static"): PlatformState {
  return {
    x,
    y,
    width: randomWidth(),
    height: PLATFORM_HEIGHT,
    type,
    broken: false,
    id: nextPlatformId++,
    originX: x,
    moveDirection: random() > 0.5 ? 1 : -1,
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
export function updatePlatforms(platforms: PlatformState[], speedMultiplier = 1): PlatformState[] {
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
  const t = difficulty?.difficultyT ?? 0;

  // New platform types scale in with difficulty
  const conveyorChance = PLATFORM_CONVEYOR_CHANCE * t;
  const springChance = PLATFORM_SPRING_CHANCE * t;
  const iceChance = PLATFORM_ICE_CHANCE * t;
  const crumblingChance = PLATFORM_CRUMBLING_CHANCE * t;
  const teleportChance = PLATFORM_TELEPORT_CHANCE * Math.max(0, t - 0.15); // after 15% difficulty
  const weightedChance = PLATFORM_WEIGHTED_CHANCE * Math.max(0, t - 0.1); // after 10% difficulty

  const roll = random();
  let cumulative = 0;

  cumulative += breakChance;
  if (roll < cumulative) return "breaking";

  cumulative += brittleChance;
  if (roll < cumulative) return "brittle";

  cumulative += PLATFORM_MOVING_CHANCE;
  if (roll < cumulative) return "moving";

  cumulative += conveyorChance;
  if (roll < cumulative) return "conveyor";

  cumulative += springChance;
  if (roll < cumulative) return "spring";

  cumulative += iceChance;
  if (roll < cumulative) return "ice";

  cumulative += crumblingChance;
  if (roll < cumulative) return "crumbling";

  cumulative += teleportChance;
  if (roll < cumulative) return "teleport";

  cumulative += weightedChance;
  if (roll < cumulative) return "weighted";

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
  lastWasBrittle = false,
  forcePlatformType?: string | null,
): PlatformState[] {
  const platforms: PlatformState[] = [];
  let y = highestY;
  let lastWasUnlandable = lastWasBrittle;

  const widthMin = difficulty?.platformWidthMin ?? PLATFORM_WIDTH_MIN;
  const widthMax = difficulty?.platformWidthMax ?? PLATFORM_WIDTH_MAX;
  const gapMin = difficulty?.gapMin ?? PLATFORM_GAP_MIN;
  const gapMax = difficulty?.gapMax ?? PLATFORM_GAP_MAX;

  for (let i = 0; i < count; i++) {
    const maxGap = lastWasUnlandable ? gapMin + 20 : gapMax;
    const gap = gapMin + random() * (maxGap - gapMin);
    y -= gap;

    const width = widthMin + random() * (widthMax - widthMin);
    const maxX = GAME_WIDTH - width - PLATFORM_HORIZONTAL_MARGIN;
    const x = PLATFORM_HORIZONTAL_MARGIN + random() * Math.max(0, maxX);

    let type = forcePlatformType ? (forcePlatformType as PlatformType) : rollType(difficulty);

    // Never two consecutive unreliable platforms (brittle, crumbling, breaking)
    const isUnreliable = type === "brittle" || type === "crumbling" || type === "breaking";
    if (lastWasUnlandable && isUnreliable && !forcePlatformType) {
      type = "static";
    }

    lastWasUnlandable = type === "brittle" || type === "crumbling" || type === "breaking";

    platforms.push(makePlatform(x, y, width, type));
  }

  return platforms;
}

/** Create a platform with type-specific extra fields. */
function makePlatform(x: number, y: number, width: number, type: PlatformType): PlatformState {
  const base: PlatformState = {
    x,
    y,
    width,
    height: PLATFORM_HEIGHT,
    type,
    broken: false,
    id: nextPlatformId++,
    originX: x,
    moveDirection: random() > 0.5 ? 1 : -1,
  };

  if (type === "conveyor") {
    base.conveyorDir = random() > 0.5 ? 1 : -1;
  } else if (type === "weighted") {
    base.tiltAngle = 0;
  }

  return base;
}

/** Mark a breaking platform as broken. Returns updated platform. */
export function breakPlatform(platform: PlatformState): PlatformState {
  return { ...platform, broken: true };
}

/** Remove platforms that are far below the camera. */
export function pruneBelow(platforms: PlatformState[], threshold: number): PlatformState[] {
  return platforms.filter((p) => p.y < threshold);
}

/** Reset the ID counter (useful for tests). */
export function resetPlatformIds(): void {
  nextPlatformId = 0;
}
