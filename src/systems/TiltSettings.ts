/** Tilt and touch control settings — persisted in localStorage. */

const KEY = "noodle-jump-tilt-inverted";
const TOUCH_KEY = "noodle-jump-touch-controls";

export function isTiltInverted(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setTiltInverted(inverted: boolean): void {
  try {
    localStorage.setItem(KEY, inverted ? "1" : "0");
  } catch {
    // ignore
  }
}

/** Whether touch controls are forced (tap left/right half instead of tilt). */
export function isTouchControlsForced(): boolean {
  try {
    return localStorage.getItem(TOUCH_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTouchControlsForced(forced: boolean): void {
  try {
    localStorage.setItem(TOUCH_KEY, forced ? "1" : "0");
  } catch {
    // ignore
  }
}
