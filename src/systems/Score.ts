/** Scoring system — pure logic, no PixiJS. */

import { MEATBALL_POINTS, POWERUP_POINTS, GAME_HEIGHT } from '../config/constants'

const HIGH_SCORE_KEY = 'noodle-jump-high-score'

export interface ScoreState {
  points: number
  height: number
  meatballsCollected: number
  powerUpsCollected: number
  highestHeight: number
}

export function createScoreState(): ScoreState {
  return {
    points: 0,
    height: 0,
    meatballsCollected: 0,
    powerUpsCollected: 0,
    highestHeight: 0,
  }
}

/** Update height-based score from player Y position. */
export function updateHeightScore(state: ScoreState, playerY: number): ScoreState {
  const currentHeight = Math.max(0, Math.floor((GAME_HEIGHT - playerY) / 10))
  if (currentHeight <= state.highestHeight) return state

  const heightGain = currentHeight - state.highestHeight
  return {
    ...state,
    height: currentHeight,
    highestHeight: currentHeight,
    points: state.points + heightGain * 2,
  }
}

/** Add points for collecting a meatball. */
export function addMeatballScore(state: ScoreState, count: number): ScoreState {
  return {
    ...state,
    meatballsCollected: state.meatballsCollected + count,
    points: state.points + count * MEATBALL_POINTS,
  }
}

/** Add points for collecting a power-up. */
export function addPowerUpScore(state: ScoreState): ScoreState {
  return {
    ...state,
    powerUpsCollected: state.powerUpsCollected + 1,
    points: state.points + POWERUP_POINTS,
  }
}

/** Load high score from localStorage. */
export function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY)
    return stored ? parseInt(stored, 10) || 0 : 0
  } catch {
    return 0
  }
}

/** Save high score to localStorage if it's a new record. Returns true if new record. */
export function saveHighScore(score: number): boolean {
  const current = loadHighScore()
  if (score > current) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(score))
    } catch {
      // localStorage might be full or blocked
    }
    return true
  }
  return false
}
