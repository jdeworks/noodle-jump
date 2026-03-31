/** Particle configs for all power-up effects. */

import type { ParticleConfig } from "../systems/ParticleEmitter";

const UP = -Math.PI / 2;
const DOWN = Math.PI / 2;
const ALL_DIRS = 0; // combined with PI spread = all directions

// ── Positive power-up particles ──────────────────────────────────────────

/** Spaghetti Spring — golden zigzag coils trailing downward. */
export const SPRING_PARTICLES: ParticleConfig = {
  count: 8,
  lifetime: 25,
  lifetimeVariance: 5,
  speed: 3,
  speedVariance: 1,
  angle: DOWN,
  angleSpread: 0.4,
  gravity: 0,
  fadeRate: 0.03,
  scaleRate: 1.0,
  rotationSpeed: 0,
  colors: [0xf0c050, 0xe8b840, 0xf5d070],
  alpha: 0.8,
  alphaVariance: 0.1,
  shape: "zigzag",
  size: [10, 16],
  spawnRate: 0.5,
  burst: false,
  drag: 1.0,
};

/** Fusilli Tornado — golden circles spiraling outward. */
export const TORNADO_PARTICLES: ParticleConfig = {
  count: 15,
  lifetime: 40,
  lifetimeVariance: 10,
  speed: 1.5,
  speedVariance: 0.5,
  angle: ALL_DIRS,
  angleSpread: Math.PI,
  gravity: 0,
  fadeRate: 0.015,
  scaleRate: 0.995,
  rotationSpeed: 0,
  colors: [0xd4a017, 0xe8b840, 0xf0c050],
  alpha: 0.6,
  alphaVariance: 0.15,
  shape: "circle",
  size: [3, 8],
  spawnRate: 0.5,
  burst: false,
  drag: 1.0,
};

/** Ravioli Rocket — fire trail drifting downward. */
export const ROCKET_PARTICLES: ParticleConfig = {
  count: 20,
  lifetime: 20,
  lifetimeVariance: 8,
  speed: 2.5,
  speedVariance: 1.5,
  angle: DOWN,
  angleSpread: 0.4,
  gravity: 0,
  fadeRate: 0.03,
  scaleRate: 0.97,
  rotationSpeed: 0,
  colors: [0xff4500, 0xff8c00, 0xffdd00, 0xff6600],
  alpha: 0.85,
  alphaVariance: 0.15,
  shape: "circle",
  size: [2, 6],
  spawnRate: 2,
  burst: false,
  drag: 1.0,
};

/** Lasagna Layers — golden/orange squares floating down. */
export const LASAGNA_PARTICLES: ParticleConfig = {
  count: 12,
  lifetime: 50,
  lifetimeVariance: 15,
  speed: 1,
  speedVariance: 0.5,
  angle: DOWN,
  angleSpread: 0.8,
  gravity: 0,
  fadeRate: 0.012,
  scaleRate: 1.0,
  rotationSpeed: 0.03,
  colors: [0xffcc00, 0xff8c00, 0xffee66],
  alpha: 0.7,
  alphaVariance: 0.1,
  shape: "rect",
  size: [2, 5],
  spawnRate: 0.33,
  burst: false,
  drag: 1.0,
};

/** Pepper Sneeze — spice cloud bursting outward. */
export const SNEEZE_PARTICLES: ParticleConfig = {
  count: 20,
  lifetime: 18,
  lifetimeVariance: 5,
  speed: 2.5,
  speedVariance: 1,
  angle: ALL_DIRS,
  angleSpread: Math.PI,
  gravity: 0.08,
  fadeRate: 0.04,
  scaleRate: 1.0,
  rotationSpeed: 0,
  colors: [0x8b0000, 0xcc4400, 0xff6633, 0xaa2200, 0xdd5500],
  alpha: 0.8,
  alphaVariance: 0.1,
  shape: "circle",
  size: [2, 6],
  spawnRate: 3,
  burst: false,
  drag: 1.0,
};

/** Meatball Magnet — blue/white sparkles converging inward. */
export const MAGNET_PARTICLES: ParticleConfig = {
  count: 12,
  lifetime: 30,
  lifetimeVariance: 10,
  speed: 2,
  speedVariance: 1,
  angle: ALL_DIRS,
  angleSpread: Math.PI,
  gravity: 0,
  fadeRate: 0.025,
  scaleRate: 0.98,
  rotationSpeed: 0.05,
  colors: [0x4488ff, 0x88bbff, 0xffffff, 0xcc66ff],
  alpha: 0.7,
  alphaVariance: 0.15,
  shape: "circle",
  size: [1.5, 4],
  spawnRate: 0.5,
  burst: false,
  drag: 0.96,
};

