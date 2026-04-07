/** Entity rendering — position and style platforms, meatballs, power-ups. */

import { type PlatformStyle } from "../rendering/sprites";
import { drawThemedPlatform } from "../rendering/ThemeSprites";
import { worldToScreen } from "../systems/Camera";
import { isNegativePowerUp } from "../entities/PowerUp";
import { GAME_HEIGHT } from "../config/constants";
import type { GameWorldState } from "./GameState";
import type { GraphicsSync } from "./GraphicsSync";
import type { ZoneTheme } from "../systems/Zone";

/** Reset rendering state on new game. */
export function resetRendererState(): void {
  // Currently no cached state — platforms redrawn each frame
}

/** Blend two colors: result = a * (1-t) + b * t */
function blendColor(a: number, b: number, t: number): number {
  const rA = (a >> 16) & 0xff,
    gA = (a >> 8) & 0xff,
    bA = a & 0xff;
  const rB = (b >> 16) & 0xff,
    gB = (b >> 8) & 0xff,
    bB = b & 0xff;
  const r = Math.round(rA * (1 - t) + rB * t);
  const g = Math.round(gA * (1 - t) + gB * t);
  const bl = Math.round(bA * (1 - t) + bB * t);
  return (r << 16) | (g << 8) | bl;
}

/** Render all platforms with zone-appropriate colors. */
export function renderPlatforms(
  state: GameWorldState,
  gfxSync: GraphicsSync,
  theme: ZoneTheme,
  camY: number,
  cosmeticTheme = "theme_default",
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

    // Distinctive base color per type, blended 30% with zone theme
    // so specials are recognizable but don't look totally alien
    const style: PlatformStyle =
      platform.type === "lasagna" ? "lasagna" : ((platform.type as PlatformStyle) ?? "normal");
    let color = theme.platform;
    const zoneBase = theme.platform;
    switch (platform.type) {
      case "breaking":
        color = blendColor(0x886622, zoneBase, 0.3);
        break;
      case "brittle":
        color = blendColor(0xcc8866, zoneBase, 0.3);
        break;
      case "moving":
        color = blendColor(0x6699cc, zoneBase, 0.3);
        break;
      case "lasagna":
        color = blendColor(0xff8c00, zoneBase, 0.2);
        break;
      case "conveyor":
        color = blendColor(0x888888, zoneBase, 0.3);
        break;
      case "spring":
        color = blendColor(0x33bb33, zoneBase, 0.25);
        break;
      case "ice":
        color = blendColor(0x88ccff, zoneBase, 0.25);
        break;
      case "crumbling":
        color = blendColor(0xcc6633, zoneBase, 0.3);
        break;
      case "teleport":
        color = blendColor(0x9955ff, zoneBase, 0.2);
        break;
      case "weighted":
        color = blendColor(0x997744, zoneBase, 0.3);
        break;
    }

    // Only redraw platform when color/shrink changes (gfx.clear() every frame leaks GPU buffers)
    const cacheKey = `${color}_${shrink}`;
    if ((gfx as any)._cacheKey !== cacheKey) {
      drawThemedPlatform(
        gfx,
        platform.width * shrink,
        platform.height,
        color,
        style,
        cosmeticTheme,
      );
      (gfx as any)._cacheKey = cacheKey;
    }
    gfx.x = platform.x + (platform.width * (1 - shrink)) / 2;
    gfx.y = worldToScreen(platform.y, camY);
    gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20;

    // Flip conveyor arrow to match direction
    if (platform.type === "conveyor" && platform.conveyorDir === -1) {
      gfx.scale.x = -1;
      gfx.x += platform.width * shrink; // compensate for flip
    } else if (gfx.scale.x < 0) {
      gfx.scale.x = 1;
    }

    // Per-type animations
    const t = state.animTick;
    if (platform.type === "spring") {
      // Gentle bounce compression
      gfx.scale.y = 1 + Math.sin(t * 0.1 + platform.id) * 0.08;
    } else if (platform.type === "teleport") {
      // Pulsing glow
      gfx.alpha = 0.75 + Math.sin(t * 0.12 + platform.id) * 0.25;
    } else if (platform.type === "crumbling") {
      // Subtle shake when visible
      gfx.x += Math.sin(t * 0.3 + platform.id * 7) * 0.5;
    } else if (platform.type === "ice") {
      // Shimmer via slight alpha oscillation
      gfx.alpha = 0.85 + Math.sin(t * 0.08 + platform.id) * 0.15;
    } else if (platform.type === "lasagna") {
      gfx.alpha = 0.8 + Math.sin(t * 0.06) * 0.2;
    }
    // Neon sign flicker — subtle random pulse per platform
    if (cosmeticTheme === "theme_neon") {
      gfx.alpha *=
        0.85 +
        Math.sin(t * 0.18 + platform.id * 7) * 0.1 +
        Math.sin(t * 0.43 + platform.id * 3) * 0.05;
    }
  }
}

