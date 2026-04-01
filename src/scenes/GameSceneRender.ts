/** Standalone render helpers for GameScene — boss and weather rendering. */

import { Container, Graphics } from "pixi.js";
import { worldToScreen } from "../systems/Camera";
import { drawBoss, drawBossHealthBar } from "../rendering/sprites";
import { GAME_WIDTH } from "../config/constants";
import type { GameWorldState } from "./GameState";

export function renderBoss(
  state: GameWorldState,
  bossGfx: Graphics,
  bossHealthGfx: Graphics,
  bossAttackGfx: Graphics[],
  gameContainer: Container,
  camY: number,
): Graphics[] {
  const boss = state.activeBoss;
  if (!boss || !boss.alive) {
    bossGfx.visible = false;
    bossHealthGfx.visible = false;
    // Clean boss attack gfx
    for (const g of bossAttackGfx) {
      gameContainer.removeChild(g);
      g.destroy();
    }
    return [];
  }

  // Draw boss
  drawBoss(
    bossGfx,
    boss.width,
    boss.height,
    boss.type,
    boss.phase,
    state.animTick,
  );
  bossGfx.x = boss.x;
  bossGfx.y = worldToScreen(boss.y, camY);
  bossGfx.visible = true;
  // Flash during spawn grace period (2 seconds)
  if (boss.patternTick <= 120) {
    bossGfx.alpha = Math.sin(boss.patternTick * 0.3) * 0.4 + 0.6;
  } else {
    bossGfx.alpha = 1;
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

  // Boss attack projectiles
  const updatedAttackGfx = [...bossAttackGfx];
  // Remove excess
  while (updatedAttackGfx.length > state.bossAttacks.length) {
    const g = updatedAttackGfx.pop()!;
    gameContainer.removeChild(g);
    g.destroy();
  }
  // Add new
  while (updatedAttackGfx.length < state.bossAttacks.length) {
    const g = new Graphics();
    g.circle(0, 0, 4);
    g.fill(0xff4444);
    gameContainer.addChild(g);
    updatedAttackGfx.push(g);
  }
  // Update positions
  for (let i = 0; i < state.bossAttacks.length; i++) {
    const atk = state.bossAttacks[i];
    const g = updatedAttackGfx[i];
    g.x = atk.x;
    g.y = worldToScreen(atk.y, camY);
    g.visible = atk.alive;
  }

  return updatedAttackGfx;
}

export function renderWeather(
  state: GameWorldState,
  weatherGfx: Graphics[],
  weatherContainer: Container,
): Graphics[] {
  const { particles } = state.weather;
  const updatedGfx = [...weatherGfx];

  // Remove excess
  while (updatedGfx.length > particles.length) {
    const gfx = updatedGfx.pop()!;
    weatherContainer.removeChild(gfx);
    gfx.destroy();
  }

  // Add new
  while (updatedGfx.length < particles.length) {
    const gfx = new Graphics();
    weatherContainer.addChild(gfx);
    updatedGfx.push(gfx);
  }

  // Update
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const gfx = updatedGfx[i];
    gfx.clear();
    gfx.circle(0, 0, p.size);
    gfx.fill({ color: 0xffffff, alpha: p.alpha });
    gfx.x = p.x;
    gfx.y = p.y;
  }

  return updatedGfx;
}
