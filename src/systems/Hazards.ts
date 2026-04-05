/** Environmental hazards — pure logic, no PixiJS. */

import { random } from "./RNG";
import {
  WIND_GUST_FORCE,
  LAVA_RISE_SPEED,
  GAME_HEIGHT,
} from "../config/constants";
import type { PlayerState } from "../entities/Player";

// ── Wind Zones (persistent spatial areas) ───────────────────────────────

export interface WindZone {
  direction: -1 | 1;
  strength: number;
  /** Top of the wind zone in world-space Y (lower value = higher on screen). */
  y: number;
  /** Height of the wind zone in pixels. */
  height: number;
}

export interface WindSystem {
  zones: WindZone[];
  /** World-Y of the highest zone spawned so far (lowest value). */
  nextSpawnY: number;
}

/** Vertical gap between wind zones. */
const WIND_ZONE_SPACING = 2000;
/** Wind zone height. */
const WIND_ZONE_HEIGHT = GAME_HEIGHT * 0.4;

export function createWindSystem(): WindSystem {
  return { zones: [], nextSpawnY: -WIND_ZONE_SPACING };
}

/**
 * Tick the wind system — spawn new zones ahead of camera, prune zones far below.
 * cameraY = world Y of the top of the screen.
 */
export function tickWind(system: WindSystem, cameraY: number): WindSystem {
  let { zones, nextSpawnY } = system;

  // Spawn zones ahead of the camera (player moves toward lower Y)
  const spawnHorizon = cameraY - GAME_HEIGHT * 2;
  while (nextSpawnY > spawnHorizon) {
    zones = [
      ...zones,
      {
        direction: random() > 0.5 ? 1 : -1,
        strength: WIND_GUST_FORCE,
        y: nextSpawnY,
        height: WIND_ZONE_HEIGHT,
      },
    ];
    // Random gap to the next zone
    nextSpawnY -= WIND_ZONE_SPACING + random() * WIND_ZONE_SPACING;
  }

  // Prune zones only when platforms at their level would also be gone
  // Platforms are pruned at camera.y + GAME_HEIGHT + 400
  const pruneY = cameraY + GAME_HEIGHT + 400;
  zones = zones.filter((z) => z.y < pruneY);

  return { zones, nextSpawnY };
}

/** Apply wind force to the player from all overlapping zones. */
export function applyWindForce(
  player: PlayerState,
  zones: WindZone[],
  speedScale = 1,
): PlayerState {
  let dx = 0;
  const playerBottom = player.y + player.height;
  for (const zone of zones) {
    const zoneBottom = zone.y + zone.height;
    if (playerBottom >= zone.y && player.y <= zoneBottom) {
      dx += zone.direction * zone.strength * speedScale;
    }
  }
  if (dx === 0) return player;
  return { ...player, x: player.x + dx };
}

// ── Rising Lava ─────────────────────────────────────────────────────────

export interface LavaState {
  y: number;
  speed: number;
  active: boolean;
}

/** Create lava that starts far below. */
export function createLava(startY: number): LavaState {
  return {
    y: startY + GAME_HEIGHT * 2,
    speed: LAVA_RISE_SPEED,
    active: true,
  };
}

/** Tick lava — rises upward. */
export function tickLava(lava: LavaState): LavaState {
  if (!lava.active) return lava;
  return { ...lava, y: lava.y - lava.speed };
}

/** Check if the player is in the lava. */
export function isPlayerInLava(
  playerY: number,
  playerHeight: number,
  lava: LavaState,
): boolean {
  if (!lava.active) return false;
  return playerY + playerHeight > lava.y;
}
