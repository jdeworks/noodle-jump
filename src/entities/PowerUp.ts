/** Power-up logic — pure, no PixiJS. */

import {
  POWERUP_SIZE,
  POWERUP_FLOAT_HEIGHT,
  POWERUP_SPAWN_CHANCE,
  POWERUP_COOLDOWN,
  SPAGHETTI_SPRING_VELOCITY,
  FUSILLI_TORNADO_VELOCITY,
  FUSILLI_TORNADO_DURATION,
  RAVIOLI_ROCKET_VELOCITY,
  RAVIOLI_ROCKET_DURATION,
  LASAGNA_LAYERS_DURATION,
  LASAGNA_GRAVITY_MULTIPLIER,
  PEPPER_SNEEZE_VELOCITY,
  PEPPER_SNEEZE_DURATION,
  NEGATIVE_EFFECT_DURATION,
  MEATBALL_MAGNET_DURATION,
  GAME_WIDTH,
} from "../config/constants";
import type { PlatformState } from "./Platform";
import type { PlayerState } from "./Player";

export type PositivePowerUpType =
  | "spaghetti_spring"
  | "fusilli_tornado"
  | "ravioli_rocket"
  | "lasagna_layers"
  | "pepper_sneeze"
  | "meatball_magnet";
export type NegativePowerUpType =
  | "chili_pepper"
  | "soggy_noodle"
  | "garlic_breath"
  | "burnt_toast";
export type PowerUpType = PositivePowerUpType | NegativePowerUpType;

