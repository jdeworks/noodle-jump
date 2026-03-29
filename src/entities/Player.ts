/** Pure player logic — no PixiJS imports. */

import {
  GRAVITY,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_JUMP_VELOCITY,
  PLAYER_MAX_HORIZONTAL_SPEED,
  GAME_WIDTH,
} from '../config/constants'

export interface PlayerState {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  isJumping: boolean
}

export function createPlayer(x: number, y: number): PlayerState {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    isJumping: false,
  }
}

/** Apply horizontal input, gravity, and movement. Called each fixed timestep. */
export function updatePlayer(player: PlayerState, inputX: number): PlayerState {
  let { x, y, vx, vy } = player

  // Horizontal movement from input
  vx = inputX * PLAYER_MAX_HORIZONTAL_SPEED

  // Gravity
  vy += GRAVITY

  // Apply velocity
  x += vx
  y += vy

  // Screen wrap (left/right)
  if (x + player.width < 0) {
    x = GAME_WIDTH
  } else if (x > GAME_WIDTH) {
    x = -player.width
  }

  return {
    ...player,
    x,
    y,
    vx,
    vy,
    isJumping: vy < 0,
  }
}

/** Trigger a jump — sets vertical velocity upward. */
export function playerJump(player: PlayerState, velocity?: number): PlayerState {
  return {
    ...player,
    vy: velocity ?? PLAYER_JUMP_VELOCITY,
    isJumping: true,
  }
}
