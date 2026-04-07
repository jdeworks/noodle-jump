/** Accessor helpers for GameScene — read-only state queries. */

import type { GameWorldState } from "./GameState";
import { getMaxDuration } from "./effectDuration";

export function getActiveEffectProgress(state: GameWorldState): number {
  return state.activeEffect
    ? state.activeEffect.ticksRemaining / getMaxDuration(state.activeEffect.type)
    : 0;
}

export function getCountdownSeconds(state: GameWorldState): number | undefined {
  return state.countdownTicks < 0 ? undefined : Math.ceil(state.countdownTicks / 60);
}

export function getZoneProgress(state: GameWorldState): number {
  const th = [0, 80, 280, 500, 750, 1000, 1300],
    z = state.zoneState.currentZone;
  return z >= th.length - 1
    ? 1
    : Math.min(1, (state.platformsPassed - th[z]) / (th[z + 1] - th[z]));
}

export function checkNewHighScore(state: GameWorldState): boolean {
  return (
    !state.highScoreBeatShown && state.highScore > 0 && state.scoreState.points > state.highScore
  );
}
