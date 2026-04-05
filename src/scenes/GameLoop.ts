/** Pure game loop — no PixiJS imports. Returns events for side effects. */

import type { GameWorldState } from "./GameState";
import type { GameEvent, TickResult } from "./GameLoopTypes";
import { updatePlayer } from "../entities/Player";
import { updatePlatforms } from "../entities/Platform";
import {
  updateMeatballPositions,
  attractMeatballs,
} from "../entities/Collectible";
import {
  tickEffect,
  updatePowerUpPositions,
} from "../entities/PowerUp";
import {
  applyGnocchiBounce,
  hasGnocchiBounce,
} from "../systems/PowerUpEffects";
import { createProjectile } from "../entities/Projectile";
import { tickWeather, changeWeatherZone } from "../systems/Weather";
import { tickDayNight } from "../systems/DayNight";
import { updateCamera, isPlayerDead } from "../systems/Camera";
import {
  updateHeightScore,
  tickCombo,
  saveHighScore,
} from "../systems/Score";
import { getDifficulty } from "../systems/Difficulty";
import { tickShake } from "../systems/ScreenShake";
import { updateZone } from "../systems/Zone";
import {
  GARLIC_BREATH_JUMP_MULTIPLIER,
  DEATH_ANIMATION_TICKS,
  COUNTDOWN_TICKS,
  SQUASH_HOLD_FRAMES,
  SQUASH_TOTAL_FRAMES,
  GAME_HEIGHT,
  GAME_WIDTH,
} from "../config/constants";
import { maybeSpawnBoss, tickBoss, tickKnifeAmmo } from "./GameLoopBoss";
import { getBossForZone } from "../entities/Boss";
import { tickEnemies } from "./GameLoopEnemies";
import { updateProjectiles } from "../entities/Projectile";
import {
  spawnLasagnaPlatform,
  expireLasagnaPlatforms,
  maybeGeneratePlatforms,
  prune,
  rescuePlayer,
} from "./GameLoopHelpers";
import {
  tickPlatformCollisions,
  tickPlatformEffects,

  tickFlood,
  tickMeatballCollection,
  tickPowerUpCollection,
  tickStagnation,
} from "./GameLoopTick";

// Re-export types so existing consumers keep working
export type { GameEvent, TickResult } from "./GameLoopTypes";

const KNIFE_REGEN_TICKS = 90; // 1.5 seconds per knife

/** Start the countdown before gameplay. */
export function startCountdown(state: GameWorldState): GameWorldState {
  return { ...state, countdownTicks: COUNTDOWN_TICKS };
}

/** Toggle pause state. */
export function togglePause(state: GameWorldState): GameWorldState {
  return { ...state, paused: !state.paused };
}

/** Throw a projectile (knife) from the player toward a target position. */
export function throwProjectile(
  state: GameWorldState,
  targetX: number,
  targetY: number,
): GameWorldState {
  if (state.gameOver || state.isDying) return state;
  if (!state.enemiesEnabled && !state.inBossFight) return state;
  const infinite = state.debugConfig.infiniteKnives;
  if (!infinite && state.knifeAmmo <= 0) return state;
  const playerCX = state.player.x + state.player.width / 2;
  const playerCY = state.player.y + state.player.height / 2;
  const proj = createProjectile(playerCX, playerCY, targetX, targetY);
  const newAmmo = infinite ? state.knifeAmmo : state.knifeAmmo - 1;
  return {
    ...state,
    projectiles: [...state.projectiles, proj],
    knifeAmmo: newAmmo,
    // Start regen if not already running — never reset existing progress
    knifeRegenTimer: infinite ? 0
      : state.knifeRegenTimer > 0 ? state.knifeRegenTimer : KNIFE_REGEN_TICKS,
  };
}

/**
 * Advance the game world by one tick. Pure function — no side effects.
 * All side effects (audio, particles, rendering) are communicated via events.
 */
