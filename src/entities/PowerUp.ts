/** Power-up logic — pure, no PixiJS. */

import { random } from "../systems/RNG";
import {
  POWERUP_SIZE,
  POWERUP_FLOAT_HEIGHT,
  POWERUP_SPAWN_CHANCE,
  POWERUP_COOLDOWN,
} from "../config/constants";
import type { PlatformState } from "./Platform";
import type { PlayerState } from "./Player";

// Re-export effect logic from dedicated module
export { applyPowerUp, tickEffect } from "./PowerUpEffectApply";
export type { TickEffectResult } from "./PowerUpEffectApply";

export type PositivePowerUpType =
  | "spaghetti_spring"
  | "fusilli_tornado"
  | "ravioli_rocket"
  | "lasagna_layers"
  | "pepper_sneeze"
  | "meatball_magnet"
  | "pasta_shield"
  | "gnocchi_bounce";
export type NegativePowerUpType =
  | "chili_pepper"
  | "soggy_noodle"
  | "garlic_breath"
  | "burnt_toast"
  | "minestrone_soup";
export type PowerUpType = PositivePowerUpType | NegativePowerUpType;

const POSITIVE_TYPES: PositivePowerUpType[] = [
  "spaghetti_spring",
  "fusilli_tornado",
  "ravioli_rocket",
  "lasagna_layers",
  "pepper_sneeze",
  "meatball_magnet",
  "pasta_shield",
  "gnocchi_bounce",
];
const NEGATIVE_TYPES: NegativePowerUpType[] = [
  "chili_pepper",
  "soggy_noodle",
  "garlic_breath",
  "burnt_toast",
  "minestrone_soup",
];

const NEGATIVE_SPAWN_CHANCE = 0.3; // 30% chance a power-up spawn is negative

export function isNegativePowerUp(type: PowerUpType): boolean {
  return (NEGATIVE_TYPES as string[]).includes(type);
}

export interface PowerUpState {
  x: number;
  y: number;
  size: number;
  type: PowerUpType;
  collected: boolean;
  platformId: number;
  id: number;
}

/** Active power-up effect on the player. */
export interface ActiveEffect {
  type: PowerUpType;
  ticksRemaining: number;
}

let nextPowerUpId = 0;

export function createPowerUp(
  platform: PlatformState,
  type?: PowerUpType,
  negativeChance?: number,
): PowerUpState {
  let chosen: PowerUpType;
  if (type) {
    chosen = type;
  } else if (random() < (negativeChance ?? NEGATIVE_SPAWN_CHANCE)) {
    chosen = NEGATIVE_TYPES[Math.floor(random() * NEGATIVE_TYPES.length)];
  } else {
    chosen = POSITIVE_TYPES[Math.floor(random() * POSITIVE_TYPES.length)];
  }
  return {
    x: platform.x + platform.width / 2 - POWERUP_SIZE / 2,
    y: platform.y - POWERUP_FLOAT_HEIGHT,
    size: POWERUP_SIZE,
    type: chosen,
    collected: false,
    platformId: platform.id,
    id: nextPowerUpId++,
  };
}

const POWERUP_SKIP_FIRST = 10; // don't spawn on the first N platforms

/** Spawn power-ups on platforms with cooldown to prevent clustering. */
export function spawnPowerUps(
  platforms: PlatformState[],
  negativeChance?: number,
  forcedType?: string,
  enabledTypes?: Set<string>,
): PowerUpState[] {
  const powerUps: PowerUpState[] = [];
  let cooldown = 0;

  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    if (i < POWERUP_SKIP_FIRST) continue;
    if (cooldown > 0) {
      cooldown--;
      continue;
    }
    if (platform.type !== "static" && platform.type !== "moving") continue;
    if (platform.width > 200) continue;

    if (random() < POWERUP_SPAWN_CHANCE) {
      const type = forcedType as PowerUpType | undefined;
      const pu = createPowerUp(platform, type, negativeChance);
      // Filter by enabled types if specified
      if (enabledTypes && enabledTypes.size > 0 && !enabledTypes.has(pu.type)) continue;
      powerUps.push(pu);
      cooldown = POWERUP_COOLDOWN;
    }
  }

  return powerUps;
}

/**
 * Swept AABB power-up collection — checks the full trajectory between
 * frames so fast movement can't skip past a power-up.
 */
export function collectPowerUps(
  player: PlayerState,
  powerUps: PowerUpState[],
  prevX?: number,
  prevY?: number,
): { powerUps: PowerUpState[]; collected: PowerUpType | null } {
  const pad = 6;
  const px = prevX ?? player.x;
  const py = prevY ?? player.y;

  // Swept bounding box
  const sweepLeft = Math.min(px, player.x) - pad;
  const sweepRight = Math.max(px + player.width, player.x + player.width) + pad;
  const sweepTop = Math.min(py, player.y) - pad;
  const sweepBottom = Math.max(py + player.height, player.y + player.height) + pad;

  for (let i = 0; i < powerUps.length; i++) {
    const pu = powerUps[i];
    if (pu.collected) continue;

    const overlapX = sweepLeft < pu.x + pu.size && sweepRight > pu.x;
    const overlapY = sweepTop < pu.y + pu.size && sweepBottom > pu.y;

    if (overlapX && overlapY) {
      const updated = [...powerUps];
      updated[i] = { ...pu, collected: true };
      return { powerUps: updated, collected: pu.type };
    }
  }

  return { powerUps, collected: null };
}

/** Update power-up positions to follow their moving platforms. */
export function updatePowerUpPositions(
  powerUps: PowerUpState[],
  platforms: PlatformState[],
  platformMap?: Map<number, PlatformState>,
): PowerUpState[] {
  const map = platformMap ?? new Map(platforms.map((p) => [p.id, p]));
  return powerUps.map((pu) => {
    const platform = map.get(pu.platformId);
    if (!platform) return pu;
    return {
      ...pu,
      x: platform.x + platform.width / 2 - pu.size / 2,
      y: platform.y - POWERUP_FLOAT_HEIGHT,
    };
  });
}

/** Remove power-ups whose platform is gone. */
export function prunePowerUps(
  powerUps: PowerUpState[],
  activePlatformIds: Set<number>,
): PowerUpState[] {
  return powerUps.filter((pu) => activePlatformIds.has(pu.platformId));
}

export function resetPowerUpIds(): void {
  nextPowerUpId = 0;
}
