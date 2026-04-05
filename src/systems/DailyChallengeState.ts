/** Daily challenge state — config generation, medals, streaks, persistence. Pure logic. */

import { getDailySeed, seededRandom } from "./DailyChallenge";
import { ALL_POWER_UP_TYPES, type RunConfig } from "./CustomRunConfig";
import type { DebugConfig } from "../config/debug";
import { createDebugConfig } from "../config/debug";

export type Medal = "bronze" | "silver" | "gold" | "platinum" | "diamond";

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

/** Modifiers that make each day unique beyond just the seed. */
export interface DailyModifiers {
  onlyNegativePowerUps: boolean;
  quickZoneTransitions: number;
  forcePlatformType: string | null;
  enemySpawnMultiplier: number;
  bossAttackMultiplier: number;
  gameSpeed: number;
}

const STORAGE_KEY = "noodle-jump-daily-challenge";

const BASE_THRESHOLDS = { bronze: 5000, silver: 15000, gold: 30000, platinum: 50000, diamond: 80000 };
const ZONES = [0, 0, 1, 1, 2, 2, 3, 3, 4, 5];
const DIFFICULTIES = [0.8, 1.0, 1.0, 1.2, 1.5, 2.0];
const PLATFORM_TYPES = [null, null, null, null, null, "moving", "ice", "conveyor", "breaking"];
const GAME_SPEEDS = [1.0, 1.0, 1.0, 1.0, 0.8, 1.2, 1.5];
const ENEMY_SPAWN_RATES = [1.0, 1.0, 1.0, 2.0, 3.0];
const BOSS_ATTACK_RATES = [1.0, 1.0, 1.0, 1.5, 2.0];
const QUICK_ZONE_OPTS = [0, 0, 0, 0, 0, 20, 15];

const NEGATIVE_POWER_UPS = ["chili_pepper", "soggy_noodle", "garlic_breath", "burnt_toast", "minestrone_soup"];

/** Get today's date key (UTC YYYY-MM-DD). */
export function getTodayDateKey(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Generate daily modifiers from a seed. */
export function generateDailyModifiers(seed: number): DailyModifiers {
  const rng = seededRandom(seed + 7919); // offset to avoid correlation with config rng
  return {
    onlyNegativePowerUps: rng() < 0.15,
    quickZoneTransitions: QUICK_ZONE_OPTS[Math.floor(rng() * QUICK_ZONE_OPTS.length)],
    forcePlatformType: PLATFORM_TYPES[Math.floor(rng() * PLATFORM_TYPES.length)],
    enemySpawnMultiplier: ENEMY_SPAWN_RATES[Math.floor(rng() * ENEMY_SPAWN_RATES.length)],
    bossAttackMultiplier: BOSS_ATTACK_RATES[Math.floor(rng() * BOSS_ATTACK_RATES.length)],
    gameSpeed: GAME_SPEEDS[Math.floor(rng() * GAME_SPEEDS.length)],
  };
}

/** Generate a daily challenge RunConfig from a seed. Deterministic. */
export function generateDailyConfig(seed?: number): RunConfig {
  const s = seed ?? getDailySeed();
  const rng = seededRandom(s);

  const zone = ZONES[Math.floor(rng() * ZONES.length)];
  const difficulty = DIFFICULTIES[Math.floor(rng() * DIFFICULTIES.length)];
  const enemiesEnabled = rng() < 0.5;

  const mods = generateDailyModifiers(s);

  // Power-up selection
  let enabled: Set<string>;
  if (mods.onlyNegativePowerUps) {
    enabled = new Set(NEGATIVE_POWER_UPS);
  } else {
    const disableCount = 2 + Math.floor(rng() * 3);
    const shuffled = [...ALL_POWER_UP_TYPES].sort(() => rng() - 0.5);
    const disabled = new Set(shuffled.slice(0, disableCount));
    enabled = new Set(ALL_POWER_UP_TYPES.filter((t) => !disabled.has(t)));
  }

  return {
    seed: s, enemiesEnabled, enabledPowerUps: enabled, startingZone: zone,
    difficultyMultiplier: difficulty, practiceMode: false, isDailyChallenge: true,
  };
}

/** Generate DebugConfig overrides for daily challenge modifiers. */
export function generateDailyDebugConfig(seed?: number): Partial<DebugConfig> {
  const s = seed ?? getDailySeed();
  const mods = generateDailyModifiers(s);
  const base = createDebugConfig();
  return {
    ...base,
    quickZoneTransitions: mods.quickZoneTransitions,
    forcePlatformType: mods.forcePlatformType,
    enemySpawnMultiplier: mods.enemySpawnMultiplier,
    bossAttackMultiplier: mods.bossAttackMultiplier,
    gameSpeed: mods.gameSpeed,
  };
}

/** Get medal score thresholds — flat values, same every day. */
export function getMedalThresholds(_config?: RunConfig): {
  bronze: number; silver: number; gold: number; platinum: number; diamond: number;
} {
  return { ...BASE_THRESHOLDS };
}

/** Determine medal earned for a score. */
export function getMedal(
  score: number,
  thresholds: { bronze: number; silver: number; gold: number; platinum: number; diamond: number },
): Medal | null {
  if (score >= thresholds.diamond) return "diamond";
  if (score >= thresholds.platinum) return "platinum";
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
  } catch { /* use default */ }
  return createDailyData();
}

