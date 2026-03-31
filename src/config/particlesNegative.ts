/** Negative power-up particle configs. */

import type { ParticleConfig } from "../systems/ParticleEmitter";

const UP = -Math.PI / 2;
const DOWN = Math.PI / 2;
const ALL_DIRS = 0; // combined with PI spread = all directions

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
