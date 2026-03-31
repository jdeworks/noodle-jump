import { describe, test, expect } from "vitest";
import {
  applyConveyorForce,
  applySpringBounce,
  applyIcePhysics,
  startCrumbleTimer,
  tickCrumbleTimer,
  applyWeightedTilt,
  applyWeightedSlide,
  resolveTeleport,
} from "../src/systems/PlatformEffects";
import { createPlayer } from "../src/entities/Player";
import type { PlatformState } from "../src/entities/Platform";
import { PLATFORM_CRUMBLE_TIMER_TICKS, PLAYER_JUMP_VELOCITY, PLATFORM_SPRING_VELOCITY_MULTIPLIER } from "../src/config/constants";

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

describe("applyConveyorForce", () => {
  test("pushes player right when conveyorDir is 1", () => {
    const player = createPlayer(100, 200);
    const platform = makePlatform({ type: "conveyor", conveyorDir: 1 });
    const result = applyConveyorForce(player, platform);
    expect(result.x).toBeGreaterThan(player.x);
  });

  test("pushes player left when conveyorDir is -1", () => {
    const player = createPlayer(100, 200);
    const platform = makePlatform({ type: "conveyor", conveyorDir: -1 });
    const result = applyConveyorForce(player, platform);
    expect(result.x).toBeLessThan(player.x);
  });
});

describe("applySpringBounce", () => {
  test("gives extra high jump velocity", () => {
    const player = createPlayer(100, 200);
    const result = applySpringBounce(player);
    expect(result.vy).toBe(PLAYER_JUMP_VELOCITY * PLATFORM_SPRING_VELOCITY_MULTIPLIER);
    expect(result.isJumping).toBe(true);
  });

  test("spring velocity is stronger than normal jump", () => {
    const player = createPlayer(100, 200);
    const result = applySpringBounce(player);
    expect(result.vy).toBeLessThan(PLAYER_JUMP_VELOCITY); // more negative = higher
  });
});

describe("applyIcePhysics", () => {
  test("preserves most horizontal velocity (low friction)", () => {
    const player = { ...createPlayer(100, 200), vx: 5 };
    const result = applyIcePhysics(player);
    expect(result.vx).toBeCloseTo(5 * (1 - 0.015), 2);
    expect(result.vx).toBeGreaterThan(4.9); // barely slows
  });
});

describe("crumble timer", () => {
  test("startCrumbleTimer sets timer", () => {
    const platform = makePlatform({ type: "crumbling" });
    const result = startCrumbleTimer(platform);
    expect(result.crumbleTimer).toBe(PLATFORM_CRUMBLE_TIMER_TICKS);
  });

  test("startCrumbleTimer does not reset existing timer", () => {
    const platform = makePlatform({ type: "crumbling", crumbleTimer: 10 });
    const result = startCrumbleTimer(platform);
    expect(result.crumbleTimer).toBe(10);
  });

  test("tickCrumbleTimer decrements", () => {
    const platform = makePlatform({ type: "crumbling", crumbleTimer: 50 });
    const result = tickCrumbleTimer(platform);
    expect(result.platform.crumbleTimer).toBe(49);
    expect(result.broke).toBe(false);
  });

  test("tickCrumbleTimer breaks platform at 0", () => {
    const platform = makePlatform({ type: "crumbling", crumbleTimer: 1 });
    const result = tickCrumbleTimer(platform);
    expect(result.platform.broken).toBe(true);
    expect(result.broke).toBe(true);
  });

  test("tickCrumbleTimer skips platforms without timer", () => {
    const platform = makePlatform({ type: "crumbling" });
    const result = tickCrumbleTimer(platform);
    expect(result.broke).toBe(false);
  });
});

describe("applyWeightedTilt", () => {
  test("tilts toward player position", () => {
    const platform = makePlatform({ type: "weighted", tiltAngle: 0, width: 100 });
    // Player on the right side
    const result = applyWeightedTilt(platform, 170, 32);
    expect(result.tiltAngle!).toBeGreaterThan(0); // tilts right
  });

  test("tilts left when player is on left side", () => {
    const platform = makePlatform({ type: "weighted", tiltAngle: 0, width: 100 });
    const result = applyWeightedTilt(platform, 80, 32);
    expect(result.tiltAngle!).toBeLessThan(0); // tilts left
  });
});

describe("applyWeightedSlide", () => {
  test("slides player based on tilt angle", () => {
    const player = createPlayer(150, 200);
    const platform = makePlatform({ type: "weighted", tiltAngle: 0.3 });
    const result = applyWeightedSlide(player, platform);
    expect(result.x).toBeGreaterThan(player.x); // slides right on positive tilt
  });
});

describe("resolveTeleport", () => {
  test("warps player to another teleport platform", () => {
    const player = createPlayer(100, 280);
    const landed = makePlatform({ type: "teleport", id: 1, y: 300 });
    const target = makePlatform({ type: "teleport", id: 2, y: 100, x: 200 });
    const platforms = [landed, target, makePlatform({ id: 3, y: 200 })];

    const result = resolveTeleport(player, landed, platforms);
    expect(result.targetPlatform).toBeDefined();
    expect(result.player.x).toBeCloseTo(200 + 50 - 16, 0); // centered on target
    expect(result.player.y).toBe(100 - player.height);
  });

  test("returns null target when no other teleport exists", () => {
    const player = createPlayer(100, 280);
    const landed = makePlatform({ type: "teleport", id: 1 });
    const platforms = [landed, makePlatform({ id: 2 })];

    const result = resolveTeleport(player, landed, platforms);
    expect(result.targetPlatform).toBeNull();
  });

  test("prefers upward teleport target", () => {
    const player = createPlayer(100, 280);
    const landed = makePlatform({ type: "teleport", id: 1, y: 300 });
    const above = makePlatform({ type: "teleport", id: 2, y: 100 });
    const below = makePlatform({ type: "teleport", id: 3, y: 400 });
    const platforms = [landed, above, below];

    const result = resolveTeleport(player, landed, platforms);
    expect(result.targetPlatform!.id).toBe(2);
  });
});