/** Save daily challenge data. */
export function saveDailyData(data: DailyChallengeData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { /* storage unavailable */ }
}

/** Record a daily challenge result. Returns updated data. */
export function recordDailyResult(
  data: DailyChallengeData, date: string, score: number, height: number,
  thresholds: { bronze: number; silver: number; gold: number; platinum: number; diamond: number },
): DailyChallengeData {
  const medal = getMedal(score, thresholds);
  const existing = data.results[date];
  const best = existing && existing.score >= score ? existing : { date, score, height, medal };
  const results = { ...data.results, [date]: best };
  const streak = calculateStreak(results, date);
  return { results, currentStreak: streak, bestStreak: Math.max(data.bestStreak, streak), lastPlayedDate: date };
}

/** Calculate consecutive-day streak ending at the given date. */
export function calculateStreak(results: Record<string, DailyResult>, fromDate: string): number {
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

function formatDateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Human-readable summary of a daily config. */
export function getDailyConfigSummary(config: RunConfig, seed?: number): string {
  const s = seed ?? config.seed;
  const mods = generateDailyModifiers(s);
  const zoneNames = ["Kitchen", "Boiling Pot", "Space", "Freezer", "Volcano", "Candy World", "Final Kitchen"];
  const zone = zoneNames[config.startingZone] ?? `Zone ${config.startingZone}`;
  const diff = config.difficultyMultiplier < 1 ? "Easy" : config.difficultyMultiplier > 1.1 ? "Hard" : "Normal";
  const parts = [zone, `${diff} (${config.difficultyMultiplier}x)`];
  if (config.enemiesEnabled) parts.push("Enemies ON");
  if (mods.onlyNegativePowerUps) parts.push("Only Negative Power-ups!");
  else parts.push(`${config.enabledPowerUps.size} power-ups`);
  if (mods.gameSpeed !== 1.0) parts.push(`Speed ${mods.gameSpeed}x`);
  if (mods.forcePlatformType) parts.push(`${mods.forcePlatformType} platforms`);
  if (mods.quickZoneTransitions > 0) parts.push("Quick zones");
  if (mods.enemySpawnMultiplier > 1) parts.push(`Enemies ${mods.enemySpawnMultiplier}x`);
  return parts.join(" | ");
}

/** Count distinct medal types earned in a date range. */
export function getMedalsInRange(
  results: Record<string, DailyResult>, startDate: string, days: number,
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
