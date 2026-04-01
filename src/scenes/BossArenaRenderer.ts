/** Boss arena rendering helpers — tentacle grabs, knife ammo, debug hitboxes. */

import { Container, Graphics, Text } from "pixi.js";
import { worldToScreen } from "../systems/Camera";
import { GAME_HEIGHT, BURNT_TOAST_SHRINK } from "../config/constants";
import type { GameWorldState } from "./GameState";

/**
 * Render tentacle grab animations from the kraken boss to platforms.
 * Driven by `state.pendingTentacles`.
 */
export function renderTentacles(
  gfx: Graphics,
  state: GameWorldState,
  camY: number,
): void {
  gfx.clear();
  if (!state.activeBoss || state.pendingTentacles.length === 0) return;

  const boss = state.activeBoss;
  const bossCX = boss.x + boss.width / 2;
  const bossBY = boss.y + boss.height;
  const tick = state.animTick;

  for (const tent of state.pendingTentacles) {
    // Find current platform position (tracks moving platforms)
    const plat = state.platforms.find((p) => p.id === tent.platformId);
    if (!plat || plat.broken) continue;

    // Compute the live target position on the platform edge
    const targetX = tent.side === "left"
      ? plat.x + plat.width * 0.15
      : plat.x + plat.width * 0.85;
    const targetY = plat.y;

    const elapsed = tent.totalTicks - tent.ticksLeft;
    // Extend takes 40% of total time, hold takes 60%
    const extendTicks = Math.floor(tent.totalTicks * 0.4);

    const extending = elapsed < extendTicks;
    const extendT = extending ? elapsed / extendTicks : 1;

    // Tentacle tip position (extends from boss to platform)
    const screenBossY = worldToScreen(bossBY, camY);
    const screenTargetY = worldToScreen(targetY, camY);
    const tipY = screenBossY + (screenTargetY - screenBossY) * extendT;
    const tipX = bossCX + (targetX - bossCX) * extendT;

    // Wavy tentacle body — connects from kraken to tip
    const segments = 10;
    for (let si = 0; si < segments; si++) {
      const t0 = si / segments;
      const t1 = (si + 1) / segments;
      const sy0 = screenBossY + (tipY - screenBossY) * t0;
      const sy1 = screenBossY + (tipY - screenBossY) * t1;
      const sx0 = bossCX + (tipX - bossCX) * t0;
      const sx1 = bossCX + (tipX - bossCX) * t1;
      const wave0 = Math.sin(si * 1.0 + tick * 0.15) * (4 + si * 0.5);
      const wave1 = Math.sin((si + 1) * 1.0 + tick * 0.15) * (4 + (si + 1) * 0.5);
      const w = 4 - si * 0.3;
      gfx.moveTo(sx0 + wave0 - w, sy0);
      gfx.lineTo(sx1 + wave1 - w, sy1);
      gfx.lineTo(sx1 + wave1 + w, sy1);
      gfx.lineTo(sx0 + wave0 + w, sy0);
      gfx.closePath();
      gfx.fill({ color: 0x44aa66, alpha: 0.8 - si * 0.04 });
    }

    // Red flashing overlay on the platform edge being grabbed — during hold phase
    if (!extending) {
      const chunkW = Math.min(30, plat.width * 0.4);
      const flashAlpha = 0.5 + Math.sin(tick * 0.25) * 0.35;
      const platScreenY = worldToScreen(plat.y, camY);
      const rx = tent.side === "left" ? plat.x : plat.x + plat.width - chunkW;
      gfx.rect(rx, platScreenY, chunkW, 15);
      gfx.fill({ color: 0xff2222, alpha: flashAlpha });
      // Outline for extra visibility
      gfx.rect(rx, platScreenY, chunkW, 15);
      gfx.stroke({ width: 1.5, color: 0xff0000, alpha: flashAlpha * 0.8 });
    }
  }
}

/**
 * Render knife ammo icons at the bottom-right of the screen.
 * Shows filled/empty knife icons based on current ammo.
 */
