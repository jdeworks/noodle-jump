/** Complex power-up effect logic — pure functions. */

import type { PlayerState } from "../entities/Player";
import type { PlatformState } from "../entities/Platform";
import type { ActiveEffect } from "../entities/PowerUp";
import {
  GNOCCHI_BOUNCE_MULTIPLIER,
  MINESTRONE_RISE_SPEED,
  GAME_HEIGHT,
} from "../config/constants";

// ── Pasta Shield ─────────────────────────────────────────────────────────

/**
 * Check if shield absorbs a negative power-up hit.
 * Returns updated effect (consumed if absorbed) and whether it absorbed.
 */
export function tryShieldAbsorb(
  effect: ActiveEffect | null,
): { effect: ActiveEffect | null; absorbed: boolean } {
  if (!effect || effect.type !== "pasta_shield") {
    return { effect, absorbed: false };
  }
  // Shield consumed — remove it
  return { effect: null, absorbed: true };
}

/** Check if the player currently has an active shield. */
export function hasShield(effect: ActiveEffect | null): boolean {
  return effect?.type === "pasta_shield";
}

// ── Rigatoni Drill ───────────────────────────────────────────────────────

/**
 * Drill smashes through platforms. Returns platform IDs that were broken.
 * Called each tick while drill is active.
 */
export function drillBreakPlatforms(
  player: PlayerState,
  platforms: PlatformState[],
): { platforms: PlatformState[]; brokenIds: number[] } {
  const brokenIds: number[] = [];
  const updated = platforms.map((p) => {
    if (p.broken) return p;
    if (p.type === "lasagna") return p; // don't break lasagna
    // Check if player is drilling through this platform
    const playerBottom = player.y + player.height;
    const playerRight = player.x + player.width;
    const horizontalOverlap = playerRight > p.x && player.x < p.x + p.width;
    const verticalOverlap =
      playerBottom >= p.y && player.y <= p.y + p.height;
    if (horizontalOverlap && verticalOverlap) {
      brokenIds.push(p.id);
      return { ...p, broken: true };
    }
    return p;
  });
  return { platforms: updated, brokenIds };
}

// ── Gnocchi Bounce ───────────────────────────────────────────────────────

/** Apply gnocchi bounce — multiply jump velocity for super bouncy platforms. */
export function applyGnocchiBounce(jumpVelocity: number): number {
  return jumpVelocity * GNOCCHI_BOUNCE_MULTIPLIER;
}

/** Check if gnocchi bounce is active. */
export function hasGnocchiBounce(effect: ActiveEffect | null): boolean {
  return effect?.type === "gnocchi_bounce";
}

// ── Minestrone Soup ──────────────────────────────────────────────────────

export interface MinestroneState {
  /** Flood Y position in world coordinates (lower = higher on screen). */
  floodY: number;
  /** Rise speed in pixels per tick. */
  riseSpeed: number;
  /** Whether the flood is active. */
  active: boolean;
}

/** Create initial minestrone flood state relative to player position. */
export function createMinestroneFlood(playerY: number): MinestroneState {
  return {
    floodY: playerY + GAME_HEIGHT, // starts below screen
    riseSpeed: MINESTRONE_RISE_SPEED,
    active: true,
  };
}

/** Tick the minestrone flood — rises toward the player. */
export function tickMinestroneFlood(state: MinestroneState): MinestroneState {
  if (!state.active) return state;
  return {
    ...state,
    floodY: state.floodY - state.riseSpeed,
  };
}

/** Check if the player is in the minestrone flood (dead). */
export function isPlayerInFlood(
  playerY: number,
  playerHeight: number,
  flood: MinestroneState,
): boolean {
  if (!flood.active) return false;
  return playerY + playerHeight > flood.floodY;
}

/** Stop the flood (effect ended). */
export function stopMinestroneFlood(state: MinestroneState): MinestroneState {
  return { ...state, active: false };
}