export function tickGameWorld(
  state: GameWorldState,
  inputX: number,
): TickResult {
  const events: GameEvent[] = [];

  if (state.gameOver || state.paused) {
    return { state, events };
  }

  // Countdown phase — update visuals but don't move player
  if (state.countdownTicks > 0) {
    const difficulty = getDifficulty(state.platformsPassed, state.runConfig.difficultyMultiplier);
    const platforms = updatePlatforms(
      state.platforms,
      difficulty.movingSpeedMultiplier,
    );
    const platMap = new Map(platforms.map((p) => [p.id, p]));
    const powerUps = updatePowerUpPositions(state.powerUps, platforms, platMap);
    const meatballs = updateMeatballPositions(state.meatballs, platforms, platMap);
    const camera = updateCamera(state.camera, state.player.y);
    return {
      state: {
        ...state,
        platforms,
        powerUps,
        meatballs,
        camera,
        countdownTicks: state.countdownTicks - 1,
        animTick: state.animTick + 1,
      },
      events,
    };
  }

  // Death animation
  if (state.isDying) {
    const dyingTicks = state.dyingTicks + 1;
    const player = {
      ...state.player,
      vy: state.player.vy + 0.45,
      y: state.player.y + state.player.vy,
    };
    if (dyingTicks >= DEATH_ANIMATION_TICKS) {
      // Ghost mode: rescue player instead of game over, freeze scoring
      if (state.isGhost) {
        const camTop = state.camera.y;
        const camBot = camTop + GAME_HEIGHT;
        const vis = state.platforms.filter((p) => !p.broken && p.y >= camTop && p.y <= camBot);
        let rescue = vis.length > 0 ? vis.sort((a, b) => a.y - b.y)[0]
          : state.platforms.filter((p) => !p.broken).sort((a, b) => a.y - b.y)[0];
        let plats = state.platforms;
        if (!rescue) {
          rescue = { x: GAME_WIDTH / 2 - 50, y: camTop + GAME_HEIGHT * 0.6, width: 100, height: 15,
            type: "static" as const, broken: false, id: Date.now(), originX: GAME_WIDTH / 2 - 50, moveDirection: 0 };
          plats = [...plats, rescue];
        }
        const ph = Math.max(0, Math.floor(state.ghostDeathHeight * 0.9));
        // Don't push "died" event to avoid repeated death sounds
        return { state: { ...state, platforms: plats, player: { ...state.player,
          x: rescue.x + rescue.width / 2 - state.player.width / 2,
          y: rescue.y - state.player.height, vy: -12, isJumping: true,
        }, isDying: false, dyingTicks: 0, stagnantTicks: 0, ghostDeathHeight: ph,
        // Clear boss fight so ghost player isn't immediately killed again
        activeBoss: null, inBossFight: false, bossAttacks: [] }, events };
      }
      const isCustom = state.runConfig.seed !== 0 || state.practiceMode;
      const isNewRecord = isCustom ? false : saveHighScore(state.scoreState.points);
      events.push({ type: "gameOver", isNewRecord });
      return {
        state: { ...state, player, dyingTicks, gameOver: true,
          highScore: isNewRecord ? state.scoreState.points : state.highScore },
        events,
      };
    }
    return { state: { ...state, player, dyingTicks }, events };
  }

  // ── Main game tick ────────────────────────────────────────────────────

  let s: GameWorldState = {
    ...state,
    elapsedMs: Date.now() - state.startTime,
  };
  const previousX = s.player.x;
  const previousY = s.player.y;

  // Active power-up effect tick
  if (s.activeEffect) {
    const effectResult = tickEffect(s.player, s.activeEffect);
    s = { ...s, player: effectResult.player, activeEffect: effectResult.effect };
    if (!s.activeEffect) {
      events.push({ type: "effectEnded" });
    }
    if (effectResult.spawnPlatform) {
      s = spawnLasagnaPlatform(s);
      events.push({ type: "lasagnaSpawned" });
    }
  }

  // Update moving platforms
  const difficulty = getDifficulty(s.platformsPassed, s.runConfig.difficultyMultiplier);
  s = {
    ...s,
    platforms: updatePlatforms(s.platforms, difficulty.movingSpeedMultiplier),
  };

  // Sync positions to platforms (skip meatballs when magnet active)
  const platMap = new Map(s.platforms.map((p) => [p.id, p]));
  if (s.activeEffect?.type !== "meatball_magnet") {
    s = {
      ...s,
      meatballs: updateMeatballPositions(s.meatballs, s.platforms, platMap),
    };
  }
  s = {
    ...s,
    powerUps: updatePowerUpPositions(s.powerUps, s.platforms, platMap),
  };

  const inSquashHold =
    s.squashTicks > SQUASH_TOTAL_FRAMES - SQUASH_HOLD_FRAMES;
  const isSquashTransition = !inSquashHold && s.pendingJumpVy !== 0;

  if (inSquashHold) {
    s = { ...s, player: { ...s.player, vy: 0, y: s.squashHoldY } };
  } else if (isSquashTransition) {
    let jumpVy = s.pendingJumpVy;
    if (s.activeEffect?.type === "garlic_breath") {
      jumpVy *= GARLIC_BREATH_JUMP_MULTIPLIER;
    }
    if (hasGnocchiBounce(s.activeEffect)) {
      jumpVy = applyGnocchiBounce(jumpVy);
    }
    s = {
      ...s,
      player: {
        ...s.player,
        vy: jumpVy,
        y: s.squashHoldY,
        isJumping: true,
      },
      pendingJumpVy: 0,
    };
  } else {
    const adjustedInputX =
      s.activeEffect?.type === "chili_pepper" ? -inputX : inputX;
    s = { ...s, player: updatePlayer(s.player, adjustedInputX) };
  }

  // Platform collisions, effects, flood
  s = tickPlatformCollisions(s, events, previousX, previousY, inSquashHold, isSquashTransition);
  s = tickPlatformEffects(s);
  s = tickFlood(s);

  // Meatball magnet attraction
  if (s.activeEffect?.type === "meatball_magnet") {
    s = {
      ...s,
      meatballs: attractMeatballs(
        s.player.x,
        s.player.y,
        s.player.width,
        s.meatballs,
      ),
    };
  }

  // Collections and scoring
  s = tickMeatballCollection(s, events, previousX, previousY);
  s = { ...s, scoreState: tickCombo(s.scoreState) };
  s = tickPowerUpCollection(s, events, previousX, previousY);
  // Ghost mode: freeze height only after first death (ghostDeathHeight > 0)
  if (!s.isGhost || !s.ghostDeathHeight) s = { ...s, scoreState: updateHeightScore(s.scoreState, s.player.y) };

  // Stagnation and zone transitions
  s = tickStagnation(s, events);

  const prevZone = s.zoneState.currentZone;
  // Quick zone transitions in debug — directly compute zone from platform count
  const qzt = s.debugConfig.quickZoneTransitions;
  let zoneResult: { state: typeof s.zoneState; changed: boolean };
  if (qzt > 0) {
    const directZone = Math.min(6, Math.floor(s.platformsPassed / qzt));
    const changed = directZone !== s.zoneState.currentZone;
    zoneResult = { state: { currentZone: directZone, platformsPassed: s.platformsPassed }, changed };
  } else {
    zoneResult = updateZone(s.zoneState, s.platformsPassed);
  }
  // Suppress zone changes during boss fights or pending boss spawn
  if (s.inBossFight || s.pendingBossZone !== null) {
    zoneResult = { state: s.zoneState, changed: false };
  }
  s = { ...s, zoneState: zoneResult.state };
  if (zoneResult.changed) {
    // Don't show zone transition cinematic if a boss is about to spawn for this zone
    const hasBoss = getBossForZone(s.zoneState.currentZone) != null;
    if (!hasBoss) {
      events.push({
        type: "zoneChanged",
        from: prevZone,
        to: s.zoneState.currentZone,
      });
    }
    s = { ...s, weather: changeWeatherZone(s.weather, s.zoneState.currentZone) };
  }

  // Boss spawning (deferred until zone transition ends) + tick
  s = maybeSpawnBoss(s, zoneResult.changed);
  s = tickBoss(s, events);
  s = tickKnifeAmmo(s);

  // Weather + day/night (skip if disabled via debug config)
  if (!s.debugConfig.disableWeather) {
    s = { ...s, weather: tickWeather(s.weather) };
  }
  s = { ...s, dayNight: tickDayNight(s.dayNight) };

  // Camera
  s = { ...s, camera: updateCamera(s.camera, s.player.y, s.inBossFight) };

  // Screen shake
  if (s.shakeState) {
    const shakeResult = tickShake(s.shakeState);
    s = { ...s, shakeState: shakeResult.state };
  }

  // High score check
  if (
    !s.highScoreBeatShown &&
    s.highScore > 0 &&
    s.scoreState.points > s.highScore
  ) {
    s = { ...s, highScoreBeatShown: true };
    events.push({ type: "highScoreBeat" });
  }

  // Enemies & hazards
  s = tickEnemies(s, events);

  // Update projectiles even when enemies are disabled (needed for boss fights)
  if (!s.enemiesEnabled && s.projectiles.length > 0) {
    s = { ...s, projectiles: updateProjectiles(s.projectiles) };
  }

  // Death check — always uses camera.highestY (fixed reference point)
  const deathCheck = isPlayerDead(s.camera, s.player.y);
  if (deathCheck) {
    if (s.practiceMode || s.debugConfig.invincible) {
      s = rescuePlayer(s);
    } else {
      s = { ...s, isDying: true, squashTicks: 0, pendingJumpVy: 0,
        ghostDeathHeight: s.ghostDeathHeight || s.scoreState.height };
      if (!s.isGhost) events.push({ type: "died" });
    }
  }

  // Generate new platforms + prune old
  s = maybeGeneratePlatforms(s);
  s = expireLasagnaPlatforms(s, events);
  s = prune(s);

  // Decrement squash ticks
  if (s.squashTicks > 0) {
    s = { ...s, squashTicks: s.squashTicks - 1 };
  }

  // Decrement spring flash
  if (s.springFlashTicks > 0) {
    s = { ...s, springFlashTicks: s.springFlashTicks - 1 };
    if (s.springFlashTicks === 0) {
      events.push({ type: "effectEnded" });
    }
  }

  // Decrement pickup flash
  if (s.pickupFlashTicks > 0) {
    s = { ...s, pickupFlashTicks: s.pickupFlashTicks - 1 };
  }

  s = { ...s, animTick: s.animTick + 1 };

  return { state: s, events };
}