export function renderKnifeAmmo(
  icons: Container,
  text: Text,
  state: GameWorldState,
  gameWidth: number,
): void {
  if (state.enemiesEnabled || state.inBossFight) {
    const knives = state.knifeAmmo;
    const max = state.knifeAmmoMax;
    const iconSpacing = 18;
    const totalW = max * iconSpacing;

    // Position container so icons are right-aligned
    icons.x = gameWidth - 10 - totalW;

    // Rebuild icons only when max changes
    if (icons.children.length !== max) {
      while (icons.children.length > 0) {
        icons.removeChildAt(0);
      }
      for (let i = 0; i < max; i++) {
        const icon = new Graphics();
        icon.x = i * iconSpacing;
        icons.addChild(icon);
      }
    }
    // Update each icon
    for (let i = 0; i < max; i++) {
      const icon = icons.children[i] as Graphics;
      icon.clear();
      const has = i < knives;
      // Blade
      icon.moveTo(0, -12);       // tip
      icon.lineTo(3, -9);
      icon.lineTo(3.5, -3);
      icon.lineTo(3.5, 0);
      icon.lineTo(-1.5, 0);
      icon.lineTo(-1.5, -10);
      icon.closePath();
      if (has) {
        icon.fill(0xccccdd);
      } else {
        icon.stroke({ width: 1, color: 0x666666, alpha: 0.6 });
      }
      // Handle
      icon.roundRect(-1.5, 1, 5, 8, 1.5);
      if (has) {
        icon.fill(0x553322);
      } else {
        icon.stroke({ width: 1, color: 0x554433, alpha: 0.4 });
      }
    }
    icons.visible = true;
    text.visible = false;
  } else {
    icons.visible = false;
    text.visible = false;
  }
}

/**
 * Render debug hitbox overlays for all game entities.
 * Only draws when `state.debugConfig.showHitboxes` is true.
 */
export function renderDebugHitboxes(
  gfx: Graphics,
  state: GameWorldState,
  camY: number,
): void {
  gfx.clear();
  if (!state.debugConfig.showHitboxes) return;

  const s = state;
  // Player hitbox
  gfx.rect(
    s.player.x, worldToScreen(s.player.y, camY),
    s.player.width, s.player.height,
  );
  gfx.stroke({ width: 1, color: 0x00ff00, alpha: 0.8 });
  // Platform hitboxes (account for burnt toast shrink)
  const isBurnt = s.activeEffect?.type === "burnt_toast";
  const shrink = isBurnt ? BURNT_TOAST_SHRINK : 1;
  for (const p of s.platforms) {
    if (p.broken) continue;
    const sy = worldToScreen(p.y, camY);
    if (sy < -50 || sy > GAME_HEIGHT + 50) continue;
    const pw = p.width * shrink;
    const px = p.x + (p.width - pw) / 2;
    gfx.rect(px, sy, pw, 15);
    gfx.stroke({ width: 1, color: 0x00aaff, alpha: 0.6 });
  }
  // Power-up hitboxes
  for (const pu of s.powerUps) {
    if (pu.collected) continue;
    const sy = worldToScreen(pu.y, camY);
    if (sy < -50 || sy > GAME_HEIGHT + 50) continue;
    gfx.rect(pu.x, sy, pu.size, pu.size);
    gfx.stroke({ width: 1, color: 0xff00ff, alpha: 0.8 });
  }
  // Meatball hitboxes
  for (const mb of s.meatballs) {
    if (mb.collected) continue;
    const sy = worldToScreen(mb.y, camY);
    if (sy < -50 || sy > GAME_HEIGHT + 50) continue;
    gfx.rect(mb.x, sy, mb.size, mb.size);
    gfx.stroke({ width: 1, color: 0xffaa00, alpha: 0.8 });
  }
  // Enemy hitboxes
  for (const e of s.enemies) {
    if (!e.alive) continue;
    gfx.rect(e.x, worldToScreen(e.y, camY), e.width, e.height);
    gfx.stroke({ width: 1, color: 0xff0000, alpha: 0.8 });
  }
  // Boss hitbox
  if (s.activeBoss?.alive) {
    const b = s.activeBoss;
    gfx.rect(b.x, worldToScreen(b.y, camY), b.width, b.height);
    gfx.stroke({ width: 1, color: 0xff8800, alpha: 0.8 });
  }
}
