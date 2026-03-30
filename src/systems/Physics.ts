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
 * Check if the player's feet land on a platform.
 * Only collides when the player is falling (vy >= 0) and
 * the player's bottom edge crosses into the platform's top zone.
 *
 * Breaking platforms: player bounces once, then the platform is marked broken.
 * Broken platforms are skipped.
 */
export function checkPlatformCollisions(
  player: PlayerState,
  platforms: PlatformState[],
  previousY: number,
  allBreaking = false,
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

  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];

    if (platform.broken) continue;

    const playerRight = player.x + player.width;
    const platformRight = platform.x + platform.width;

    if (playerRight < platform.x || player.x > platformRight) continue;

    const platformTop = platform.y;

    if (previousBottom <= platformTop && playerBottom >= platformTop) {
      // Check edge landing before any bounce
      const leftMargin = player.x - platform.x;
      const rightMargin = platformRight - playerRight;
      const edgeLanding =
        leftMargin < CLOSE_CALL_THRESHOLD || rightMargin < CLOSE_CALL_THRESHOLD;

      // Brittle: mark broken on contact, no bounce
      if (platform.type === "brittle") {
        const updatedPlatforms = [...platforms];
        updatedPlatforms[i] = breakPlatform(platform);
        return {
          player,
          platforms: updatedPlatforms,
          landed: false,
          edgeLanding: false,
          platformBroke: true,
        };
      }

      const landed = { ...player, y: platformTop - player.height };
      const jumped = playerJump(landed);

      // Breaking platform (or soggy noodle effect)
      if (
        platform.type === "breaking" ||
        (allBreaking && platform.type === "static")
      ) {
        const updatedPlatforms = [...platforms];
        updatedPlatforms[i] = breakPlatform(platform);
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
  }

  return noHit;
}
