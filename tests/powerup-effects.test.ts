import { describe, test, expect } from "vitest";
import {
  tryShieldAbsorb,
  hasShield,
  drillBreakPlatforms,
  applyGnocchiBounce,
  hasGnocchiBounce,
  createMinestroneFlood,
  tickMinestroneFlood,
  isPlayerInFlood,
  stopMinestroneFlood,
} from "../src/systems/PowerUpEffects";
import { createPlayer } from "../src/entities/Player";
import type { ActiveEffect } from "../src/entities/PowerUp";
import type { PlatformState } from "../src/entities/Platform";
import {
  GNOCCHI_BOUNCE_MULTIPLIER,
  PLAYER_JUMP_VELOCITY,
} from "../src/config/constants";

function makeEffect(type: string, ticks = 100): ActiveEffect {
  return { type: type as ActiveEffect["type"], ticksRemaining: ticks };
}

function makePlatform(overrides: Partial<PlatformState> = {}): PlatformState {
  return {
    x: 100,
    y: 300,
    width: 100,
    height: 15,
    type: "static",
    broken: false,
    id: 1,
    originX: 100,
    moveDirection: 1,
    ...overrides,
  };
}

describe("Pasta Shield", () => {
  test("tryShieldAbsorb consumes shield on negative hit", () => {
    const effect = makeEffect("pasta_shield");
    const result = tryShieldAbsorb(effect);
    expect(result.absorbed).toBe(true);
    expect(result.effect).toBeNull();
  });

  test("tryShieldAbsorb does nothing without shield", () => {
    const effect = makeEffect("fusilli_tornado");
    const result = tryShieldAbsorb(effect);
    expect(result.absorbed).toBe(false);
    expect(result.effect).toBe(effect);
  });

  test("tryShieldAbsorb does nothing with null effect", () => {
    const result = tryShieldAbsorb(null);
    expect(result.absorbed).toBe(false);
    expect(result.effect).toBeNull();
  });

  test("hasShield returns true for shield effect", () => {
    expect(hasShield(makeEffect("pasta_shield"))).toBe(true);
    expect(hasShield(makeEffect("fusilli_tornado"))).toBe(false);
    expect(hasShield(null)).toBe(false);
  });
});

describe("Rigatoni Drill", () => {
  test("breaks platforms the player passes through", () => {
    const player = { ...createPlayer(120, 298), width: 32, height: 40 };
    const platforms = [
      makePlatform({ id: 1, x: 100, y: 300, width: 100 }),
      makePlatform({ id: 2, x: 300, y: 300, width: 100 }), // not overlapping
    ];
    const result = drillBreakPlatforms(player, platforms);
    expect(result.brokenIds).toContain(1);
    expect(result.brokenIds).not.toContain(2);
    expect(result.platforms[0].broken).toBe(true);
    expect(result.platforms[1].broken).toBe(false);
  });

  test("does not break already broken platforms", () => {
    const player = { ...createPlayer(120, 298), width: 32, height: 40 };
    const platforms = [
      makePlatform({ id: 1, x: 100, y: 300, broken: true }),
    ];
    const result = drillBreakPlatforms(player, platforms);
    expect(result.brokenIds).toHaveLength(0);
  });

  test("does not break lasagna platforms", () => {
    const player = { ...createPlayer(120, 298), width: 32, height: 40 };
    const platforms = [
      makePlatform({ id: 1, x: 100, y: 300, type: "lasagna" }),
    ];
    const result = drillBreakPlatforms(player, platforms);
    expect(result.brokenIds).toHaveLength(0);
  });

  test("does not break breaking platforms (drill safety)", () => {
    const player = { ...createPlayer(120, 298), width: 32, height: 40 };
    const platforms = [
      makePlatform({ id: 1, x: 100, y: 300, type: "breaking" }),
    ];
    const result = drillBreakPlatforms(player, platforms);
    expect(result.brokenIds).toHaveLength(0);
    expect(result.platforms[0].broken).toBe(false);
  });

  test("does not break brittle platforms (drill safety)", () => {
    const player = { ...createPlayer(120, 298), width: 32, height: 40 };
    const platforms = [
      makePlatform({ id: 1, x: 100, y: 300, type: "brittle" }),
    ];
    const result = drillBreakPlatforms(player, platforms);
    expect(result.brokenIds).toHaveLength(0);
    expect(result.platforms[0].broken).toBe(false);
  });
});

describe("Gnocchi Bounce", () => {
  test("multiplies jump velocity", () => {
    const result = applyGnocchiBounce(PLAYER_JUMP_VELOCITY);
    expect(result).toBe(PLAYER_JUMP_VELOCITY * GNOCCHI_BOUNCE_MULTIPLIER);
  });

  test("result is more negative than input (higher jump)", () => {
    const result = applyGnocchiBounce(PLAYER_JUMP_VELOCITY);
    expect(result).toBeLessThan(PLAYER_JUMP_VELOCITY);
  });

  test("hasGnocchiBounce detects correctly", () => {
    expect(hasGnocchiBounce(makeEffect("gnocchi_bounce"))).toBe(true);
    expect(hasGnocchiBounce(makeEffect("pasta_shield"))).toBe(false);
    expect(hasGnocchiBounce(null)).toBe(false);
  });
});

describe("Minestrone Soup", () => {
  test("createMinestroneFlood starts below player", () => {
    const flood = createMinestroneFlood(100);
    expect(flood.floodY).toBeGreaterThan(100);
    expect(flood.active).toBe(true);
  });

  test("tickMinestroneFlood raises the flood", () => {
    const flood = createMinestroneFlood(100);
    const ticked = tickMinestroneFlood(flood);
    expect(ticked.floodY).toBeLessThan(flood.floodY);
  });

  test("isPlayerInFlood detects when player is submerged", () => {
    const flood = { floodY: 100, riseSpeed: 1, active: true };
    // Player at y=90 with height 40 means bottom at 130 > floodY 100
    expect(isPlayerInFlood(90, 40, flood)).toBe(true);
    // Player at y=50 with height 40 means bottom at 90 < floodY 100
    expect(isPlayerInFlood(50, 40, flood)).toBe(false);
  });

  test("inactive flood never detects player", () => {
    const flood = { floodY: 100, riseSpeed: 1, active: false };
    expect(isPlayerInFlood(90, 40, flood)).toBe(false);
  });

  test("stopMinestroneFlood deactivates", () => {
    const flood = createMinestroneFlood(100);
    const stopped = stopMinestroneFlood(flood);
    expect(stopped.active).toBe(false);
  });

  test("tick does nothing when inactive", () => {
    const flood = { floodY: 100, riseSpeed: 1, active: false };
    const ticked = tickMinestroneFlood(flood);
    expect(ticked.floodY).toBe(100); // unchanged
  });
});
