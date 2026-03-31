/** Platform generation and pruning helpers extracted from GameLoop. */

import type { GameWorldState } from "./GameState";
import type { GameEvent } from "./GameLoopTypes";
import {
  createPlatform,
  generatePlatforms,
  pruneBelow,
} from "../entities/Platform";
import {
  spawnMeatballs,
  pruneMeatballs,
} from "../entities/Collectible";
import {
  spawnPowerUps,
  prunePowerUps,
} from "../entities/PowerUp";
import { getDifficulty } from "../systems/Difficulty";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLATFORM_COUNT_BUFFER,
  LASAGNA_TTL_TICKS,
} from "../config/constants";

/** Spawn a lasagna platform near the player. */
export function spawnLasagnaPlatform(state: GameWorldState): GameWorldState {
  const x = Math.max(
    20,
    Math.min(
      GAME_WIDTH - 120,
      state.player.x - 30 + (Math.random() - 0.5) * 80,
    ),
  );
  const y = state.player.y - 60 - Math.random() * 50;
  const platform = createPlatform(x, y, "lasagna");
  platform.spawnTick = state.animTick;
  return {
    ...state,
    platforms: [...state.platforms, platform],
  };
}

/** Expire lasagna platforms that have exceeded their TTL. */
export function expireLasagnaPlatforms(
  state: GameWorldState,
  events: GameEvent[],
): GameWorldState {
  let changed = false;
  const platforms = state.platforms.map((p) => {
    if (
      p.type === "lasagna" &&
      !p.broken &&
      p.spawnTick != null &&
      state.animTick - p.spawnTick > LASAGNA_TTL_TICKS
    ) {
      changed = true;
      events.push({ type: "platformCrumbled", platform: p });
      return { ...p, broken: true };
    }
    return p;
  });
  return changed ? { ...state, platforms } : state;
}

/** Generate new platforms if the camera is approaching the top of existing ones. */
export function maybeGeneratePlatforms(state: GameWorldState): GameWorldState {
  const cameraTop = state.camera.y;
  if (state.highestPlatformY > cameraTop - GAME_HEIGHT) {
    const difficulty = getDifficulty(state.platformsPassed);
    const generated = generatePlatforms(
      state.highestPlatformY,
      PLATFORM_COUNT_BUFFER,
      difficulty,
      state.lastPlatformWasBrittle,
    );

    const hasUncollected = state.powerUps.some((pu) => !pu.collected);
    const newPowerUps = hasUncollected
      ? []
      : spawnPowerUps(generated, difficulty.negativeSpawnChance);

    const allPuPlatformIds = new Set([
      ...state.powerUps.map((pu) => pu.platformId),
      ...newPowerUps.map((pu) => pu.platformId),
    ]);
    const newMeatballs = spawnMeatballs(generated, allPuPlatformIds);

    return {
      ...state,
      platforms: [...state.platforms, ...generated],
      powerUps: [...state.powerUps, ...newPowerUps],
      meatballs: [...state.meatballs, ...newMeatballs],
      highestPlatformY: generated[generated.length - 1].y,
      lastPlatformWasBrittle:
        generated[generated.length - 1].type === "brittle",
      platformCount: state.platformCount + generated.length,
    };
  }
  return state;
}

/** Prune platforms, meatballs, and power-ups that have scrolled off screen. */
export function prune(state: GameWorldState): GameWorldState {
  const threshold = state.camera.y + GAME_HEIGHT + 400;
  const platforms = pruneBelow(state.platforms, threshold);
  const activeIds = new Set(platforms.map((p) => p.id));
  const meatballs = pruneMeatballs(state.meatballs, activeIds);
  const powerUps = prunePowerUps(state.powerUps, activeIds);

  return { ...state, platforms, meatballs, powerUps };
}
