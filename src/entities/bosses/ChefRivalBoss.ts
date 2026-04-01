/** Chef Rival — jumps between platforms chasing the player. Contact kills. */

import { random } from "../../systems/RNG";
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
const MAX_SAME_PLATFORM_JUMPS = 2; // force variety after landing here N times

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

    // Jump toward player — with variety so boss doesn't camp one platform
    jumpCooldown = Math.max(0, jumpCooldown - 1);
    if (jumpCooldown === 0 && vy === 0) {
      // Only consider non-broken platforms (broken = off-screen during boss fights)
      const visiblePlatforms = platforms.filter((p) =>
        !p.broken && p.id !== currentPlatformId,
      );
      const targets = visiblePlatforms.sort((a, b) => {
        const da = Math.abs(a.x + a.width / 2 - player.x) + Math.abs(a.y - player.y);
        const db = Math.abs(b.x + b.width / 2 - player.x) + Math.abs(b.y - player.y);
        return da - db;
      });

      if (targets.length > 0) {
        // Mix up targeting: sometimes pick a random platform instead of nearest
        const useRandom = patternTick % (MAX_SAME_PLATFORM_JUMPS + 1) === 0 && targets.length > 2;
        let target: PlatformState;
        if (useRandom) {
          // Pick from top 4 candidates randomly for variety
          const pool = targets.slice(0, Math.min(4, targets.length));
          target = pool[Math.floor(random() * pool.length)];
        } else {
          const nearby = targets.filter((p) => Math.abs(p.y - y) < 200);
          target = nearby.length > 0 ? nearby[0] : targets[0];
        }
        const dx = (target.x + target.width / 2) - (x + boss.width / 2);
        const dy = target.y - y;
        // Clamp jump strength — never launch off-screen
        vy = Math.max(-14, Math.min(-6, dy * 0.12 - 6));
        x += Math.sign(dx) * Math.min(Math.abs(dx) * 0.3, 5);
        jumpCooldown = Math.max(MIN_JUMP_COOLDOWN, BASE_JUMP_COOLDOWN - boss.phase * 10);
      }
    }

    x = Math.max(0, Math.min(GAME_WIDTH - boss.width, x));

    // Safety: if boss fell way off screen, teleport to a visible platform
    if (y > player.y + 400) {
      const rescue = platforms
        .filter((p) => !p.broken && Math.abs(p.y - player.y) < 200)
        .sort((a, b) => a.y - b.y);
      if (rescue.length > 0) {
        const p = rescue[Math.floor(rescue.length / 2)];
        x = p.x + p.width / 2 - boss.width / 2;
        y = p.y - boss.height;
        vy = 0;
        currentPlatformId = p.id;
      }
    }

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
