import { describe, test, expect } from "vitest";
import {
  createWindSystem,
  tickWind,
  applyWindForce,
  createLava,
  tickLava,
  isPlayerInLava,
} from "../src/systems/Hazards";
import { createPlayer } from "../src/entities/Player";

describe("Wind system", () => {
  test("createWindSystem starts with no zones", () => {
    const system = createWindSystem();
    expect(system.zones).toEqual([]);
  });

  test("tickWind spawns zones ahead of camera", () => {
    const system = createWindSystem();
    // Camera at Y=-3000 should trigger zone spawning
    const ticked = tickWind(system, -3000);
    expect(ticked.zones.length).toBeGreaterThan(0);
  });

  test("applyWindForce pushes player inside zone", () => {
    const player = createPlayer(100, 200);
    const zones = [{ direction: 1 as const, strength: 2.5, y: 150, height: 300 }];
    const result = applyWindForce(player, zones);
    expect(result.x).toBeGreaterThan(100);
  });

  test("applyWindForce pushes left for negative direction", () => {
    const player = createPlayer(100, 200);
    const zones = [{ direction: -1 as const, strength: 2.5, y: 150, height: 300 }];
    const result = applyWindForce(player, zones);
    expect(result.x).toBeLessThan(100);
  });

  test("applyWindForce does not affect player outside zone", () => {
    const player = createPlayer(100, 200);
    const zones = [{ direction: 1 as const, strength: 2.5, y: 500, height: 100 }];
    const result = applyWindForce(player, zones);
    expect(result.x).toBe(100);
  });
});

describe("Lava", () => {
  test("createLava starts below the player", () => {
    const lava = createLava(100);
    expect(lava.y).toBeGreaterThan(100);
    expect(lava.active).toBe(true);
  });

  test("tickLava raises the lava", () => {
    const lava = createLava(100);
    const ticked = tickLava(lava);
    expect(ticked.y).toBeLessThan(lava.y);
  });

  test("tickLava does nothing when inactive", () => {
    const lava = { ...createLava(100), active: false };
    const ticked = tickLava(lava);
    expect(ticked.y).toBe(lava.y);
  });

  test("isPlayerInLava detects submersion", () => {
    const lava = { y: 300, speed: 1, active: true };
    // Player bottom at 280 + 40 = 320 > 300
    expect(isPlayerInLava(280, 40, lava)).toBe(true);
    // Player bottom at 240 + 40 = 280 < 300
    expect(isPlayerInLava(240, 40, lava)).toBe(false);
  });

  test("isPlayerInLava ignores inactive lava", () => {
    const lava = { y: 300, speed: 1, active: false };
    expect(isPlayerInLava(280, 40, lava)).toBe(false);
  });
});
