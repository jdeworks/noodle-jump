/** Entity rendering — position and style platforms, meatballs, power-ups. */

import { drawPlatform, drawEnemy, type PlatformStyle } from "../rendering/sprites";
import { worldToScreen } from "../systems/Camera";
import { isNegativePowerUp } from "../entities/PowerUp";
import { GAME_HEIGHT } from "../config/constants";
import type { GameWorldState } from "./GameState";
import type { GraphicsSync } from "./GraphicsSync";
import type { ZoneTheme } from "../systems/Zone";

/** Render all platforms with zone-appropriate colors. */
export function renderPlatforms(
  state: GameWorldState,
  gfxSync: GraphicsSync,
  theme: ZoneTheme,
  camY: number,
): void {
  const isBurnt = state.activeEffect?.type === "burnt_toast";
  const shrink = isBurnt ? 0.5 : 1;

  for (const platform of state.platforms) {
    const gfx = gfxSync.platformGfxMap.get(platform.id);
    if (!gfx) continue;

    if (platform.broken) {
      if (gfx.alpha > 0.05) {
        gfx.alpha *= 0.85;
        gfx.scale.y *= 0.88;
        gfx.y = worldToScreen(platform.y, camY);
      } else {
        gfx.visible = false;
      }
      continue;
    }

    if (gfx.alpha < 1) gfx.alpha = 1;
    if (gfx.scale.y < 1) gfx.scale.y = 1;

    let color = theme.platform;
    let style: PlatformStyle = "normal";

    if (platform.type === "breaking") {
      color = theme.platformBreaking;
      style = "breaking";
    } else if (platform.type === "brittle") {
      color = theme.platformBrittle;
      style = "brittle";
    } else if (platform.type === "moving") {
      color = theme.platformMoving;
      style = "moving";
    } else if (platform.type === "lasagna") {
      color = theme.platformLasagna;
      style = "lasagna";
    } else if (platform.type === "conveyor") {
      color = theme.platformConveyor;
      style = "conveyor";
    } else if (platform.type === "spring") {
      color = theme.platformSpring;
      style = "spring";
    } else if (platform.type === "ice") {
      color = theme.platformIce;
      style = "ice";
    } else if (platform.type === "crumbling") {
      color = theme.platformCrumbling;
      style = "crumbling";
    } else if (platform.type === "teleport") {
      color = theme.platformTeleport;
      style = "teleport";
    } else if (platform.type === "weighted") {
      color = theme.platformWeighted;
      style = "weighted";
    }

    drawPlatform(gfx, platform.width * shrink, platform.height, color, style);
    gfx.x = platform.x + (platform.width * (1 - shrink)) / 2;
    gfx.y = worldToScreen(platform.y, camY);
    gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20;
  }
}

/** Render meatballs with wobble and bob animations. */
export function renderMeatballs(
  state: GameWorldState,
  gfxSync: GraphicsSync,
  camY: number,
): void {
  const wobble = Math.cos(state.animTick * 0.04);
  const bob = Math.sin(state.animTick * 0.05) * 2;

  for (const meatball of state.meatballs) {
    const gfx = gfxSync.meatballGfxMap.get(meatball.id);
    if (!gfx) continue;

    if (meatball.collected) {
      gfx.visible = false;
      continue;
    }

    gfx.x = meatball.x + meatball.size / 2;
    gfx.y = worldToScreen(meatball.y, camY) + bob;
    gfx.pivot.x = meatball.size / 2;
    gfx.scale.x = 0.75 + Math.abs(wobble) * 0.25;
    gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20;
  }
}

/** Render power-ups with spin and pulse animations. */
export function renderPowerUps(
  state: GameWorldState,
  gfxSync: GraphicsSync,
  camY: number,
): void {
  const spin = Math.cos(state.animTick * 0.08);
  const bob = Math.sin(state.animTick * 0.04) * 3;

  for (const pu of state.powerUps) {
    const gfx = gfxSync.powerUpGfxMap.get(pu.id);
    if (!gfx) continue;

    if (pu.collected) {
      gfx.visible = false;
      continue;
    }

    gfx.x = pu.x + pu.size / 2;
    gfx.y = worldToScreen(pu.y, camY) + bob;
    gfx.pivot.x = pu.size / 2;

    if (isNegativePowerUp(pu.type)) {
      const pulse = 0.8 + Math.sin(state.animTick * 0.15) * 0.2;
      gfx.scale.set(pulse);
    } else {
      gfx.scale.x = 0.4 + Math.abs(spin) * 0.6;
    }

    gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20;
  }
}

/** Render enemies with bob animation. */
export function renderEnemies(
  state: GameWorldState,
  gfxSync: GraphicsSync,
  camY: number,
): void {
  const bob = Math.sin(state.animTick * 0.06) * 2;

  for (const enemy of state.enemies) {
    const gfx = gfxSync.enemyGfxMap.get(enemy.id);
    if (!gfx) continue;

    if (!enemy.alive) {
      gfx.visible = false;
      continue;
    }

    gfx.x = enemy.x + enemy.width / 2;
    gfx.y = worldToScreen(enemy.y, camY) + bob;
    gfx.pivot.set(enemy.width / 2, enemy.height / 2);
    gfx.scale.x = enemy.vx >= 0 ? 1 : -1;
    gfx.visible = gfx.y > -30 && gfx.y < GAME_HEIGHT + 30;
  }
}

/** Render projectiles with rotation based on velocity angle. */
export function renderProjectiles(
  state: GameWorldState,
  gfxSync: GraphicsSync,
  camY: number,
): void {
  for (const proj of state.projectiles) {
    const gfx = gfxSync.projectileGfxMap.get(proj.id);
    if (!gfx) continue;

    if (!proj.alive) {
      gfx.visible = false;
      continue;
    }

    gfx.x = proj.x;
    gfx.y = worldToScreen(proj.y, camY);
    gfx.rotation = Math.atan2(proj.vy, proj.vx) + Math.PI / 2;
    gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20;
  }
}
