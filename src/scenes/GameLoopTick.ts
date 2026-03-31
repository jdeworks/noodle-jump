/** Per-tick sub-routines for collisions, collections, and state updates. */

import type { GameWorldState } from "./GameState";
import type { GameEvent } from "./GameLoopTypes";
import {
  collectMeatballs,
} from "../entities/Collectible";
import {
  collectPowerUps,
  applyPowerUp,
  isNegativePowerUp,
} from "../entities/PowerUp";
import { checkPlatformCollisions } from "../systems/Physics";
import {
  tickCrumbleTimer,
  resolveTeleport,
  applyConveyorForce,
  applyWeightedTilt,
  applyWeightedSlide,
  applyIcePhysics,
} from "../systems/PlatformEffects";
import {
  tryShieldAbsorb,
  drillBreakPlatforms,
  createMinestroneFlood,
  tickMinestroneFlood,
  isPlayerInFlood,
  stopMinestroneFlood,
} from "../systems/PowerUpEffects";
import {
  addMeatballScore,
  addPowerUpScore,
  addCloseCallBonus,
  addLandingStreak,
} from "../systems/Score";
import { createShake } from "../systems/ScreenShake";
import {
  BURNT_TOAST_SHRINK,
  STAGNANT_WARNING_1_TICKS,
  STAGNANT_WARNING_2_TICKS,
  STAGNANT_KILL_START_TICKS,
  STAGNANT_CRUMBLE_INTERVAL,
  SQUASH_TOTAL_FRAMES,
} from "../config/constants";

/** Resolve platform collisions, landings, teleports, and crumble timers. */
export function tickPlatformCollisions(
  s: GameWorldState,
  events: GameEvent[],
  previousX: number,
  previousY: number,
  inSquashHold: boolean,
  isSquashTransition: boolean,
): GameWorldState {
  const isFlying =
    s.activeEffect?.type === "fusilli_tornado" ||
    s.activeEffect?.type === "ravioli_rocket" ||
    s.activeEffect?.type === "pepper_sneeze";

  if (isFlying || inSquashHold || isSquashTransition) return s;

  const allBreaking = s.activeEffect?.type === "soggy_noodle";
  const alreadyBroken = new Set(
    s.platforms.filter((p) => p.broken).map((p) => p.id),
  );

  // Burnt toast shrinks collision hitboxes
  let collisionPlatforms = s.platforms;
  if (s.activeEffect?.type === "burnt_toast") {
    collisionPlatforms = s.platforms.map((p) => ({
      ...p,
      x: p.x + p.width * 0.25,
      width: p.width * BURNT_TOAST_SHRINK,
    }));
  }

  const collision = checkPlatformCollisions(
    s.player,
    collisionPlatforms,
    previousY,
    allBreaking,
    previousX,
  );
  s = { ...s, player: collision.player };

  // Map platform updates back
  if (s.activeEffect?.type === "burnt_toast") {
    const brokenIds = new Set(
      collision.platforms.filter((p) => p.broken).map((p) => p.id),
    );
    s = {
      ...s,
      platforms: s.platforms.map((p) =>
        brokenIds.has(p.id) && !p.broken ? { ...p, broken: true } : p,
      ),
    };
  } else {
    s = { ...s, platforms: collision.platforms };
  }

  // Landing
  if (collision.landed) {
    s = {
      ...s,
      pendingJumpVy: s.player.vy,
      squashHoldY: s.player.y,
      player: { ...s.player, vy: 0 },
      squashTicks: SQUASH_TOTAL_FRAMES,
    };
    s = { ...s, scoreState: addLandingStreak(s.scoreState) };
    events.push({
      type: "landed",
      edgeLanding: collision.edgeLanding,
      platformBroke: collision.platformBroke,
      x: s.player.x + s.player.width / 2,
      y: s.player.y + s.player.height,
    });

    if (s.scoreState.landingStreak % 5 === 0) {
      events.push({
        type: "landingStreak",
        streak: s.scoreState.landingStreak,
      });
    }
    if (collision.edgeLanding && s.stagnantTicks < 300) {
      s = { ...s, scoreState: addCloseCallBonus(s.scoreState) };
    }
  }

  if (collision.platformBroke) {
    for (const p of s.platforms) {
      if (p.broken && !alreadyBroken.has(p.id)) {
        events.push({ type: "platformCrumbled", platform: p });
      }
    }
  }

  // Teleport resolution
  if (collision.teleported && collision.landedPlatform) {
    const teleResult = resolveTeleport(
      s.player,
      collision.landedPlatform,
      s.platforms,
    );
    if (teleResult.targetPlatform) {
      s = { ...s, player: teleResult.player };
    }
  }

  // Tick crumbling platform timers
  {
    let anyBroke = false;
    const platforms = s.platforms.map((p) => {
      if (p.type !== "crumbling" || p.crumbleTimer == null) return p;
      const result = tickCrumbleTimer(p);
      if (result.broke) {
        anyBroke = true;
        events.push({ type: "platformCrumbled", platform: p });
      }
      return result.platform;
    });
    if (anyBroke || platforms !== s.platforms) {
      s = { ...s, platforms };
    }
  }

  return s;
}

