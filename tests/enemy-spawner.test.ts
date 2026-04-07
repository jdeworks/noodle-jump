import { describe, test, expect } from "vitest";
import { createSpawnerState, trySpawnEnemy } from "../src/systems/EnemySpawner";
import { ENEMY_SPAWN_INTERVAL, ENEMY_SPAWN_MIN_PLATFORMS } from "../src/config/constants";

describe("EnemySpawner", () => {
  test("createSpawnerState starts at zero", () => {
    const s = createSpawnerState();
    expect(s.ticksSinceLastSpawn).toBe(0);
  });

  test("does not spawn before min platforms", () => {
    let spawner = createSpawnerState();
    spawner = { ticksSinceLastSpawn: ENEMY_SPAWN_INTERVAL + 1 };
    const result = trySpawnEnemy(spawner, 0, -500, 5); // only 5 platforms
    expect(result.enemy).toBeNull();
  });

  test("does not spawn before interval elapsed", () => {
    const spawner = createSpawnerState();
    const result = trySpawnEnemy(spawner, 0, -500, ENEMY_SPAWN_MIN_PLATFORMS + 10);
    expect(result.enemy).toBeNull();
    expect(result.spawner.ticksSinceLastSpawn).toBe(1);
  });

  test("eventually spawns after enough ticks", () => {
    let spawner = createSpawnerState();
    let spawned = false;
    for (let i = 0; i < 2000; i++) {
      const result = trySpawnEnemy(spawner, 0, -500, ENEMY_SPAWN_MIN_PLATFORMS + 10);
      spawner = result.spawner;
      if (result.enemy) {
        spawned = true;
        expect(result.enemy.alive).toBe(true);
        break;
      }
    }
    expect(spawned).toBe(true);
  });
});
