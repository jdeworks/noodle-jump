import { describe, it, expect } from "vitest";
import { createInitialState } from "../src/scenes/GameState";
import { tickGameWorld, throwProjectile } from "../src/scenes/GameLoop";
import { createDefaultRunConfig } from "../src/systems/CustomRunConfig";
import { applyPreset, createDebugConfig, bossTestPreset } from "../src/config/debug";
import { resetRNG } from "../src/systems/RNG";

describe("Seeded RNG wiring", () => {
  it("same seed produces same initial platforms", () => {
    const config1 = { ...createDefaultRunConfig(), seed: 42 };
    const state1 = createInitialState(config1);

    const config2 = { ...createDefaultRunConfig(), seed: 42 };
    const state2 = createInitialState(config2);

    expect(state1.platforms.length).toBe(state2.platforms.length);
    for (let i = 0; i < state1.platforms.length; i++) {
      expect(state1.platforms[i].x).toBe(state2.platforms[i].x);
      expect(state1.platforms[i].y).toBe(state2.platforms[i].y);
      expect(state1.platforms[i].type).toBe(state2.platforms[i].type);
    }
    resetRNG();
  });

  it("different seeds produce different platforms", () => {
    const config1 = { ...createDefaultRunConfig(), seed: 42 };
    const state1 = createInitialState(config1);

    const config2 = { ...createDefaultRunConfig(), seed: 99999 };
    const state2 = createInitialState(config2);

    // At least some platforms should differ in position
    const sameX = state1.platforms.every(
      (p, i) => state2.platforms[i] && p.x === state2.platforms[i].x,
    );
    expect(sameX).toBe(false);
    resetRNG();
  });
});

describe("Debug config wiring", () => {
  it("invincible prevents death", () => {
    const config = createDefaultRunConfig();
    let state = createInitialState(config);
    state = {
      ...state,
      debugConfig: { ...state.debugConfig, invincible: true },
      countdownTicks: 0,
    };
    // Move player way below camera (would normally die)
    state = {
      ...state,
      player: { ...state.player, y: state.camera.y + 2000 },
    };

    const result = tickGameWorld(state, 0);
    expect(result.state.isDying).toBe(false);
    resetRNG();
  });

  it("infiniteKnives allows throwing without ammo", () => {
    const config = createDefaultRunConfig();
    let state = createInitialState(config);
    state = {
      ...state,
      debugConfig: { ...state.debugConfig, infiniteKnives: true },
      knifeAmmo: 0,
      enemiesEnabled: true,
      countdownTicks: 0,
    };

    const result = throwProjectile(state, 100, 100);
    expect(result.projectiles.length).toBe(1);
    expect(result.knifeAmmo).toBe(0); // unchanged
    resetRNG();
  });

  it("bossTestPreset sets quickZoneTransitions", () => {
    const debug = applyPreset(createDebugConfig(), bossTestPreset());
    expect(debug.quickZoneTransitions).toBe(15);
    expect(debug.infiniteKnives).toBe(true);
  });
});

describe("Enemies killed tracking", () => {
  it("initial state has 0 enemiesKilled", () => {
    const state = createInitialState();
    expect(state.enemiesKilled).toBe(0);
    resetRNG();
  });
});
