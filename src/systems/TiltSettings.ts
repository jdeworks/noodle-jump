/** Control mode and tilt settings — persisted in localStorage. */

const INVERT_KEY = "noodle-jump-tilt-inverted";
const CONTROL_KEY = "noodle-jump-control-mode";

/** PC control modes (no tilt hardware). */
export type PcControlMode = "arrows" | "wasd" | "click";
/** Mobile control modes (tilt hardware available). */
export type MobileControlMode = "motion" | "touch";
export type ControlMode = PcControlMode | MobileControlMode;

const PC_MODES: PcControlMode[] = ["arrows", "wasd", "click"];
const MOBILE_MODES: MobileControlMode[] = ["motion", "touch"];

export function isMobileDevice(): boolean {
  return navigator.maxTouchPoints > 0;
}

export function getControlMode(): ControlMode {
  try {
    const stored = localStorage.getItem(CONTROL_KEY);
    const modes = isMobileDevice() ? MOBILE_MODES : PC_MODES;
    if (stored && (modes as string[]).includes(stored)) return stored as ControlMode;
    return modes[0]; // default: arrows (PC) or motion (mobile)
  } catch {
    return isMobileDevice() ? "motion" : "arrows";
  }
}

export function setControlMode(mode: ControlMode): void {
  try {
    localStorage.setItem(CONTROL_KEY, mode);
  } catch {
    // ignore
  }
}

/** Cycle to the next control mode for the current platform. */
export function cycleControlMode(): ControlMode {
  const modes = isMobileDevice() ? MOBILE_MODES : PC_MODES;
  const current = getControlMode();
  const idx = (modes as string[]).indexOf(current);
  const next = modes[(idx + 1) % modes.length];
  setControlMode(next);
  return next;
}

/** Whether the current mode uses touch/click (tap halves) rather than keyboard/tilt. */
export function isTouchControlsForced(): boolean {
  const mode = getControlMode();
  return mode === "click" || mode === "touch";
}

/**
 * Override control mode for online multiplayer fairness sync.
 * `true` forces touch/click, `false` restores the user's saved preference.
 */
let savedMode: ControlMode | null = null;
export function setTouchControlsForced(forced: boolean): void {
  if (forced) {
    savedMode = getControlMode();
    setControlMode(isMobileDevice() ? "touch" : "click");
  } else if (savedMode !== null) {
    setControlMode(savedMode);
    savedMode = null;
  }
}

export function isTiltInverted(): boolean {
  try {
    return localStorage.getItem(INVERT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTiltInverted(inverted: boolean): void {
  try {
    localStorage.setItem(INVERT_KEY, inverted ? "1" : "0");
  } catch {
    // ignore
  }
}
