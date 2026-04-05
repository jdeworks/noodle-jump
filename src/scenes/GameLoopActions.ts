/** Standalone game loop actions — start countdown, pause, throw projectile. */

import type { GameWorldState } from "./GameState";
import { COUNTDOWN_TICKS } from "../config/constants";
import { createProjectile } from "../entities/Projectile";

export const KNIFE_REGEN_TICKS = 90; // 1.5 seconds per knife

/** Start the countdown before gameplay. */
export function startCountdown(state: GameWorldState): GameWorldState {
  return { ...state, countdownTicks: COUNTDOWN_TICKS };
}

/** Toggle pause state. */
export function togglePause(state: GameWorldState): GameWorldState {
  return { ...state, paused: !state.paused };
}

/** Throw a projectile (knife) from the player toward a target position. */
export function throwProjectile(
  state: GameWorldState,
  targetX: number,
  targetY: number,
): GameWorldState {
  if (state.gameOver || state.isDying) return state;
  if (!state.enemiesEnabled && !state.inBossFight) return state;
  const infinite = state.debugConfig.infiniteKnives;
  if (!infinite && state.knifeAmmo <= 0) return state;
  const playerCX = state.player.x + state.player.width / 2;
  const playerCY = state.player.y + state.player.height / 2;
  const proj = createProjectile(playerCX, playerCY, targetX, targetY);
  const newAmmo = infinite ? state.knifeAmmo : state.knifeAmmo - 1;
  return {
    ...state,
    projectiles: [...state.projectiles, proj],
    knifeAmmo: newAmmo,
    knifeRegenTimer: infinite
      ? 0
      : state.knifeRegenTimer > 0
        ? state.knifeRegenTimer
        : KNIFE_REGEN_TICKS,
  };
}
