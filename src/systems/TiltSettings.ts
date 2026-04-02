/** Tilt inversion setting — persisted in localStorage. */

const KEY = "noodle-jump-tilt-inverted";

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
