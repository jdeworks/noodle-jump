/** Shadow recorder — captures player position for ghost replay. Pure logic. */

import type { GameWorldState } from "../scenes/GameState";

/** Compact shadow recording — flat number array, 4 values per sample. */
export interface ShadowRecording {
  frames: number[];
  score: number;
  height: number;
  sampleInterval: number;
  timestamp: number;
}

export interface ShadowRecorder {
  tick(state: GameWorldState): void;
  finalize(score: number, height: number): ShadowRecording;
}

/** Values per sample: x, y, vy, playerState (0=alive, 1=dead). */
const VALUES_PER_FRAME = 4;
const DEFAULT_INTERVAL = 3;
const BEST_KEY = "noodle-jump-shadow-best";
const LAST_KEY = "noodle-jump-shadow-last";
const DAILY_PREFIX = "noodle-jump-shadow-daily-";
const MAX_DAILY_SHADOWS = 7;

/** Create a shadow recorder that samples every N ticks. */
export function createShadowRecorder(
  sampleInterval = DEFAULT_INTERVAL,
): ShadowRecorder {
  const frames: number[] = [];
  let tickCount = 0;

  return {
    tick(state: GameWorldState): void {
      tickCount++;
      if (tickCount % sampleInterval !== 0) return;
      frames.push(
        Math.round(state.player.x * 10) / 10,
        Math.round(state.player.y * 10) / 10,
        Math.round(state.player.vy * 10) / 10,
        state.isDying || state.gameOver ? 1 : 0,
      );
    },
    finalize(score: number, height: number): ShadowRecording {
      return {
        frames,
        score,
        height,
        sampleInterval,
        timestamp: Date.now(),
      };
    },
  };
}

/** Get the number of samples in a recording. */
export function getSampleCount(recording: ShadowRecording): number {
  return Math.floor(recording.frames.length / VALUES_PER_FRAME);
}

/** Get a single frame from a recording by index. */
export function getFrame(
  recording: ShadowRecording,
  index: number,
): { x: number; y: number; vy: number; playerState: number } | null {
  const offset = index * VALUES_PER_FRAME;
  if (offset + VALUES_PER_FRAME > recording.frames.length) return null;
  return {
    x: recording.frames[offset],
    y: recording.frames[offset + 1],
    vy: recording.frames[offset + 2],
    playerState: recording.frames[offset + 3],
  };
}

/** Save as "last run" shadow (always overwritten). */
export function saveLastShadow(recording: ShadowRecording): void {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(recording));
  } catch {
    /* storage full */
  }
}

/** Save as "personal best" shadow (only if score beats existing). */
export function saveBestShadow(recording: ShadowRecording): boolean {
  const existing = loadShadowRecording(BEST_KEY);
  if (existing && existing.score >= recording.score) return false;
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(recording));
  } catch {
    /* storage full */
  }
  return true;
}

/** Save daily challenge shadow. */
export function saveDailyShadow(
  date: string,
  recording: ShadowRecording,
): void {
  const key = DAILY_PREFIX + date;
  const existing = loadShadowRecording(key);
  if (existing && existing.score >= recording.score) return;
  try {
    localStorage.setItem(key, JSON.stringify(recording));
    pruneOldDailyShadows(date);
  } catch {
    /* storage full */
  }
}

/** Load a shadow recording from a specific key. */
export function loadShadowRecording(
  key: string,
): ShadowRecording | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const data = JSON.parse(stored);
    if (!data.frames || !Array.isArray(data.frames)) return null;
    return data as ShadowRecording;
  } catch {
    return null;
  }
}

/** Load the "last run" shadow. */
export function loadLastShadow(): ShadowRecording | null {
  return loadShadowRecording(LAST_KEY);
}

/** Load the "personal best" shadow. */
export function loadBestShadow(): ShadowRecording | null {
  return loadShadowRecording(BEST_KEY);
}

/** Load daily shadow for a specific date. */
export function loadDailyShadow(date: string): ShadowRecording | null {
  return loadShadowRecording(DAILY_PREFIX + date);
}

/** Remove daily shadows older than MAX_DAILY_SHADOWS days. */
function pruneOldDailyShadows(currentDate: string): void {
  const d = new Date(currentDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - MAX_DAILY_SHADOWS);
  // Remove keys older than the cutoff by scanning localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(DAILY_PREFIX)) continue;
    const dateStr = key.slice(DAILY_PREFIX.length);
    if (dateStr < currentDate.slice(0, 10) && dateStr < formatDate(d)) {
      localStorage.removeItem(key);
    }
  }
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
