/** Collision detection — pure logic, no PixiJS. */

import type { PlayerState } from "../entities/Player";
import type { PlatformState } from "../entities/Platform";
import { playerJump } from "../entities/Player";
import { breakPlatform } from "../entities/Platform";
import { CLOSE_CALL_THRESHOLD } from "../config/constants";

export interface CollisionResult {
  player: PlayerState;
  platforms: PlatformState[];
  landed: boolean;
  edgeLanding: boolean;
  platformBroke: boolean;
}

/**
 * Swept collision detection — checks the full trajectory between frames.
 *
 * Instead of only testing the end-of-frame position, we find the exact
 * fraction `t` at which the player's feet cross each platform top and
 * verify that the player overlaps horizontally at that moment.
 *
 * This eliminates tunnelling regardless of fall speed.
 */
export function checkPlatformCollisions(
  player: PlayerState,
  platforms: PlatformState[],
  previousY: number,
  allBreaking = false,
  previousX?: number,
): CollisionResult {
  const noHit: CollisionResult = {
    player,
    platforms,
    landed: false,
    edgeLanding: false,
    platformBroke: false,
  };

  if (player.vy < 0) return noHit;

  const playerBottom = player.y + player.height;
  const previousBottom = previousY + player.height;
  const prevX = previousX ?? player.x;

  // Sort candidate platforms by crossing time so we land on the FIRST one
  let bestT = Infinity;
  let bestIdx = -1;

  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    if (platform.broken) continue;

    const platformTop = platform.y;

    // Vertical sweep: did the bottom edge cross this platform top?
    if (previousBottom > platformTop || playerBottom < platformTop) continue;

    // Compute t ∈ [0,1] at which bottom edge == platformTop
    const dy = playerBottom - previousBottom;
    const t = dy === 0 ? 0 : (platformTop - previousBottom) / dy;

    // Interpolate horizontal position at crossing time
    const xAtT = prevX + (player.x - prevX) * t;
    const playerRightAtT = xAtT + player.width;
    const platformRight = platform.x + platform.width;

    if (playerRightAtT < platform.x || xAtT > platformRight) continue;

    if (t < bestT) {
      bestT = t;
      bestIdx = i;
    }
  }

  if (bestIdx < 0) return noHit;

  const platform = platforms[bestIdx];
  const platformRight = platform.x + platform.width;

  // Use player's current X for edge-landing (visual position)
  const playerRight = player.x + player.width;
  const leftMargin = player.x - platform.x;
  const rightMargin = platformRight - playerRight;
  const edgeLanding =
    leftMargin < CLOSE_CALL_THRESHOLD || rightMargin < CLOSE_CALL_THRESHOLD;

  // Brittle: mark broken on contact, no bounce
  if (platform.type === "brittle") {
    const updatedPlatforms = [...platforms];
    updatedPlatforms[bestIdx] = breakPlatform(platform);
    return {
      player,
      platforms: updatedPlatforms,
      landed: false,
      edgeLanding: false,
      platformBroke: true,
    };
  }

  const landed = { ...player, y: platform.y - player.height };
  const jumped = playerJump(landed);

  // Breaking platform, lasagna stepping stone, or soggy noodle effect
  if (
    platform.type === "breaking" ||
    platform.type === "lasagna" ||
    (allBreaking && (platform.type === "static" || platform.type === "moving"))
  ) {
    const updatedPlatforms = [...platforms];
    updatedPlatforms[bestIdx] = breakPlatform(platform);
    return {
      player: jumped,
      platforms: updatedPlatforms,
      landed: true,
      edgeLanding,
      platformBroke: true,
    };
  }

  return {
    player: jumped,
    platforms,
    landed: true,
    edgeLanding,
    platformBroke: false,
  };
}
