/** Projectile entity (thrown knife) — pure logic, no PixiJS. */

import { PROJECTILE_SPEED, PROJECTILE_SIZE, PROJECTILE_LIFETIME } from "../config/constants";
import type { EnemyState } from "./Enemy";

export interface ProjectileState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  id: number;
  alive: boolean;
}

let nextProjectileId = 0;

/**
 * Create a projectile from the player toward a target position.
 * @param playerX Player center X (world coords)
 * @param playerY Player center Y (world coords)
 * @param targetX Click/tap X (world coords)
 * @param targetY Click/tap Y (world coords)
 */
export function createProjectile(
  playerX: number,
  playerY: number,
  targetX: number,
  targetY: number,
): ProjectileState {
  const dx = targetX - playerX;
  const dy = targetY - playerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dist > 0 ? dx / dist : 0;
  const ny = dist > 0 ? dy / dist : -1;

  return {
    x: playerX,
    y: playerY,
    vx: nx * PROJECTILE_SPEED,
    vy: ny * PROJECTILE_SPEED,
    size: PROJECTILE_SIZE,
    life: PROJECTILE_LIFETIME,
    id: nextProjectileId++,
    alive: true,
  };
}

/** Update all projectiles — move and decrement lifetime. */
export function updateProjectiles(
  projectiles: ProjectileState[],
  speedScale = 1,
): ProjectileState[] {
  return projectiles
    .map((p) => {
      if (!p.alive) return p;
      return {
        ...p,
        x: p.x + p.vx * speedScale,
        y: p.y + p.vy * speedScale,
        life: p.life - speedScale,
        alive: p.life - speedScale > 0,
      };
    })
    .filter((p) => p.alive);
}

/**
 * Check projectile-enemy collisions.
 * Returns which enemies were hit and which projectiles were consumed.
 */
export function checkProjectileEnemyCollisions(
  projectiles: ProjectileState[],
  enemies: EnemyState[],
): {
  projectiles: ProjectileState[];
  hitEnemyIds: number[];
} {
  const hitEnemyIds: number[] = [];
  const consumedProjectileIds = new Set<number>();

  for (const proj of projectiles) {
    if (!proj.alive) continue;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (consumedProjectileIds.has(proj.id)) break;

      const overlapX =
        proj.x + proj.size / 2 > enemy.x && proj.x - proj.size / 2 < enemy.x + enemy.width;
      const overlapY =
        proj.y + proj.size / 2 > enemy.y && proj.y - proj.size / 2 < enemy.y + enemy.height;

      if (overlapX && overlapY) {
        hitEnemyIds.push(enemy.id);
        consumedProjectileIds.add(proj.id);
      }
    }
  }

  const updatedProjectiles = projectiles
    .map((p) => (consumedProjectileIds.has(p.id) ? { ...p, alive: false } : p))
    .filter((p) => p.alive);

  return { projectiles: updatedProjectiles, hitEnemyIds };
}

export function resetProjectileIds(): void {
  nextProjectileId = 0;
}
