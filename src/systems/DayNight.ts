/** Day/night cycle — subtle brightness variation. Pure logic. */

/** Cycle period in ticks (~5 minutes at 60fps). */
const CYCLE_PERIOD = 18000;

/** Min brightness (night). */
const MIN_BRIGHTNESS = 0.85;

/** Max brightness (day). */
const MAX_BRIGHTNESS = 1.0;

export interface DayNightState {
  /** Elapsed ticks. */
  ticks: number;
  /** Current brightness 0-1. */
  brightness: number;
  /** Current tint color overlay. */
  tint: number;
}

export function createDayNight(): DayNightState {
  return { ticks: 0, brightness: MAX_BRIGHTNESS, tint: 0x000000 };
}

/** Tick the day/night cycle. */
export function tickDayNight(state: DayNightState): DayNightState {
  const ticks = state.ticks + 1;
  const phase = (ticks % CYCLE_PERIOD) / CYCLE_PERIOD; // 0-1
  // Sinusoidal brightness: max at noon, min at midnight
  const brightness =
    MIN_BRIGHTNESS +
    (MAX_BRIGHTNESS - MIN_BRIGHTNESS) * (0.5 + 0.5 * Math.cos(phase * Math.PI * 2));

  // Subtle blue tint at low brightness (night)
  const nightness = 1 - (brightness - MIN_BRIGHTNESS) / (MAX_BRIGHTNESS - MIN_BRIGHTNESS);
  const tintBlue = Math.round(nightness * 30);
  const tint = (0 << 16) | (0 << 8) | tintBlue;

  return { ticks, brightness, tint };
}
