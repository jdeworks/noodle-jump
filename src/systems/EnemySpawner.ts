/** Enemy spawning — pure logic, zone-aware. */

import { random } from "./RNG";
import {
  ENEMY_SPAWN_INTERVAL,
  ENEMY_SPAWN_CHANCE,
  ENEMY_SPAWN_MIN_PLATFORMS,
  GAME_WIDTH,
  ENEMY_SIZE,
} from "../config/constants";
import {
  createEnemy,
  getEnemyTypesForZone,
  type EnemyState,
} from "../entities/Enemy";

export interface SpawnerState {
  ticksSinceLastSpawn: number;
}

export function createSpawnerState(): SpawnerState {
  return { ticksSinceLastSpawn: 0 };
}

/**
 * Try to spawn an enemy. Returns a new enemy or null.
 * Enemies spawn at the camera's top edge, moving horizontally.
 */
export function trySpawnEnemy(
  spawner: SpawnerState,
  zone: number,
  cameraY: number,
  platformsPassed: number,
  spawnMultiplier = 1.0,
): { spawner: SpawnerState; enemy: EnemyState | null } {
  const ticks = spawner.ticksSinceLastSpawn + 1;

  if (platformsPassed < ENEMY_SPAWN_MIN_PLATFORMS) {
    return { spawner: { ticksSinceLastSpawn: ticks }, enemy: null };
  }

  // spawnMultiplier < 1 = faster spawns (0.1 = 10x faster)
  const adjustedInterval = Math.max(1, Math.ceil(ENEMY_SPAWN_INTERVAL * spawnMultiplier));
  if (ticks < adjustedInterval) {
    return { spawner: { ticksSinceLastSpawn: ticks }, enemy: null };
  }

  if (random() > ENEMY_SPAWN_CHANCE) {
    return { spawner: { ticksSinceLastSpawn: 0 }, enemy: null };
  }

  const types = getEnemyTypesForZone(zone);
  const type = types[Math.floor(random() * types.length)];
  const x = random() * (GAME_WIDTH - ENEMY_SIZE);
  const y = cameraY - 20; // just above screen
  const movingRight = random() > 0.5;

  return {
    spawner: { ticksSinceLastSpawn: 0 },
    enemy: createEnemy(x, y, type, movingRight),
  };
}
