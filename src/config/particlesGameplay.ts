/** Gameplay particle configs (dust, crumble). */

import type { ParticleConfig } from "../systems/ParticleEmitter";

const UP = -Math.PI / 2;

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