/** Apply conveyor, ice, and weighted platform effects while standing. */
export function tickPlatformEffects(s: GameWorldState): GameWorldState {
  if (s.squashTicks <= 0) return s;

  const standingOn = s.platforms.find(
    (p) =>
      !p.broken &&
      s.player.y + s.player.height >= p.y - 2 &&
      s.player.y + s.player.height <= p.y + 5 &&
      s.player.x + s.player.width > p.x &&
      s.player.x < p.x + p.width,
  );

  if (standingOn?.type === "conveyor") {
    return { ...s, player: applyConveyorForce(s.player, standingOn) };
  }
  if (standingOn?.type === "ice") {
    return { ...s, player: applyIcePhysics(s.player) };
  }
  if (standingOn?.type === "weighted") {
    const tilted = applyWeightedTilt(standingOn, s.player.x, s.player.width);
    return {
      ...s,
      platforms: s.platforms.map((p) => (p.id === tilted.id ? tilted : p)),
      player: applyWeightedSlide(s.player, tilted),
    };
  }
  return s;
}

/** Tick rigatoni drill platform breaking. */
export function tickDrill(
  s: GameWorldState,
  events: GameEvent[],
): GameWorldState {
  if (s.activeEffect?.type !== "rigatoni_drill") return s;

  const drillResult = drillBreakPlatforms(s.player, s.platforms);
  s = { ...s, platforms: drillResult.platforms };
  for (const id of drillResult.brokenIds) {
    const broken = s.platforms.find((p) => p.id === id);
    if (broken) {
      events.push({ type: "platformCrumbled", platform: broken });
    }
  }
  return s;
}

/** Tick minestrone flood rising and stopping. */
export function tickFlood(s: GameWorldState): GameWorldState {
  if (s.minestroneFlood?.active) {
    const updatedFlood = tickMinestroneFlood(s.minestroneFlood);
    s = { ...s, minestroneFlood: updatedFlood };
    if (isPlayerInFlood(s.player.y, s.player.height, updatedFlood)) {
      s = {
        ...s,
        player: { ...s.player, vy: Math.min(s.player.vy, -8) },
      };
    }
  }
  if (
    s.minestroneFlood?.active &&
    s.activeEffect?.type !== "minestrone_soup"
  ) {
    s = { ...s, minestroneFlood: stopMinestroneFlood(s.minestroneFlood) };
  }
  return s;
}

/** Collect meatballs and emit events. */
export function tickMeatballCollection(
  s: GameWorldState,
  events: GameEvent[],
  previousX: number,
  previousY: number,
): GameWorldState {
  const meatballResult = collectMeatballs(
    s.player.x,
    s.player.y,
    s.player.width,
    s.player.height,
    s.meatballs,
    previousX,
    previousY,
  );
  s = { ...s, meatballs: meatballResult.meatballs };
  if (meatballResult.collected > 0) {
    s = {
      ...s,
      scoreState: addMeatballScore(s.scoreState, meatballResult.collected),
    };
    events.push({
      type: "meatballCollected",
      count: meatballResult.collected,
      combo: s.scoreState.comboMultiplier,
    });
    if (s.scoreState.comboMultiplier > 1) {
      events.push({
        type: "comboActive",
        multiplier: s.scoreState.comboMultiplier,
      });
    }
  }
  return s;
}

