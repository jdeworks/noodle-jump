/** Power-up effect rendering — player sprite selection, overlays, squash/stretch. */

import { Graphics, Text, TextStyle } from "pixi.js";
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
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_HEIGHT,
} from "../config/constants";
import type { GameWorldState } from "./GameState";
import type { ParticleManager } from "./ParticleManager";

// Squash-stretch keyframes: [scaleY, scaleX factor]
const SQUASH_KEYFRAMES: [number, number][] = [
  [0.75, 1.2],
  [0.58, 1.3],
  [0.55, 1.32],
  [0.6, 1.28],
  [0.72, 1.18],
  [1.12, 0.9],
  [1.28, 0.84],
  [1.3, 0.82],
  [1.22, 0.86],
  [1.12, 0.92],
  [1.05, 0.96],
  [1.02, 0.98],
  [1.0, 1.0],
];
const SQUASH_TOTAL = SQUASH_KEYFRAMES.length;

export class EffectRenderer {
  private effectOverlay = new Graphics();
  private effectLabel: Text | null = null;
  private activeEmitterType: string | null = null;

  /** The overlay Graphics to add to the scene container (above game, below HUD). */
  get overlay(): Graphics {
    return this.effectOverlay;
  }

  /**
   * Render the player sprite based on active effect, handling
   * position, rotation, scale, squash/stretch, and particle dispatch.
   */
  renderPlayer(
    state: GameWorldState,
    playerGfx: Graphics,
    camY: number,
    particles: ParticleManager,
    inputX: number,
  ): void {
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
      this.ensureEffectEmitter(particles, "chili_pepper", player.x, player.y, player.width, player.height);
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
      this.ensureEffectEmitter(particles, "soggy_noodle", player.x, player.y, player.width, player.height);
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
      this.ensureEffectEmitter(particles, "garlic_breath", player.x, player.y, player.width, player.height);
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
      this.ensureEffectEmitter(particles, "burnt_toast", player.x, player.y, player.width, player.height);
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
      this.ensureEffectEmitter(particles, "meatball_magnet", player.x, player.y, player.width, player.height);
      particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
      particles.clearTornadoParticles();
      particles.clearRocketParticles();
      particles.clearLasagnaParticles();
      particles.clearSpringParticles();
      particles.clearSneezeParticles();
    } else if (activeType === "pasta_shield") {
      drawChef(playerGfx, player.width, player.height);
      playerGfx.pivot.set(player.width / 2, 0);
      playerGfx.rotation = 0;
      playerGfx.x = player.x + player.width / 2;
      playerGfx.y = worldToScreen(player.y, camY);
      // Pulsing shield scale
      const shieldPulse = 1.0 + Math.sin(animTick * 0.1) * 0.05;
      playerGfx.scale.set(shieldPulse);
      playerGfx.tint = 0xaaeeff;
      this.ensureEffectEmitter(particles, "pasta_shield", player.x, player.y, player.width, player.height);
      particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
      particles.clearTornadoParticles();
      particles.clearRocketParticles();
      particles.clearLasagnaParticles();
      particles.clearSpringParticles();
      particles.clearSneezeParticles();
    } else if (activeType === "rigatoni_drill") {
      drawChef(playerGfx, player.width, player.height);
      playerGfx.pivot.set(player.width / 2, player.height / 2);
      playerGfx.x = player.x + player.width / 2;
      playerGfx.y = worldToScreen(player.y, camY) + player.height / 2;
      // Spinning drill
      playerGfx.rotation = animTick * 0.2;
      playerGfx.scale.set(1);
      playerGfx.tint = 0xddaa66;
      this.ensureEffectEmitter(particles, "rigatoni_drill", player.x, player.y, player.width, player.height);
      particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
      particles.clearTornadoParticles();
      particles.clearRocketParticles();
      particles.clearLasagnaParticles();
      particles.clearSpringParticles();
      particles.clearSneezeParticles();
    } else if (activeType === "penne_cannon") {
      drawChef(playerGfx, player.width, player.height);
      playerGfx.pivot.set(player.width / 2, 0);
      playerGfx.rotation = 0;
      playerGfx.x = player.x + player.width / 2;
      playerGfx.y = worldToScreen(player.y, camY);
      playerGfx.scale.set(1);
      playerGfx.tint = 0xffdd66;
      this.ensureEffectEmitter(particles, "penne_cannon", player.x, player.y, player.width, player.height);
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
      // Bouncy scale pulse
      const bouncePulse = 1.0 + Math.sin(animTick * 0.15) * 0.1;
      playerGfx.scale.set(bouncePulse);
      playerGfx.tint = 0xffeedd;
      this.ensureEffectEmitter(particles, "gnocchi_bounce", player.x, player.y, player.width, player.height);
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
      this.ensureEffectEmitter(particles, "minestrone_soup", player.x, player.y, player.width, player.height);
      particles.updateEffectEmitter(player.x, player.y, player.width, player.height, camY);
      particles.clearTornadoParticles();
      particles.clearRocketParticles();
      particles.clearLasagnaParticles();
      particles.clearSpringParticles();
      particles.clearSneezeParticles();
    } else {
      // Normal or spaghetti spring flash — clear config-driven emitter
      if (this.activeEmitterType) {
        particles.clearEffectEmitter();
        this.activeEmitterType = null;
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
        playerGfx.tint = 0xffffff;
        particles.clearSpringParticles();
      }

      particles.clearTornadoParticles();
      particles.clearRocketParticles();
      particles.clearLasagnaParticles();
      particles.clearSneezeParticles();
    }

