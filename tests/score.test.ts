import { describe, test, expect } from 'vitest'
import {
  createScoreState,
  updateHeightScore,
  addMeatballScore,
  addPowerUpScore,
} from '../src/systems/Score'
import { MEATBALL_POINTS, POWERUP_POINTS } from '../src/config/constants'

describe('Score', () => {
  test('starts at zero', () => {
    const state = createScoreState()
    expect(state.points).toBe(0)
    expect(state.height).toBe(0)
  })

  test('height score increases as player climbs', () => {
    let state = createScoreState()
    // Player at y=300 (lower Y = higher in game)
    state = updateHeightScore(state, 300)
    expect(state.height).toBeGreaterThan(0)
    expect(state.points).toBeGreaterThan(0)
  })

  test('height score does not decrease when player falls', () => {
    let state = createScoreState()
    state = updateHeightScore(state, 100) // high
    const highPoints = state.points
    state = updateHeightScore(state, 500) // fell down
    expect(state.points).toBe(highPoints) // no change
    expect(state.height).toBe(state.highestHeight)
  })

  test('meatball adds correct points', () => {
    let state = createScoreState()
    state = addMeatballScore(state, 3)
    expect(state.points).toBe(3 * MEATBALL_POINTS)
    expect(state.meatballsCollected).toBe(3)
  })

  test('power-up adds correct points', () => {
    let state = createScoreState()
    state = addPowerUpScore(state)
    expect(state.points).toBe(POWERUP_POINTS)
    expect(state.powerUpsCollected).toBe(1)
  })
})
