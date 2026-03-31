/** Kraken — hovers at top, tentacles steal platform chunks. */

import { GAME_WIDTH } from "../../config/constants";
import type { PlayerState } from "../Player";
import type { PlatformState } from "../Platform";
import type { BossBehavior, BossState, BossTickResult } from "./BossInterface";

const WIDTH = 64;
const HEIGHT = 64;
const HEALTH = 8;
const BASE_ATTACK_INTERVAL = 100;
const MIN_ATTACK_INTERVAL = 50;

export const krakenBehavior: BossBehavior = {
  create(cameraY: number): BossState {
    return {
      type: "kraken",
      x: GAME_WIDTH / 2 - WIDTH / 2,
      y: cameraY + 40,
      width: WIDTH, height: HEIGHT,
      health: HEALTH, maxHealth: HEALTH,
      phase: 0, alive: true, patternTick: 0,
      currentPlatformId: null, jumpCooldown: 0, vy: 0,
    };
  },

  tick(
    boss: BossState,
    player: PlayerState,
    platforms: PlatformState[],
  ): BossTickResult {
    if (!boss.alive) return { boss, attacks: [] };

    let { x, y, patternTick } = boss;
    patternTick++;

    // Drift toward player
    const targetX = player.x - boss.width / 2;
    x += Math.sign(targetX - x) * Math.min(Math.abs(targetX - x), 0.6);
    y = boss.y + Math.sin(patternTick * 0.02) * 0.3;

    const attacks: BossTickResult["attacks"] = [];

    // Tentacle attack — grab platform chunks
    const interval = Math.max(MIN_ATTACK_INTERVAL, BASE_ATTACK_INTERVAL - boss.phase * 15);
    if (patternTick % interval === 0) {
      const visible = platforms.filter((p) => !p.broken && p.width > 30);
      if (visible.length > 0) {
        const target = visible[Math.floor(Math.random() * visible.length)];
        attacks.push({
          type: "tentacle",
          x: target.x + target.width / 2,
          y: target.y,
          vx: 0, vy: 0,
          targetPlatformId: target.id,
        });
      }
    }

    return {
      boss: { ...boss, x, y, patternTick },
      attacks,
    };
  },

  checkPlayerContact(): boolean {
    return false; // Kraken doesn't do contact damage
  },
};

/** Apply tentacle attack — shrink a platform by removing a chunk. */
export function applyTentacleAttack(platform: PlatformState): PlatformState {
  const chunkSize = 20 + Math.random() * 15;
  const newWidth = platform.width - chunkSize;
  if (newWidth < 25) {
    return { ...platform, broken: true };
  }
  if (Math.random() > 0.5) {
    return { ...platform, width: newWidth };
  }
  return { ...platform, x: platform.x + chunkSize, width: newWidth };
}