const POSITIVE_TYPES: PositivePowerUpType[] = [
  "spaghetti_spring",
  "fusilli_tornado",
  "ravioli_rocket",
  "lasagna_layers",
  "pepper_sneeze",
  "meatball_magnet",
];
const NEGATIVE_TYPES: NegativePowerUpType[] = [
  "chili_pepper",
  "soggy_noodle",
  "garlic_breath",
  "burnt_toast",
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
  } else if (Math.random() < (negativeChance ?? NEGATIVE_SPAWN_CHANCE)) {
    chosen = NEGATIVE_TYPES[Math.floor(Math.random() * NEGATIVE_TYPES.length)];
  } else {
    chosen = POSITIVE_TYPES[Math.floor(Math.random() * POSITIVE_TYPES.length)];
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

    if (Math.random() < POWERUP_SPAWN_CHANCE) {
      powerUps.push(createPowerUp(platform, undefined, negativeChance));
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
  const sweepRight =
    Math.max(px + player.width, player.x + player.width) + pad;
  const sweepTop = Math.min(py, player.y) - pad;
  const sweepBottom =
    Math.max(py + player.height, player.y + player.height) + pad;

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

/**
 * Apply a power-up effect. Returns the modified player state and active effect.
 */
export function applyPowerUp(
  player: PlayerState,
  type: PowerUpType,
): { player: PlayerState; effect: ActiveEffect | null } {
  switch (type) {
    case "spaghetti_spring":
      return {
        player: { ...player, vy: SPAGHETTI_SPRING_VELOCITY, isJumping: true },
        effect: null,
      };

    case "fusilli_tornado":
      return {
        player: { ...player, vy: FUSILLI_TORNADO_VELOCITY, isJumping: true },
        effect: {
          type: "fusilli_tornado",
          ticksRemaining: FUSILLI_TORNADO_DURATION,
        },
      };

    case "ravioli_rocket":
      return {
        player: { ...player, vy: RAVIOLI_ROCKET_VELOCITY, isJumping: true },
        effect: {
          type: "ravioli_rocket",
          ticksRemaining: RAVIOLI_ROCKET_DURATION,
        },
      };

    case "lasagna_layers":
      // Stepping stones — small boost + spawns platforms above to jump on
      return {
        player: {
          ...player,
          vy: -12,
          isJumping: true,
        },
        effect: {
          type: "lasagna_layers",
          ticksRemaining: LASAGNA_LAYERS_DURATION,
        },
      };

    case "pepper_sneeze":
      // Powerful sneeze — short burst upward with shaking
      return {
        player: { ...player, vy: PEPPER_SNEEZE_VELOCITY, isJumping: true },
        effect: {
          type: "pepper_sneeze",
          ticksRemaining: PEPPER_SNEEZE_DURATION,
        },
      };

    case "meatball_magnet":
      return {
        player,
        effect: {
          type: "meatball_magnet",
          ticksRemaining: MEATBALL_MAGNET_DURATION,
        },
      };

    // Negative power-ups — no velocity boost, just debuff effects
    case "chili_pepper":
      return {
        player,
        effect: {
          type: "chili_pepper",
          ticksRemaining: NEGATIVE_EFFECT_DURATION,
        },
      };
    case "soggy_noodle":
      return {
        player,
        effect: {
          type: "soggy_noodle",
          ticksRemaining: NEGATIVE_EFFECT_DURATION,
        },
      };
    case "garlic_breath":
      return {
        player,
        effect: {
          type: "garlic_breath",
          ticksRemaining: NEGATIVE_EFFECT_DURATION,
        },
      };
    case "burnt_toast":
      return {
        player,
        effect: {
          type: "burnt_toast",
          ticksRemaining: NEGATIVE_EFFECT_DURATION,
        },
      };
  }
}

export interface TickEffectResult {
  player: PlayerState;
  effect: ActiveEffect | null;
  spawnPlatform: boolean; // true = caller should spawn a platform near the player
}

/**
 * Tick the active effect. During sustained effects, gravity is overridden.
 * Lasagna layers periodically signals the caller to spawn a platform.
 */
export function tickEffect(
  player: PlayerState,
  effect: ActiveEffect,
): TickEffectResult {
  const remaining = effect.ticksRemaining - 1;

  if (remaining <= 0) {
    return { player, effect: null, spawnPlatform: false };
  }

  const updatedEffect = { ...effect, ticksRemaining: remaining };

  if (effect.type === "fusilli_tornado") {
    return {
      player: { ...player, vy: FUSILLI_TORNADO_VELOCITY, isJumping: true },
      effect: updatedEffect,
      spawnPlatform: false,
    };
  }

  if (effect.type === "ravioli_rocket") {
    return {
      player: { ...player, vy: RAVIOLI_ROCKET_VELOCITY, isJumping: true },
      effect: updatedEffect,
      spawnPlatform: false,
    };
  }

  if (effect.type === "pepper_sneeze") {
    // Full upward force the entire duration — violent launch
    return {
      player: { ...player, vy: PEPPER_SNEEZE_VELOCITY, isJumping: true },
      effect: updatedEffect,
      spawnPlatform: false,
    };
  }

  if (effect.type === "lasagna_layers") {
    // Stepping stones — spawn platforms above the player to jump on
    // Normal physics apply, player jumps between spawned platforms
    const shouldSpawn = remaining % 20 === 0;
    return {
      player,
      effect: updatedEffect,
      spawnPlatform: shouldSpawn,
    };
  }

  // Magnet + negative effects — just count down, effects handled by GameScene
  if (
    effect.type === "meatball_magnet" ||
    effect.type === "chili_pepper" ||
    effect.type === "soggy_noodle" ||
    effect.type === "garlic_breath" ||
    effect.type === "burnt_toast"
  ) {
    return { player, effect: updatedEffect, spawnPlatform: false };
  }

  return { player, effect: updatedEffect, spawnPlatform: false };
}

/** Update power-up positions to follow their moving platforms. */
export function updatePowerUpPositions(
  powerUps: PowerUpState[],
  platforms: PlatformState[],
): PowerUpState[] {
  const platformMap = new Map(platforms.map((p) => [p.id, p]));
  return powerUps.map((pu) => {
    const platform = platformMap.get(pu.platformId);
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
