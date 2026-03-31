/** Environmental hazards — pure logic, no PixiJS. */

import {
  WIND_GUST_FORCE,
  WIND_GUST_DURATION,
  WIND_GUST_INTERVAL,
  LAVA_RISE_SPEED,
  GAME_HEIGHT,
} from "../config/constants";
import type { PlayerState } from "../entities/Player";

// ── Wind Gusts ──────────────────────────────────────────────────────────

export interface WindGustState {
  direction: -1 | 1;
  strength: number;
  ticksRemaining: number;
}

export interface WindSystem {
  activeGust: WindGustState | null;
  ticksSinceLastGust: number;
}

export function createWindSystem(): WindSystem {
  return { activeGust: null, ticksSinceLastGust: 0 };
}

/** Tick the wind system — may start a new gust. */
export function tickWind(system: WindSystem): WindSystem {
  // Active gust counting down
  if (system.activeGust) {
    const remaining = system.activeGust.ticksRemaining - 1;
    if (remaining <= 0) {
      return { activeGust: null, ticksSinceLastGust: 0 };
    }
    return {
      ...system,
      activeGust: { ...system.activeGust, ticksRemaining: remaining },
    };
  }

  // Check if a new gust should start
  const ticks = system.ticksSinceLastGust + 1;
  if (ticks >= WIND_GUST_INTERVAL && Math.random() < 0.3) {
    return {
      ticksSinceLastGust: 0,
      activeGust: {
        direction: Math.random() > 0.5 ? 1 : -1,
        strength: WIND_GUST_FORCE,
        ticksRemaining: WIND_GUST_DURATION,
      },
    };
  }

  return { ...system, ticksSinceLastGust: ticks };
}

/** Apply wind force to the player. */
export function applyWindForce(
  player: PlayerState,
  gust: WindGustState,
): PlayerState {
  return {
    ...player,
    x: player.x + gust.direction * gust.strength,
  };
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
