/** Extracted rendering update logic for GameScene to keep files under LOC limit. */

import type { Graphics, Text, Container } from "pixi.js";
import type { GameWorldState } from "./GameState";
import type { ParallaxBackground } from "../systems/Parallax";
import type { ParticleManager } from "./ParticleManager";
import type { EffectRenderer } from "./EffectRenderer";
import type { GraphicsSync } from "./GraphicsSync";
import type { TrailRenderer } from "../rendering/TrailRenderer";
import type { FloatingTextManager } from "./FloatingText";
import { worldToScreen } from "../systems/Camera";
import { getInterpolatedTheme } from "../systems/Zone";
import { GAME_WIDTH, GAME_HEIGHT, DEATH_ANIMATION_TICKS } from "../config/constants";
import {
  renderPlatforms,
  renderMeatballs,
  renderPowerUps,
  renderEnemies,
  renderProjectiles,
} from "./EntityRenderer";
import { renderBoss, renderBossArc, renderWeather, renderWindOverlay } from "./GameSceneRender";
import { getSelectedCharacter } from "../systems/CharacterSettings";
import { getProjectileVisual, projectileSpins } from "../rendering/sprites";
import { renderTentacles, renderKnifeAmmo, renderDebugHitboxes } from "./BossArenaRenderer";
import { tickShake } from "../systems/ScreenShake";

export interface RenderContext {
  state: GameWorldState;
  parallax: ParallaxBackground;
  particles: ParticleManager;
  effectRenderer: EffectRenderer;
  gfxSync: GraphicsSync;
  trail: TrailRenderer;
  floatingTextMgr: FloatingTextManager;
  gameContainer: Container;
  playerGfx: Graphics;
  weatherContainer: Container;
  weatherGfx: Graphics[];
  windGfx: Graphics;
  bossGfx: Graphics;
  bossArcGfx: Graphics;
  bossHealthGfx: Graphics;
  bossAttackGfx: Graphics[];
  knifeAmmoText: Text;
  knifeAmmoIcons: Container;
  hitboxGfx: Graphics;
  tentacleGfx: Graphics;
  comboGlowGfx: Graphics;
  cosmeticTrail: string | null;
  cosmeticTint: number;
  cosmeticTheme: string;
  inputX: number;
}

/** Render the death animation. Returns true if in death state. */
export function renderDeathAnimation(ctx: RenderContext): boolean {
  if (!ctx.state.isDying) return false;
  const t = ctx.state.dyingTicks / DEATH_ANIMATION_TICKS;
  ctx.playerGfx.rotation += 0.1 + t * 0.3;
  ctx.playerGfx.scale.x = (1 - t * 0.6) * (1 + Math.sin(t * 20) * 0.15);
  ctx.playerGfx.scale.y = 1 - t * 0.8;
  ctx.playerGfx.alpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
  ctx.playerGfx.y = worldToScreen(ctx.state.player.y, ctx.state.camera.y);
  ctx.floatingTextMgr.update();
  ctx.particles.updateCrumbleParticles();
  return true;
}

/** Render all game entities, effects, and overlays. */
export function renderGameWorld(ctx: RenderContext): Graphics[] {
  const { state } = ctx;
  const theme = getInterpolatedTheme(state.platformsPassed);
  if (ctx.cosmeticTheme !== "theme_default") {
    const overrides: Record<string, number> = {
      theme_neon: 0x080818, theme_pixel: 0x222222,
      theme_candy: 0xffeef4, theme_dark: 0x0a0a14,
    };
    theme.background = overrides[ctx.cosmeticTheme] ?? theme.background;
  }
  ctx.parallax.applyTheme(theme, state.zoneState.currentZone);
  if (!state.debugConfig.disableParallax) {
    ctx.parallax.update(state.camera.y);
  }
  ctx.parallax.container.visible = !state.debugConfig.disableParallax;
  const camY = state.camera.y;

  ctx.effectRenderer.renderPlayer(state, ctx.playerGfx, camY, ctx.particles, ctx.inputX, ctx.cosmeticTint, ctx.cosmeticTheme);
  renderPlatforms(state, ctx.gfxSync, theme, camY, ctx.cosmeticTheme);
  renderMeatballs(state, ctx.gfxSync, camY);
  renderPowerUps(state, ctx.gfxSync, camY);
  if (state.enemiesEnabled) renderEnemies(state, ctx.gfxSync, camY, ctx.cosmeticTheme);
  if (state.enemiesEnabled || state.inBossFight) {
    const charVisual = getProjectileVisual(getSelectedCharacter());
    renderProjectiles(state, ctx.gfxSync, camY, projectileSpins(charVisual));
  }
  renderDebugHitboxes(ctx.hitboxGfx, state, camY);

  // Particles and floating text
  if (!state.debugConfig.disableEffectParticles) {
    ctx.particles.updateDustParticles();
    ctx.particles.updateCrumbleParticles();
  }
  ctx.floatingTextMgr.update();

  // Boss + tentacles + ammo
  const bossAttackGfx = renderBoss(state, ctx.bossGfx, ctx.bossHealthGfx, ctx.bossAttackGfx, ctx.gameContainer, camY, ctx.cosmeticTheme);
  renderBossArc(ctx.bossArcGfx, state, camY);
  renderTentacles(ctx.tentacleGfx, state, camY);
  renderKnifeAmmo(ctx.knifeAmmoIcons, ctx.knifeAmmoText, state, GAME_WIDTH);

  // Weather
  let weatherGfx = ctx.weatherGfx;
  if (!state.debugConfig.disableWeather) {
    weatherGfx = renderWeather(state, ctx.weatherGfx, ctx.weatherContainer);
  }
  ctx.weatherContainer.visible = !state.debugConfig.disableWeather;
  if (state.inBossFight) { ctx.windGfx.clear(); ctx.windGfx.visible = false; }
  else renderWindOverlay(ctx.windGfx, state, camY);

  // Trail
  const speedEffect = state.activeEffect?.type;
  if (speedEffect === "ravioli_rocket") ctx.trail.setTrailType("speed_rocket");
  else if (speedEffect === "fusilli_tornado") ctx.trail.setTrailType("speed_tornado");
  else if (speedEffect === "pepper_sneeze") ctx.trail.setTrailType("speed_sneeze");
  else ctx.trail.setTrailType(ctx.cosmeticTrail);
  ctx.trail.addPoint(
    state.player.x + state.player.width / 2,
    state.player.y + state.player.height + 6,
  );
  ctx.trail.update(camY);

  ctx.effectRenderer.renderEffectOverlay(state);

  // Combo border glow
  ctx.comboGlowGfx.clear();
  const combo = state.scoreState.comboMultiplier;
  if (combo >= 2) {
    const a = Math.min(combo / 5, 1) * (0.3 + Math.sin(state.animTick * 0.1) * 0.2);
    const gw = 4 + combo;
    ctx.comboGlowGfx.rect(0, 0, GAME_WIDTH, gw); ctx.comboGlowGfx.rect(0, GAME_HEIGHT - gw, GAME_WIDTH, gw);
    ctx.comboGlowGfx.rect(0, 0, gw, GAME_HEIGHT); ctx.comboGlowGfx.rect(GAME_WIDTH - gw, 0, gw, GAME_HEIGHT);
    ctx.comboGlowGfx.fill({ color: 0xff8800, alpha: a });
  }

  // Return updated arrays for caller to store
  ctx.bossAttackGfx = bossAttackGfx;
  return weatherGfx;
}
