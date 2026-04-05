/** Screen shake — pure logic, no PixiJS. */

export interface ShakeState {
  intensity: number;
  ticksRemaining: number;
  totalTicks: number;
}

export function createShake(intensity: number, duration: number): ShakeState {
  return { intensity, ticksRemaining: duration, totalTicks: duration };
}

export interface ShakeResult {
  state: ShakeState | null;
  offsetX: number;
  offsetY: number;
}

export function tickShake(state: ShakeState, speedScale = 1): ShakeResult {
  const remaining = state.ticksRemaining - speedScale;
  if (remaining <= 0) {
    return { state: null, offsetX: 0, offsetY: 0 };
  }

  const decay = remaining / state.totalTicks;
  const currentIntensity = state.intensity * decay;
  const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
  const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;

  return {
    state: { ...state, ticksRemaining: remaining },
    offsetX,
    offsetY,
  };
}
