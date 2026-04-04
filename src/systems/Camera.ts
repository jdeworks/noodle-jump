/** Camera system — pure logic, no PixiJS. */

import {
  CAMERA_LERP_SPEED,
  CAMERA_GRACE_PLATFORMS,
  GAME_HEIGHT,
  PLATFORM_GAP_MAX,
} from "../config/constants";

export interface CameraState {
  y: number; // world-space Y of the camera's top edge
  highestY: number; // highest Y the camera has ever reached (lowest value = highest)
  /** When set, camera smoothly lerps to this Y before locking for boss fight. */
  bossTargetY: number | null;
}

export function createCamera(): CameraState {
  return { y: 0, highestY: 0, bossTargetY: null };
}

/**
 * Update camera to follow the player with easing.
 * Only follows upward or when the player is still on screen.
 * Once the player falls below the viewport, camera locks — no chasing down.
 */
export function updateCamera(
  camera: CameraState,
  playerY: number,
  inBossFight = false,
): CameraState {
  // Smooth transition toward boss arena position (even during boss fight)
  if (camera.bossTargetY !== null) {
    const BOSS_LERP = 0.06;
    const y = camera.y + (camera.bossTargetY - camera.y) * BOSS_LERP;
    const highestY = Math.min(camera.highestY, y);
    // Snap when close enough
    if (Math.abs(y - camera.bossTargetY) < 0.5) {
      return { y: camera.bossTargetY, highestY, bossTargetY: null };
    }
    return { y, highestY, bossTargetY: camera.bossTargetY };
  }

  // Lock the camera during boss fights so the arena stays fixed
  if (inBossFight) return camera;

  const targetY = playerY - GAME_HEIGHT * 0.4;
  const viewportBottom = camera.y + GAME_HEIGHT;

  // If the player is below the viewport, lock the camera — let them die fast
  if (playerY > viewportBottom) {
    return camera;
  }

  // Lerp toward target
  const y = camera.y + (targetY - camera.y) * CAMERA_LERP_SPEED;

  // Track the highest point reached
  const highestY = Math.min(camera.highestY, y);

  return { y, highestY, bossTargetY: null };
}

/**
 * Check if the player has fallen too far below the camera's highest point.
 * Uses the camera's highest-ever position (not current) so the camera
 * can't prevent death by following the player downward.
 */
export function isPlayerDead(camera: CameraState, playerY: number): boolean {
  const graceDistance = CAMERA_GRACE_PLATFORMS * PLATFORM_GAP_MAX;
  const deathLine = camera.highestY + GAME_HEIGHT + graceDistance;
  return playerY > deathLine;
}

/** Convert world-space Y to screen-space Y. */
export function worldToScreen(worldY: number, cameraY: number): number {
  return worldY - cameraY;
}
