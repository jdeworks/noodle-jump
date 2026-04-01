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
import { GAME_HEIGHT, GAME_WIDTH } from "../config/constants";

const KNIFE_REGEN_TICKS = 90; // 1.5 seconds per knife

const BOSS_GRACE_TICKS = 120; // 2 seconds of invulnerability after boss spawns

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

  // Lock camera around the player, but only if close to the current camera.
  // If the player overshot (e.g. via power-up), keep the current camera so
  // platforms in view aren't lost — the player will fall back into the arena.
  const distFromCamera = Math.abs(s.player.y - (s.camera.y + GAME_HEIGHT * 0.5));
  const lockedCameraY = distFromCamera < GAME_HEIGHT
    ? s.player.y - GAME_HEIGHT * 0.5
    : s.camera.y;
  const camera = { ...s.camera, y: lockedCameraY };

  // Spawn boss away from the player (opposite side of screen)
  const boss = behavior.create(lockedCameraY, s.platforms);
  const playerSide = s.player.x < GAME_WIDTH / 2 ? "left" : "right";
  const safeX = playerSide === "left"
    ? GAME_WIDTH - boss.width - 20
    : 20;
  const spawnedBoss = { ...boss, x: safeX, patternTick: 0 };

  // Convert arena power-ups to boss-safe types
  const BOSS_SAFE_TYPES = new Set(["pasta_shield", "meatball_magnet", "gnocchi_bounce"]);
  const BOSS_REPLACEMENTS = ["pasta_shield", "gnocchi_bounce", "meatball_magnet"];
  let replIdx = 0;
  const safePowerUps = s.powerUps.map((pu) => {
    if (pu.collected || BOSS_SAFE_TYPES.has(pu.type)) return pu;
    // Replace dangerous power-ups with safe alternatives
    const replacement = BOSS_REPLACEMENTS[replIdx % BOSS_REPLACEMENTS.length];
    replIdx++;
    return { ...pu, type: replacement } as typeof pu;
  });

  events.push({ type: "bossSpawned", bossType });
  return {
    ...s,
    camera,
    activeBoss: spawnedBoss,
    inBossFight: true,
    bossAttacks: [],
    powerUps: safePowerUps,
    // Cancel movement effects so player doesn't fly out of the arena, but keep shield
    activeEffect: s.activeEffect?.type === "pasta_shield" ? s.activeEffect : null,
    player: { ...s.player, vy: Math.max(s.player.vy, -10) },
  };
}

