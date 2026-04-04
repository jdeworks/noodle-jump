/** Power-up effect rendering — overlays, labels, squash/stretch, delegation. */

import { Graphics, Text, TextStyle } from "pixi.js";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_HEIGHT,
} from "../config/constants";
import type { GameWorldState } from "./GameState";
import type { ParticleManager } from "./ParticleManager";
import { renderPlayerForEffect } from "./EffectPlayerRender";
import { getMaxDuration } from "./effectDuration";

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
    cosmeticTint = 0xffffff,
  ): void {
    const { activeEffect } = state;
    const activeType = activeEffect?.type;

    this.activeEmitterType = renderPlayerForEffect(
      state,
      playerGfx,
      camY,
      particles,
      this.activeEmitterType,
      this.ensureEffectEmitter.bind(this),
      cosmeticTint,
    );

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

    // Ghost mode: desaturate to gray, slightly transparent
    if (state.isGhost && state.ghostDeathHeight > 0) {
      playerGfx.tint = 0x888899;
      playerGfx.alpha = 0.8;
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
    this.effectLabel.y = GAME_HEIGHT - 50;
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

