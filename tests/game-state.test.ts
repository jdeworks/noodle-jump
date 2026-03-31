import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../src/scenes/GameState";
import { resetPlatformIds } from "../src/entities/Platform";
import { resetPowerUpIds } from "../src/entities/PowerUp";
import { resetCollectibleIds } from "../src/entities/Collectible";

beforeEach(() => {
  resetPlatformIds();
  resetPowerUpIds();
  resetCollectibleIds();
});

describe("createInitialState", () => {
  test("returns a valid initial state", () => {
    const state = createInitialState();

    expect(state.player).toBeDefined();
    expect(state.platforms.length).toBeGreaterThan(1); // ground + generated
    expect(state.camera).toBeDefined();
    expect(state.scoreState.points).toBe(0);
    expect(state.zoneState.currentZone).toBe(0);
    expect(state.gameOver).toBe(false);
    expect(state.isDying).toBe(false);
    expect(state.paused).toBe(false);
    expect(state.activeEffect).toBeNull();
    expect(state.animTick).toBe(0);
    expect(state.platformsPassed).toBe(0);
  });

  test("player starts above ground platform", () => {
    const state = createInitialState();
    const ground = state.platforms[0];
    expect(state.player.y).toBeLessThan(ground.y);
  });

  test("platforms include ground and generated platforms", () => {
    const state = createInitialState();
    // First platform should be full-width ground
    const ground = state.platforms[0];
    expect(ground.type).toBe("static");
    expect(ground.width).toBe(400); // GAME_WIDTH
    // Should have additional generated platforms
    expect(state.platforms.length).toBeGreaterThan(10);
  });

  test("generates meatballs and power-ups", () => {
    // Meatballs and power-ups are random, so just check arrays exist
    const state = createInitialState();
    expect(Array.isArray(state.meatballs)).toBe(true);
    expect(Array.isArray(state.powerUps)).toBe(true);
  });

  test("countdown starts inactive", () => {
    const state = createInitialState();
    expect(state.countdownTicks).toBe(-1);
  });

  test("two calls produce independent states", () => {
    const state1 = createInitialState();
    resetPlatformIds();
    resetPowerUpIds();
    resetCollectibleIds();
    const state2 = createInitialState();

    // Mutating one shouldn't affect the other
    state1.scoreState.points = 999;
    expect(state2.scoreState.points).toBe(0);
  });
});
