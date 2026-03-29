import { describe, test, expect, beforeEach } from 'vitest'
import {
  createPowerUp,
  collectPowerUps,
  applyPowerUp,
  tickEffect,
  spawnPowerUps,
  resetPowerUpIds,
} from '../src/entities/PowerUp'
import { createPlatform, resetPlatformIds } from '../src/entities/Platform'
import { createPlayer } from '../src/entities/Player'
import {
  SPAGHETTI_SPRING_VELOCITY,
  FUSILLI_TORNADO_DURATION,
  FUSILLI_TORNADO_VELOCITY,
  RAVIOLI_ROCKET_DURATION,
  RAVIOLI_ROCKET_VELOCITY,
  LASAGNA_LAYERS_DURATION,
  LASAGNA_GRAVITY_MULTIPLIER,
  POWERUP_FLOAT_HEIGHT,
} from '../src/config/constants'

beforeEach(() => {
  resetPowerUpIds()
  resetPlatformIds()
})

describe('PowerUp', () => {
  test('creates power-up above platform', () => {
    const platform = createPlatform(100, 300)
    const pu = createPowerUp(platform, 'spaghetti_spring')
    expect(pu.y).toBe(300 - POWERUP_FLOAT_HEIGHT)
    expect(pu.type).toBe('spaghetti_spring')
    expect(pu.collected).toBe(false)
  })

  test('collectPowerUps detects overlap', () => {
    const platform = createPlatform(100, 300)
    const pu = createPowerUp(platform, 'fusilli_tornado')
    const player = createPlayer(pu.x, pu.y)

    const result = collectPowerUps(player, [pu])
    expect(result.collected).toBe('fusilli_tornado')
    expect(result.powerUps[0].collected).toBe(true)
  })

  test('collectPowerUps skips already collected', () => {
    const platform = createPlatform(100, 300)
    const pu = { ...createPowerUp(platform), collected: true }
    const player = createPlayer(pu.x, pu.y)

    const result = collectPowerUps(player, [pu])
    expect(result.collected).toBeNull()
  })

  test('spaghetti spring gives instant super jump', () => {
    const player = createPlayer(100, 300)
    const result = applyPowerUp(player, 'spaghetti_spring')
    expect(result.player.vy).toBe(SPAGHETTI_SPRING_VELOCITY)
    expect(result.effect).toBeNull()
  })

  test('fusilli tornado gives sustained upward flight', () => {
    const player = createPlayer(100, 300)
    const result = applyPowerUp(player, 'fusilli_tornado')
    expect(result.player.vy).toBe(FUSILLI_TORNADO_VELOCITY)
    expect(result.effect).not.toBeNull()
    expect(result.effect!.ticksRemaining).toBe(FUSILLI_TORNADO_DURATION)
  })

  test('ravioli rocket gives sustained flight', () => {
    const player = createPlayer(100, 300)
    const result = applyPowerUp(player, 'ravioli_rocket')
    expect(result.player.vy).toBe(RAVIOLI_ROCKET_VELOCITY)
    expect(result.effect).not.toBeNull()
    expect(result.effect!.ticksRemaining).toBe(RAVIOLI_ROCKET_DURATION)
  })

  test('lasagna layers gives slow fall effect with bounce', () => {
    const player = createPlayer(100, 300)
    const result = applyPowerUp(player, 'lasagna_layers')
    expect(result.effect).not.toBeNull()
    expect(result.effect!.type).toBe('lasagna_layers')
    expect(result.effect!.ticksRemaining).toBe(LASAGNA_LAYERS_DURATION)
    expect(result.player.vy).toBeLessThan(0) // bounce on pickup
  })

  test('lasagna effect slows downward velocity', () => {
    const player = { ...createPlayer(100, 300), vy: 5 } // falling
    const effect = { type: 'lasagna_layers' as const, ticksRemaining: 100 }

    const result = tickEffect(player, effect)
    // Downward velocity should be reduced
    expect(result.player.vy).toBeLessThan(5)
    expect(result.player.vy).toBeCloseTo(5 * LASAGNA_GRAVITY_MULTIPLIER)
  })

  test('lasagna effect does not slow upward velocity', () => {
    const player = { ...createPlayer(100, 300), vy: -10 } // jumping up
    const effect = { type: 'lasagna_layers' as const, ticksRemaining: 100 }

    const result = tickEffect(player, effect)
    expect(result.player.vy).toBe(-10) // unchanged
  })

  test('tickEffect counts down and expires', () => {
    const player = createPlayer(100, 300)
    let effect = { type: 'fusilli_tornado' as const, ticksRemaining: 3 }

    let result = tickEffect(player, effect)
    expect(result.effect!.ticksRemaining).toBe(2)
    expect(result.player.vy).toBe(FUSILLI_TORNADO_VELOCITY)

    result = tickEffect(result.player, result.effect!)
    expect(result.effect!.ticksRemaining).toBe(1)

    result = tickEffect(result.player, result.effect!)
    expect(result.effect).toBeNull()
  })

  test('tornado and rocket override velocity each tick', () => {
    const player = createPlayer(100, 300)

    const tornado = tickEffect({ ...player, vy: 5 }, { type: 'fusilli_tornado', ticksRemaining: 10 })
    expect(tornado.player.vy).toBe(FUSILLI_TORNADO_VELOCITY)

    const rocket = tickEffect({ ...player, vy: 5 }, { type: 'ravioli_rocket', ticksRemaining: 10 })
    expect(rocket.player.vy).toBe(RAVIOLI_ROCKET_VELOCITY)
  })

  test('spawnPowerUps respects cooldown', () => {
    const platforms = Array.from({ length: 50 }, (_, i) =>
      createPlatform(100, 300 - i * 80),
    )
    for (let run = 0; run < 5; run++) {
      const pus = spawnPowerUps(platforms)
      for (let i = 1; i < pus.length; i++) {
        const prevIdx = platforms.findIndex((p) => p.id === pus[i - 1].platformId)
        const currIdx = platforms.findIndex((p) => p.id === pus[i].platformId)
        expect(currIdx - prevIdx).toBeGreaterThan(1)
      }
    }
  })

  test('spawnPowerUps skips breaking and brittle platforms', () => {
    const platforms = [
      createPlatform(100, 300, 'breaking'),
      createPlatform(100, 200, 'brittle'),
      createPlatform(100, 100, 'static'),
    ]
    for (let run = 0; run < 20; run++) {
      const pus = spawnPowerUps(platforms)
      for (const pu of pus) {
        const platform = platforms.find((p) => p.id === pu.platformId)!
        expect(platform.type).not.toBe('breaking')
        expect(platform.type).not.toBe('brittle')
      }
    }
  })
})
