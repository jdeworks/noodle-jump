/** Enemy entity — pure logic, no PixiJS. */

import {
  ENEMY_SIZE,
  ENEMY_SPEED,
  GAME_WIDTH,
} from "../config/constants";

export type EnemyType = "rat" | "fish" | "alien";

/** Zone-to-enemy mapping. */
const ZONE_ENEMIES: EnemyType[][] = [
  ["rat"],          // Zone 1: Kitchen
  ["fish"],         // Zone 2: Ocean
  ["alien"],        // Zone 3: Space
  ["rat"],          // Zone 4: Freezer (ice rats)
  ["rat", "fish"],  // Zone 5: Volcano (fire creatures)
  ["fish"],         // Zone 6: Candy (candy fish)
  ["rat", "fish", "alien"], // Zone 7: Final Kitchen (all)
];

export interface EnemyState {
  x: number;
  y: number;
  width: number;
  height: number;
  type: EnemyType;
  vx: number;
  vy: number;
  id: number;
  alive: boolean;
}

let nextEnemyId = 0;

/** Get enemy types available for a zone. */
export function getEnemyTypesForZone(zone: number): EnemyType[] {
  return ZONE_ENEMIES[Math.min(zone, ZONE_ENEMIES.length - 1)];
}

/** Create an enemy at the given position. */
export function createEnemy(
  x: number,
  y: number,
  type: EnemyType,
  movingRight: boolean,
): EnemyState {
  return {
    x,
    y,
    width: ENEMY_SIZE,
    height: ENEMY_SIZE,
    type,
    vx: (movingRight ? 1 : -1) * ENEMY_SPEED,
    vy: 0,
    id: nextEnemyId++,
    alive: true,
  };
}

/** Update all enemies — move horizontally, bounce off walls. */
export function updateEnemies(enemies: EnemyState[]): EnemyState[] {
  return enemies.map((e) => {
    if (!e.alive) return e;

    let { x, vx } = e;
    x += vx;

    // Bounce off screen edges
    if (x + e.width > GAME_WIDTH) {
      x = GAME_WIDTH - e.width;
      vx = -Math.abs(vx);
    } else if (x < 0) {
      x = 0;
      vx = Math.abs(vx);
    }

    return { ...e, x, vx };
  });
}

/** Remove enemies far below the camera. */
export function pruneEnemies(
  enemies: EnemyState[],
  threshold: number,
): EnemyState[] {
  return enemies.filter((e) => e.y < threshold);
}

/** Check if player collides with any alive enemy. Returns the enemy hit (or null). */
export function checkEnemyPlayerCollision(
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number,
  enemies: EnemyState[],
): EnemyState | null {
  const pad = 4;
  for (const e of enemies) {
    if (!e.alive) continue;
    const overlapX =
      playerX + playerW - pad > e.x && playerX + pad < e.x + e.width;
    const overlapY =
      playerY + playerH - pad > e.y && playerY + pad < e.y + e.height;
    if (overlapX && overlapY) return e;
  }
  return null;
}

/** Mark an enemy as dead. */
export function killEnemy(
  enemies: EnemyState[],
  enemyId: number,
): EnemyState[] {
  return enemies.map((e) =>
    e.id === enemyId ? { ...e, alive: false } : e,
  );
}

export function resetEnemyIds(): void {
  nextEnemyId = 0;
}
