import { describe, test, expect } from "vitest";
import {
  createEmitter,
  tickEmitter,
  burstEmitter,
  moveEmitter,
  stopEmitter,
  isEmitterDone,
  type ParticleConfig,
} from "../src/systems/ParticleEmitter";

const TEST_CONFIG: ParticleConfig = {
  count: 5,
  lifetime: 10,
  lifetimeVariance: 0,
  speed: 2,
  speedVariance: 0,
  angle: -Math.PI / 2, // upward
  angleSpread: 0,
  gravity: 0,
  fadeRate: 0.1,
  scaleRate: 1.0,
  rotationSpeed: 0,
  colors: [0xff0000],
  alpha: 1.0,
  alphaVariance: 0,
  shape: "circle",
  size: [3, 3],
  spawnRate: 1,
  burst: false,
  drag: 1.0,
};

describe("ParticleEmitter", () => {
  test("createEmitter initializes at given position", () => {
    const emitter = createEmitter(TEST_CONFIG, 100, 200);
    expect(emitter.originX).toBe(100);
    expect(emitter.originY).toBe(200);
    expect(emitter.particles).toHaveLength(0);
    expect(emitter.active).toBe(true);
  });

  test("tickEmitter spawns particles at spawnRate", () => {
    let emitter = createEmitter(TEST_CONFIG, 0, 0);
    // spawnRate = 1, so each tick should spawn 1 particle
    emitter = tickEmitter(emitter);
    expect(emitter.particles.length).toBe(1);

    emitter = tickEmitter(emitter);
    expect(emitter.particles.length).toBe(2);
  });

  test("particles move based on velocity", () => {
    let emitter = createEmitter(TEST_CONFIG, 50, 50);
    emitter = tickEmitter(emitter);

    const p = emitter.particles[0];
    const startY = p.y;

    emitter = tickEmitter(emitter);
    const updated = emitter.particles[0];
    // Particle should have moved upward (angle = -PI/2, speed = 2)
    expect(updated.y).toBeLessThan(startY);
  });

  test("particles fade over time", () => {
    let emitter = createEmitter(TEST_CONFIG, 0, 0);
    emitter = tickEmitter(emitter); // spawn
    const initialAlpha = emitter.particles[0].alpha;

    emitter = tickEmitter(emitter);
    expect(emitter.particles[0].alpha).toBeLessThan(initialAlpha);
  });

  test("particles are removed when life reaches 0", () => {
    let emitter = createEmitter(TEST_CONFIG, 0, 0);
    emitter = tickEmitter(emitter); // spawn 1 particle
    expect(emitter.particles.length).toBeGreaterThanOrEqual(1);

    // Tick until all particles expire (lifetime=10, spawn 1/tick, max ~15 particles)
    for (let i = 0; i < 30; i++) {
      emitter = stopEmitter(emitter); // stop spawning
      emitter = tickEmitter(emitter);
    }
    expect(emitter.particles).toHaveLength(0);
  });

  test("burstEmitter spawns all particles at once", () => {
    let emitter = createEmitter(TEST_CONFIG, 0, 0);
    emitter = burstEmitter(emitter);
    expect(emitter.particles).toHaveLength(TEST_CONFIG.count);
  });

  test("moveEmitter updates origin", () => {
    let emitter = createEmitter(TEST_CONFIG, 0, 0);
    emitter = moveEmitter(emitter, 50, 100);
    expect(emitter.originX).toBe(50);
    expect(emitter.originY).toBe(100);
  });

  test("stopEmitter prevents new particles", () => {
    let emitter = createEmitter(TEST_CONFIG, 0, 0);
    emitter = stopEmitter(emitter);
    expect(emitter.active).toBe(false);

    emitter = tickEmitter(emitter);
    expect(emitter.particles).toHaveLength(0);
  });

  test("isEmitterDone returns true when stopped and empty", () => {
    let emitter = createEmitter(TEST_CONFIG, 0, 0);
    expect(isEmitterDone(emitter)).toBe(false);

    emitter = stopEmitter(emitter);
    expect(isEmitterDone(emitter)).toBe(true); // no particles, not active
  });

  test("isEmitterDone returns false when particles remain", () => {
    let emitter = createEmitter(TEST_CONFIG, 0, 0);
    emitter = burstEmitter(emitter);
    emitter = stopEmitter(emitter);
    expect(isEmitterDone(emitter)).toBe(false); // particles still alive
  });

  test("gravity affects particle velocity", () => {
    const gravConfig = { ...TEST_CONFIG, gravity: 0.5, angle: 0, speed: 0 };
    let emitter = createEmitter(gravConfig, 0, 0);
    emitter = tickEmitter(emitter); // spawn + first tick applies gravity

    const vyAfterFirstTick = emitter.particles[0].vy;

    emitter = tickEmitter(emitter);
    const vyAfterSecondTick = emitter.particles[0].vy;

    // Gravity should accumulate: second tick vy > first tick vy
    expect(vyAfterSecondTick).toBeGreaterThan(vyAfterFirstTick);
  });

  test("drag slows particles", () => {
    const dragConfig = { ...TEST_CONFIG, drag: 0.5, speed: 10 };
    let emitter = createEmitter(dragConfig, 0, 0);
    emitter = tickEmitter(emitter); // spawn

    const initialVx = emitter.particles[0].vx;
    emitter = tickEmitter(emitter);
    const newVx = emitter.particles[0].vx;

    // Speed should decrease due to drag
    expect(Math.abs(newVx)).toBeLessThan(Math.abs(initialVx));
  });

  test("particle colors come from config", () => {
    const multiColorConfig = {
      ...TEST_CONFIG,
      colors: [0xff0000, 0x00ff00, 0x0000ff],
    };
    let emitter = createEmitter(multiColorConfig, 0, 0);

    // Spawn several particles
    for (let i = 0; i < 10; i++) {
      emitter = tickEmitter(emitter);
    }

    // Each particle color should be one of the configured colors
    for (const p of emitter.particles) {
      expect(multiColorConfig.colors).toContain(p.color);
    }
  });
});
