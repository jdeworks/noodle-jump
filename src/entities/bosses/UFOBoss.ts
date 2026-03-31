/** UFO — hovers and fires projectiles downward. Spread shot at phase 2+. */

import { random } from "../../systems/RNG";
import { GAME_WIDTH } from "../../config/constants";
import type { PlayerState } from "../Player";
import type { PlatformState } from "../Platform";
import type { BossBehavior, BossState, BossTickResult } from "./BossInterface";

const WIDTH = 56;
const HEIGHT = 40;
const HEALTH = 10;
const BASE_ATTACK_INTERVAL = 80;
const MIN_ATTACK_INTERVAL = 30;

export const ufoBehavior: BossBehavior = {
  create(cameraY: number): BossState {
    return {
      type: "ufo",
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
    _platforms: PlatformState[],
    animTick: number,
  ): BossTickResult {
    if (!boss.alive) return { boss, attacks: [] };

    let { x, y, patternTick } = boss;
    patternTick++;

    // Track player
    const targetX = player.x - boss.width / 2;
    const moveSpeed = 0.8 + boss.phase * 0.3;
    x += Math.sign(targetX - x) * Math.min(Math.abs(targetX - x), moveSpeed);
    y = boss.y + Math.sin(animTick * 0.03) * 0.5;

    const attacks: BossTickResult["attacks"] = [];

    // Fire projectiles
    const interval = Math.max(MIN_ATTACK_INTERVAL, BASE_ATTACK_INTERVAL - boss.phase * 15);
    if (patternTick % interval === 0) {
      attacks.push({
        type: "projectile",
        x: boss.x + boss.width / 2,
        y: boss.y + boss.height,
        vx: (random() - 0.5) * 3,
        vy: 2.5 + boss.phase * 0.5,
      });
    }

    // Spread shot at phase 2+
    if (boss.phase >= 2 && patternTick % (interval * 3) === 0) {
      for (const angle of [-0.4, 0, 0.4]) {
        attacks.push({
          type: "projectile",
          x: boss.x + boss.width / 2,
          y: boss.y + boss.height,
          vx: Math.sin(angle) * 3,
          vy: Math.cos(angle) * 3,
        });
      }
    }

    return {
      boss: { ...boss, x, y, patternTick },
      attacks,
    };
  },

  checkPlayerContact(): boolean {
    return false; // UFO doesn't do contact damage, only projectiles
  },
};
