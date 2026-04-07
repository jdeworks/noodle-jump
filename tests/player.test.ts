import { describe, test, expect } from "vitest";
import { createPlayer, updatePlayer, playerJump } from "../src/entities/Player";
import { GRAVITY, GAME_WIDTH, PLAYER_MAX_HORIZONTAL_SPEED } from "../src/config/constants";

describe("Player", () => {
  test("creates player at given position", () => {
    const p = createPlayer(100, 200);
    expect(p.x).toBe(100);
    expect(p.y).toBe(200);
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
  });

  test("gravity increases downward velocity each tick", () => {
    const p = createPlayer(100, 200);
    const p2 = updatePlayer(p, 0);
    expect(p2.vy).toBeCloseTo(GRAVITY);
    expect(p2.y).toBeCloseTo(200 + GRAVITY);
  });

  test("horizontal input moves player", () => {
    const p = createPlayer(100, 200);
    const right = updatePlayer(p, 1);
    expect(right.vx).toBe(PLAYER_MAX_HORIZONTAL_SPEED);
    expect(right.x).toBeGreaterThan(100);

    const left = updatePlayer(p, -1);
    expect(left.vx).toBe(-PLAYER_MAX_HORIZONTAL_SPEED);
    expect(left.x).toBeLessThan(100);
  });

  test("wraps around left edge", () => {
    const p = createPlayer(-40, 200); // past left edge (width=32)
    const p2 = updatePlayer(p, 0);
    expect(p2.x).toBe(GAME_WIDTH);
  });

  test("wraps around right edge", () => {
    const p = createPlayer(GAME_WIDTH + 1, 200);
    const p2 = updatePlayer(p, 0);
    expect(p2.x).toBe(-p.width);
  });

  test("jump sets negative vertical velocity", () => {
    const p = createPlayer(100, 200);
    const jumped = playerJump(p);
    expect(jumped.vy).toBeLessThan(0);
    expect(jumped.isJumping).toBe(true);
  });

  test("custom jump velocity", () => {
    const p = createPlayer(100, 200);
    const jumped = playerJump(p, -20);
    expect(jumped.vy).toBe(-20);
  });
});
