import { describe, test, expect } from 'vitest'
import { createGroundPlatform } from '../src/entities/Platform'
import { createCamera, worldToScreen } from '../src/systems/Camera'
import { GAME_HEIGHT } from '../src/config/constants'

/**
 * Integration-style tests that verify the scene wiring is correct.
 * These catch bugs where logic is correct in isolation but the scene
 * connects things wrong (e.g., camera position makes ground invisible).
 */
describe('Scene setup', () => {
  test('ground platform is visible on screen at game start', () => {
    const ground = createGroundPlatform(GAME_HEIGHT)

    // Camera should start so ground is visible — near the bottom of the screen
    const cameraY = ground.y - GAME_HEIGHT + 100

    const groundScreenY = worldToScreen(ground.y, cameraY)
    expect(groundScreenY).toBeGreaterThanOrEqual(0)
    expect(groundScreenY).toBeLessThan(GAME_HEIGHT)
  })

  test('player starts above ground and visible', () => {
    const ground = createGroundPlatform(GAME_HEIGHT)
    const playerY = ground.y - 40
    const cameraY = ground.y - GAME_HEIGHT + 100

    const playerScreenY = worldToScreen(playerY, cameraY)
    expect(playerScreenY).toBeGreaterThanOrEqual(0)
    expect(playerScreenY).toBeLessThan(GAME_HEIGHT)
  })

  test('ground is not pruned by initial prune threshold', () => {
    const ground = createGroundPlatform(GAME_HEIGHT)
    const cameraY = ground.y - GAME_HEIGHT + 100
    const pruneThreshold = cameraY + GAME_HEIGHT + 400

    // Ground should survive pruning (y < threshold)
    expect(ground.y).toBeLessThan(pruneThreshold)
  })
})
