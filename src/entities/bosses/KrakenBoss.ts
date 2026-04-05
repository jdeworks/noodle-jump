/** Kraken — hovers at top, tentacles steal platform edge chunks. */

import { random } from "../../systems/RNG";
import { GAME_WIDTH } from "../../config/constants";
import type { PlayerState } from "../Player";
import type { PlatformState } from "../Platform";
import type { BossBehavior, BossState, BossTickResult } from "./BossInterface";

const WIDTH = 64;
const HEIGHT = 64;
const HEALTH = 8;
const BASE_ATTACK_INTERVAL = 480; // 8 seconds initially
const MIN_ATTACK_INTERVAL = 180; // 3 seconds at max aggression
const INTERVAL_REDUCTION = 30; // each attack gets faster by this many ticks
const MIN_PLATFORM_WIDTH = 20; // never shrink below this — always leave a jumpable sliver

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
    _animTick: number,
    speedScale = 1,
  ): BossTickResult {
    if (!boss.alive) return { boss, attacks: [] };

    let { x, y, patternTick } = boss;
    patternTick++;

    // Drift toward player horizontally
    const targetX = player.x - boss.width / 2;
    x += Math.sign(targetX - x) * Math.min(Math.abs(targetX - x), 0.6) * speedScale;
    // Stay near player vertically — slow upward (stompable), normal downward
    const targetY = player.y - 200;
    const diff = targetY - y;
    const lerpRate = diff < 0 ? 0.005 : 0.03; // up = slow, down = normal
    y += diff * lerpRate * speedScale;
    y += Math.sin(patternTick * 0.02) * 0.3 * speedScale;

    const attacks: BossTickResult["attacks"] = [];

    // Tentacle attack — first attack right after grace (tick 121), then escalating
    const GRACE = 120;
    const attackCount = boss.jumpCooldown; // reuse jumpCooldown as attack counter
    const interval = Math.max(MIN_ATTACK_INTERVAL, BASE_ATTACK_INTERVAL - attackCount * INTERVAL_REDUCTION);
    const ticksSinceGrace = patternTick - GRACE;
    const shouldAttack = patternTick === GRACE + 1
      || (ticksSinceGrace > 0 && ticksSinceGrace % interval === 0);
    if (shouldAttack) {
      const alive = platforms.filter((p) => !p.broken);
      // Phase 1: shrink platforms that are still wide — pick randomly
      const shrinkable = alive.filter((p) => p.width > MIN_PLATFORM_WIDTH + 15);
      // Phase 2: all platforms are slivers — destroy lowest first
      const slivers = shrinkable.length === 0
        ? alive.sort((a, b) => b.y - a.y) // lowest (highest Y) first
        : [];

      const target = shrinkable.length > 0
        ? shrinkable[Math.floor(random() * shrinkable.length)]
        : slivers[0] ?? null;

      if (target) {
        const side = random() > 0.5 ? "left" : "right";
        const attackX = side === "left"
          ? target.x + target.width * 0.15
          : target.x + target.width * 0.85;
        attacks.push({
          type: "tentacle",
          x: attackX,
          y: target.y,
          vx: 0, vy: 0,
          targetPlatformId: target.id,
        });
      }
    }

    return {
      boss: { ...boss, x, y, patternTick, jumpCooldown: attackCount + attacks.length },
      attacks,
    };
  },

  checkPlayerContact(boss: BossState, player: PlayerState): boolean {
    if (!boss.alive) return false;
    // Player hitting from below = damage to player
    const pad = 4;
    const overlapX = player.x + player.width - pad > boss.x && player.x + pad < boss.x + boss.width;
    const playerBottom = player.y + player.height;
    // Only kill player if they hit from below (moving upward into the kraken)
    const hitsFromBelow = overlapX && playerBottom > boss.y + pad && player.y < boss.y + boss.height * 0.5;
    return hitsFromBelow;
  },
};

/** Apply tentacle attack — remove one third of the platform's INITIAL width.
 *  After 3 chunks the platform is destroyed. */
export function applyTentacleAttack(platform: PlatformState, side?: "left" | "right"): PlatformState {
  const initW = platform.initialWidth ?? platform.width;
  const chunkSize = Math.floor(initW / 3);

  // If removing this chunk would leave less than MIN_PLATFORM_WIDTH, destroy
  if (platform.width - chunkSize < MIN_PLATFORM_WIDTH) {
    return { ...platform, broken: true };
  }

  const newWidth = platform.width - chunkSize;
  const removeSide = side ?? (random() > 0.5 ? "left" : "right");
  if (removeSide === "left") {
    return { ...platform, x: platform.x + chunkSize, width: newWidth, initialWidth: initW };
  }
  return { ...platform, width: newWidth, initialWidth: initW };
}

/** Get the chunk size a tentacle would remove from a platform. */
export function getTentacleChunkSize(platform: PlatformState): number {
  const initW = platform.initialWidth ?? platform.width;
  return Math.floor(initW / 3);
}
