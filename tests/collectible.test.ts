import { describe, test, expect, beforeEach } from 'vitest'
import {
  createMeatball,
  collectMeatballs,
  pruneMeatballs,
  resetCollectibleIds,
} from '../src/entities/Collectible'
import { createPlatform, resetPlatformIds } from '../src/entities/Platform'
import { MEATBALL_FLOAT_HEIGHT } from '../src/config/constants'

beforeEach(() => {
  resetCollectibleIds()
  resetPlatformIds()
})

describe('Collectibles', () => {
  test('meatball spawns above its platform', () => {
    const platform = createPlatform(100, 300)
    const meatball = createMeatball(platform)
    expect(meatball.y).toBe(300 - MEATBALL_FLOAT_HEIGHT)
    expect(meatball.platformId).toBe(platform.id)
    expect(meatball.collected).toBe(false)
  })

  test('player collects overlapping meatball', () => {
    const platform = createPlatform(100, 300)
    const meatball = createMeatball(platform)

    // Player overlapping the meatball
    const result = collectMeatballs(
      meatball.x - 5, meatball.y - 5,
      32, 40,
      [meatball],
    )

    expect(result.collected).toBe(1)
    expect(result.meatballs[0].collected).toBe(true)
  })

  test('player does not collect distant meatball', () => {
    const platform = createPlatform(100, 300)
    const meatball = createMeatball(platform)

    const result = collectMeatballs(
      0, 0, // far away
      32, 40,
      [meatball],
    )

    expect(result.collected).toBe(0)
    expect(result.meatballs[0].collected).toBe(false)
  })

  test('already collected meatball is skipped', () => {
    const platform = createPlatform(100, 300)
    const meatball = { ...createMeatball(platform), collected: true }

    const result = collectMeatballs(
      meatball.x, meatball.y,
      32, 40,
      [meatball],
    )

    expect(result.collected).toBe(0)
  })

  test('pruneMeatballs removes meatballs whose platform is gone', () => {
    const p1 = createPlatform(0, 100)
    const p2 = createPlatform(0, 200)
    const m1 = createMeatball(p1)
    const m2 = createMeatball(p2)

    // Only p1 is still active
    const result = pruneMeatballs([m1, m2], new Set([p1.id]))
    expect(result).toHaveLength(1)
    expect(result[0].platformId).toBe(p1.id)
  })
})
