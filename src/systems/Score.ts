/** Scoring system — pure logic, no PixiJS. */

import {
  MEATBALL_POINTS,
  POWERUP_POINTS,
  GAME_HEIGHT,
  COMBO_TIMEOUT_TICKS,
  COMBO_MAX_MULTIPLIER,
  CLOSE_CALL_BONUS,
  LANDING_STREAK_INTERVAL,
  LANDING_STREAK_BONUS,
} from "../config/constants";

const HIGH_SCORE_KEY = "noodle-jump-high-score";

export interface ScoreState {
  points: number;
  height: number;
  meatballsCollected: number;
  powerUpsCollected: number;
  highestHeight: number;
  comboCount: number;
  comboMultiplier: number;
  comboTimer: number;
  landingStreak: number;
}

export function createScoreState(): ScoreState {
  return {
    points: 0,
    height: 0,
    meatballsCollected: 0,
    powerUpsCollected: 0,
    highestHeight: 0,
    comboCount: 0,
    comboMultiplier: 1,
    comboTimer: 0,
    landingStreak: 0,
  };
}

/** Update height-based score from player Y position. */
export function updateHeightScore(state: ScoreState, playerY: number): ScoreState {
  const currentHeight = Math.max(0, Math.floor((GAME_HEIGHT - playerY) / 10));
  if (currentHeight <= state.highestHeight) return state;

  const heightGain = currentHeight - state.highestHeight;
  return {
    ...state,
    height: currentHeight,
    highestHeight: currentHeight,
    points: state.points + heightGain * 2,
  };
}

/** Add points for collecting a meatball with combo multiplier. */
export function addMeatballScore(state: ScoreState, count: number): ScoreState {
  const newCombo = state.comboCount + count;
  const newMultiplier = Math.min(COMBO_MAX_MULTIPLIER, 1 + Math.floor(newCombo / 2));
  const points = count * MEATBALL_POINTS * state.comboMultiplier;
  return {
    ...state,
    meatballsCollected: state.meatballsCollected + count,
    points: state.points + points,
    comboCount: newCombo,
    comboMultiplier: newMultiplier,
    comboTimer: COMBO_TIMEOUT_TICKS,
  };
}

/** Tick down combo timer. Call once per frame. */
export function tickCombo(state: ScoreState, speedScale = 1): ScoreState {
  if (state.comboTimer <= 0) return state;
  const timer = state.comboTimer - speedScale;
  if (timer <= 0) {
    return { ...state, comboTimer: 0, comboCount: 0, comboMultiplier: 1 };
  }
  return { ...state, comboTimer: timer };
}

/** Add close call bonus for landing on a platform edge. */
export function addCloseCallBonus(state: ScoreState): ScoreState {
  return { ...state, points: state.points + CLOSE_CALL_BONUS };
}

/** Record a platform landing and award streak bonus every N landings. */
export function addLandingStreak(state: ScoreState): ScoreState {
  const streak = state.landingStreak + 1;
  const bonus = streak % LANDING_STREAK_INTERVAL === 0 ? LANDING_STREAK_BONUS : 0;
  return { ...state, landingStreak: streak, points: state.points + bonus };
}

/** Reset landing streak (e.g., on death or missed platform). */
export function resetLandingStreak(state: ScoreState): ScoreState {
  return { ...state, landingStreak: 0 };
}

/** Add points for collecting a power-up. */
export function addPowerUpScore(state: ScoreState): ScoreState {
  return {
    ...state,
    powerUpsCollected: state.powerUpsCollected + 1,
    points: state.points + POWERUP_POINTS,
  };
}

/** Load high score from localStorage. */
export function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    return stored ? parseInt(stored, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/** Save high score to localStorage if it's a new record. Returns true if new record. */
export function saveHighScore(score: number): boolean {
  const current = loadHighScore();
  if (score > current) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
    } catch {
      // localStorage might be full or blocked
    }
    return true;
  }
  return false;
}
