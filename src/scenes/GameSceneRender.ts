/** Standalone render helpers for GameScene — boss and weather rendering. */

import { Container, Graphics } from "pixi.js";
import { worldToScreen } from "../systems/Camera";
import { drawBossHealthBar } from "../rendering/sprites";
import { drawThemedBoss } from "../rendering/ThemeSprites";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import type { GameWorldState } from "./GameState";

export function renderBoss(
  state: GameWorldState,
  bossGfx: Graphics,
  bossHealthGfx: Graphics,
  bossAttackGfx: Graphics[],
  gameContainer: Container,
  camY: number,
  cosmeticTheme = "theme_default",
): Graphics[] {
  const boss = state.activeBoss;
  if (!boss) {
    bossGfx.visible = false;
    bossHealthGfx.visible = false;
    for (const g of bossAttackGfx) {
      gameContainer.removeChild(g);
      g.destroy();
    }
    return [];
  }

  // Draw boss
  drawThemedBoss(
    bossGfx,
    boss.width,
    boss.height,
    boss.type,
    boss.phase,
    state.animTick,
    cosmeticTheme,
  );
  bossGfx.x = boss.x;
  bossGfx.y = worldToScreen(boss.y, camY);
  bossGfx.visible = true;

  if (!boss.alive && boss.deathTicks != null) {
    // Death animation — shrink, spin, fade out
    const totalDeathTicks = 90;
    const progress = 1 - boss.deathTicks / totalDeathTicks;
    const scale = 1 - progress * 0.9; // shrink to 10%
    bossGfx.scale.set(scale);
    bossGfx.rotation = progress * Math.PI * 4; // 2 full spins
    bossGfx.alpha = 1 - progress;
    bossGfx.y -= progress * 30; // float upward
    bossHealthGfx.visible = false;
  } else if (boss.patternTick <= 120) {
    // Flash during spawn grace period (2 seconds)
    bossGfx.alpha = Math.sin(boss.patternTick * 0.3) * 0.4 + 0.6;
    bossGfx.scale.set(1);
    bossGfx.rotation = 0;
  } else {
    bossGfx.alpha = 1;
    bossGfx.scale.set(1);
    bossGfx.rotation = 0;
  }

  // Health bar at top of screen
  drawBossHealthBar(
    bossHealthGfx,
    GAME_WIDTH * 0.15,
    45,
    GAME_WIDTH * 0.7,
    boss.health,
    boss.maxHealth,
  );
  bossHealthGfx.visible = true;

  // Boss attack projectiles — mutate in place
  while (bossAttackGfx.length > state.bossAttacks.length) {
    const g = bossAttackGfx.pop()!;
    gameContainer.removeChild(g);
    g.destroy();
  }
  while (bossAttackGfx.length < state.bossAttacks.length) {
    const g = new Graphics();
    g.circle(0, 0, 4);
    g.fill(0xff4444);
    gameContainer.addChild(g);
    bossAttackGfx.push(g);
  }
  for (let i = 0; i < state.bossAttacks.length; i++) {
    const atk = state.bossAttacks[i];
    const g = bossAttackGfx[i];
    g.x = atk.x;
    g.y = worldToScreen(atk.y, camY);
    g.visible = atk.alive;
  }

  return bossAttackGfx;
}

/** Render the boss jump arc — dotted parabola preview + landing target X. */
export function renderBossArc(gfx: Graphics, state: GameWorldState, camY: number): void {
  gfx.clear();
  const boss = state.activeBoss;
  if (!boss?.alive || !boss.jumpArc || boss.jumpArc.progress >= 1) {
    gfx.visible = false;
    return;
  }

  gfx.visible = true;
  const arc = boss.jumpArc;
  const ARC_H = 120;
  const midY = (arc.startY + arc.targetY) / 2;
  const peakY = midY - ARC_H;
  const steps = 20;
  // During preview (progress < 0): draw full arc; during jump: draw remaining
  const startT = Math.max(0, arc.progress);
  const isPreview = arc.progress < 0;
  const lineAlpha = isPreview ? 0.6 : 0.4;
  const markerAlpha = isPreview ? 0.8 : 0.6;

  // Draw dotted arc
  for (let i = 0; i < steps; i++) {
    const t0 = startT + (1 - startT) * (i / steps);
    const t1 = startT + (1 - startT) * ((i + 1) / steps);
    if (i % 2 !== 0) continue; // dotted

    const invT0 = 1 - t0;
    const px0 = arc.startX + (arc.targetX - arc.startX) * t0 + boss.width / 2;
    const py0 =
      invT0 * invT0 * arc.startY + 2 * invT0 * t0 * peakY + t0 * t0 * arc.targetY + boss.height / 2;

    const invT1 = 1 - t1;
    const px1 = arc.startX + (arc.targetX - arc.startX) * t1 + boss.width / 2;
    const py1 =
      invT1 * invT1 * arc.startY + 2 * invT1 * t1 * peakY + t1 * t1 * arc.targetY + boss.height / 2;

    gfx.moveTo(px0, worldToScreen(py0, camY));
    gfx.lineTo(px1, worldToScreen(py1, camY));
    gfx.stroke({ width: 2.5, color: 0xff4444, alpha: lineAlpha });
  }

  // Landing target — pulsing X marker
  const tx = arc.targetX + boss.width / 2;
  const ty = worldToScreen(arc.targetY + boss.height, camY);
  const pulse = isPreview ? 6 + Math.sin(state.animTick * 0.15) * 2 : 6;
  gfx.moveTo(tx - pulse, ty - pulse);
  gfx.lineTo(tx + pulse, ty + pulse);
  gfx.stroke({ width: 3, color: 0xff4444, alpha: markerAlpha });
  gfx.moveTo(tx + pulse, ty - pulse);
  gfx.lineTo(tx - pulse, ty + pulse);
  gfx.stroke({ width: 3, color: 0xff4444, alpha: markerAlpha });
}

