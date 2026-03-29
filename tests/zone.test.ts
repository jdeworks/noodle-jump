import { describe, test, expect } from 'vitest'
import {
  createZoneState,
  updateZone,
  getZoneTheme,
  getInterpolatedTheme,
  lerpColor,
} from '../src/systems/Zone'
import { ZONE_THRESHOLDS } from '../src/config/constants'

describe('Zone', () => {
  test('starts at zone 0', () => {
    const state = createZoneState()
    expect(state.currentZone).toBe(0)
  })

  test('transitions to zone 1 at second threshold', () => {
    const state = createZoneState()
    const result = updateZone(state, ZONE_THRESHOLDS[1])
    expect(result.state.currentZone).toBe(1)
    expect(result.changed).toBe(true)
  })

  test('transitions to zone 2 at third threshold', () => {
    const state = createZoneState()
    const result = updateZone(state, ZONE_THRESHOLDS[2])
    expect(result.state.currentZone).toBe(2)
    expect(result.changed).toBe(true)
  })

  test('does not change within same zone', () => {
    // Stay well within zone 0 (below first threshold)
    const mid = Math.floor(ZONE_THRESHOLDS[1] / 2)
    const state = { currentZone: 0, platformsPassed: mid }
    const result = updateZone(state, mid + 1)
    expect(result.changed).toBe(false)
  })

  test('each zone has a distinct theme', () => {
    const theme0 = getZoneTheme(0)
    const theme1 = getZoneTheme(1)
    const theme2 = getZoneTheme(2)
    expect(theme0.background).not.toBe(theme1.background)
    expect(theme1.background).not.toBe(theme2.background)
  })

  test('lerpColor interpolates correctly', () => {
    expect(lerpColor(0x000000, 0xffffff, 0)).toBe(0x000000)
    expect(lerpColor(0x000000, 0xffffff, 1)).toBe(0xffffff)
    const mid = lerpColor(0x000000, 0xffffff, 0.5)
    // Should be roughly 0x808080
    expect((mid >> 16) & 0xff).toBeCloseTo(128, -1)
  })

  test('interpolated theme transitions smoothly around threshold', () => {
    const t = ZONE_THRESHOLDS[2]
    const before = getInterpolatedTheme(t - 10)
    const during = getInterpolatedTheme(t)
    const after = getInterpolatedTheme(t + 10)
    // During transition, background should be between zone 0 and zone 1
    expect(during.background).not.toBe(before.background)
    expect(during.background).not.toBe(after.background)
  })
})
