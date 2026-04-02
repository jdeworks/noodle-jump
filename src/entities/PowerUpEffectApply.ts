/** Power-up effect application and tick logic — extracted from PowerUp.ts. */

import {
  SPAGHETTI_SPRING_VELOCITY,
  FUSILLI_TORNADO_VELOCITY,
  FUSILLI_TORNADO_DURATION,
  RAVIOLI_ROCKET_VELOCITY,
  RAVIOLI_ROCKET_DURATION,
  LASAGNA_LAYERS_DURATION,
  PEPPER_SNEEZE_VELOCITY,
  PEPPER_SNEEZE_DURATION,
  NEGATIVE_EFFECT_DURATION,
  MEATBALL_MAGNET_DURATION,
  PASTA_SHIELD_DURATION,
  GNOCCHI_BOUNCE_DURATION,
  MINESTRONE_SOUP_DURATION,
} from "../config/constants";
import type { PlayerState } from "./Player";
import type { PowerUpType, ActiveEffect } from "./PowerUp";

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
        effect: { type: "meatball_magnet", ticksRemaining: MEATBALL_MAGNET_DURATION },
      };

    case "pasta_shield":
      return {
        player,
        effect: { type: "pasta_shield", ticksRemaining: PASTA_SHIELD_DURATION },
      };

    case "gnocchi_bounce":
      return {
        player,
        effect: { type: "gnocchi_bounce", ticksRemaining: GNOCCHI_BOUNCE_DURATION },
      };

    case "minestrone_soup":
      return {
        player,
        effect: { type: "minestrone_soup", ticksRemaining: MINESTRONE_SOUP_DURATION },
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

  // Remaining effects — just count down, behavior handled by caller
  return { player, effect: updatedEffect, spawnPlatform: false };
}