    // Sprite faces movement direction (skip for spinning effects)
    let lastFacing = state.lastFacing;
    if (inputX > 0.1) lastFacing = 1;
    else if (inputX < -0.1) lastFacing = -1;

    if (activeType !== "fusilli_tornado" && activeType !== "lasagna_layers") {
      playerGfx.scale.x = lastFacing * Math.abs(playerGfx.scale.x);
    }

    // Squash/stretch keyframe animation
    if (state.squashTicks > 0) {
      const frameIdx = SQUASH_TOTAL - state.squashTicks;
      if (frameIdx >= 0 && frameIdx < SQUASH_KEYFRAMES.length) {
        const [scaleY, scaleXFactor] = SQUASH_KEYFRAMES[frameIdx];
        playerGfx.scale.y = scaleY;
        playerGfx.scale.x = lastFacing * scaleXFactor;
        playerGfx.y += PLAYER_HEIGHT * (1 - scaleY);
      }
    }
  }

  /** Start config-driven emitter if not already running for this type. */
  private ensureEffectEmitter(
    particles: ParticleManager,
    type: string,
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
  ): void {
    if (this.activeEmitterType !== type) {
      particles.startEffectEmitter(type, playerX, playerY, playerW, playerH);
      this.activeEmitterType = type;
    }
  }

  /** Render pickup flash overlay. */
  renderPickupFlash(state: GameWorldState): void {
    if (state.pickupFlashTicks > 0) {
      const flashAlpha = (state.pickupFlashTicks / 12) * 0.3;
      this.effectOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.effectOverlay.fill({
        color: state.pickupFlashColor,
        alpha: flashAlpha,
      });
    }
  }

  /** Render negative effect screen overlays. */
  renderEffectOverlay(state: GameWorldState): void {
    this.effectOverlay.clear();
    if (!state.activeEffect) {
      this.renderPickupFlash(state);
      return;
    }

    const type = state.activeEffect.type;
    const maxDuration = getMaxDuration(type);
    const progress = state.activeEffect.ticksRemaining / maxDuration;
    const flashAlpha =
      0.1 + Math.sin(state.animTick * 0.08) * 0.05;

    if (type === "chili_pepper") {
      this.effectOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.effectOverlay.fill({
        color: 0xff0000,
        alpha: flashAlpha * progress,
      });
    } else if (type === "soggy_noodle") {
      this.effectOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.effectOverlay.fill({
        color: 0x3366aa,
        alpha: flashAlpha * progress,
      });
    } else if (type === "garlic_breath") {
      const fogAlpha =
        (0.3 + Math.sin(state.animTick * 0.04) * 0.1) * progress;
      this.effectOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.effectOverlay.fill({ color: 0x88bb44, alpha: fogAlpha * 0.4 });
      for (let i = 0; i < 5; i++) {
        const bandY = GAME_HEIGHT * 0.15 + (i / 5) * GAME_HEIGHT * 0.7;
        const wobble =
          Math.sin(state.animTick * 0.02 + i * 1.5) * 30;
        this.effectOverlay.ellipse(
          GAME_WIDTH / 2 + wobble,
          bandY,
          GAME_WIDTH * 0.6,
          60 + i * 10,
        );
        this.effectOverlay.fill({ color: 0x99cc55, alpha: fogAlpha * 0.3 });
      }
    } else if (type === "burnt_toast") {
      this.effectOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.effectOverlay.fill({
        color: 0x1a0a00,
        alpha: flashAlpha * 0.6 * progress,
      });
    }

    this.renderPickupFlash(state);
  }

  /** Show effect name label at bottom of screen. */
  showEffectLabel(
    type: string,
    container: { addChild: (child: Text) => void; removeChild: (child: Text) => void },
  ): void {
    this.clearEffectLabel(container);
    const label = type.replace("_", " ").toUpperCase();
    this.effectLabel = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 16,
        fill: "#fff",
        fontWeight: "bold",
        stroke: { color: "#000", width: 3 },
      }),
    });
    this.effectLabel.x = GAME_WIDTH / 2;
    this.effectLabel.y = GAME_HEIGHT - 30;
    this.effectLabel.anchor.set(0.5, 0.5);
    container.addChild(this.effectLabel);
  }

  clearEffectLabel(container?: { removeChild: (child: Text) => void }): void {
    if (this.effectLabel) {
      container?.removeChild(this.effectLabel);
      this.effectLabel.destroy();
      this.effectLabel = null;
    }
  }

  destroy(container?: { removeChild: (child: Text) => void }): void {
    this.clearEffectLabel(container);
    this.effectOverlay.destroy();
  }
}

function getMaxDuration(type: string): number {
  switch (type) {
    case "fusilli_tornado":
      return 300;
    case "ravioli_rocket":
      return 180;
    case "lasagna_layers":
      return 360;
    case "pepper_sneeze":
      return 30;
    case "meatball_magnet":
      return 300;
    case "pasta_shield":
      return 600;
    case "rigatoni_drill":
      return 180;
    case "penne_cannon":
      return 360;
    case "gnocchi_bounce":
      return 360;
    case "minestrone_soup":
      return 480;
    case "chili_pepper":
    case "soggy_noodle":
    case "garlic_breath":
    case "burnt_toast":
      return 300;
    default:
      return 1;
  }
}
