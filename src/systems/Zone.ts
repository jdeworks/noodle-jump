/** Zone system — tracks progression and provides theme data. Pure logic. */

import { ZONE_THRESHOLDS } from '../config/constants'

export interface ZoneTheme {
  background: number
  platform: number
  platformBreaking: number
  platformBrittle: number
  platformMoving: number
  platformLasagna: number
  parallaxFar: number
  parallaxMid: number
  parallaxNear: number
}

const ZONE_THEMES: ZoneTheme[] = [
  {
    // Zone 1: Warm pasta kitchen
    background: 0xfff8e7,
    platform: 0xd4a574,
    platformBreaking: 0x8b6914,
    platformBrittle: 0xc4a882,
    platformMoving: 0xc8915a,
    platformLasagna: 0xff8c00,
    parallaxFar: 0xf5e6c8,
    parallaxMid: 0xebd5aa,
    parallaxNear: 0xe0c48c,
  },
  {
    // Zone 2: Steamy clouds / boiling zone
    background: 0xd4e6f1,
    platform: 0x7fb3d8,
    platformBreaking: 0x5a9bc2,
    platformBrittle: 0xa8cfe0,
    platformMoving: 0x6da7cf,
    platformLasagna: 0xffa333,
    parallaxFar: 0xc5dff0,
    parallaxMid: 0xaed0e8,
    parallaxNear: 0x98c1de,
  },
  {
    // Zone 3: Void pasta — dark, abstract
    background: 0x1a1a2e,
    platform: 0x6c3483,
    platformBreaking: 0x4a235a,
    platformBrittle: 0x8e6b9e,
    platformMoving: 0x7d3c98,
    platformLasagna: 0xff6600,
    parallaxFar: 0x16213e,
    parallaxMid: 0x0f3460,
    parallaxNear: 0x1a1a40,
  },
]

export interface ZoneState {
  currentZone: number
  platformsPassed: number
}

export function createZoneState(): ZoneState {
  return { currentZone: 0, platformsPassed: 0 }
}

/** Update zone based on total platform count. Returns updated state and whether zone changed. */
export function updateZone(state: ZoneState, totalPlatformCount: number): { state: ZoneState; changed: boolean } {
  let zone = 0
  for (let i = ZONE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPlatformCount >= ZONE_THRESHOLDS[i]) {
      zone = i
      break
    }
  }

  const changed = zone !== state.currentZone
  return {
    state: { currentZone: zone, platformsPassed: totalPlatformCount },
    changed,
  }
}

/** Get the theme for the current zone. */
export function getZoneTheme(zone: number): ZoneTheme {
  return ZONE_THEMES[Math.min(zone, ZONE_THEMES.length - 1)]
}

/**
 * Lerp between two colors for smooth zone transitions.
 * t = 0 returns colorA, t = 1 returns colorB.
 */
export function lerpColor(colorA: number, colorB: number, t: number): number {
  const rA = (colorA >> 16) & 0xff
  const gA = (colorA >> 8) & 0xff
  const bA = colorA & 0xff

  const rB = (colorB >> 16) & 0xff
  const gB = (colorB >> 8) & 0xff
  const bB = colorB & 0xff

  const r = Math.round(rA + (rB - rA) * t)
  const g = Math.round(gA + (gB - gA) * t)
  const b = Math.round(bA + (bB - bA) * t)

  return (r << 16) | (g << 8) | b
}

/**
 * Get an interpolated theme for smooth transitions between zones.
 * Transitions over 20 platforms around each threshold.
 */
export function getInterpolatedTheme(platformCount: number): ZoneTheme {
  const TRANSITION_RANGE = 20

  for (let i = ZONE_THRESHOLDS.length - 1; i > 0; i--) {
    const threshold = ZONE_THRESHOLDS[i]
    const transStart = threshold - TRANSITION_RANGE / 2
    const transEnd = threshold + TRANSITION_RANGE / 2

    if (platformCount >= transStart && platformCount <= transEnd) {
      const t = (platformCount - transStart) / TRANSITION_RANGE
      const themeA = ZONE_THEMES[i - 1]
      const themeB = ZONE_THEMES[Math.min(i, ZONE_THEMES.length - 1)]

      return {
        background: lerpColor(themeA.background, themeB.background, t),
        platform: lerpColor(themeA.platform, themeB.platform, t),
        platformBreaking: lerpColor(themeA.platformBreaking, themeB.platformBreaking, t),
        platformBrittle: lerpColor(themeA.platformBrittle, themeB.platformBrittle, t),
        platformMoving: lerpColor(themeA.platformMoving, themeB.platformMoving, t),
        platformLasagna: lerpColor(themeA.platformLasagna, themeB.platformLasagna, t),
        parallaxFar: lerpColor(themeA.parallaxFar, themeB.parallaxFar, t),
        parallaxMid: lerpColor(themeA.parallaxMid, themeB.parallaxMid, t),
        parallaxNear: lerpColor(themeA.parallaxNear, themeB.parallaxNear, t),
      }
    }
  }

  // No transition — return current zone theme
  let zone = 0
  for (let i = ZONE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (platformCount >= ZONE_THRESHOLDS[i]) {
      zone = i
      break
    }
  }
  return ZONE_THEMES[Math.min(zone, ZONE_THEMES.length - 1)]
}
