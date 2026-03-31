/** Config-driven particle emitter — pure logic, no PixiJS. */

export type ParticleShape = "circle" | "rect" | "zigzag";

export interface ParticleConfig {
  /** Max particles spawned per trigger. */
  count: number;
  /** Ticks each particle lives. */
  lifetime: number;
  /** Lifetime randomness range (+/- ticks). */
  lifetimeVariance: number;
  /** Initial speed magnitude. */
  speed: number;
  /** Speed randomness (+/-). */
  speedVariance: number;
  /** Direction angle in radians (0 = right, PI/2 = down). */
  angle: number;
  /** Angle spread (+/- radians from center angle). */
  angleSpread: number;
  /** Gravity acceleration per tick (positive = down). */
  gravity: number;
  /** Alpha fade per tick. */
  fadeRate: number;
  /** Scale change per tick (1.0 = no change, 1.03 = grow 3%). */
  scaleRate: number;
  /** Rotation speed per tick (radians). */
  rotationSpeed: number;
  /** Available colors (one chosen randomly per particle). */
  colors: number[];
  /** Initial alpha. */
  alpha: number;
  /** Alpha randomness (+/-). */
  alphaVariance: number;
  /** Particle shape. */
  shape: ParticleShape;
  /** Size range [min, max]. */
  size: [number, number];
  /** Spawn rate: particles per tick (fractional OK, accumulates). */
  spawnRate: number;
  /** If true, spawn all `count` particles at once (burst mode). */
  burst: boolean;
  /** Horizontal drag per tick (0.98 = slight drag). 1.0 = none. */
  drag: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  alpha: number;
  scale: number;
  rotation: number;
  color: number;
  size: number;
  shape: ParticleShape;
  rotationSpeed: number;
}

export interface EmitterState {
  config: ParticleConfig;
  particles: Particle[];
  /** Origin X in world coordinates. */
  originX: number;
  /** Origin Y in world coordinates. */
  originY: number;
  /** Accumulated fractional spawn count. */
  spawnAccum: number;
  /** Whether the emitter is actively spawning. */
  active: boolean;
}

/** Create a new emitter at a world position. */
export function createEmitter(
  config: ParticleConfig,
  originX: number,
  originY: number,
): EmitterState {
  return {
    config,
    particles: [],
    originX,
    originY,
    spawnAccum: 0,
    active: true,
  };
}

/** Spawn a burst of particles (all at once). */
export function burstEmitter(state: EmitterState): EmitterState {
  const particles = [...state.particles];
  for (let i = 0; i < state.config.count; i++) {
    particles.push(spawnParticle(state.config, state.originX, state.originY));
  }
  return { ...state, particles };
}

/** Tick the emitter — spawn new particles and update existing ones. */
export function tickEmitter(state: EmitterState): EmitterState {
  const { config } = state;
  const particles = [...state.particles];
  let spawnAccum = state.spawnAccum;

  // Spawn new particles if active
  if (state.active && !config.burst) {
    spawnAccum += config.spawnRate;
    while (spawnAccum >= 1) {
      if (particles.length < config.count * 3) {
        particles.push(
          spawnParticle(config, state.originX, state.originY),
        );
      }
      spawnAccum -= 1;
    }
  }

  // Update existing particles
  const alive: Particle[] = [];
  for (const p of particles) {
    const updated = tickParticle(p, config);
    if (updated.life > 0 && updated.alpha > 0) {
      alive.push(updated);
    }
  }

  return { ...state, particles: alive, spawnAccum };
}

/** Update emitter origin (follow a moving source like the player). */
export function moveEmitter(
  state: EmitterState,
  x: number,
  y: number,
): EmitterState {
  return { ...state, originX: x, originY: y };
}

/** Stop spawning new particles (existing ones keep playing out). */
export function stopEmitter(state: EmitterState): EmitterState {
  return { ...state, active: false };
}

/** Check if the emitter is done (inactive and no particles left). */
export function isEmitterDone(state: EmitterState): boolean {
  return !state.active && state.particles.length === 0;
}

// ── Internal helpers ─────────────────────────────────────────────────────

function spawnParticle(
  config: ParticleConfig,
  originX: number,
  originY: number,
): Particle {
  const angle =
    config.angle + (Math.random() - 0.5) * 2 * config.angleSpread;
  const speed =
    config.speed + (Math.random() - 0.5) * 2 * config.speedVariance;
  const life =
    config.lifetime +
    Math.floor((Math.random() - 0.5) * 2 * config.lifetimeVariance);
  const size =
    config.size[0] + Math.random() * (config.size[1] - config.size[0]);
  const alpha =
    config.alpha + (Math.random() - 0.5) * 2 * config.alphaVariance;

  return {
    x: originX,
    y: originY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life,
    maxLife: life,
    alpha: Math.max(0, Math.min(1, alpha)),
    scale: 1,
    rotation: Math.random() * Math.PI * 2,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    size,
    shape: config.shape,
    rotationSpeed: config.rotationSpeed,
  };
}

function tickParticle(p: Particle, config: ParticleConfig): Particle {
  return {
    ...p,
    x: p.x + p.vx,
    y: p.y + p.vy,
    vx: p.vx * config.drag,
    vy: p.vy * config.drag + config.gravity,
    life: p.life - 1,
    alpha: Math.max(0, p.alpha - config.fadeRate),
    scale: p.scale * config.scaleRate,
    rotation: p.rotation + p.rotationSpeed,
  };
}
