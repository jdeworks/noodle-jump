/**
 * Debug configuration — comprehensive controls for testing.
 * Only active when DEBUG_MODE is true in constants.ts.
 */

import { DEBUG_MODE } from "./constants";

export interface DebugConfig {
  /** Override seed for deterministic testing. 0 = use Math.random. */
  seed: number;
  /** Force a specific boss to spawn at next zone transition. */
  forceBossType: string | null;
  /** Trigger boss spawn at this many platforms passed. 0 = normal zone-based. */
  forceBossAtPlatforms: number;
  /** Speed up enemy spawn interval (multiplier, 0.1 = 10x faster). */
  enemySpawnMultiplier: number;
  /** Speed up boss attack interval (multiplier). */
  bossAttackMultiplier: number;
  /** Start at a specific zone (0-6). */
  startingZone: number;
  /** Skip to a specific platform count (simulates progress). */
  startingPlatforms: number;
  /** Invincibility — player can't die. */
  invincible: boolean;
  /** Infinite knife ammo. */
  infiniteKnives: boolean;
  /** Show hitboxes for all entities. */
  showHitboxes: boolean;
  /** Show FPS counter. */
  showFPS: boolean;
  /** Disable weather particles (performance testing). */
  disableWeather: boolean;
  /** Disable parallax (performance testing). */
  disableParallax: boolean;
  /** Disable effect particles (performance testing). */
  disableEffectParticles: boolean;
  /** Force a specific power-up type to spawn next. */
  forcePowerUpType: string | null;
  /** Force a specific platform type to spawn. */
  forcePlatformType: string | null;
  /** Speed multiplier for gameplay (0.5 = slow-mo, 2.0 = fast). */
  gameSpeed: number;
  /** Zone transition every N platforms (0 = normal). */
  quickZoneTransitions: number;
}

/** Default debug config — all features at normal/off. */
export function createDebugConfig(): DebugConfig {
  return {
    seed: 0,
    forceBossType: null,
    forceBossAtPlatforms: 0,
    enemySpawnMultiplier: 1.0,
    bossAttackMultiplier: 1.0,
    startingZone: 0,
    startingPlatforms: 0,
    invincible: false,
    infiniteKnives: false,
    showHitboxes: false,
    showFPS: false,
    disableWeather: false,
    disableParallax: false,
    disableEffectParticles: false,
    forcePowerUpType: null,
    forcePlatformType: null,
    gameSpeed: 1.0,
    quickZoneTransitions: 0,
  };
}

/** Preset: boss testing — quick zone transitions. */
export function bossTestPreset(): Partial<DebugConfig> {
  return {
    quickZoneTransitions: 15,
    enemySpawnMultiplier: 0.1,
  };
}

/** Preset: enemy testing — fast spawns, show hitboxes. */
export function enemyTestPreset(): Partial<DebugConfig> {
  return {
    enemySpawnMultiplier: 0.2,
    showHitboxes: true,
    startingPlatforms: 50,
  };
}

/** Preset: power-up testing — force specific types. */
export function powerUpTestPreset(type: string): Partial<DebugConfig> {
  return {
    forcePowerUpType: type,
    invincible: true,
  };
}

/** Preset: performance testing — disable visuals. */
export function perfTestPreset(): Partial<DebugConfig> {
  return {
    disableWeather: true,
    disableParallax: true,
    disableEffectParticles: true,
    showFPS: true,
  };
}

/** Check if debug mode is active. */
export function isDebugMode(): boolean {
  return DEBUG_MODE;
}

/** Merge a preset into the debug config. */
export function applyPreset(
  config: DebugConfig,
  preset: Partial<DebugConfig>,
): DebugConfig {
  return { ...config, ...preset };
}

/**
 * Active debug config — mutable singleton.
 * Only used when DEBUG_MODE is true.
 */
let activeConfig: DebugConfig = createDebugConfig();

export function getDebugConfig(): DebugConfig {
  return activeConfig;
}

export function setDebugConfig(config: DebugConfig): void {
  activeConfig = config;
}

export function resetDebugConfig(): void {
  activeConfig = createDebugConfig();
}