/** Tick boss behavior, attacks, and projectile interactions. */
export function tickBoss(
  s: GameWorldState,
  events: GameEvent[],
): GameWorldState {
  if (!s.activeBoss?.alive) return s;

  const behavior = getBossBehavior(s.activeBoss.type);
  if (!behavior) return s;

  // Break platforms outside the playable boss arena (50px inset from screen edges)
  const arenaTop = s.camera.y + 50;
  const arenaBottom = s.camera.y + GAME_HEIGHT - 50;
  s = {
    ...s,
    platforms: s.platforms.map((p) =>
      !p.broken && (p.y < arenaTop || p.y > arenaBottom)
        ? { ...p, broken: true }
        : p,
    ),
  };

  const boss = s.activeBoss!;
  const bossResult = behavior.tick(
    boss, s.player, s.platforms, s.animTick,
  );
  s = { ...s, activeBoss: bossResult.boss };

  // Check contact damage (e.g. chef rival) — skip during grace period
  const inGrace = bossResult.boss.patternTick <= BOSS_GRACE_TICKS;
  if (!inGrace && behavior.checkPlayerContact(bossResult.boss, s.player)) {
    if (s.activeEffect?.type === "pasta_shield") {
      const shield = tryShieldAbsorb(s.activeEffect);
      s = { ...s, activeEffect: shield.effect };
    } else if (!s.isDying) {
      s = { ...s, isDying: true, squashTicks: 0, pendingJumpVy: 0,
        ghostDeathHeight: s.ghostDeathHeight || s.scoreState.height };
      if (!s.isGhost) events.push({ type: "died" });
    }
  }

  // Tick pending tentacle grabs — apply damage when timer expires
  if (s.pendingTentacles.length > 0) {
    let platforms = s.platforms;
    const remaining = s.pendingTentacles
      .map((t) => ({ ...t, ticksLeft: t.ticksLeft - 1 }))
      .filter((t) => {
        if (t.ticksLeft <= 0) {
          // Timer expired — apply platform damage
          platforms = platforms.map((p) =>
            p.id === t.platformId ? applyTentacleAttack(p, t.side) : p,
          );
          events.push({ type: "platformCrumbled", platform: platforms.find((p) => p.id === t.platformId)! });
          return false;
        }
        return true;
      });
    s = { ...s, platforms, pendingTentacles: remaining };
  }

  // Process attacks (skip during grace period)
  for (const atk of inGrace ? [] : bossResult.attacks) {
    if (atk.type === "tentacle" && atk.targetPlatformId != null) {
      // Don't apply damage immediately — queue as pending tentacle
      const plat = s.platforms.find((p) => p.id === atk.targetPlatformId);
      if (plat) {
        const side: "left" | "right" = atk.x < plat.x + plat.width / 2 ? "left" : "right";
        // Tentacle gets faster over time: starts at 6 sec, min 2.5 sec
        const attackNum = s.activeBoss?.jumpCooldown ?? 0;
        const totalTicks = Math.max(150, 360 - attackNum * 20); // 6s → 2.5s
        s = {
          ...s,
          pendingTentacles: [
            ...s.pendingTentacles,
            { platformId: plat.id, x: atk.x, targetY: plat.y, ticksLeft: totalTicks, totalTicks, side },
          ],
        };
        events.push({ type: "tentacleGrab", platformId: plat.id });
        events.push({ type: "bossAttack" });
      }
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

  // Boss attack projectiles hitting player (skip during grace)
  for (const atk of inGrace ? [] : s.bossAttacks) {
    if (!atk.alive) continue;
    const hitX = atk.x > s.player.x && atk.x < s.player.x + s.player.width;
    const hitY = atk.y > s.player.y && atk.y < s.player.y + s.player.height;
    if (hitX && hitY) {
      atk.alive = false;
      if (s.activeEffect?.type === "pasta_shield") {
        const shield = tryShieldAbsorb(s.activeEffect);
        s = { ...s, activeEffect: shield.effect };
      } else if (!s.isDying) {
        s = { ...s, isDying: true, squashTicks: 0, pendingJumpVy: 0,
          ghostDeathHeight: s.ghostDeathHeight || s.scoreState.height };
        if (!s.isGhost) events.push({ type: "died" });
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
        // Reset highestPlatformY to camera top so platform generation resumes
        // from visible area (boss fight broke all off-screen platforms)
        const highestSurviving = s.platforms
          .filter((p) => !p.broken)
          .reduce((min, p) => Math.min(min, p.y), Infinity);
        const resumeY = isFinite(highestSurviving)
          ? highestSurviving
          : s.camera.y;
        // Clear existing collectibles so new generation doesn't double up
        const survivingPlatIds = new Set(
          s.platforms.filter((p) => !p.broken).map((p) => p.id),
        );
        s = {
          ...s,
          activeBoss: null,
          inBossFight: false,
          bossAttacks: [],
          pendingTentacles: [],
          highestPlatformY: resumeY,
          // Remove collectibles on broken platforms + uncollected ones to avoid doubles
          meatballs: s.meatballs.filter((m) => m.collected || survivingPlatIds.has(m.platformId)),
          powerUps: s.powerUps.filter((pu) => pu.collected || survivingPlatIds.has(pu.platformId)),
        };
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
