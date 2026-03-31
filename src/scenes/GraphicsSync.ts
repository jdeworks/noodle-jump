/** Graphics lifecycle — sync entity arrays with PixiJS Graphics maps. */

import { Container, Graphics } from "pixi.js";
import { drawPlatform, drawMeatball, drawMeatballVariant, drawPowerUp, drawEnemy, drawProjectile } from "../rendering/sprites";
import { COLORS } from "../config/constants";
import type { PlatformState } from "../entities/Platform";
import type { CollectibleState } from "../entities/Collectible";
import type { PowerUpState } from "../entities/PowerUp";
import type { EnemyState } from "../entities/Enemy";
import type { ProjectileState } from "../entities/Projectile";

export class GraphicsSync {
  readonly platformGfxMap = new Map<number, Graphics>();
  readonly meatballGfxMap = new Map<number, Graphics>();
  readonly powerUpGfxMap = new Map<number, Graphics>();
  readonly enemyGfxMap = new Map<number, Graphics>();
  readonly projectileGfxMap = new Map<number, Graphics>();

  syncPlatforms(platforms: PlatformState[], parent: Container): void {
    for (const platform of platforms) {
      if (this.platformGfxMap.has(platform.id)) continue;
      const gfx = new Graphics();
      drawPlatform(gfx, platform.width, platform.height, COLORS.platform[0]);
      parent.addChild(gfx);
      this.platformGfxMap.set(platform.id, gfx);
    }
  }

  syncMeatballs(meatballs: CollectibleState[], parent: Container): void {
    for (const meatball of meatballs) {
      if (this.meatballGfxMap.has(meatball.id)) continue;
      const gfx = new Graphics();
      if (meatball.variant && meatball.variant !== "meatball") {
        drawMeatballVariant(gfx, meatball.size, meatball.variant);
      } else {
        drawMeatball(gfx, meatball.size);
      }
      parent.addChild(gfx);
      this.meatballGfxMap.set(meatball.id, gfx);
    }
  }

  syncPowerUps(powerUps: PowerUpState[], parent: Container): void {
    for (const pu of powerUps) {
      if (this.powerUpGfxMap.has(pu.id)) continue;
      const gfx = new Graphics();
      const color = COLORS.powerups[pu.type] ?? 0xffffff;
      drawPowerUp(gfx, pu.size, color, pu.type);
      parent.addChild(gfx);
      this.powerUpGfxMap.set(pu.id, gfx);
    }
  }

  syncEnemies(enemies: EnemyState[], parent: Container): void {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (this.enemyGfxMap.has(enemy.id)) continue;
      const gfx = new Graphics();
      drawEnemy(gfx, enemy.width, enemy.type);
      parent.addChild(gfx);
      this.enemyGfxMap.set(enemy.id, gfx);
    }
  }

  syncProjectiles(projectiles: ProjectileState[], parent: Container): void {
    for (const proj of projectiles) {
      if (!proj.alive) continue;
      if (this.projectileGfxMap.has(proj.id)) continue;
      const gfx = new Graphics();
      drawProjectile(gfx, proj.size);
      parent.addChild(gfx);
      this.projectileGfxMap.set(proj.id, gfx);
    }
  }

  syncAll(
    platforms: PlatformState[],
    meatballs: CollectibleState[],
    powerUps: PowerUpState[],
    parent: Container,
    enemies?: EnemyState[],
    projectiles?: ProjectileState[],
  ): void {
    this.syncPlatforms(platforms, parent);
    this.syncMeatballs(meatballs, parent);
    this.syncPowerUps(powerUps, parent);
    if (enemies) this.syncEnemies(enemies, parent);
    if (projectiles) this.syncProjectiles(projectiles, parent);
  }

  /** Remove graphics for entities no longer in the active set. */
  cleanup(
    platforms: PlatformState[],
    meatballs: CollectibleState[],
    powerUps: PowerUpState[],
    enemies?: EnemyState[],
    projectiles?: ProjectileState[],
  ): void {
    cleanupMap(this.platformGfxMap, platforms.map((p) => p.id));
    cleanupMap(this.meatballGfxMap, meatballs.map((m) => m.id));
    cleanupMap(this.powerUpGfxMap, powerUps.map((pu) => pu.id));
    if (enemies) {
      cleanupMap(this.enemyGfxMap, enemies.filter((e) => e.alive).map((e) => e.id));
    }
    if (projectiles) {
      cleanupMap(this.projectileGfxMap, projectiles.filter((p) => p.alive).map((p) => p.id));
    }
  }

  destroy(): void {
    destroyMap(this.platformGfxMap);
    destroyMap(this.meatballGfxMap);
    destroyMap(this.powerUpGfxMap);
    destroyMap(this.enemyGfxMap);
    destroyMap(this.projectileGfxMap);
  }
}

function cleanupMap(map: Map<number, Graphics>, activeIds: number[]): void {
  const idSet = new Set(activeIds);
  for (const [id, gfx] of map) {
    if (!idSet.has(id)) {
      gfx.parent?.removeChild(gfx);
      gfx.destroy();
      map.delete(id);
    }
  }
}

function destroyMap(map: Map<number, Graphics>): void {
  for (const [, gfx] of map) {
    gfx.parent?.removeChild(gfx);
    gfx.destroy();
  }
  map.clear();
}
