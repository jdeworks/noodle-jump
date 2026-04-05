/** UFO — hovers and fires aimed projectiles downward. Spread shot at phase 2+. */

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
const PROJECTILE_SPEED = 3.5;

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
    speedScale = 1,
  ): BossTickResult {
    if (!boss.alive) return { boss, attacks: [] };

    let { x, y, patternTick } = boss;
    patternTick++;

    // Track player horizontally
    const targetX = player.x - boss.width / 2;
    const moveSpeed = (0.8 + boss.phase * 0.3) * speedScale;
    x += Math.sign(targetX - x) * Math.min(Math.abs(targetX - x), moveSpeed);
    // Stay near player vertically — slower upward (stompable), normal downward
    const targetY = player.y - 180;
    const diff = targetY - y;
    const lerpRate = diff < 0 ? 0.01 : 0.04;
    y += diff * lerpRate * speedScale;
    y += Math.sin(animTick * 0.03) * 0.5 * speedScale;

    const attacks: BossTickResult["attacks"] = [];
    const bossCX = x + boss.width / 2;
    const bossBY = y + boss.height;

    // Aim at player with slight inaccuracy
    const dx = (player.x + player.width / 2) - bossCX;
    const dy = (player.y + player.height / 2) - bossBY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = PROJECTILE_SPEED + boss.phase * 0.3;

    // Fire aimed projectiles
    const interval = Math.max(MIN_ATTACK_INTERVAL, BASE_ATTACK_INTERVAL - boss.phase * 15);
    if (patternTick % interval === 0) {
      // Add slight random spread so it's not perfectly aimed
      const spread = (random() - 0.5) * 0.8;
      attacks.push({
        type: "projectile",
        x: bossCX,
        y: bossBY,
        vx: (dx / dist) * speed + spread,
        vy: (dy / dist) * speed,
      });
    }

    // Spread shot at phase 2+ — fan of 3 aimed projectiles
    if (boss.phase >= 2 && patternTick % (interval * 3) === 0) {
      for (const angleOffset of [-0.3, 0, 0.3]) {
        const cos = Math.cos(angleOffset);
        const sin = Math.sin(angleOffset);
        const aimVx = (dx / dist) * speed;
        const aimVy = (dy / dist) * speed;
        attacks.push({
          type: "projectile",
          x: bossCX,
          y: bossBY,
          vx: aimVx * cos - aimVy * sin,
          vy: aimVx * sin + aimVy * cos,
        });
      }
    }

    return {
      boss: { ...boss, x, y, patternTick },
      attacks,
    };
  },

  checkPlayerContact(boss: BossState, player: PlayerState): boolean {
    if (!boss.alive) return false;
    // Player hitting from below = damage
    const pad = 4;
    const overlapX = player.x + player.width - pad > boss.x && player.x + pad < boss.x + boss.width;
    const playerBottom = player.y + player.height;
    return overlapX && playerBottom > boss.y + pad && player.y < boss.y + boss.height * 0.5;
  },
};