// ── Negative power-up particles ──────────────────────────────────────────

/** Chili Pepper — flame particles trailing behind. */
export const CHILI_PARTICLES: ParticleConfig = {
  count: 15,
  lifetime: 20,
  lifetimeVariance: 8,
  speed: 1.5,
  speedVariance: 1,
  angle: UP,
  angleSpread: 0.6,
  gravity: -0.03, // flames rise
  fadeRate: 0.035,
  scaleRate: 1.02,
  rotationSpeed: 0,
  colors: [0xff2200, 0xff6600, 0xffaa00, 0xff4400],
  alpha: 0.7,
  alphaVariance: 0.15,
  shape: "circle",
  size: [2, 6],
  spawnRate: 1.5,
  burst: false,
  drag: 1.0,
};

/** Soggy Noodle — water drip particles falling. */
export const SOGGY_PARTICLES: ParticleConfig = {
  count: 10,
  lifetime: 30,
  lifetimeVariance: 10,
  speed: 1,
  speedVariance: 0.5,
  angle: DOWN,
  angleSpread: 0.3,
  gravity: 0.12,
  fadeRate: 0.02,
  scaleRate: 1.01,
  rotationSpeed: 0,
  colors: [0x3388cc, 0x55aaee, 0x77ccff, 0x2266aa],
  alpha: 0.6,
  alphaVariance: 0.1,
  shape: "circle",
  size: [1.5, 4],
  spawnRate: 0.5,
  burst: false,
  drag: 1.0,
};

/** Garlic Breath — green fog/cloud drifting outward. */
export const GARLIC_PARTICLES: ParticleConfig = {
  count: 10,
  lifetime: 60,
  lifetimeVariance: 20,
  speed: 0.5,
  speedVariance: 0.3,
  angle: ALL_DIRS,
  angleSpread: Math.PI,
  gravity: -0.01, // fog rises slightly
  fadeRate: 0.01,
  scaleRate: 1.02, // clouds expand
  rotationSpeed: 0.01,
  colors: [0x88bb44, 0x99cc55, 0x77aa33, 0xaadd66],
  alpha: 0.35,
  alphaVariance: 0.1,
  shape: "circle",
  size: [4, 10],
  spawnRate: 0.3,
  burst: false,
  drag: 0.99,
};

/** Burnt Toast — smoke trail rising from sprite. */
export const BURNT_PARTICLES: ParticleConfig = {
  count: 10,
  lifetime: 35,
  lifetimeVariance: 10,
  speed: 0.8,
  speedVariance: 0.4,
  angle: UP,
  angleSpread: 0.5,
  gravity: -0.02, // smoke rises
  fadeRate: 0.018,
  scaleRate: 1.03, // smoke expands
  rotationSpeed: 0.02,
  colors: [0x333333, 0x555555, 0x444444, 0x666666],
  alpha: 0.5,
  alphaVariance: 0.1,
  shape: "circle",
  size: [3, 7],
  spawnRate: 0.5,
  burst: false,
  drag: 0.99,
};

// ── New positive power-up particles ───────────────────────────────────────

/** Pasta Shield — glowing blue shield bubble particles. */
export const SHIELD_PARTICLES: ParticleConfig = {
  count: 8,
  lifetime: 25,
  lifetimeVariance: 8,
  speed: 0.8,
  speedVariance: 0.4,
  angle: ALL_DIRS,
  angleSpread: Math.PI,
  gravity: -0.02,
  fadeRate: 0.025,
  scaleRate: 1.01,
  rotationSpeed: 0.02,
  colors: [0x44ddff, 0x88eeff, 0xaaffff, 0x66ccff],
  alpha: 0.5,
  alphaVariance: 0.15,
  shape: "circle",
  size: [2, 5],
  spawnRate: 0.4,
  burst: false,
  drag: 0.99,
};

