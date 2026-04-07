/** Custom run configuration — defines all tweakable game parameters. */

export interface RunConfig {
  /** Seed for deterministic RNG. 0 = random (Math.random). */
  seed: number;
  /** Whether enemies are active. */
  enemiesEnabled: boolean;
  /** Which power-up types can spawn. Empty = all enabled. */
  enabledPowerUps: Set<string>;
  /** Starting zone (0-6). */
  startingZone: number;
  /** Difficulty multiplier (0.5 = easy, 1.0 = normal, 2.0 = hard). */
  difficultyMultiplier: number;
  /** Practice mode — no death. */
  practiceMode: boolean;
  /** Whether this is a daily challenge run. */
  isDailyChallenge: boolean;
}

/** All power-up type names. */
export const ALL_POWER_UP_TYPES: string[] = [
  "spaghetti_spring",
  "fusilli_tornado",
  "ravioli_rocket",
  "lasagna_layers",
  "pepper_sneeze",
  "meatball_magnet",
  "pasta_shield",
  "gnocchi_bounce",
  "minestrone_soup",
  "chili_pepper",
  "soggy_noodle",
  "garlic_breath",
  "burnt_toast",
];

/** Create default run config (normal game). */
export function createDefaultRunConfig(): RunConfig {
  return {
    seed: 0,
    enemiesEnabled: false,
    enabledPowerUps: new Set(ALL_POWER_UP_TYPES),
    startingZone: 0,
    difficultyMultiplier: 1.0,
    practiceMode: false,
    isDailyChallenge: false,
  };
}

/** Create a daily challenge config. */
export function createDailyChallengeConfig(seed: number): RunConfig {
  return {
    ...createDefaultRunConfig(),
    seed,
    isDailyChallenge: true,
  };
}

/** Check if a power-up type is enabled in the config. */
export function isPowerUpEnabled(config: RunConfig, type: string): boolean {
  return config.enabledPowerUps.size === 0 || config.enabledPowerUps.has(type);
}

/** Serialize config to a shareable string. */
export function serializeRunConfig(config: RunConfig): string {
  return JSON.stringify({
    s: config.seed,
    e: config.enemiesEnabled,
    p: [...config.enabledPowerUps],
    z: config.startingZone,
    d: config.difficultyMultiplier,
    pr: config.practiceMode,
  });
}

/** Deserialize a run config from string. */
export function deserializeRunConfig(str: string): RunConfig | null {
  try {
    const data = JSON.parse(str);
    return {
      seed: data.s ?? 0,
      enemiesEnabled: data.e ?? false,
      enabledPowerUps: new Set(data.p ?? ALL_POWER_UP_TYPES),
      startingZone: data.z ?? 0,
      difficultyMultiplier: data.d ?? 1.0,
      practiceMode: data.pr ?? false,
      isDailyChallenge: false,
    };
  } catch {
    return null;
  }
}

// ── localStorage persistence (pure logic, no pixi) ─────────────────────

import { type DebugConfig, createDebugConfig } from "../config/debug";

export const STORAGE_RUN_CONFIG = "noodle_custom_run";
export const STORAGE_DEBUG_CONFIG = "noodle_debug_config";

export function saveRunConfigToStorage(cfg: RunConfig): void {
  try {
    localStorage.setItem(
      STORAGE_RUN_CONFIG,
      JSON.stringify({
        seed: cfg.seed,
        enemiesEnabled: cfg.enemiesEnabled,
        enabledPowerUps: [...cfg.enabledPowerUps],
        startingZone: cfg.startingZone,
        difficultyMultiplier: cfg.difficultyMultiplier,
        practiceMode: cfg.practiceMode,
      }),
    );
  } catch {
    /* quota exceeded */
  }
}

export function loadRunConfigFromStorage(): RunConfig {
  try {
    const raw = localStorage.getItem(STORAGE_RUN_CONFIG);
    if (!raw) return createDefaultRunConfig();
    const d = JSON.parse(raw);
    return {
      seed: d.seed ?? 0,
      enemiesEnabled: d.enemiesEnabled ?? false,
      enabledPowerUps: new Set(d.enabledPowerUps ?? ALL_POWER_UP_TYPES),
      startingZone: d.startingZone ?? 0,
      difficultyMultiplier: d.difficultyMultiplier ?? 1.0,
      practiceMode: d.practiceMode ?? false,
      isDailyChallenge: false,
    };
  } catch {
    return createDefaultRunConfig();
  }
}

export function saveDebugConfigToStorage(cfg: DebugConfig): void {
  try {
    localStorage.setItem(STORAGE_DEBUG_CONFIG, JSON.stringify(cfg));
  } catch {
    /* quota exceeded */
  }
}

export function loadDebugConfigFromStorage(): DebugConfig {
  try {
    const raw = localStorage.getItem(STORAGE_DEBUG_CONFIG);
    if (!raw) return createDebugConfig();
    return { ...createDebugConfig(), ...JSON.parse(raw) };
  } catch {
    return createDebugConfig();
  }
}
