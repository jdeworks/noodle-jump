/** Boss tick logic extracted from GameLoop. */

import type { GameWorldState } from "./GameState";
import type { GameEvent } from "./GameLoopTypes";
import {
  getBossForZone,
  getBossBehavior,
  checkProjectileBossCollision,
  damageBoss,
  applyTentacleAttack,
} from "../entities/Boss";
import { tryShieldAbsorb } from "../systems/PowerUpEffects";
import { GAME_HEIGHT } from "../config/constants";

const KNIFE_REGEN_TICKS = 90; // 1.5 seconds per knife

/** Spawn a boss on zone change if applicable. */
export function maybeSpawnBoss(
  s: GameWorldState,
  zoneChanged: boolean,
  events: GameEvent[],
): GameWorldState {
  if (!zoneChanged || s.activeBoss) return s;
  const bossType = getBossForZone(s.zoneState.currentZone);
  const behavior = bossType ? getBossBehavior(bossType) : undefined;
  if (!bossType || !behavior) return s;

  const boss = behavior.create(s.camera.y, s.platforms);
  events.push({ type: "bossSpawned", bossType });
  return { ...s, activeBoss: boss, inBossFight: true, bossAttacks: [] };
}

/** Tick boss behavior, attacks, and projectile interactions. */
export function tickBoss(
  s: GameWorldState,
  events: GameEvent[],
): GameWorldState {
  if (!s.activeBoss?.alive) return s;

  const behavior = getBossBehavior(s.activeBoss.type);
  if (!behavior) return s;

  const bossResult = behavior.tick(
    s.activeBoss, s.player, s.platforms, s.animTick,
  );
  s = { ...s, activeBoss: bossResult.boss };

  // Check contact damage (e.g. chef rival)
  if (behavior.checkPlayerContact(bossResult.boss, s.player)) {
    if (s.activeEffect?.type === "pasta_shield") {
      const shield = tryShieldAbsorb(s.activeEffect);
      s = { ...s, activeEffect: shield.effect };
    } else if (!s.isDying) {
      s = { ...s, isDying: true, squashTicks: 0, pendingJumpVy: 0 };
      events.push({ type: "died" });
    }
  }

  // Process attacks
  for (const atk of bossResult.attacks) {
    if (atk.type === "tentacle" && atk.targetPlatformId != null) {
      events.push({ type: "tentacleGrab", platformId: atk.targetPlatformId });
      events.push({ type: "bossAttack" });
      s = {
        ...s,
        platforms: s.platforms.map((p) =>
          p.id === atk.targetPlatformId ? applyTentacleAttack(p) : p,
        ),
      };
    } else if (atk.type === "projectile") {
      s = {
        ...s,
        bossAttacks: [
          ...s.bossAttacks,
          { x: atk.x, y: atk.y, vx: atk.vx, vy: atk.vy, alive: true },
        ],
      };
      events.push({ type: "bossAttack" });
    }
  }

  // Update boss attack projectiles
  s = {
    ...s,
    bossAttacks: s.bossAttacks
      .map((a) => ({
        ...a,
        x: a.x + a.vx,
        y: a.y + a.vy,
        alive: a.alive && a.y < s.camera.y + GAME_HEIGHT + 100,
      }))
      .filter((a) => a.alive),
  };

  // Boss attack projectiles hitting player
  for (const atk of s.bossAttacks) {
    if (!atk.alive) continue;
    const hitX = atk.x > s.player.x && atk.x < s.player.x + s.player.width;
    const hitY = atk.y > s.player.y && atk.y < s.player.y + s.player.height;
    if (hitX && hitY) {
      atk.alive = false;
      if (s.activeEffect?.type === "pasta_shield") {
        const shield = tryShieldAbsorb(s.activeEffect);
        s = { ...s, activeEffect: shield.effect };
      } else if (!s.isDying) {
        s = { ...s, isDying: true, squashTicks: 0, pendingJumpVy: 0 };
        events.push({ type: "died" });
      }
    }
  }

  // Player knives hitting boss
  for (const proj of s.projectiles) {
    if (!proj.alive || !s.activeBoss?.alive) continue;
    if (checkProjectileBossCollision(proj.x, proj.y, proj.size, s.activeBoss)) {
      proj.alive = false;
      const dmg = damageBoss(s.activeBoss);
      s = { ...s, activeBoss: dmg.boss };
      events.push({
        type: "bossDamaged",
        health: dmg.boss.health,
        maxHealth: dmg.boss.maxHealth,
      });
      if (dmg.killed) {
        s = { ...s, inBossFight: false, bossAttacks: [] };
        events.push({ type: "bossKilled", bossType: dmg.boss.type });
      }
    }
  }
  // Clean consumed projectiles
  s = { ...s, projectiles: s.projectiles.filter((p) => p.alive) };

  return s;
}

/** Regenerate knife ammo over time. */
export function tickKnifeAmmo(s: GameWorldState): GameWorldState {
  if (s.knifeAmmo >= s.knifeAmmoMax) return s;

  const regenTimer = s.knifeRegenTimer - 1;
  if (regenTimer <= 0) {
    return {
      ...s,
      knifeAmmo: s.knifeAmmo + 1,
      knifeRegenTimer: KNIFE_REGEN_TICKS,
    };
  }
  return { ...s, knifeRegenTimer: regenTimer };
}