export function renderWeather(
  state: GameWorldState,
  weatherGfx: Graphics[],
  weatherContainer: Container,
): Graphics[] {
  const { particles } = state.weather;

  // Remove excess — mutate in place instead of spreading
  while (weatherGfx.length > particles.length) {
    const gfx = weatherGfx.pop()!;
    gfx.visible = false;
    weatherContainer.removeChild(gfx);
    gfx.destroy();
  }

  // Add new
  while (weatherGfx.length < particles.length) {
    const gfx = new Graphics();
    // Pre-draw a unit circle; we'll scale per-particle
    gfx.circle(0, 0, 1);
    gfx.fill(0xffffff);
    weatherContainer.addChild(gfx);
    weatherGfx.push(gfx);
  }

  // Update positions — skip clear/redraw, just move and scale
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const gfx = weatherGfx[i];
    gfx.x = p.x;
    gfx.y = p.y;
    gfx.scale.set(p.size);
    gfx.alpha = p.alpha;
  }

  return weatherGfx;
}

/** Number of large arrows per zone. */
const ARROWS_PER_ZONE = 4;

/** Draw a filled chevron arrow pointing in `dir` at position (cx, cy). */
function drawArrow(gfx: Graphics, cx: number, cy: number, dir: number, size: number): void {
  const hw = size * 2; // very wide horizontal spread
  const hh = size * 1.3; // tall vertical spread
  const thick = size * 0.7; // thick chevron arms
  gfx.moveTo(cx - dir * hw, cy - hh);
  gfx.lineTo(cx + dir * hw, cy);
  gfx.lineTo(cx - dir * hw, cy + hh);
  gfx.lineTo(cx - dir * (hw - thick), cy + hh - thick * 0.6);
  gfx.lineTo(cx + dir * (hw - thick * 1.8), cy);
  gfx.lineTo(cx - dir * (hw - thick), cy - hh + thick * 0.6);
  gfx.closePath();
  gfx.fill({ color: 0xffffff, alpha: 0.6 });
}

/** Render all visible wind zones — blue tint + large animated arrows. */
export function renderWindOverlay(gfx: Graphics, state: GameWorldState, camY: number): void {
  gfx.clear();
  const { zones } = state.windSystem;
  if (zones.length === 0) {
    gfx.visible = false;
    return;
  }

  let anyVisible = false;
  const t = state.animTick;

  for (const zone of zones) {
    const screenTop = worldToScreen(zone.y, camY);
    const screenBottom = worldToScreen(zone.y + zone.height, camY);
    const top = Math.min(screenTop, screenBottom);
    const bottom = Math.max(screenTop, screenBottom);

    if (bottom < 0 || top > GAME_HEIGHT) continue;
    anyVisible = true;

    const clampTop = Math.max(0, top);
    const clampBottom = Math.min(GAME_HEIGHT, bottom);
    const clampH = clampBottom - clampTop;
    const dir = zone.direction;

    // Blue tint over the zone
    gfx.rect(0, clampTop, GAME_WIDTH, clampH);
    gfx.fill({ color: 0x88bbff, alpha: 0.14 });

    // Top and bottom border lines
    gfx.moveTo(0, clampTop);
    gfx.lineTo(GAME_WIDTH, clampTop);
    gfx.stroke({ width: 2, color: 0xaaddff, alpha: 0.35 });
    gfx.moveTo(0, clampBottom);
    gfx.lineTo(GAME_WIDTH, clampBottom);
    gfx.stroke({ width: 2, color: 0xaaddff, alpha: 0.35 });

    // Large animated arrows showing wind direction
    const zoneH = clampBottom - clampTop;
    const arrowSize = Math.min(30, zoneH * 0.3);

    for (let i = 0; i < ARROWS_PER_ZONE; i++) {
      const drift = ((t * 1.5 * dir + i * 80) % (GAME_WIDTH + 60)) - 30;
      const x =
        dir > 0
          ? (((drift % (GAME_WIDTH + 60)) + GAME_WIDTH + 60) % (GAME_WIDTH + 60)) - 30
          : GAME_WIDTH +
            30 -
            (((-drift % (GAME_WIDTH + 60)) + GAME_WIDTH + 60) % (GAME_WIDTH + 60));

      // Vertical position — distribute evenly within zone
      const cy = clampTop + (zoneH * (i + 1)) / (ARROWS_PER_ZONE + 1);
      if (cy < clampTop + 10 || cy > clampBottom - 10) continue;

      drawArrow(gfx, x, cy, dir, arrowSize);
    }
  }

  gfx.visible = anyVisible;
}
