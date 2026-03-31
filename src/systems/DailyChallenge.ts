/** Daily challenge — seeded RNG for deterministic runs. Pure logic. */

/**
 * Get today's daily seed based on UTC date.
 * Same seed = same platform layout for everyone.
 */
export function getDailySeed(): number {
  const now = new Date();
  const dateStr = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
  return hashString(dateStr);
}

/** Get a seed from an arbitrary string (for custom runs). */
export function getSeedFromString(str: string): number {
  return hashString(str);
}

/**
 * Create a seeded pseudo-random number generator.
 * Returns a function that produces values in [0, 1) deterministically.
 * Uses mulberry32 algorithm.
 */
export function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simple string hash (djb2). */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/** Format a seed as a shareable code (hex string). */
export function seedToCode(seed: number): string {
  return (seed >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

/** Parse a seed code back to a number. */
export function codeToSeed(code: string): number {
  return parseInt(code, 16) >>> 0;
}
