/** Haptic feedback — Vibration API wrapper with graceful fallback. */

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/** Short impact vibration (landing, bounce). */
export function vibrateImpact(): void {
  if (canVibrate()) navigator.vibrate(15);
}

/** Medium vibration (power-up collected). */
export function vibratePowerUp(): void {
  if (canVibrate()) navigator.vibrate([20, 10, 20]);
}

/** Strong vibration (negative power-up). */
export function vibrateNegative(): void {
  if (canVibrate()) navigator.vibrate([30, 10, 30, 10, 30]);
}

/** Long vibration (death). */
export function vibrateDeath(): void {
  if (canVibrate()) navigator.vibrate(200);
}

/** Quick tap (meatball collected). */
export function vibrateMeatball(): void {
  if (canVibrate()) navigator.vibrate(8);
}

/** Enemy killed. */
export function vibrateEnemyKill(): void {
  if (canVibrate()) navigator.vibrate([15, 5, 25]);
}

/** Projectile thrown. */
export function vibrateThrow(): void {
  if (canVibrate()) navigator.vibrate(10);
}
