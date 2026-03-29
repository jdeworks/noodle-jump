/** Pure platform logic — no PixiJS imports. */

import {
  PLATFORM_WIDTH_MIN,
  PLATFORM_WIDTH_MAX,
  PLATFORM_HEIGHT,
  PLATFORM_GAP_MIN,
  PLATFORM_GAP_MAX,
  PLATFORM_HORIZONTAL_MARGIN,
  PLATFORM_BREAK_CHANCE,
  PLATFORM_BRITTLE_CHANCE,
  PLATFORM_MOVING_CHANCE,
  PLATFORM_MOVING_SPEED,
  PLATFORM_MOVING_RANGE,
  GAME_WIDTH,
} from '../config/constants'

export type PlatformType = 'static' | 'breaking' | 'brittle' | 'moving' | 'lasagna'

/** Whether a platform can support a landing (player won't fall through). */
export function isSolid(type: PlatformType): boolean {
  return type === 'static' || type === 'moving' || type === 'breaking' || type === 'lasagna'
}

export interface PlatformState {
  x: number
  y: number
  width: number
  height: number
  type: PlatformType
  broken: boolean
  id: number
  originX: number
  moveDirection: number
}

let nextPlatformId = 0

function randomWidth(): number {
  return PLATFORM_WIDTH_MIN + Math.random() * (PLATFORM_WIDTH_MAX - PLATFORM_WIDTH_MIN)
}

export function createPlatform(x: number, y: number, type: PlatformType = 'static'): PlatformState {
  return {
    x,
    y,
    width: randomWidth(),
    height: PLATFORM_HEIGHT,
    type,
    broken: false,
    id: nextPlatformId++,
    originX: x,
    moveDirection: Math.random() > 0.5 ? 1 : -1,
  }
}

/** Create a full-width ground floor so the player can't die at the start. */
export function createGroundPlatform(gameHeight: number): PlatformState {
  return {
    x: 0,
    y: gameHeight - 50,
    width: GAME_WIDTH,
    height: PLATFORM_HEIGHT,
    type: 'static',
    broken: false,
    id: nextPlatformId++,
    originX: 0,
    moveDirection: 0,
  }
}

/** Update moving platforms. Call each tick. */
export function updatePlatforms(platforms: PlatformState[]): PlatformState[] {
  return platforms.map((p) => {
    if (p.type !== 'moving') return p

    let { x, moveDirection } = p

    x += PLATFORM_MOVING_SPEED * moveDirection

    if (x + p.width > GAME_WIDTH) {
      x = GAME_WIDTH - p.width
      moveDirection = -1
    } else if (x < 0) {
      x = 0
      moveDirection = 1
    } else if (x > p.originX + PLATFORM_MOVING_RANGE) {
      x = p.originX + PLATFORM_MOVING_RANGE
      moveDirection = -1
    } else if (x < p.originX - PLATFORM_MOVING_RANGE) {
      x = p.originX - PLATFORM_MOVING_RANGE
      moveDirection = 1
    }

    return { ...p, x, moveDirection }
  })
}

function rollType(): PlatformType {
  const roll = Math.random()
  if (roll < PLATFORM_BREAK_CHANCE) return 'breaking'
  if (roll < PLATFORM_BREAK_CHANCE + PLATFORM_BRITTLE_CHANCE) return 'brittle'
  if (roll < PLATFORM_BREAK_CHANCE + PLATFORM_BRITTLE_CHANCE + PLATFORM_MOVING_CHANCE) return 'moving'
  return 'static'
}

/**
 * Generate a batch of platforms above the highest existing one.
 * Guarantees the game is always possible: never two consecutive
 * unlandable (brittle) platforms — at least every other platform is solid.
 */
export function generatePlatforms(
  highestY: number,
  count: number,
): PlatformState[] {
  const platforms: PlatformState[] = []
  let y = highestY
  let lastWasUnlandable = false

  for (let i = 0; i < count; i++) {
    // After an unlandable platform, tighten the gap so the next one is easy to reach
    const maxGap = lastWasUnlandable ? PLATFORM_GAP_MIN + 20 : PLATFORM_GAP_MAX
    const gap = PLATFORM_GAP_MIN + Math.random() * (maxGap - PLATFORM_GAP_MIN)
    y -= gap

    const width = randomWidth()
    const maxX = GAME_WIDTH - width - PLATFORM_HORIZONTAL_MARGIN
    const x = PLATFORM_HORIZONTAL_MARGIN + Math.random() * Math.max(0, maxX)

    let type = rollType()

    // Possibility check: if the last platform was unlandable,
    // force this one to be solid so there's always a reachable platform.
    if (lastWasUnlandable && !isSolid(type)) {
      type = 'static'
    }

    lastWasUnlandable = !isSolid(type)

    platforms.push({
      x,
      y,
      width,
      height: PLATFORM_HEIGHT,
      type,
      broken: false,
      id: nextPlatformId++,
      originX: x,
      moveDirection: Math.random() > 0.5 ? 1 : -1,
    })
  }

  return platforms
}

/** Mark a breaking platform as broken. Returns updated platform. */
export function breakPlatform(platform: PlatformState): PlatformState {
  return { ...platform, broken: true }
}

/** Remove platforms that are far below the camera. */
export function pruneBelow(platforms: PlatformState[], threshold: number): PlatformState[] {
  return platforms.filter((p) => p.y < threshold)
}

/** Reset the ID counter (useful for tests). */
export function resetPlatformIds(): void {
  nextPlatformId = 0
}
