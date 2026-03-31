/** Chef Rival — jumps between platforms chasing the player. Contact kills. */

import { GAME_WIDTH } from "../../config/constants";
import type { PlayerState } from "../Player";
import type { PlatformState } from "../Platform";
import type { BossBehavior, BossState, BossTickResult } from "./BossInterface";

const WIDTH = 36;
const HEIGHT = 44;
const HEALTH = 3;
const GRAVITY = 0.4;
const BASE_JUMP_COOLDOWN = 60;
const MIN_JUMP_COOLDOWN = 30;

export const chefRivalBehavior: BossBehavior = {
  create(cameraY: number, platforms?: PlatformState[]): BossState {
    let x = GAME_WIDTH / 2 - WIDTH / 2;
    let y = cameraY + 40;
    let currentPlatformId: number | null = null;

    if (platforms && platforms.length > 0) {
      const visible = platforms
        .filter((p) => !p.broken && p.y > cameraY && p.y < cameraY + 400)
        .sort((a, b) => a.y - b.y);
      if (visible.length > 0) {
        const plat = visible[Math.floor(visible.length / 2)];
        x = plat.x + plat.width / 2 - WIDTH / 2;
        y = plat.y - HEIGHT;
        currentPlatformId = plat.id;
      }
    }

    return {
      type: "chef_rival",
      x, y, width: WIDTH, height: HEIGHT,
      health: HEALTH, maxHealth: HEALTH,
      phase: 0, alive: true, patternTick: 0,
      currentPlatformId, jumpCooldown: BASE_JUMP_COOLDOWN, vy: 0,
    };
  },

  tick(
    boss: BossState,
    player: PlayerState,
    platforms: PlatformState[],
  ): BossTickResult {
    if (!boss.alive) return { boss, attacks: [] };

    let { x, y, vy, jumpCooldown, currentPlatformId, patternTick } = boss;
    patternTick++;

    vy += GRAVITY;
    y += vy;

    // Land on platforms
    if (vy > 0) {
      for (const p of platforms) {
        if (p.broken) continue;
        const bossBottom = y + boss.height;
        if (
          bossBottom >= p.y && bossBottom <= p.y + 10 &&
          x + boss.width > p.x && x < p.x + p.width
        ) {
          y = p.y - boss.height;
          vy = 0;
          currentPlatformId = p.id;
          break;
        }
      }
    }

    // Jump toward player
    jumpCooldown = Math.max(0, jumpCooldown - 1);
    if (jumpCooldown === 0 && vy === 0) {
      const targets = platforms
        .filter((p) => !p.broken && p.id !== currentPlatformId)
        .sort((a, b) => {
          const da = Math.abs(a.x + a.width / 2 - player.x) + Math.abs(a.y - player.y);
          const db = Math.abs(b.x + b.width / 2 - player.x) + Math.abs(b.y - player.y);
          return da - db;
        });

      if (targets.length > 0) {
        const target = targets[0];
        const dx = (target.x + target.width / 2) - (x + boss.width / 2);
        vy = Math.min(-8, (target.y - y) * 0.15 - 6);
        x += Math.sign(dx) * Math.min(Math.abs(dx) * 0.3, 4);
        jumpCooldown = Math.max(MIN_JUMP_COOLDOWN, BASE_JUMP_COOLDOWN - boss.phase * 10);
      }
    }

    x = Math.max(0, Math.min(GAME_WIDTH - boss.width, x));

    return {
      boss: { ...boss, x, y, vy, jumpCooldown, currentPlatformId, patternTick },
      attacks: [],
    };
  },

  checkPlayerContact(boss: BossState, player: PlayerState): boolean {
    if (!boss.alive) return false;
    const pad = 4;
    return (
      player.x + player.width - pad > boss.x &&
      player.x + pad < boss.x + boss.width &&
      player.y + player.height - pad > boss.y &&
      player.y + pad < boss.y + boss.height
    );
  },
};
