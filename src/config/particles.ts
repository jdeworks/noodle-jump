/** Particle configs — barrel re-export + lookup map. */

import type { ParticleConfig } from "../systems/ParticleEmitter";

// Re-export all configs so existing imports continue to work
export {
  SPRING_PARTICLES,
  TORNADO_PARTICLES,
  ROCKET_PARTICLES,
  LASAGNA_PARTICLES,
  SNEEZE_PARTICLES,
  MAGNET_PARTICLES,
  SHIELD_PARTICLES,
  CANNON_PARTICLES,
  GNOCCHI_PARTICLES,
  MINESTRONE_PARTICLES,
} from "./particlesPositive";

export {
  CHILI_PARTICLES,
  SOGGY_PARTICLES,
  GARLIC_PARTICLES,
  BURNT_PARTICLES,
} from "./particlesNegative";

export { DUST_PARTICLES, CRUMBLE_PARTICLES } from "./particlesGameplay";

// Import for the lookup map
import {
  SPRING_PARTICLES,
  TORNADO_PARTICLES,
  ROCKET_PARTICLES,
  LASAGNA_PARTICLES,
  SNEEZE_PARTICLES,
  MAGNET_PARTICLES,
  SHIELD_PARTICLES,
  CANNON_PARTICLES,
  GNOCCHI_PARTICLES,
  MINESTRONE_PARTICLES,
} from "./particlesPositive";

import {
  CHILI_PARTICLES,
  SOGGY_PARTICLES,
  GARLIC_PARTICLES,
  BURNT_PARTICLES,
} from "./particlesNegative";

/** Map power-up type to its particle config. */
export const POWER_UP_PARTICLE_CONFIGS: Record<string, ParticleConfig> = {
  spaghetti_spring: SPRING_PARTICLES,
  fusilli_tornado: TORNADO_PARTICLES,
  ravioli_rocket: ROCKET_PARTICLES,
  lasagna_layers: LASAGNA_PARTICLES,
  pepper_sneeze: SNEEZE_PARTICLES,
  meatball_magnet: MAGNET_PARTICLES,
  chili_pepper: CHILI_PARTICLES,
  soggy_noodle: SOGGY_PARTICLES,
  garlic_breath: GARLIC_PARTICLES,
  burnt_toast: BURNT_PARTICLES,
  pasta_shield: SHIELD_PARTICLES,

  penne_cannon: CANNON_PARTICLES,
  gnocchi_bounce: GNOCCHI_PARTICLES,
  minestrone_soup: MINESTRONE_PARTICLES,
};
