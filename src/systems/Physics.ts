/** Collision detection — pure logic, no PixiJS. */

import type { PlayerState } from '../entities/Player'
import type { PlatformState } from '../entities/Platform'
import { playerJump } from '../entities/Player'
import { breakPlatform } from '../entities/Platform'

export interface CollisionResult {
  player: PlayerState
  platforms: PlatformState[]
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
): CollisionResult {
  // Only check when falling
  if (player.vy < 0) return { player, platforms }

  const playerBottom = player.y + player.height
  const previousBottom = previousY + player.height

  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i]

    if (platform.broken) continue

    // Horizontal overlap check
    const playerRight = player.x + player.width
    const platformRight = platform.x + platform.width

    if (playerRight < platform.x || player.x > platformRight) continue

    // Vertical: player's feet crossed into platform's top surface this frame
    const platformTop = platform.y

    if (previousBottom <= platformTop && playerBottom >= platformTop) {
      // Brittle: mark broken on contact, no bounce — fall straight through
      if (platform.type === 'brittle') {
        const updatedPlatforms = [...platforms]
        updatedPlatforms[i] = breakPlatform(platform)
        return { player, platforms: updatedPlatforms }
      }
      // Land on the platform — snap and jump
      const landed = { ...player, y: platformTop - player.height }
      const jumped = playerJump(landed)

      // If breaking platform, mark it broken after the bounce
      if (platform.type === 'breaking') {
        const updatedPlatforms = [...platforms]
        updatedPlatforms[i] = breakPlatform(platform)
        return { player: jumped, platforms: updatedPlatforms }
      }

      return { player: jumped, platforms }
    }
  }

  return { player, platforms }
}
