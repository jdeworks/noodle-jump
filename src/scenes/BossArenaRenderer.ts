/** Boss arena rendering helpers — tentacle grabs, knife ammo, debug hitboxes. */

import { Container, Graphics, Text } from "pixi.js";
import { worldToScreen } from "../systems/Camera";
import { GAME_HEIGHT, BURNT_TOAST_SHRINK } from "../config/constants";
import type { GameWorldState } from "./GameState";
import { drawProjectile } from "../rendering/sprites";
import { getSelectedCharacter } from "../systems/CharacterSettings";
import { getTentacleChunkSize } from "../entities/bosses/KrakenBoss";

/**
 * Render tentacle grab animations from the kraken boss to platforms.
 * Driven by `state.pendingTentacles`.
 */
export function renderTentacles(gfx: Graphics, state: GameWorldState, camY: number): void {
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
    const targetX = tent.side === "left" ? plat.x + plat.width * 0.15 : plat.x + plat.width * 0.85;
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
      const chunkW = getTentacleChunkSize(plat);
      const flashAlpha = 0.5 + Math.sin(tick * 0.25) * 0.35;
      const platScreenY = worldToScreen(plat.y, camY);
      const rx = tent.side === "left" ? plat.x : plat.x + plat.width - chunkW;
      gfx.rect(rx, platScreenY, chunkW, 15);
      gfx.fill({ color: 0xff2222, alpha: flashAlpha });
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

    const charId = getSelectedCharacter();
    // Rebuild icons when max changes or character changes
    // Icons stored in a sub-container so regen bar doesn't interfere with indexing
    const cacheKey = `${max}:${charId}`;
    type IconsExt = {
      _cacheKey?: string;
      _iconContainer?: Container;
      _regenBar?: Graphics;
    };
    const ext = icons as unknown as IconsExt;
    if (ext._cacheKey !== cacheKey) {
      ext._cacheKey = cacheKey;
      while (icons.children.length > 0) {
        icons.removeChildAt(0);
      }
      // Regen bar behind icons
      const regenBar = new Graphics();
      icons.addChild(regenBar);
      ext._regenBar = regenBar;
      // Icon container on top
      const iconContainer = new Container();
      icons.addChild(iconContainer);
      ext._iconContainer = iconContainer;
      for (let i = 0; i < max; i++) {
        const icon = new Graphics();
        drawProjectile(icon, 12, charId);
        icon.scale.set(0.7);
        icon.x = i * iconSpacing;
        iconContainer.addChild(icon);
      }
    }
    const iconContainer = ext._iconContainer!;
    const regenBar = ext._regenBar!;

    // Regen progress
    const regenMax = 90; // KNIFE_REGEN_TICKS
    const regenProgress =
      knives < max && state.knifeRegenTimer > 0 ? 1 - state.knifeRegenTimer / regenMax : 0;

    // Update each icon's opacity
    for (let i = 0; i < max; i++) {
      const icon = iconContainer.children[i] as Graphics;
      if (i < knives) {
        icon.alpha = 1;
      } else if (i === knives && regenProgress > 0) {
        icon.alpha = 0.25 + regenProgress * 0.75;
      } else {
        icon.alpha = 0.25;
      }
    }

    // Draw fill bar sized to match the actual icon bounds
    regenBar.clear();
    if (knives < max && regenProgress > 0) {
      const regenIcon = iconContainer.children[knives] as Graphics;
      const bounds = regenIcon.getLocalBounds();
      const scale = regenIcon.scale.x;
      const pad = 3;
      const fullW = bounds.width * scale + pad * 2;
      const fullH = bounds.height * scale + pad * 2;
      const barX = regenIcon.x + bounds.x * scale - pad;
      const barY = bounds.y * scale - pad;
      const barW = fullW * regenProgress;
      // Background track
      regenBar.roundRect(barX, barY, fullW, fullH, 3);
      regenBar.fill({ color: 0x000000, alpha: 0.4 });
      // Fill bar — grows left to right
      regenBar.roundRect(barX, barY, barW, fullH, 3);
      regenBar.fill({ color: 0x44ccff, alpha: 0.4 });
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
export function renderDebugHitboxes(gfx: Graphics, state: GameWorldState, camY: number): void {
  gfx.clear();
  if (!state.debugConfig.showHitboxes) return;

  const s = state;
  // Player hitbox
  gfx.rect(s.player.x, worldToScreen(s.player.y, camY), s.player.width, s.player.height);
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
  // Enemy hitboxes (shifted up to match collision logic)
  const enemyYShift = -16;
  for (const e of s.enemies) {
    if (!e.alive) continue;
    gfx.rect(e.x, worldToScreen(e.y + enemyYShift, camY), e.width, e.height);
    gfx.stroke({ width: 1, color: 0xff0000, alpha: 0.8 });
  }
  // Boss hitbox
  if (s.activeBoss?.alive) {
    const b = s.activeBoss;
    gfx.rect(b.x, worldToScreen(b.y, camY), b.width, b.height);
    gfx.stroke({ width: 1, color: 0xff8800, alpha: 0.8 });
  }
}
