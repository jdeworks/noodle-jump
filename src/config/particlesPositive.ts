/** Positive power-up particle configs. */

import type { ParticleConfig } from "../systems/ParticleEmitter";

const UP = -Math.PI / 2;
const DOWN = Math.PI / 2;
const ALL_DIRS = 0; // combined with PI spread = all directions

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
