import { describe, test, expect, beforeEach } from "vitest";
import {
  createProjectile,
  updateProjectiles,
  checkProjectileEnemyCollisions,
  resetProjectileIds,
} from "../src/entities/Projectile";
import { createEnemy, resetEnemyIds } from "../src/entities/Enemy";

beforeEach(() => {
  resetProjectileIds();
  resetEnemyIds();
});

describe("Projectile", () => {
  test("createProjectile aims toward target", () => {
    // Target directly above player
    const proj = createProjectile(100, 200, 100, 100);
    expect(proj.vx).toBeCloseTo(0, 1);
    expect(proj.vy).toBeLessThan(0); // moving upward
  });

  test("createProjectile aims toward target to the right", () => {
    const proj = createProjectile(100, 200, 200, 200);
    expect(proj.vx).toBeGreaterThan(0);
    expect(proj.vy).toBeCloseTo(0, 1);
  });

  test("updateProjectiles moves and decrements lifetime", () => {
    const projs = [createProjectile(100, 200, 100, 100)];
    const updated = updateProjectiles(projs);
    expect(updated[0].y).toBeLessThan(200);
    expect(updated[0].life).toBe(projs[0].life - 1);
  });

  test("updateProjectiles removes expired projectiles", () => {
    const proj = { ...createProjectile(100, 200, 100, 100), life: 1 };
    const updated = updateProjectiles([proj]);
    expect(updated).toHaveLength(0);
  });

  test("checkProjectileEnemyCollisions detects hit", () => {
    const proj = createProjectile(100, 200, 100, 200); // stationary
    // Place enemy right on the projectile
    const enemy = createEnemy(95, 195, "rat", true);
    const result = checkProjectileEnemyCollisions([proj], [enemy]);
    expect(result.hitEnemyIds).toContain(enemy.id);
    expect(result.projectiles).toHaveLength(0); // consumed
  });

  test("checkProjectileEnemyCollisions misses non-overlap", () => {
    const proj = createProjectile(100, 200, 100, 100);
    const enemy = createEnemy(300, 300, "rat", true);
    const result = checkProjectileEnemyCollisions([proj], [enemy]);
    expect(result.hitEnemyIds).toHaveLength(0);
    expect(result.projectiles).toHaveLength(1);
  });

  test("checkProjectileEnemyCollisions ignores dead enemies", () => {
    const proj = createProjectile(100, 200, 100, 200);
    const enemy = { ...createEnemy(95, 195, "rat", true), alive: false };
    const result = checkProjectileEnemyCollisions([proj], [enemy]);
    expect(result.hitEnemyIds).toHaveLength(0);
  });
});
