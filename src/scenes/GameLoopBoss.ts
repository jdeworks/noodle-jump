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

/** Queue a boss spawn on zone change — actual spawn deferred until transition ends. */
export function maybeSpawnBoss(
  s: GameWorldState,
  zoneChanged: boolean,
): GameWorldState {
  if (!zoneChanged || s.activeBoss || s.pendingBossZone !== null) return s;
  const bossType = getBossForZone(s.zoneState.currentZone);
  if (!bossType) return s;
  return { ...s, pendingBossZone: s.zoneState.currentZone };
}

/** Actually spawn the boss — called when zone transition finishes. */
export function spawnPendingBoss(
  s: GameWorldState,
  events: GameEvent[],
): GameWorldState {
  if (s.pendingBossZone === null || s.activeBoss) return s;
  const bossType = getBossForZone(s.pendingBossZone);
  const behavior = bossType ? getBossBehavior(bossType) : undefined;
  if (!bossType || !behavior) return { ...s, pendingBossZone: null };

  // Lock camera around the player, but only if close to the current camera.
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

  // Convert arena platforms to boss-safe types (no teleport, spring, lasagna)
  const UNSAFE_PLATFORM_TYPES = new Set(["teleport", "spring", "lasagna"]);
  const safePlatforms = s.platforms.map((p) =>
    !p.broken && UNSAFE_PLATFORM_TYPES.has(p.type)
      ? { ...p, type: "static" as const }
      : p,
  );

  // Convert arena power-ups to boss-safe types
  const BOSS_SAFE_TYPES = new Set(["pasta_shield", "meatball_magnet", "gnocchi_bounce"]);
  const BOSS_REPLACEMENTS = ["pasta_shield", "gnocchi_bounce", "meatball_magnet"];
  let replIdx = 0;
  const safePowerUps = s.powerUps.map((pu) => {
    if (pu.collected || BOSS_SAFE_TYPES.has(pu.type)) return pu;
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
    pendingBossZone: null,
    bossAttacks: [],
    platforms: safePlatforms,
    powerUps: safePowerUps,
    // Clear enemies and player projectiles for a clean arena
    enemies: [],
    projectiles: [],
    // Cancel movement effects so player doesn't fly out of the arena, but keep shield
    activeEffect: s.activeEffect?.type === "pasta_shield" ? s.activeEffect : null,
    player: { ...s.player, vy: Math.max(s.player.vy, -10) },
  };
}

const BOSS_DEATH_TICKS = 90; // 1.5 second death animation
const SKILL_KILL_POINTS = 5000;

/** Clean up after boss is fully dead — resume normal gameplay. */
function finishBossKill(s: GameWorldState, events: GameEvent[]): GameWorldState {
  const bossType = s.activeBoss?.type ?? "unknown";
  const highestSurviving = s.platforms
    .filter((p) => !p.broken)
    .reduce((min, p) => Math.min(min, p.y), Infinity);
  const resumeY = isFinite(highestSurviving) ? highestSurviving : s.camera.y;
  const survivingPlatIds = new Set(
    s.platforms.filter((p) => !p.broken).map((p) => p.id),
  );
  events.push({ type: "bossKilled", bossType });
  return {
    ...s,
    activeBoss: null,
    inBossFight: false,
    bossAttacks: [],
    pendingTentacles: [],
    highestPlatformY: resumeY,
    meatballs: s.meatballs.filter((m) => m.collected || survivingPlatIds.has(m.platformId)),
    powerUps: s.powerUps.filter((pu) => pu.collected || survivingPlatIds.has(pu.platformId)),
  };
}

/** Tick boss behavior, attacks, and projectile interactions. */
export function tickBoss(
  s: GameWorldState,
  events: GameEvent[],
): GameWorldState {
  if (!s.activeBoss) return s;

  // Death animation — tick down, then clean up
  if (!s.activeBoss.alive) {
    const ticks = (s.activeBoss.deathTicks ?? 0) - 1;
    if (ticks <= 0) {
      return finishBossKill(s, events);
    }
    s = { ...s, activeBoss: { ...s.activeBoss, deathTicks: ticks } };
    return s;
  }

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

  // Break platforms the boss jumped away from (crumbling/brittle)
  if (bossResult.breakPlatformIds && bossResult.breakPlatformIds.length > 0) {
    const breakSet = new Set(bossResult.breakPlatformIds);
    s = {
      ...s,
      platforms: s.platforms.map((p) =>
        breakSet.has(p.id) ? { ...p, broken: true } : p,
      ),
    };
  }

  // Skill kill: only when boss is MID-JUMP (progress >= 0) and target platform is broken/breaks
  const BREAKABLE_TYPES = new Set(["breaking", "brittle", "crumbling"]);
  const bossArc = bossResult.boss.jumpArc;
  const bossTargetPlatId = bossArc?.targetPlatformId;
  const bossIsJumping = bossArc != null && bossArc.progress >= 0;
  if (bossIsJumping && bossTargetPlatId != null && bossResult.boss.alive) {
    const targetPlat = s.platforms.find((p) => p.id === bossTargetPlatId);
    if (targetPlat && BREAKABLE_TYPES.has(targetPlat.type)) {
      let skillKilled = false;
      if (targetPlat.broken) {
        const dmgResult = damageBoss({ ...bossResult.boss, health: 1 });
        s = { ...s, activeBoss: { ...dmgResult.boss, deathTicks: BOSS_DEATH_TICKS, jumpArc: undefined } };
        skillKilled = true;
      } else {
        const pBot = s.player.y + s.player.height;
        const onPlatX = s.player.x + s.player.width > targetPlat.x && s.player.x < targetPlat.x + targetPlat.width;
        const onPlatY = pBot >= targetPlat.y && pBot <= targetPlat.y + 12;
        if (onPlatX && onPlatY) {
          s = {
            ...s,
            platforms: s.platforms.map((p) => p.id === bossTargetPlatId ? { ...p, broken: true } : p),
          };
          const dmgResult = damageBoss({ ...bossResult.boss, health: 1 });
          s = { ...s, activeBoss: { ...dmgResult.boss, deathTicks: BOSS_DEATH_TICKS, jumpArc: undefined } };
          skillKilled = true;
        }
      }
      if (skillKilled) {
        s = { ...s, scoreState: { ...s.scoreState, points: s.scoreState.points + SKILL_KILL_POINTS } };
        events.push({ type: "skillKill" });
      }
    }
  }
  // During preview, if target platform breaks, just pick a new target instead of dying
  if (bossArc && bossArc.progress < 0 && bossTargetPlatId != null && bossResult.boss.alive) {
    const targetPlat = s.platforms.find((p) => p.id === bossTargetPlatId);
    if (!targetPlat || targetPlat.broken) {
      // Target gone — cancel preview, boss will pick a new target next cycle
      s = { ...s, activeBoss: { ...bossResult.boss, jumpArc: undefined } };
    }
  }

  // Stomp skill kill: player lands on top of hovering bosses (kraken, ufo)
  const STOMP_BOSSES = new Set(["chef_rival", "kraken", "ufo"]);
  const inGrace = bossResult.boss.patternTick <= BOSS_GRACE_TICKS;
  if (!inGrace && s.activeBoss?.alive && STOMP_BOSSES.has(s.activeBoss.type)) {
    const b = s.activeBoss;
    const pad = 4;
    const overlapX = s.player.x + s.player.width - pad > b.x && s.player.x + pad < b.x + b.width;
    const playerBottom = s.player.y + s.player.height;
    const stompY = playerBottom >= b.y && playerBottom <= b.y + b.height * 0.4 && s.player.vy > 0;
    if (overlapX && stompY) {
      const dmgResult = damageBoss({ ...s.activeBoss, health: 1 });
      s = { ...s, activeBoss: { ...dmgResult.boss, deathTicks: BOSS_DEATH_TICKS } };
      s = { ...s, player: { ...s.player, vy: -12 } };
      // Bonus points for skill kill
      s = { ...s, scoreState: { ...s.scoreState, points: s.scoreState.points + SKILL_KILL_POINTS } };
      events.push({ type: "skillKill" });
    }
  }

  // Check contact damage (e.g. chef rival, kraken from below) — skip during grace period
  if (!inGrace && s.activeBoss?.alive && behavior.checkPlayerContact(s.activeBoss, s.player)) {
    if (s.activeEffect?.type === "pasta_shield") {
      const shield = tryShieldAbsorb(s.activeEffect);
      s = { ...s, activeEffect: shield.effect };
    } else if (!s.isDying && !s.practiceMode && !s.debugConfig.invincible) {
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
      } else if (!s.isDying && !s.practiceMode && !s.debugConfig.invincible) {
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
        // Start death animation — cleanup happens when deathTicks reaches 0
        s = { ...s, activeBoss: { ...dmg.boss, deathTicks: BOSS_DEATH_TICKS, jumpArc: undefined } };
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
    const newAmmo = s.knifeAmmo + 1;
    return {
      ...s,
      knifeAmmo: newAmmo,
      // If still below max, start next regen cycle; otherwise clear timer
      knifeRegenTimer: newAmmo < s.knifeAmmoMax ? KNIFE_REGEN_TICKS : 0,
    };
  }
  return { ...s, knifeRegenTimer: regenTimer };
}
