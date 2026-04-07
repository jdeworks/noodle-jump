/** Boss damage interactions — skill kills, stomps, contact, attack hits. */

import type { GameWorldState } from "./GameState";
import type { GameEvent } from "./GameLoopTypes";
import type { BossTickResult } from "../entities/bosses/BossInterface";
import { damageBoss } from "../entities/Boss";

const BOSS_DEATH_TICKS = 60;
const SKILL_KILL_POINTS = 5000;
const BOSS_GRACE_TICKS = 120;

/** Check for skill kill: boss is mid-jump and target platform is broken/breakable. */
export function checkSkillKill(
  s: GameWorldState,
  bossResult: BossTickResult,
  events: GameEvent[],
): GameWorldState {
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
        s = {
          ...s,
          activeBoss: { ...dmgResult.boss, deathTicks: BOSS_DEATH_TICKS, jumpArc: undefined },
        };
        skillKilled = true;
      } else {
        const pBot = s.player.y + s.player.height;
        const onPlatX =
          s.player.x + s.player.width > targetPlat.x &&
          s.player.x < targetPlat.x + targetPlat.width;
        const onPlatY = pBot >= targetPlat.y && pBot <= targetPlat.y + 12;
        if (onPlatX && onPlatY) {
          s = {
            ...s,
            platforms: s.platforms.map((p) =>
              p.id === bossTargetPlatId ? { ...p, broken: true } : p,
            ),
          };
          const dmgResult = damageBoss({ ...bossResult.boss, health: 1 });
          s = {
            ...s,
            activeBoss: { ...dmgResult.boss, deathTicks: BOSS_DEATH_TICKS, jumpArc: undefined },
          };
          skillKilled = true;
        }
      }
      if (skillKilled) {
        s = {
          ...s,
          scoreState: { ...s.scoreState, points: s.scoreState.points + SKILL_KILL_POINTS },
        };
        events.push({ type: "skillKill" });
      }
    }
  }
  // During preview, if target platform breaks, cancel preview
  if (bossArc && bossArc.progress < 0 && bossTargetPlatId != null && bossResult.boss.alive) {
    const targetPlat = s.platforms.find((p) => p.id === bossTargetPlatId);
    if (!targetPlat || targetPlat.broken) {
      s = { ...s, activeBoss: { ...bossResult.boss, jumpArc: undefined } };
    }
  }
  return s;
}

/** Check stomp kill: player lands on top of hovering bosses. */
export function checkStompKill(
  s: GameWorldState,
  bossPatternTick: number,
  events: GameEvent[],
): GameWorldState {
  const STOMP_BOSSES = new Set(["chef_rival", "kraken", "ufo"]);
  const inGrace = bossPatternTick <= BOSS_GRACE_TICKS;
  if (!inGrace && s.activeBoss?.alive && STOMP_BOSSES.has(s.activeBoss.type)) {
    const b = s.activeBoss;
    const pad = 4;
    const overlapX = s.player.x + s.player.width - pad > b.x && s.player.x + pad < b.x + b.width;
    const playerBottom = s.player.y + s.player.height;
    const stompY = playerBottom >= b.y && playerBottom <= b.y + b.height * 0.4 && s.player.vy > 0;
    if (overlapX && stompY) {
      const dmgResult = damageBoss({ ...s.activeBoss, health: 1 });
      s = { ...s, activeBoss: { ...dmgResult.boss, deathTicks: BOSS_DEATH_TICKS } };
      s = { ...s, player: { ...s.player, vy: -12 }, bossStomps: s.bossStomps + 1 };
      s = {
        ...s,
        scoreState: { ...s.scoreState, points: s.scoreState.points + SKILL_KILL_POINTS },
      };
      events.push({ type: "skillKill" });
    }
  }
  return s;
}

/** Whether the boss is in grace period. */
export function isBossInGrace(patternTick: number): boolean {
  return patternTick <= BOSS_GRACE_TICKS;
}
