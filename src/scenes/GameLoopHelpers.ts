/** Platform generation, pruning, and rescue helpers extracted from GameLoop. */

import { random } from "../systems/RNG";
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
      state.player.x - 30 + (random() - 0.5) * 80,
    ),
  );
  const y = state.player.y - 60 - random() * 50;
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
  if (state.inBossFight) return state; // freeze platform generation during boss fights
  const cameraTop = state.camera.y;
  if (state.highestPlatformY > cameraTop - GAME_HEIGHT) {
    const difficulty = getDifficulty(state.platformsPassed, state.runConfig.difficultyMultiplier);
    const generated = generatePlatforms(
      state.highestPlatformY,
      PLATFORM_COUNT_BUFFER,
      difficulty,
      state.lastPlatformWasBrittle,
      state.debugConfig.forcePlatformType,
    );

    const hasUncollected = state.powerUps.some((pu) => !pu.collected);
    const forcedType = state.debugConfig.forcePowerUpType ?? undefined;
    const newPowerUps = hasUncollected
      ? []
      : spawnPowerUps(generated, difficulty.negativeSpawnChance, forcedType, state.runConfig.enabledPowerUps);

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
  const closeCallPlatformIds = state.closeCallPlatformIds.filter((id) => activeIds.has(id));

  return { ...state, platforms, meatballs, powerUps, closeCallPlatformIds };
}

/** Rescue player to a safe platform (practice/timed mode). */
export function rescuePlayer(s: GameWorldState): GameWorldState {
  const camTop = s.camera.y;
  const camBot = camTop + GAME_HEIGHT;
  const camMid = camTop + GAME_HEIGHT * 0.5;
  const safe = s.platforms.filter((p) =>
    !p.broken && p.type !== "breaking" &&
    !(p.crumbleTimer !== undefined && p.crumbleTimer < 120) &&
    p.y >= camTop && p.y <= camBot,
  );
  let rescue = safe.length > 0
    ? safe.sort((a, b) => Math.abs(a.y - camMid) - Math.abs(b.y - camMid))[0]
    : s.platforms.filter((p) => !p.broken).sort((a, b) => Math.abs(a.y - camMid) - Math.abs(b.y - camMid))[0];
  if (!rescue) {
    rescue = {
      x: GAME_WIDTH / 2 - 50, y: camTop + GAME_HEIGHT * 0.6,
      width: 100, height: 15, type: "static" as const,
      broken: false, id: Date.now(), originX: GAME_WIDTH / 2 - 50, moveDirection: 0,
    };
    s = { ...s, platforms: [...s.platforms, rescue] };
  }
  const penalizedScore = s.deathPenaltyEnabled
    ? { ...s.scoreState,
        height: Math.max(0, Math.floor(s.scoreState.height * 0.9)),
        highestHeight: Math.max(0, Math.floor(s.scoreState.highestHeight * 0.9)),
      }
    : s.scoreState;
  return { ...s, player: { ...s.player,
      x: rescue.x + rescue.width / 2 - s.player.width / 2,
      y: rescue.y - s.player.height, vy: -8, isJumping: true,
    }, stagnantTicks: 0, scoreState: penalizedScore };
}
