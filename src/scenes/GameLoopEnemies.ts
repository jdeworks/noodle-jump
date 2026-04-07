/** Enemy and hazard tick logic extracted from GameLoop. */

import type { GameWorldState } from "./GameState";
import type { GameEvent } from "./GameLoopTypes";
import {
  updateEnemies,
  pruneEnemies,
  checkEnemyPlayerCollision,
  killEnemy,
} from "../entities/Enemy";
import { updateProjectiles, checkProjectileEnemyCollisions } from "../entities/Projectile";
import { createMeatball } from "../entities/Collectible";
import { trySpawnEnemy } from "../systems/EnemySpawner";
import { tickWind, applyWindForce } from "../systems/Hazards";
import { tryShieldAbsorb } from "../systems/PowerUpEffects";
import { GAME_HEIGHT } from "../config/constants";

/** Tick enemies, projectiles, wind, and enemy-player interactions. */
export function tickEnemies(s: GameWorldState, events: GameEvent[]): GameWorldState {
  if (!s.enemiesEnabled) return s;
  if (s.inBossFight) {
    // During boss fights: still tick projectiles (knives need to fly), skip enemies/wind
    s = {
      ...s,
      projectiles: updateProjectiles(s.projectiles, s.gameSpeedScale),
    };
    return s;
  }

  // Spawn enemies
  const spawnResult = trySpawnEnemy(
    s.enemySpawner,
    s.zoneState.currentZone,
    s.camera.y,
    s.platformsPassed,
    s.debugConfig.enemySpawnMultiplier,
    s.gameSpeedScale,
  );
  s = { ...s, enemySpawner: spawnResult.spawner };
  if (spawnResult.enemy) {
    s = { ...s, enemies: [...s.enemies, spawnResult.enemy] };
  }

  // Update enemies
  s = { ...s, enemies: updateEnemies(s.enemies, s.gameSpeedScale) };

  // Update projectiles
  s = { ...s, projectiles: updateProjectiles(s.projectiles, s.gameSpeedScale) };

  // Projectile-enemy collisions — killed enemies become meatballs
  if (s.projectiles.length > 0 && s.enemies.length > 0) {
    const projResult = checkProjectileEnemyCollisions(s.projectiles, s.enemies);
    s = {
      ...s,
      projectiles: projResult.projectiles,
      enemiesKilled: s.enemiesKilled + projResult.hitEnemyIds.length,
    };
    for (const enemyId of projResult.hitEnemyIds) {
      const enemy = s.enemies.find((e) => e.id === enemyId);
      if (enemy) {
        events.push({
          type: "enemyKilled",
          enemyId,
          x: enemy.x + enemy.width / 2,
          y: enemy.y,
        });
        // Convert dead enemy to meatball
        const fakePlatform = {
          x: enemy.x,
          y: enemy.y,
          width: enemy.width,
          height: enemy.height,
          type: "static" as const,
          broken: false,
          id: -enemyId, // negative ID to avoid collision
          originX: enemy.x,
          moveDirection: 0,
        };
        const meatball = createMeatball(fakePlatform);
        s = {
          ...s,
          meatballs: [...s.meatballs, meatball],
        };
      }
      s = { ...s, enemies: killEnemy(s.enemies, enemyId) };
    }
  }

  // Enemy-player collision
  const hitEnemy = checkEnemyPlayerCollision(
    s.player.x,
    s.player.y,
    s.player.width,
    s.player.height,
    s.enemies,
  );
  if (hitEnemy) {
    // Shield absorbs hit
    if (s.activeEffect?.type === "pasta_shield") {
      const shield = tryShieldAbsorb(s.activeEffect);
      s = {
        ...s,
        activeEffect: shield.effect,
        enemies: killEnemy(s.enemies, hitEnemy.id),
      };
    } else if (!s.practiceMode && !s.debugConfig.invincible) {
      // Player dies
      events.push({ type: "enemyHitPlayer" });
      s = {
        ...s,
        isDying: true,
        squashTicks: 0,
        pendingJumpVy: 0,
        ghostDeathHeight: s.ghostDeathHeight || s.scoreState.height,
      };
      if (!s.isGhost) events.push({ type: "died" });
    }
  }

  // Prune enemies below camera
  s = {
    ...s,
    enemies: pruneEnemies(s.enemies, s.camera.y + GAME_HEIGHT + 400),
  };

  // Wind zones — persistent spatial areas (disabled during boss fights)
  if (!s.inBossFight) {
    const windResult = tickWind(s.windSystem, s.camera.y);
    s = { ...s, windSystem: windResult };
    if (windResult.zones.length > 0 && !s.isDying) {
      s = {
        ...s,
        player: applyWindForce(s.player, windResult.zones, s.gameSpeedScale),
      };
    }
  }

  return s;
}
