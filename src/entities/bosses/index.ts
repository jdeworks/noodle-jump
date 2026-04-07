/** Boss registry — maps boss types to their behavior modules. */

export type { BossState, BossAttack, BossTickResult, BossBehavior } from "./BossInterface";
export { damageBoss, checkProjectileBossCollision } from "./BossInterface";
export { applyTentacleAttack } from "./KrakenBoss";

import type { BossBehavior } from "./BossInterface";
import { chefRivalBehavior } from "./ChefRivalBoss";
import { krakenBehavior } from "./KrakenBoss";
import { ufoBehavior } from "./UFOBoss";

/** All registered boss behaviors. Add new bosses here. */
const BOSS_REGISTRY: Record<string, BossBehavior> = {
  chef_rival: chefRivalBehavior,
  kraken: krakenBehavior,
  ufo: ufoBehavior,
};

/** Zone-to-boss mapping. null = no boss at that transition. */
const ZONE_BOSSES: (string | null)[] = [
  null, // Zone 1 -> 2
  null, // Zone 2 -> 3
  "chef_rival", // Zone 3 -> 4
  null, // Zone 4 -> 5
  "kraken", // Zone 5 -> 6
  null, // Zone 6 -> 7
  "ufo", // Zone 7 end
];

/** Get the boss type for a zone transition. */
export function getBossForZone(zone: number): string | null {
  if (zone < 0 || zone >= ZONE_BOSSES.length) return null;
  return ZONE_BOSSES[zone];
}

/** Get the behavior module for a boss type. */
export function getBossBehavior(type: string): BossBehavior | undefined {
  return BOSS_REGISTRY[type];
}

/** Get all registered boss type names. */
export function getAllBossTypes(): string[] {
  return Object.keys(BOSS_REGISTRY);
}
