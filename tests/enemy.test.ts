import { describe, test, expect, beforeEach } from "vitest";
import {
  createEnemy,
  updateEnemies,
  pruneEnemies,
  checkEnemyPlayerCollision,
  killEnemy,
  getEnemyTypesForZone,
  resetEnemyIds,
} from "../src/entities/Enemy";
import { GAME_WIDTH } from "../src/config/constants";

beforeEach(() => resetEnemyIds());

describe("Enemy entity", () => {
  test("createEnemy sets position and type", () => {
    const e = createEnemy(100, 200, "rat", true);
    expect(e.x).toBe(100);
    expect(e.y).toBe(200);
    expect(e.type).toBe("rat");
    expect(e.alive).toBe(true);
    expect(e.vx).toBeGreaterThan(0); // moving right
  });

  test("createEnemy moving left has negative vx", () => {
    const e = createEnemy(100, 200, "fish", false);
    expect(e.vx).toBeLessThan(0);
  });

  test("updateEnemies moves enemies", () => {
    const enemies = [createEnemy(100, 200, "rat", true)];
    const updated = updateEnemies(enemies);
    expect(updated[0].x).toBeGreaterThan(100);
  });

  test("updateEnemies bounces off right wall", () => {
    const e = createEnemy(GAME_WIDTH - 5, 200, "rat", true);
    const [updated] = updateEnemies([e]);
    expect(updated.vx).toBeLessThan(0); // reversed
  });

  test("updateEnemies bounces off left wall", () => {
    const e = createEnemy(1, 200, "rat", false);
    const [updated] = updateEnemies([e]);
    expect(updated.vx).toBeGreaterThan(0); // reversed
  });

  test("pruneEnemies removes below threshold", () => {
    const enemies = [
      createEnemy(100, 500, "rat", true),
      createEnemy(100, 100, "fish", true),
    ];
    const pruned = pruneEnemies(enemies, 300);
    expect(pruned).toHaveLength(1);
    expect(pruned[0].y).toBe(100);
  });

  test("checkEnemyPlayerCollision detects overlap", () => {
    const enemies = [createEnemy(100, 200, "rat", true)];
    // Player overlaps with shifted-up enemy hitbox
    const hit = checkEnemyPlayerCollision(105, 185, 32, 40, enemies);
    expect(hit).not.toBeNull();
  });

  test("checkEnemyPlayerCollision misses non-overlap", () => {
    const enemies = [createEnemy(300, 200, "rat", true)];
    const hit = checkEnemyPlayerCollision(10, 200, 32, 40, enemies);
    expect(hit).toBeNull();
  });

  test("checkEnemyPlayerCollision ignores dead enemies", () => {
    const enemies = [{ ...createEnemy(100, 200, "rat", true), alive: false }];
    const hit = checkEnemyPlayerCollision(105, 205, 32, 40, enemies);
    expect(hit).toBeNull();
  });

  test("killEnemy marks enemy as dead", () => {
    const enemies = [createEnemy(100, 200, "rat", true)];
    const id = enemies[0].id;
    const updated = killEnemy(enemies, id);
    expect(updated[0].alive).toBe(false);
  });

  test("getEnemyTypesForZone returns correct types", () => {
    expect(getEnemyTypesForZone(0)).toContain("rat");
    expect(getEnemyTypesForZone(1)).toContain("fish");
    expect(getEnemyTypesForZone(2)).toContain("alien");
  });
});
