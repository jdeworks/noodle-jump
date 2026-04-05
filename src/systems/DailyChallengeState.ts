/** Daily challenge state — config generation, medals, streaks, persistence. Pure logic. */

import { getDailySeed, seededRandom } from "./DailyChallenge";
import { ALL_POWER_UP_TYPES, type RunConfig } from "./CustomRunConfig";

export type Medal = "bronze" | "silver" | "gold";

export interface DailyResult {
  date: string;
  score: number;
  height: number;
  medal: Medal | null;
}

export interface DailyChallengeData {
  results: Record<string, DailyResult>;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string;
}

const STORAGE_KEY = "noodle-jump-daily-challenge";

const BASE_THRESHOLDS = { bronze: 3000, silver: 10000, gold: 25000 };
const ZONES = [0, 1, 2, 3];
const DIFFICULTIES = [0.8, 1.0, 1.0, 1.2, 1.5];

/** Get today's date key (UTC YYYY-MM-DD). */
export function getTodayDateKey(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Generate a daily challenge RunConfig from a seed. Deterministic. */
export function generateDailyConfig(seed?: number): RunConfig {
  const s = seed ?? getDailySeed();
  const rng = seededRandom(s);

  const zone = ZONES[Math.floor(rng() * ZONES.length)];
  const difficulty = DIFFICULTIES[Math.floor(rng() * DIFFICULTIES.length)];
  const enemiesEnabled = rng() < 0.4;

  // Disable 2-4 random power-ups for variety
  const disableCount = 2 + Math.floor(rng() * 3);
  const shuffled = [...ALL_POWER_UP_TYPES].sort(() => rng() - 0.5);
  const disabled = new Set(shuffled.slice(0, disableCount));
  const enabled = new Set(ALL_POWER_UP_TYPES.filter((t) => !disabled.has(t)));

  return {
    seed: s,
    enemiesEnabled,
    enabledPowerUps: enabled,
    startingZone: zone,
    difficultyMultiplier: difficulty,
    practiceMode: false,
    isDailyChallenge: true,
  };
}

/** Get medal score thresholds for a daily config. */
export function getMedalThresholds(config: RunConfig): {
  bronze: number;
  silver: number;
  gold: number;
} {
  const scale = config.difficultyMultiplier * (1 + config.startingZone * 0.15);
  return {
    bronze: Math.round(BASE_THRESHOLDS.bronze / scale),
    silver: Math.round(BASE_THRESHOLDS.silver / scale),
    gold: Math.round(BASE_THRESHOLDS.gold / scale),
  };
}

/** Determine medal earned for a score. */
export function getMedal(
  score: number,
  thresholds: { bronze: number; silver: number; gold: number },
): Medal | null {
  if (score >= thresholds.gold) return "gold";
  if (score >= thresholds.silver) return "silver";
  if (score >= thresholds.bronze) return "bronze";
  return null;
}

/** Create empty daily challenge data. */
export function createDailyData(): DailyChallengeData {
  return { results: {}, currentStreak: 0, bestStreak: 0, lastPlayedDate: "" };
}

/** Load daily challenge data from localStorage. */
export function loadDailyData(): DailyChallengeData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...createDailyData(), ...JSON.parse(stored) };
  } catch {
    /* use default */
  }
  return createDailyData();
}

/** Save daily challenge data. */
export function saveDailyData(data: DailyChallengeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

/** Record a daily challenge result. Returns updated data. */
export function recordDailyResult(
  data: DailyChallengeData,
  date: string,
  score: number,
  height: number,
  thresholds: { bronze: number; silver: number; gold: number },
): DailyChallengeData {
  const medal = getMedal(score, thresholds);
  const existing = data.results[date];

  // Only update if new score is better
  const best =
    existing && existing.score >= score
      ? existing
      : { date, score, height, medal };

  const results = { ...data.results, [date]: best };
  const streak = calculateStreak(results, date);
  return {
    results,
    currentStreak: streak,
    bestStreak: Math.max(data.bestStreak, streak),
    lastPlayedDate: date,
  };
}

/** Calculate consecutive-day streak ending at the given date. */
export function calculateStreak(
  results: Record<string, DailyResult>,
  fromDate: string,
): number {
  let streak = 0;
  const d = new Date(fromDate + "T00:00:00Z");
  while (true) {
    const key = formatDateKey(d);
    if (!results[key]) break;
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}

/** Format a Date to YYYY-MM-DD. */
function formatDateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Human-readable summary of a daily config. */
export function getDailyConfigSummary(config: RunConfig): string {
  const zoneNames = [
    "Kitchen",
    "Boiling Pot",
    "Space",
    "Freezer",
    "Volcano",
    "Candy World",
    "Final Kitchen",
  ];
  const zone = zoneNames[config.startingZone] ?? `Zone ${config.startingZone}`;
  const diff =
    config.difficultyMultiplier < 1
      ? "Easy"
      : config.difficultyMultiplier > 1.1
        ? "Hard"
        : "Normal";
  const enemies = config.enemiesEnabled ? "Enemies ON" : "Enemies OFF";
  const pups = config.enabledPowerUps.size;
  return `${zone} | ${diff} (${config.difficultyMultiplier}x) | ${enemies} | ${pups} power-ups`;
}

/** Count distinct medal types earned in a date range. */
export function getMedalsInRange(
  results: Record<string, DailyResult>,
  startDate: string,
  days: number,
): Set<Medal> {
  const medals = new Set<Medal>();
  const d = new Date(startDate + "T00:00:00Z");
  for (let i = 0; i < days; i++) {
    const key = formatDateKey(d);
    const r = results[key];
    if (r?.medal) medals.add(r.medal);
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return medals;
}
