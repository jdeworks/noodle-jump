/** Platform effect logic — pure functions for new platform behaviors. */

import type { PlayerState } from "../entities/Player";
import type { PlatformState } from "../entities/Platform";
import {
  PLATFORM_CONVEYOR_SPEED,
  PLATFORM_SPRING_VELOCITY_MULTIPLIER,
  PLATFORM_ICE_FRICTION,
  PLATFORM_CRUMBLE_TIMER_TICKS,
  PLATFORM_WEIGHTED_TILT_RATE,
  PLATFORM_WEIGHTED_MAX_TILT,
  PLATFORM_WEIGHTED_SLIDE_SPEED,
  PLAYER_JUMP_VELOCITY,
  GAME_WIDTH,
} from "../config/constants";

/** Apply conveyor belt push to the player. Call each tick while on the platform. */
export function applyConveyorForce(
  player: PlayerState,
  platform: PlatformState,
  speedScale = 1,
): PlayerState {
  const dir = platform.conveyorDir ?? 1;
  let x = player.x + PLATFORM_CONVEYOR_SPEED * dir * speedScale;
  // Screen wrap
  if (x + player.width < 0) x = GAME_WIDTH;
  else if (x > GAME_WIDTH) x = -player.width;
  return { ...player, x };
}

/** Apply spring bounce — extra high jump velocity. */
export function applySpringBounce(player: PlayerState): PlayerState {
  return {
    ...player,
    vy: PLAYER_JUMP_VELOCITY * PLATFORM_SPRING_VELOCITY_MULTIPLIER,
    isJumping: true,
  };
}

/** Apply ice physics — preserve horizontal momentum, very low friction. */
export function applyIcePhysics(player: PlayerState): PlayerState {
  // On ice, horizontal velocity decays very slowly (slides)
  const vx = player.vx * (1 - PLATFORM_ICE_FRICTION);
  return { ...player, vx };
}

/** Start the crumble timer on a platform when landed. */
export function startCrumbleTimer(platform: PlatformState): PlatformState {
  if (platform.crumbleTimer != null) return platform; // already started
  return { ...platform, crumbleTimer: PLATFORM_CRUMBLE_TIMER_TICKS };
}

/** Tick the crumble timer. Returns updated platform and whether it broke. */
export function tickCrumbleTimer(
  platform: PlatformState,
  speedScale = 1,
): {
  platform: PlatformState;
  broke: boolean;
} {
  if (platform.crumbleTimer == null || platform.broken) {
    return { platform, broke: false };
  }
  const timer = platform.crumbleTimer - speedScale;
  if (timer <= 0) {
    return {
      platform: { ...platform, broken: true, crumbleTimer: 0 },
      broke: true,
    };
  }
  return {
    platform: { ...platform, crumbleTimer: timer },
    broke: false,
  };
}

/** Apply weighted platform tilt based on player position. */
export function applyWeightedTilt(
  platform: PlatformState,
  playerX: number,
  playerWidth: number,
  speedScale = 1,
): PlatformState {
  const platformCenter = platform.x + platform.width / 2;
  const playerCenter = playerX + playerWidth / 2;
  const offset = playerCenter - platformCenter;
  const normalizedOffset = offset / (platform.width / 2); // -1 to +1

  let tiltAngle = platform.tiltAngle ?? 0;
  const targetTilt = normalizedOffset * PLATFORM_WEIGHTED_MAX_TILT;
  tiltAngle += (targetTilt - tiltAngle) * PLATFORM_WEIGHTED_TILT_RATE * 3 * speedScale;
  tiltAngle = Math.max(
    -PLATFORM_WEIGHTED_MAX_TILT,
    Math.min(PLATFORM_WEIGHTED_MAX_TILT, tiltAngle),
  );

  return { ...platform, tiltAngle };
}

/** Apply slide force to player on a tilted weighted platform. */
export function applyWeightedSlide(
  player: PlayerState,
  platform: PlatformState,
  speedScale = 1,
): PlayerState {
  const tilt = platform.tiltAngle ?? 0;
  const slideForce = Math.sin(tilt) * PLATFORM_WEIGHTED_SLIDE_SPEED * speedScale;
  return { ...player, x: player.x + slideForce };
}

/**
 * Resolve teleport — find the paired teleport platform and warp the player.
 * Teleport platforms are paired: they target the nearest other teleport platform.
 */
export function resolveTeleport(
  player: PlayerState,
  landedPlatform: PlatformState,
  allPlatforms: PlatformState[],
): { player: PlayerState; targetPlatform: PlatformState | null } {
  // Find another teleport platform that isn't this one and isn't broken
  const candidates = allPlatforms.filter(
    (p) => p.type === "teleport" && p.id !== landedPlatform.id && !p.broken,
  );

  if (candidates.length === 0) {
    return { player, targetPlatform: null };
  }

  // Pick the closest teleport platform above the player (prefer upward travel)
  const above = candidates.filter((p) => p.y < landedPlatform.y);
  const target =
    above.length > 0
      ? above.reduce((best, p) =>
          Math.abs(p.y - landedPlatform.y) < Math.abs(best.y - landedPlatform.y) ? p : best,
        )
      : candidates[0]; // fallback to any

  return {
    player: {
      ...player,
      x: target.x + target.width / 2 - player.width / 2,
      y: target.y - player.height,
    },
    targetPlatform: target,
  };
}
