/**
 * Boss entity — re-exports from modular boss system.
 * Import from here or directly from ./bosses/index.
 */

export {
  type BossState,
  type BossAttack,
  type BossTickResult,
  type BossBehavior,
  damageBoss,
  checkProjectileBossCollision,
  getBossForZone,
  getBossBehavior,
  getAllBossTypes,
  applyTentacleAttack,
} from "./bosses/index";
