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
import { WIND_GUST_DURATION } from "../src/config/constants";

describe("Wind system", () => {
  test("createWindSystem starts with no gust", () => {
    const system = createWindSystem();
    expect(system.activeGust).toBeNull();
    expect(system.ticksSinceLastGust).toBe(0);
  });

  test("tickWind increments counter without gust", () => {
    const system = createWindSystem();
    const ticked = tickWind(system);
    expect(ticked.ticksSinceLastGust).toBe(1);
    expect(ticked.activeGust).toBeNull();
  });

  test("active gust decrements remaining ticks", () => {
    const system = {
      activeGust: { direction: 1 as const, strength: 2, ticksRemaining: 10 },
      ticksSinceLastGust: 0,
    };
    const ticked = tickWind(system);
    expect(ticked.activeGust!.ticksRemaining).toBe(9);
  });

  test("gust ends when ticks reach 0", () => {
    const system = {
      activeGust: { direction: 1 as const, strength: 2, ticksRemaining: 1 },
      ticksSinceLastGust: 0,
    };
    const ticked = tickWind(system);
    expect(ticked.activeGust).toBeNull();
  });

  test("applyWindForce pushes player", () => {
    const player = createPlayer(100, 200);
    const gust = { direction: 1 as const, strength: 2.5, ticksRemaining: 50 };
    const result = applyWindForce(player, gust);
    expect(result.x).toBeGreaterThan(100);
  });

  test("applyWindForce pushes left for negative direction", () => {
    const player = createPlayer(100, 200);
    const gust = { direction: -1 as const, strength: 2.5, ticksRemaining: 50 };
    const result = applyWindForce(player, gust);
    expect(result.x).toBeLessThan(100);
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