/** Render meatballs — each has unique rotation + bob. */
export function renderMeatballs(state: GameWorldState, gfxSync: GraphicsSync, camY: number): void {
  const t = state.animTick;

  for (const meatball of state.meatballs) {
    const gfx = gfxSync.meatballGfxMap.get(meatball.id);
    if (!gfx) continue;

    if (meatball.collected) {
      gfx.visible = false;
      continue;
    }

    // Per-meatball phase so they don't all look the same
    const phase = meatball.id * 1.7;
    const bobSpeed = 0.04 + (meatball.id % 4) * 0.006;
    const bob = Math.sin(t * bobSpeed + phase) * 2.5;

    gfx.pivot.set(meatball.size / 2, meatball.size / 2);
    gfx.x = meatball.x + meatball.size / 2;
    gfx.y = worldToScreen(meatball.y + meatball.size / 2, camY) + bob;

    // Each meatball has a fixed base rotation (from ID) + slow wobble
    const baseRotation = (((meatball.id * 137.5) % 360) * Math.PI) / 180;
    gfx.rotation = baseRotation + Math.sin(t * 0.015 + phase) * 0.3;

    // Slight scale variation so they feel organic
    const scalePulse = 0.95 + Math.sin(t * 0.03 + phase) * 0.05;
    gfx.scale.set(scalePulse);

    gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20;
  }
}

/** Render power-ups with per-item unique animations. */
export function renderPowerUps(state: GameWorldState, gfxSync: GraphicsSync, camY: number): void {
  const t = state.animTick;

  for (const pu of state.powerUps) {
    const gfx = gfxSync.powerUpGfxMap.get(pu.id);
    if (!gfx) continue;

    if (pu.collected) {
      gfx.visible = false;
      continue;
    }

    // Per-item phase offset from ID for variety
    const phase = pu.id * 2.3;
    // Each power-up bobs at a slightly different speed/amplitude
    const bobSpeed = 0.03 + (pu.id % 5) * 0.008;
    const bobAmp = 2 + (pu.id % 3);
    const bob = Math.sin(t * bobSpeed + phase) * bobAmp;

    // Pivot at center so bob/scale/rotation all happen around the middle
    gfx.pivot.set(pu.size / 2, pu.size / 2);
    gfx.x = pu.x + pu.size / 2;
    gfx.y = worldToScreen(pu.y + pu.size / 2, camY) + bob;

    // Coin rotation — scaleX oscillates to simulate 3D spin
    const spinSpeed = 0.07 + (pu.id % 4) * 0.012;
    gfx.scale.x = 0.35 + Math.abs(Math.cos(t * spinSpeed + phase)) * 0.65;

    if (isNegativePowerUp(pu.type)) {
      // Negative: pulse scale + wobble rotation
      const pulse = 0.9 + Math.sin(t * 0.12 + phase) * 0.1;
      gfx.scale.y = pulse;
      gfx.rotation = Math.sin(t * 0.1 + phase) * 0.08;
    } else {
      gfx.scale.y = 1;
      gfx.rotation = 0;
    }

    gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20;
  }
}

/** Render enemies with bob animation. */
export function renderEnemies(
  state: GameWorldState,
  gfxSync: GraphicsSync,
  camY: number,
  cosmeticTheme = "theme_default",
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
    // Neon flicker for themed enemies
    gfx.alpha =
      cosmeticTheme === "theme_neon"
        ? 0.8 + Math.sin(state.animTick * 0.2 + enemy.id * 3) * 0.2
        : 1;
    const facing = enemy.vx >= 0 ? 1 : -1;
    gfx.scale.x = facing;
    // Wobble rotation for liveliness
    gfx.rotation = Math.sin(state.animTick * 0.08 + enemy.id * 3) * 0.12;
    gfx.visible = gfx.y > -30 && gfx.y < GAME_HEIGHT + 30;
  }
}

/** Render projectiles — knife points in travel direction + slight spin. */
export function renderProjectiles(
  state: GameWorldState,
  gfxSync: GraphicsSync,
  camY: number,
  spins: boolean,
): void {
  const t = state.animTick;
  for (const proj of state.projectiles) {
    const gfx = gfxSync.projectileGfxMap.get(proj.id);
    if (!gfx) continue;

    if (!proj.alive) {
      gfx.visible = false;
      continue;
    }

    gfx.x = proj.x;
    gfx.y = worldToScreen(proj.y, camY);
    if (spins) {
      // Continuous fast spin (shurikens, axes, orbs)
      gfx.rotation = t * 0.25 + proj.id * 3;
    } else {
      // Point in travel direction + subtle wobble
      gfx.rotation =
        Math.atan2(proj.vy, proj.vx) + Math.PI / 2 + Math.sin(t * 0.3 + proj.id * 5) * 0.06;
    }
    gfx.visible = gfx.y > -30 && gfx.y < GAME_HEIGHT + 30;
  }
}
