/** Global RNG — seeded or Math.random depending on run config. */

import { seededRandom } from "./DailyChallenge";

let rngFn: () => number = Math.random;

/** Initialize the global RNG. Seed 0 = Math.random, otherwise deterministic. */
export function initRNG(seed: number): void {
  rngFn = seed === 0 ? Math.random : seededRandom(seed);
}

/** Reset to Math.random (used on restart). */
export function resetRNG(): void {
  rngFn = Math.random;
}

/** Get a random number in [0, 1). Uses seeded RNG if initialized. */
export function random(): number {
  return rngFn();
}
