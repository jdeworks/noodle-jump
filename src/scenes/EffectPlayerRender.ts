/** Player sprite rendering based on active effect — extracted from EffectRenderer. */

import { Graphics } from "pixi.js";
import { worldToScreen } from "../systems/Camera";
import {
  drawChef,
  drawChefOnRocket,
  drawMagnetSprite,
  drawTornadoSprite,
  drawLasagnaSprite,
  drawPepperSprite,
  drawChiliSprite,
  drawSoggySprite,
  drawGarlicSprite,
  drawBurntToastSprite,
} from "../rendering/sprites";
import type { GameWorldState } from "./GameState";
import type { ParticleManager } from "./ParticleManager";

/**
 * Render the player sprite based on the active effect type.
 * Returns the new activeEmitterType (or null if cleared).
 */
export function renderPlayerForEffect(
  state: GameWorldState,
  playerGfx: Graphics,
  camY: number,
  particles: ParticleManager,
  activeEmitterType: string | null,
  ensureEffectEmitter: (
    particles: ParticleManager,
    type: string,
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
  ) => void,
  cosmeticTint = 0xffffff,
): string | null {
  const { player, activeEffect, animTick, springFlashTicks } = state;
  const activeType = activeEffect?.type;

  if (activeType === "ravioli_rocket") {
    drawChefOnRocket(playerGfx, player.width, player.height, animTick);
    playerGfx.pivot.set(player.width / 2, 0);
    playerGfx.rotation = 0;
    playerGfx.x = player.x + player.width / 2;
    playerGfx.y = worldToScreen(player.y, camY);
    particles.updateRocketParticles(
      player.x, player.y, player.width, player.height, camY,
    );
    particles.clearTornadoParticles();
  } else if (activeType === "fusilli_tornado") {
    drawTornadoSprite(playerGfx, player.width, player.height, animTick);
    playerGfx.pivot.set(player.width / 2, player.height / 2);
    playerGfx.x = player.x + player.width / 2;
    playerGfx.y = worldToScreen(player.y, camY) + player.height / 2;
    playerGfx.rotation = animTick * 0.15;
    particles.updateTornadoParticles(
      player.x, player.y, player.width, player.height, camY, animTick,
    );
    particles.clearRocketParticles();
  } else if (activeType === "pepper_sneeze") {
    drawPepperSprite(playerGfx, player.width, player.height, animTick);
    playerGfx.pivot.set(player.width / 2, 0);
    playerGfx.rotation = 0;
    const shakeX = (Math.random() - 0.5) * 6;
    const shakeY = (Math.random() - 0.5) * 4;
    playerGfx.x = player.x + player.width / 2 + shakeX;
    playerGfx.y = worldToScreen(player.y, camY) + shakeY;
    particles.updateSneezeParticles(
      player.x, player.y, player.width, player.height, camY,
    );
    particles.clearTornadoParticles();
    particles.clearRocketParticles();
    particles.clearLasagnaParticles();
  } else if (activeType === "lasagna_layers") {
    drawLasagnaSprite(playerGfx, player.width, player.height, animTick);
    playerGfx.pivot.set(player.width / 2, player.height / 2);
    playerGfx.x = player.x + player.width / 2;
    playerGfx.y = worldToScreen(player.y, camY) + player.height / 2;
    playerGfx.rotation = Math.sin(animTick * 0.06) * 0.15;
    const floatPulse = 1.0 + Math.sin(animTick * 0.08) * 0.08;
    playerGfx.scale.set(floatPulse);
    particles.updateLasagnaParticles(
      player.x, player.y, player.width, player.height, camY, animTick,
    );
    particles.clearTornadoParticles();
    particles.clearRocketParticles();
  } else if (activeType === "chili_pepper") {
    drawChiliSprite(playerGfx, player.width, player.height, animTick);
    playerGfx.pivot.set(player.width / 2, 0);
    playerGfx.x =
      player.x + player.width / 2 + Math.sin(animTick * 0.5) * 3;
    playerGfx.y =
      worldToScreen(player.y, camY) + Math.cos(animTick * 0.7) * 2;
    playerGfx.rotation = Math.sin(animTick * 0.4) * 0.1;
    playerGfx.scale.set(1);
    ensureEffectEmitter(particles, "chili_pepper", player.x, player.y, player.width, player.height);
    particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
    particles.clearTornadoParticles();
    particles.clearRocketParticles();
    particles.clearLasagnaParticles();
    particles.clearSpringParticles();
    particles.clearSneezeParticles();
  } else if (activeType === "soggy_noodle") {
    drawSoggySprite(playerGfx, player.width, player.height, animTick);
    playerGfx.pivot.set(player.width / 2, 0);
    playerGfx.x = player.x + player.width / 2;
    playerGfx.y = worldToScreen(player.y, camY);
    const squishX = 1.0 + Math.sin(animTick * 0.12) * 0.15;
    const squishY = 1.0 - Math.sin(animTick * 0.12) * 0.12;
    playerGfx.scale.set(squishX, squishY);
    playerGfx.rotation = Math.sin(animTick * 0.08) * 0.08;
    ensureEffectEmitter(particles, "soggy_noodle", player.x, player.y, player.width, player.height);
    particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
    particles.clearTornadoParticles();
    particles.clearRocketParticles();
    particles.clearLasagnaParticles();
    particles.clearSpringParticles();
    particles.clearSneezeParticles();
  } else if (activeType === "garlic_breath") {
    drawGarlicSprite(playerGfx, player.width, player.height, animTick);
    playerGfx.pivot.set(player.width / 2, 0);
    playerGfx.x =
      player.x + player.width / 2 + Math.sin(animTick * 0.08) * 4;
    playerGfx.y =
      worldToScreen(player.y, camY) + Math.cos(animTick * 0.06) * 2;
    playerGfx.rotation = Math.sin(animTick * 0.05) * 0.08;
    playerGfx.scale.set(1);
    ensureEffectEmitter(particles, "garlic_breath", player.x, player.y, player.width, player.height);
    particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
    particles.clearTornadoParticles();
    particles.clearRocketParticles();
    particles.clearLasagnaParticles();
    particles.clearSpringParticles();
    particles.clearSneezeParticles();
  } else if (activeType === "burnt_toast") {
    drawBurntToastSprite(playerGfx, player.width, player.height, animTick);
    playerGfx.pivot.set(player.width / 2, 0);
    playerGfx.x =
      player.x + player.width / 2 + (Math.random() - 0.5) * 2;
    playerGfx.y =
      worldToScreen(player.y, camY) + (Math.random() - 0.5) * 1.5;
    playerGfx.rotation = (Math.random() - 0.5) * 0.05;
    playerGfx.scale.set(0.9 + Math.random() * 0.1);
    ensureEffectEmitter(particles, "burnt_toast", player.x, player.y, player.width, player.height);
    particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
    particles.clearTornadoParticles();
    particles.clearRocketParticles();
    particles.clearLasagnaParticles();
    particles.clearSpringParticles();
    particles.clearSneezeParticles();
  } else if (activeType === "meatball_magnet") {
    drawMagnetSprite(playerGfx, player.width, player.height, animTick);
    playerGfx.pivot.set(player.width / 2, 0);
    playerGfx.rotation = 0;
    playerGfx.x = player.x + player.width / 2;
    playerGfx.y = worldToScreen(player.y, camY);
    const magnetPulse = 1.0 + Math.sin(animTick * 0.12) * 0.08;
    playerGfx.scale.set(magnetPulse);
    ensureEffectEmitter(particles, "meatball_magnet", player.x, player.y, player.width, player.height);
    particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
    particles.clearTornadoParticles();
    particles.clearRocketParticles();
    particles.clearLasagnaParticles();
    particles.clearSpringParticles();
    particles.clearSneezeParticles();
  } else if (activeType === "pasta_shield") {
    drawChef(playerGfx, player.width, player.height, undefined, "pasta_shield");
    // Draw shield bubble around character
    const cx = player.width / 2, cy = player.height / 2;
    const shieldR = Math.max(player.width, player.height) * 0.7;
    const pulse = 1 + Math.sin(animTick * 0.1) * 0.08;
    playerGfx.circle(cx, cy, shieldR * pulse);
    playerGfx.stroke({ width: 2, color: 0x44ddff, alpha: 0.6 + Math.sin(animTick * 0.15) * 0.2 });
    playerGfx.circle(cx, cy, shieldR * pulse * 0.85);
    playerGfx.fill({ color: 0xaaeeff, alpha: 0.12 });
    playerGfx.pivot.set(player.width / 2, 0);
    playerGfx.rotation = 0;
    playerGfx.x = player.x + player.width / 2;
    playerGfx.y = worldToScreen(player.y, camY);
    playerGfx.scale.set(1);
    playerGfx.tint = cosmeticTint;
    ensureEffectEmitter(particles, "pasta_shield", player.x, player.y, player.width, player.height);
    particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
    particles.clearTornadoParticles();
    particles.clearRocketParticles();
    particles.clearLasagnaParticles();
    particles.clearSpringParticles();
    particles.clearSneezeParticles();
  } else if (activeType === "gnocchi_bounce") {
    drawChef(playerGfx, player.width, player.height);
    playerGfx.pivot.set(player.width / 2, 0);
    playerGfx.rotation = 0;
    playerGfx.x = player.x + player.width / 2;
    playerGfx.y = worldToScreen(player.y, camY);
    const bouncePulse = 1.0 + Math.sin(animTick * 0.15) * 0.1;
    playerGfx.scale.set(bouncePulse);
    playerGfx.tint = 0xffeedd;
    ensureEffectEmitter(particles, "gnocchi_bounce", player.x, player.y, player.width, player.height);
    particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
    particles.clearTornadoParticles();
    particles.clearRocketParticles();
    particles.clearLasagnaParticles();
    particles.clearSpringParticles();
    particles.clearSneezeParticles();
  } else if (activeType === "minestrone_soup") {
    drawChef(playerGfx, player.width, player.height);
    playerGfx.pivot.set(player.width / 2, 0);
    playerGfx.rotation = 0;
    playerGfx.x = player.x + player.width / 2;
    playerGfx.y = worldToScreen(player.y, camY);
    playerGfx.scale.set(1);
    playerGfx.tint = 0xffaa88;
    ensureEffectEmitter(particles, "minestrone_soup", player.x, player.y, player.width, player.height);
    particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
    particles.clearTornadoParticles();
    particles.clearRocketParticles();
    particles.clearLasagnaParticles();
    particles.clearSpringParticles();
    particles.clearSneezeParticles();
  } else {
    // Normal or spaghetti spring flash — clear config-driven emitter
    if (activeEmitterType) {
      particles.clearEffectEmitter();
      return null;
    }
    drawChef(playerGfx, player.width, player.height);
    playerGfx.pivot.set(player.width / 2, 0);
    playerGfx.rotation = 0;
    playerGfx.x = player.x + player.width / 2;
    playerGfx.y = worldToScreen(player.y, camY);
    playerGfx.scale.set(1);

    if (springFlashTicks > 0) {
      const stretch = 1 + (springFlashTicks / 30) * 0.5;
      playerGfx.scale.set(1, stretch);
      playerGfx.tint = 0xf0c050;
      particles.updateSpringParticles(
        player.x, player.y, player.width, player.height, camY, animTick,
      );
    } else {
      playerGfx.tint = cosmeticTint;
      particles.clearSpringParticles();
    }

    particles.clearTornadoParticles();
    particles.clearRocketParticles();
    particles.clearLasagnaParticles();
    particles.clearSneezeParticles();
  }

  return activeEmitterType;
}
