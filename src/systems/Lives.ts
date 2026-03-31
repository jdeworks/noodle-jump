/** Optional lives/health system — pure logic. */

export interface LivesState {
  lives: number;
  maxLives: number;
  enabled: boolean;
}

export function createLivesState(enabled = false, maxLives = 3): LivesState {
  return { lives: maxLives, maxLives, enabled };
}

/** Lose a life. Returns updated state and whether game is over. */
export function loseLife(state: LivesState): { state: LivesState; gameOver: boolean } {
  if (!state.enabled) return { state, gameOver: true }; // no lives mode = instant death
  const lives = state.lives - 1;
  return {
    state: { ...state, lives },
    gameOver: lives <= 0,
  };
}

/** Gain a life (e.g., from achievement or pickup). */
export function gainLife(state: LivesState): LivesState {
  if (!state.enabled) return state;
  return {
    ...state,
    lives: Math.min(state.lives + 1, state.maxLives),
  };
}

/** Check if the player has lives remaining. */
export function hasLives(state: LivesState): boolean {
  return state.enabled && state.lives > 0;
}

/** Reset lives to max. */
export function resetLives(state: LivesState): LivesState {
  return { ...state, lives: state.maxLives };
}
