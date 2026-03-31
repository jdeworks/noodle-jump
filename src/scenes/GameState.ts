/** Pure game state — no PixiJS imports. */

import type { PlayerState } from "../entities/Player";
import type { PlatformState } from "../entities/Platform";
import type { CollectibleState } from "../entities/Collectible";
import type { PowerUpState, ActiveEffect } from "../entities/PowerUp";
import type { CameraState } from "../systems/Camera";
import type { ScoreState } from "../systems/Score";
import type { ZoneState } from "../systems/Zone";
import type { ShakeState } from "../systems/ScreenShake";

import { createPlayer } from "../entities/Player";
import {
  createGroundPlatform,
  generatePlatforms,
} from "../entities/Platform";
import { spawnMeatballs } from "../entities/Collectible";
import { spawnPowerUps } from "../entities/PowerUp";
import { createCamera } from "../systems/Camera";
import { createScoreState, loadHighScore } from "../systems/Score";
import { createZoneState } from "../systems/Zone";
import type { MinestroneState } from "../systems/PowerUpEffects";
import type { EnemyState } from "../entities/Enemy";
import type { ProjectileState } from "../entities/Projectile";
import type { SpawnerState } from "../systems/EnemySpawner";
import { createSpawnerState } from "../systems/EnemySpawner";
import type { WindSystem } from "../systems/Hazards";
import { createWindSystem } from "../systems/Hazards";
import type { WeatherState } from "../systems/Weather";
import { createWeather } from "../systems/Weather";
import type { DayNightState } from "../systems/DayNight";
import { createDayNight } from "../systems/DayNight";
import type { LivesState } from "../systems/Lives";
import { createLivesState } from "../systems/Lives";
import type { RunConfig } from "../systems/CustomRunConfig";
import { createDefaultRunConfig } from "../systems/CustomRunConfig";
import { initRNG } from "../systems/RNG";
import type { DebugConfig } from "../config/debug";
import { createDebugConfig, isDebugMode } from "../config/debug";
import type { BossState } from "../entities/Boss";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLATFORM_COUNT_BUFFER,
} from "../config/constants";

/** Complete game world state — everything needed to tick the game. */
export interface GameWorldState {
  player: PlayerState;
  platforms: PlatformState[];
  meatballs: CollectibleState[];
  powerUps: PowerUpState[];
  camera: CameraState;
  scoreState: ScoreState;
  zoneState: ZoneState;
  activeEffect: ActiveEffect | null;
  shakeState: ShakeState | null;
  animTick: number;
  squashTicks: number;
  squashHoldY: number;
  pendingJumpVy: number;
  highestPlatformY: number;
  lastPlatformWasBrittle: boolean;
  platformCount: number;
  platformsPassed: number;
  highestPlayerY: number;
  stagnantTicks: number;
  isDying: boolean;
  dyingTicks: number;
  gameOver: boolean;
  countdownTicks: number;
  springFlashTicks: number;
  pickupFlashTicks: number;
  pickupFlashColor: number;
  lastFacing: number;
  highScore: number;
  highScoreBeatShown: boolean;
  startTime: number;
  elapsedMs: number;
  paused: boolean;
  /** Active minestrone flood (rising soup). */
  minestroneFlood: MinestroneState | null;
  /** Enemies (opt-in feature). */
  enemies: EnemyState[];
  /** Thrown projectiles (knives). */
  projectiles: ProjectileState[];
  /** Enemy spawner state. */
  enemySpawner: SpawnerState;
  /** Wind system state. */
  windSystem: WindSystem;
  /** Whether enemies are enabled. */
  enemiesEnabled: boolean;
  /** Weather particle state. */
  weather: WeatherState;
  /** Day/night cycle state. */
  dayNight: DayNightState;
  /** Lives system (optional). */
  livesState: LivesState;
  /** Practice mode — no death. */
  practiceMode: boolean;
  /** Run configuration (custom runs, daily challenge). */
  runConfig: RunConfig;
  /** Debug configuration (only active in DEBUG_MODE). */
  debugConfig: DebugConfig;
  /** Knife ammo for throwing. */
  knifeAmmo: number;
  /** Max knife ammo. */
  knifeAmmoMax: number;
  /** Ticks until next knife regenerates. */
  knifeRegenTimer: number;
  /** Active boss (null when no boss encounter). */
  activeBoss: BossState | null;
  /** Boss attack projectiles (separate from player knives). */
  bossAttacks: { x: number; y: number; vx: number; vy: number; alive: boolean }[];
  /** Whether boss fight is active (disables stagnant timer). */
  inBossFight: boolean;
  /** Enemies killed this game (for achievements). */
  enemiesKilled: number;
}

/** Create the initial game world state for a new game. */
export function createInitialState(runConfig?: RunConfig): GameWorldState {
  const config = runConfig ?? createDefaultRunConfig();
  initRNG(config.seed);
  const scoreState = createScoreState();
  const zoneState = createZoneState();
  const highScore = loadHighScore();

  // Ground floor
  const ground = createGroundPlatform(GAME_HEIGHT);
  const platforms = [ground];
  let highestPlatformY = ground.y;

  // Generate initial platforms
  const generated = generatePlatforms(
    highestPlatformY,
    PLATFORM_COUNT_BUFFER,
    undefined,
    false,
  );
  platforms.push(...generated);
  highestPlatformY = generated[generated.length - 1].y;
  const lastPlatformWasBrittle =
    generated[generated.length - 1].type === "brittle";

  // Spawn power-ups first, then meatballs (excluding power-up platforms)
  const powerUps = spawnPowerUps(generated);
  const puPlatformIds = new Set(powerUps.map((pu) => pu.platformId));
  const meatballs = spawnMeatballs(generated, puPlatformIds);

  // Player
  const player = createPlayer(GAME_WIDTH / 2 - 16, ground.y - 40);

  // Camera
  let camera = createCamera();
  camera = { ...camera, y: ground.y - GAME_HEIGHT + 100 };

  return {
    player,
    platforms,
    meatballs,
    powerUps,
    camera,
    scoreState,
    zoneState,
    activeEffect: null,
    shakeState: null,
    animTick: 0,
    squashTicks: 0,
    squashHoldY: 0,
    pendingJumpVy: 0,
    highestPlatformY,
    lastPlatformWasBrittle,
    platformCount: generated.length,
    platformsPassed: 0,
    highestPlayerY: Infinity,
    stagnantTicks: 0,
    isDying: false,
    dyingTicks: 0,
    gameOver: false,
    countdownTicks: -1,
    springFlashTicks: 0,
    pickupFlashTicks: 0,
    pickupFlashColor: 0xffffff,
    lastFacing: 1,
    highScore,
    highScoreBeatShown: false,
    startTime: Date.now(),
    elapsedMs: 0,
    paused: false,
    minestroneFlood: null,
    enemies: [],
    projectiles: [],
    enemySpawner: createSpawnerState(),
    windSystem: createWindSystem(),
    enemiesEnabled: false,
    weather: createWeather(0),
    dayNight: createDayNight(),
    livesState: createLivesState(false),
    practiceMode: config.practiceMode || (isDebugMode() && createDebugConfig().invincible),
    runConfig: config,
    debugConfig: createDebugConfig(),
    knifeAmmo: 3,
    knifeAmmoMax: 3,
    knifeRegenTimer: 0,
    activeBoss: null,
    bossAttacks: [],
    inBossFight: false,
    enemiesKilled: 0,
  };
}
