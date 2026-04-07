/**
 * Local leaderboard — top 10, stored in localStorage with integrity checks.
 * This is local-only. Open an issue if you'd like a server-backed version.
 */

const LOCAL_KEY = "noodle-jump-leaderboard";
const INTEGRITY_SALT = "noodle-jump-2026";
const MAX_ENTRIES = 10;

export interface LeaderboardEntry {
  name: string;
  score: number;
  height: number;
  zone: number;
  meatballs: number;
  bestCombo: number;
  timestamp: number;
  /** Integrity hash to detect localStorage tampering. */
  hash: string;
}

/** Compute integrity hash for an entry. */
function computeHash(score: number, height: number, zone: number, timestamp: number): string {
  const raw = `${INTEGRITY_SALT}:${score}:${height}:${zone}:${timestamp}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h + raw.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function verifyEntry(entry: LeaderboardEntry): boolean {
  return entry.hash === computeHash(entry.score, entry.height, entry.zone, entry.timestamp);
}

/** Submit a score. Returns the rank (1-based) or null if it didn't make the top 10. */
export function submitScore(
  name: string,
  score: number,
  height: number,
  zone: number,
  meatballs: number,
  bestCombo: number,
): number | null {
  const timestamp = Date.now();
  const entry: LeaderboardEntry = {
    name: name || "Chef",
    score,
    height,
    zone,
    meatballs,
    bestCombo,
    timestamp,
    hash: computeHash(score, height, zone, timestamp),
  };

  const entries = loadEntries();
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);
  const trimmed = entries.slice(0, MAX_ENTRIES);
  saveEntries(trimmed);

  const rank = trimmed.findIndex((e) => e.timestamp === timestamp && e.score === score);
  return rank >= 0 ? rank + 1 : null;
}

/** Get the top 10, with tampered entries silently removed. */
export function getLeaderboard(): LeaderboardEntry[] {
  return loadEntries().filter(verifyEntry);
}

/** Check if a score would make the top 10. */
export function wouldMakeLeaderboard(score: number): boolean {
  const entries = loadEntries().filter(verifyEntry);
  if (entries.length < MAX_ENTRIES) return true;
  return score > entries[entries.length - 1].score;
}

/** Clear the leaderboard. */
export function clearLeaderboard(): void {
  saveEntries([]);
}

/** Export hash function for testing. */
export function _computeHash(
  score: number,
  height: number,
  zone: number,
  timestamp: number,
): string {
  return computeHash(score, height, zone, timestamp);
}

function loadEntries(): LeaderboardEntry[] {
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  } catch {
    // localStorage may be unavailable
  }
}