/** Collect power-ups, apply effects, and emit events. */
export function tickPowerUpCollection(
  s: GameWorldState,
  events: GameEvent[],
  previousX: number,
  previousY: number,
): GameWorldState {
  const puResult = collectPowerUps(s.player, s.powerUps, previousX, previousY);
  s = { ...s, powerUps: puResult.powerUps };
  if (!puResult.collected) return s;

  const isNeg = isNegativePowerUp(puResult.collected);

  // Shield absorption — if a negative power-up is collected and shield is active
  if (isNeg && s.activeEffect?.type === "pasta_shield") {
    const shield = tryShieldAbsorb(s.activeEffect);
    s = { ...s, activeEffect: shield.effect };
    s = { ...s, scoreState: addPowerUpScore(s.scoreState) };
    events.push({
      type: "powerUpCollected",
      powerUpType: puResult.collected,
      isNegative: true,
    });
    s = { ...s, pickupFlashTicks: 15, pickupFlashColor: 0x44ddff };
  } else {
    s = { ...s, scoreState: addPowerUpScore(s.scoreState) };
    const applied = applyPowerUp(s.player, puResult.collected);
    s = { ...s, player: applied.player, activeEffect: applied.effect };

    events.push({
      type: "powerUpCollected",
      powerUpType: puResult.collected,
      isNegative: isNeg,
    });

    if (puResult.collected === "spaghetti_spring") {
      s = { ...s, springFlashTicks: 30 };
    }
    if (puResult.collected === "minestrone_soup") {
      s = {
        ...s,
        minestroneFlood: createMinestroneFlood(s.player.y),
      };
    }
    if (isNeg) {
      s = {
        ...s,
        shakeState: createShake(8, 20),
        pickupFlashTicks: 15,
        pickupFlashColor: 0xff0000,
      };
    } else {
      s = { ...s, pickupFlashTicks: 12, pickupFlashColor: 0xffffff };
    }
  }
  return s;
}

/** Track height progress and apply stagnation penalties. */
export function tickStagnation(
  s: GameWorldState,
  events: GameEvent[],
): GameWorldState {
  if (s.player.y < s.highestPlayerY) {
    const newlyPassed = s.platforms.filter(
      (p) => p.y > s.player.y && p.y <= s.highestPlayerY,
    ).length;
    return {
      ...s,
      platformsPassed: s.platformsPassed + newlyPassed,
      highestPlayerY: s.player.y,
      stagnantTicks: 0,
    };
  }

  if (s.inBossFight) return s;

  s = { ...s, stagnantTicks: s.stagnantTicks + 1 };

  if (s.stagnantTicks === STAGNANT_WARNING_1_TICKS) {
    s = { ...s, shakeState: createShake(3, 30) };
    events.push({ type: "stagnantWarning", level: 1 });
  }
  if (s.stagnantTicks === STAGNANT_WARNING_2_TICKS) {
    s = { ...s, shakeState: createShake(5, 20) };
    events.push({ type: "stagnantWarning", level: 2 });
  }
  if (
    s.stagnantTicks > STAGNANT_KILL_START_TICKS &&
    s.stagnantTicks % STAGNANT_CRUMBLE_INTERVAL === 0
  ) {
    const intact = s.platforms
      .filter((p) => !p.broken && p.type !== "lasagna")
      .sort((a, b) => b.y - a.y);
    if (intact.length > 0) {
      const victim = intact[0];
      s = {
        ...s,
        platforms: s.platforms.map((p) =>
          p.id === victim.id ? { ...p, broken: true } : p,
        ),
        shakeState: createShake(4, 10),
      };
      events.push({ type: "platformCrumbled", platform: victim });
      events.push({ type: "stagnantWarning", level: 3 });
    }
  }
  return s;
}
