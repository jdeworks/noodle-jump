/** Meatball collectibles — pure logic, no PixiJS. */

import {
  MEATBALL_SIZE,
  MEATBALL_SPAWN_CHANCE,
  MEATBALL_FLOAT_HEIGHT,
  MEATBALL_MAGNET_RADIUS,
} from "../config/constants";
import type { PlatformState } from "./Platform";

export interface CollectibleState {
  x: number;
  y: number;
  size: number;
  collected: boolean;
  platformId: number;
  id: number;
}

let nextCollectibleId = 0;

export function createMeatball(platform: PlatformState): CollectibleState {
  return {
    x: platform.x + platform.width / 2 - MEATBALL_SIZE / 2,
    y: platform.y - MEATBALL_FLOAT_HEIGHT,
    size: MEATBALL_SIZE,
    collected: false,
    platformId: platform.id,
    id: nextCollectibleId++,
  };
}

/** Spawn meatballs on a set of platforms based on chance. */
export function spawnMeatballs(
  platforms: PlatformState[],
  excludePlatformIds?: Set<number>,
): CollectibleState[] {
  const meatballs: CollectibleState[] = [];
  for (const platform of platforms) {
    if (platform.type === "breaking" || platform.width > 200) continue;
    if (excludePlatformIds?.has(platform.id)) continue;
    if (Math.random() < MEATBALL_SPAWN_CHANCE) {
      meatballs.push(createMeatball(platform));
    }
  }
  return meatballs;
}

/**
 * Swept AABB collection — checks the full trajectory between frames.
 * Uses the bounding box that covers both the previous and current
 * player position so fast movement can't skip past a meatball.
 */
export function collectMeatballs(
  playerX: number,
  playerY: number,
  playerWidth: number,
  playerHeight: number,
  meatballs: CollectibleState[],
  prevX?: number,
  prevY?: number,
): { meatballs: CollectibleState[]; collected: number } {
  const pad = 6;
  const px = prevX ?? playerX;
  const py = prevY ?? playerY;

  // Swept bounding box covering both previous and current positions
  const sweepLeft = Math.min(px, playerX) - pad;
  const sweepRight = Math.max(px + playerWidth, playerX + playerWidth) + pad;
  const sweepTop = Math.min(py, playerY) - pad;
  const sweepBottom =
    Math.max(py + playerHeight, playerY + playerHeight) + pad;

  let collected = 0;
  const updated = meatballs.map((m) => {
    if (m.collected) return m;

    const overlapX = sweepLeft < m.x + m.size && sweepRight > m.x;
    const overlapY = sweepTop < m.y + m.size && sweepBottom > m.y;

    if (overlapX && overlapY) {
      collected++;
      return { ...m, collected: true };
    }
    return m;
  });

  return { meatballs: updated, collected };
}

/** Remove meatballs whose platform is gone. */
export function pruneMeatballs(
  meatballs: CollectibleState[],
  activePlatformIds: Set<number>,
): CollectibleState[] {
  return meatballs.filter((m) => activePlatformIds.has(m.platformId));
}

/** Update meatball positions to follow their moving platforms. */
export function updateMeatballPositions(
  meatballs: CollectibleState[],
  platforms: PlatformState[],
): CollectibleState[] {
  const platformMap = new Map(platforms.map((p) => [p.id, p]));
  return meatballs.map((m) => {
    const platform = platformMap.get(m.platformId);
    if (!platform) return m;
    return {
      ...m,
      x: platform.x + platform.width / 2 - m.size / 2,
      y: platform.y - MEATBALL_FLOAT_HEIGHT,
    };
  });
}

/** Move uncollected meatballs toward the player when magnet is active. */
export function attractMeatballs(
  playerX: number,
  playerY: number,
  playerWidth: number,
  meatballs: CollectibleState[],
): CollectibleState[] {
  const cx = playerX + playerWidth / 2;
  const cy = playerY;
  return meatballs.map((m) => {
    if (m.collected) return m;
    const dx = cx - (m.x + m.size / 2);
    const dy = cy - (m.y + m.size / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MEATBALL_MAGNET_RADIUS || dist < 1) return m;
    // Inverse-square-ish: very strong up close, weaker at distance (like a real magnet)
    const t = 1 - dist / MEATBALL_MAGNET_RADIUS;
    const strength = 3 + 18 * t * t; // 3 at edge, 21 at point-blank
    return {
      ...m,
      x: m.x + (dx / dist) * strength,
      y: m.y + (dy / dist) * strength,
    };
  });
}

export function resetCollectibleIds(): void {
  nextCollectibleId = 0;
}
