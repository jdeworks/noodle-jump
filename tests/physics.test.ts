import { describe, test, expect } from "vitest";
import { checkPlatformCollisions } from "../src/systems/Physics";
import { createPlayer } from "../src/entities/Player";
import { createPlatform } from "../src/entities/Platform";
import { PLAYER_JUMP_VELOCITY } from "../src/config/constants";

describe("Physics — platform collision", () => {
  test("player landing on platform triggers jump", () => {
    const platform = createPlatform(90, 300);
    const player = { ...createPlayer(100, 262), vy: 5 };
    const previousY = 255;

    const result = checkPlatformCollisions(player, [platform], previousY);
    expect(result.player.vy).toBe(PLAYER_JUMP_VELOCITY);
    expect(result.player.y).toBe(300 - player.height);
  });

  test("does not collide when moving upward", () => {
    const platform = createPlatform(90, 300);
    const player = { ...createPlayer(100, 295), vy: -5 };
    const previousY = 300;

    const result = checkPlatformCollisions(player, [platform], previousY);
    expect(result.player.vy).toBe(-5);
  });

  test("does not collide when horizontally apart", () => {
    const platform = createPlatform(0, 300);
    const player = { ...createPlayer(350, 262), vy: 5 };
    const previousY = 255;

    const result = checkPlatformCollisions(player, [platform], previousY);
    expect(result.player.vy).toBe(5);
  });

  test("collides with first matching platform only", () => {
    const p1 = createPlatform(90, 300);
    const p2 = createPlatform(90, 305);
    const player = { ...createPlayer(100, 262), vy: 5 };
    const previousY = 255;

    const result = checkPlatformCollisions(player, [p1, p2], previousY);
    expect(result.player.y).toBe(300 - player.height);
  });

  test("breaking platform bounces player then marks broken", () => {
    const platform = createPlatform(90, 300, "breaking");
    const player = { ...createPlayer(100, 262), vy: 5 };
    const previousY = 255;

    const result = checkPlatformCollisions(player, [platform], previousY);
    expect(result.player.vy).toBe(PLAYER_JUMP_VELOCITY);
    expect(result.platforms[0].broken).toBe(true);
  });

  test("broken platform is skipped", () => {
    const platform = { ...createPlatform(90, 300, "breaking"), broken: true };
    const player = { ...createPlayer(100, 262), vy: 5 };
    const previousY = 255;

    const result = checkPlatformCollisions(player, [platform], previousY);
    expect(result.player.vy).toBe(5);
  });

  test("brittle platform is instant fall-through and destroyed on contact", () => {
    const platform = createPlatform(90, 300, "brittle");
    const player = { ...createPlayer(100, 262), vy: 5 };
    const previousY = 255;

    const result = checkPlatformCollisions(player, [platform], previousY);
    expect(result.player.vy).toBe(5); // falls right through
    expect(result.platforms[0].broken).toBe(true); // visually destroyed
  });

  test("allBreaking flag makes static platforms bounce once then break", () => {
    const platform = createPlatform(90, 300, "static");
    const player = { ...createPlayer(100, 262), vy: 5 };
    const previousY = player.y - 5;

    const result = checkPlatformCollisions(player, [platform], previousY, true);
    expect(result.player.vy).toBe(PLAYER_JUMP_VELOCITY); // bounces
    expect(result.platforms[0].broken).toBe(true); // then breaks
  });

  test("allBreaking does not affect moving platforms", () => {
    const platform = createPlatform(90, 300, "moving");
    const player = { ...createPlayer(100, 262), vy: 5 };
    const previousY = player.y - 5;

    const result = checkPlatformCollisions(player, [platform], previousY, true);
    // Moving platforms still bounce normally
    expect(result.player.vy).toBe(PLAYER_JUMP_VELOCITY);
  });
});