/** Rigatoni Drill — brown/orange debris flying upward as player drills down. */
export const DRILL_PARTICLES: ParticleConfig = {
  count: 15,
  lifetime: 20,
  lifetimeVariance: 8,
  speed: 3,
  speedVariance: 1.5,
  angle: UP,
  angleSpread: 0.8,
  gravity: 0,
  fadeRate: 0.035,
  scaleRate: 0.98,
  rotationSpeed: 0.1,
  colors: [0xaa6633, 0xcc8844, 0x886622, 0xddaa55],
  alpha: 0.8,
  alphaVariance: 0.1,
  shape: "rect",
  size: [3, 7],
  spawnRate: 2,
  burst: false,
  drag: 1.0,
};

/** Penne Cannon — golden projectile trail shooting upward. */
export const CANNON_PARTICLES: ParticleConfig = {
  count: 10,
  lifetime: 15,
  lifetimeVariance: 5,
  speed: 2,
  speedVariance: 1,
  angle: UP,
  angleSpread: 0.3,
  gravity: 0,
  fadeRate: 0.04,
  scaleRate: 0.97,
  rotationSpeed: 0,
  colors: [0xffcc33, 0xffdd66, 0xffaa00],
  alpha: 0.7,
  alphaVariance: 0.1,
  shape: "circle",
  size: [2, 4],
  spawnRate: 1,
  burst: false,
  drag: 1.0,
};

/** Gnocchi Bounce — soft white/beige puff on each bounce. */
export const GNOCCHI_PARTICLES: ParticleConfig = {
  count: 6,
  lifetime: 20,
  lifetimeVariance: 5,
  speed: 1.5,
  speedVariance: 0.8,
  angle: ALL_DIRS,
  angleSpread: Math.PI,
  gravity: -0.01,
  fadeRate: 0.03,
  scaleRate: 1.02,
  rotationSpeed: 0,
  colors: [0xffe4c4, 0xffeedd, 0xfff5e6],
  alpha: 0.5,
  alphaVariance: 0.1,
  shape: "circle",
  size: [3, 6],
  spawnRate: 0.5,
  burst: false,
  drag: 0.99,
};

/** Minestrone Soup — rising soup bubbles and vegetable bits. */
export const MINESTRONE_PARTICLES: ParticleConfig = {
  count: 12,
  lifetime: 30,
  lifetimeVariance: 10,
  speed: 1,
  speedVariance: 0.5,
  angle: UP,
  angleSpread: 0.5,
  gravity: -0.03,
  fadeRate: 0.02,
  scaleRate: 1.01,
  rotationSpeed: 0.02,
  colors: [0xcc4422, 0xdd6633, 0xee8844, 0x44aa33, 0xffcc00],
  alpha: 0.6,
  alphaVariance: 0.1,
  shape: "circle",
  size: [2, 5],
  spawnRate: 0.5,
  burst: false,
  drag: 1.0,
};

// ── Gameplay particles ───────────────────────────────────────────────────

/** Dust puff on landing. */
export const DUST_PARTICLES: ParticleConfig = {
  count: 5,
  lifetime: 18,
  lifetimeVariance: 5,
  speed: 1.2,
  speedVariance: 0.8,
  angle: UP,
  angleSpread: 1.2,
  gravity: 0,
  fadeRate: 0.04,
  scaleRate: 1.03,
  rotationSpeed: 0,
  colors: [0xccbbaa],
  alpha: 0.6,
  alphaVariance: 0.1,
  shape: "circle",
  size: [2, 5],
  spawnRate: 5, // all at once
  burst: true,
  drag: 1.0,
};

/** Platform crumble debris. */
export const CRUMBLE_PARTICLES: ParticleConfig = {
  count: 7,
  lifetime: 45,
  lifetimeVariance: 10,
  speed: 2,
  speedVariance: 1,
  angle: UP,
  angleSpread: 1.5,
  gravity: 0.15,
  fadeRate: 0.018,
  scaleRate: 1.0,
  rotationSpeed: 0.05,
  colors: [0xd4a574, 0xc8915a, 0xbb8050],
  alpha: 0.8,
  alphaVariance: 0.1,
  shape: "rect",
  size: [3, 8],
  spawnRate: 7, // all at once
  burst: true,
  drag: 1.0,
};

// ── Lookup ───────────────────────────────────────────────────────────────

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
  rigatoni_drill: DRILL_PARTICLES,
  penne_cannon: CANNON_PARTICLES,
  gnocchi_bounce: GNOCCHI_PARTICLES,
  minestrone_soup: MINESTRONE_PARTICLES,
};
