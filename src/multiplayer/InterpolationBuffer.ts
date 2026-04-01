/**
 * Interpolation buffer for smooth remote player rendering.
 * Receives position updates at ~20Hz, outputs smooth positions at 60FPS.
 * Uses lerp toward target + velocity-based extrapolation between updates.
 */

export interface InterpolatedState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0 = alive, 1 = dead, 2 = ghost */
  playerState: number;
}

const LERP_FACTOR = 0.2;

export class InterpolationBuffer {
  private targetX = 0;
  private targetY = 0;
  private targetVx = 0;
  private targetVy = 0;
  private currentX = 0;
  private currentY = 0;
  private currentVx = 0;
  private currentVy = 0;
  private _playerState = 0;
  private hasReceivedUpdate = false;

  /** Feed a new position update from the network (called at ~20Hz). */
  pushUpdate(x: number, y: number, vx: number, vy: number, playerState: number): void {
    this.targetX = x;
    this.targetY = y;
    this.targetVx = vx;
    this.targetVy = vy;
    this._playerState = playerState;

    if (!this.hasReceivedUpdate) {
      // First update — snap to position
      this.currentX = x;
      this.currentY = y;
      this.currentVx = vx;
      this.currentVy = vy;
      this.hasReceivedUpdate = true;
    }
  }

  /** Get the interpolated state for this render frame (called at 60FPS). */
  getState(): InterpolatedState {
    if (!this.hasReceivedUpdate) {
      return { x: 0, y: 0, vx: 0, vy: 0, playerState: 0 };
    }

    // Lerp toward target
    this.currentX += (this.targetX - this.currentX) * LERP_FACTOR;
    this.currentY += (this.targetY - this.currentY) * LERP_FACTOR;
    this.currentVx += (this.targetVx - this.currentVx) * LERP_FACTOR;
    this.currentVy += (this.targetVy - this.currentVy) * LERP_FACTOR;

    // Extrapolate using velocity for smoother motion between updates
    const extraX = this.currentX + this.currentVx * 0.3;
    const extraY = this.currentY + this.currentVy * 0.3;

    return {
      x: extraX,
      y: extraY,
      vx: this.currentVx,
      vy: this.currentVy,
      playerState: this._playerState,
    };
  }

  get isReady(): boolean {
    return this.hasReceivedUpdate;
  }

  get playerState(): number {
    return this._playerState;
  }

  reset(): void {
    this.hasReceivedUpdate = false;
    this.targetX = 0;
    this.targetY = 0;
    this.targetVx = 0;
    this.targetVy = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.currentVx = 0;
    this.currentVy = 0;
    this._playerState = 0;
  }
}
