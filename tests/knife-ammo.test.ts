import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../src/scenes/GameState";
import { throwProjectile } from "../src/scenes/GameLoop";
import { resetPlatformIds } from "../src/entities/Platform";
import { resetPowerUpIds } from "../src/entities/PowerUp";
import { resetCollectibleIds } from "../src/entities/Collectible";

beforeEach(() => {
  resetPlatformIds();
  resetPowerUpIds();
  resetCollectibleIds();
});

describe("Knife ammo system", () => {
  test("initial state has 3 knives", () => {
    const state = createInitialState();
    expect(state.knifeAmmo).toBe(3);
    expect(state.knifeAmmoMax).toBe(3);
  });

  test("throwProjectile consumes a knife when enemies enabled", () => {
    let state = createInitialState();
    state = { ...state, enemiesEnabled: true, countdownTicks: 0 };
    const after = throwProjectile(state, 200, -100);
    expect(after.knifeAmmo).toBe(2);
    expect(after.projectiles.length).toBe(1);
  });

  test("throwProjectile consumes a knife during boss fight", () => {
    let state = createInitialState();
    state = { ...state, inBossFight: true, countdownTicks: 0 };
    const after = throwProjectile(state, 200, -100);
    expect(after.knifeAmmo).toBe(2);
  });

  test("throwProjectile fails with 0 ammo", () => {
    let state = createInitialState();
    state = { ...state, enemiesEnabled: true, knifeAmmo: 0, countdownTicks: 0 };
    const after = throwProjectile(state, 200, -100);
    expect(after.knifeAmmo).toBe(0);
    expect(after.projectiles.length).toBe(0);
  });

  test("throwProjectile fails when neither enemies nor boss active", () => {
    let state = createInitialState();
    state = { ...state, enemiesEnabled: false, inBossFight: false, countdownTicks: 0 };
    const after = throwProjectile(state, 200, -100);
    expect(after.projectiles.length).toBe(0);
    expect(after.knifeAmmo).toBe(3); // unchanged
  });

  test("can throw exactly 3 times then stops", () => {
    let state = createInitialState();
    state = { ...state, enemiesEnabled: true, countdownTicks: 0 };
    state = throwProjectile(state, 200, -100);
    state = throwProjectile(state, 200, -100);
    state = throwProjectile(state, 200, -100);
    expect(state.knifeAmmo).toBe(0);
    expect(state.projectiles.length).toBe(3);

    // 4th throw fails
    const after = throwProjectile(state, 200, -100);
    expect(after.projectiles.length).toBe(3);
  });
});
