/** Common boss interface — all boss types implement this. Pure logic. */

import type { PlayerState } from "../Player";
import type { PlatformState } from "../Platform";

/** Attack output from a boss tick. */
export interface BossAttack {
  type: "projectile" | "tentacle";
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetPlatformId?: number;
}

/** Shared boss state fields. */
export interface BossState {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  phase: number;
  alive: boolean;
  patternTick: number;
  /** Used by platform-jumping bosses. */
  currentPlatformId: number | null;
  jumpCooldown: number;
  vy: number;
  /** Platform IDs already visited — boss cycles through all before revisiting. */
  visitedPlatformIds?: number[];
  /** Death animation countdown — boss is dying but still visible. */
  deathTicks?: number;
  /** Jump arc: start position, target position, progress (0-1). */
  jumpArc?: {
    startX: number; startY: number;
    targetX: number; targetY: number;
    progress: number; duration: number;
    targetPlatformId?: number;
  };
}

/** Result of a boss tick. */
export interface BossTickResult {
  boss: BossState;
  attacks: BossAttack[];
  /** Platform IDs to break (e.g. crumbling platforms the boss jumped away from). */
  breakPlatformIds?: number[];
}

/**
 * Boss behavior interface — implement one per boss type.
 * All methods are pure functions (no side effects).
 */
export interface BossBehavior {
  /** Create the initial boss state. */
  create(cameraY: number, platforms?: PlatformState[]): BossState;

  /** Tick the boss. Returns updated state + attacks. */
  tick(
    boss: BossState,
    player: PlayerState,
    platforms: PlatformState[],
    animTick: number,
  ): BossTickResult;

  /** Check if the boss directly damages the player (e.g. contact). */
  checkPlayerContact(boss: BossState, player: PlayerState): boolean;
}

/** Damage a boss. Returns updated state + killed flag. */
export function damageBoss(boss: BossState): { boss: BossState; killed: boolean } {
  const health = boss.health - 1;
  const phase = Math.floor((1 - health / boss.maxHealth) * 3);
  if (health <= 0) {
    return { boss: { ...boss, health: 0, alive: false, phase }, killed: true };
  }
  return { boss: { ...boss, health, phase }, killed: false };
}

/** Check if a projectile (knife) hits the boss. */
export function checkProjectileBossCollision(
  projX: number,
  projY: number,
  projSize: number,
  boss: BossState,
): boolean {
  if (!boss.alive) return false;
  return (
    projX + projSize / 2 > boss.x &&
    projX - projSize / 2 < boss.x + boss.width &&
    projY + projSize / 2 > boss.y &&
    projY - projSize / 2 < boss.y + boss.height
  );
}
