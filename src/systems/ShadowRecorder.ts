/** Shadow recorder — captures player position for ghost replay. Pure logic. */

import type { GameWorldState } from "../scenes/GameState";
import type { RunConfig } from "./CustomRunConfig";

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

const VALUES_PER_FRAME = 4;
const DEFAULT_INTERVAL = 3;
const PREFIX = "noodle-jump-shadow-";
const MAX_DAILY_SHADOWS = 7;

export type ShadowMode = "normal" | "daily" | "custom";

export function getShadowKey(mode: ShadowMode, qualifier?: string): string {
  if (mode === "daily") return `${PREFIX}daily-${qualifier ?? "unknown"}`;
  if (mode === "custom") return `${PREFIX}custom-${qualifier ?? "default"}`;
  return `${PREFIX}normal`;
}

export function getShadowSlot(config?: RunConfig): {
  mode: ShadowMode;
  qualifier: string;
} {
  if (!config) return { mode: "normal", qualifier: "" };
  if (config.isDailyChallenge) return { mode: "daily", qualifier: "" };
  if (config.seed !== 0 || config.startingZone !== 0 || config.difficultyMultiplier !== 1.0) {
    return { mode: "custom", qualifier: hashConfig(config) };
  }
  return { mode: "normal", qualifier: "" };
}

function hashConfig(config: RunConfig): string {
  const parts = [
    config.seed,
    config.startingZone,
    config.difficultyMultiplier,
    config.enemiesEnabled ? 1 : 0,
    config.practiceMode ? 1 : 0,
    [...config.enabledPowerUps].sort().join(","),
  ];
  let h = 5381;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function createShadowRecorder(sampleInterval = DEFAULT_INTERVAL): ShadowRecorder {
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
      return { frames, score, height, sampleInterval, timestamp: Date.now() };
    },
  };
}

export function getSampleCount(recording: ShadowRecording): number {
  return Math.floor(recording.frames.length / VALUES_PER_FRAME);
}

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

export function saveShadow(mode: ShadowMode, qualifier: string, recording: ShadowRecording): void {
  const key = getShadowKey(mode, qualifier);
  const existing = loadShadowRecording(key);
  if (existing && existing.score >= recording.score) return;
  try {
    localStorage.setItem(key, JSON.stringify(recording));
    if (mode === "daily") pruneOldDailyShadows(qualifier);
  } catch {
    /* storage full */
  }
}

export function loadShadow(mode: ShadowMode, qualifier?: string): ShadowRecording | null {
  return loadShadowRecording(getShadowKey(mode, qualifier));
}

export function loadShadowRecording(key: string): ShadowRecording | null {
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

function pruneOldDailyShadows(currentDate: string): void {
  const cutoff = new Date(currentDate + "T00:00:00Z");
  cutoff.setUTCDate(cutoff.getUTCDate() - MAX_DAILY_SHADOWS);
  const cutoffStr = formatDate(cutoff);
  const dailyKey = `${PREFIX}daily-`;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(dailyKey)) continue;
    const dateStr = key.slice(dailyKey.length);
    if (dateStr < cutoffStr) localStorage.removeItem(key);
  }
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
