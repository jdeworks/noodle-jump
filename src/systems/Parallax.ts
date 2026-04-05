/** Parallax background — ghost platforms + feature animations per zone. */

import { Container, Graphics } from "pixi.js";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLATFORM_WIDTH_MIN,
  PLATFORM_WIDTH_MAX,
  PLATFORM_HEIGHT,
} from "../config/constants";
import type { ZoneTheme } from "./Zone";
import { drawPlateWithPasta, drawBoilingPot } from "../rendering/ParallaxKitchen";
import { drawVoidPortal } from "../rendering/ParallaxSpace";
import { drawFreezer, drawVolcano, drawCandyLand, drawGoldenKitchen } from "../rendering/ParallaxLate";

// Fade speed: ~0.0055/frame at 60fps ≈ 3 seconds for full transition
const FADE_SPEED = 0.0055;
const FEATURE_FADE_SPEED = 0.006;

// Ghost platform layer configs: { speed, count, alpha }
const GHOST_LAYERS = [
  { speed: 0.03, count: 8, alpha: 0.08 }, // far — slow, faint
  { speed: 0.07, count: 6, alpha: 0.12 }, // mid — moderate
  { speed: 0.14, count: 5, alpha: 0.06 }, // near — faster, subtle
];

interface GhostPlatform {
  baseY: number;
  x: number;
  width: number;
  gfx: Graphics;
}

interface GhostLayer {
  container: Container;
  speed: number;
  items: GhostPlatform[];
}

// ── Seeded random for deterministic ghost platform placement ────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Main class ──────────────────────────────────────────────────────────────

export class ParallaxBackground {
  readonly container = new Container();
  private bgGfx = new Graphics();
  private contentContainer = new Container();
  private ghostLayers: GhostLayer[] = [];
  private features: {
    gfx: Graphics;
    baseY: number;
    x: number;
    speed: number;
  }[] = [];
  private fadingOutFeatures: {
    gfx: Graphics;
    baseY: number;
    x: number;
    speed: number;
    alpha: number;
  }[] = [];
  private featureZone = -1;
  private currentBgColor = -1;
  private currentZone = -1;
  private animTick = 0;
  private fadeProgress = 1;
  private featureFadeIn = 1;
  private lastPlatformColor = 0xd4a574;

  constructor() {
    this.bgGfx.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.bgGfx.fill(0xfff8e7);
    this.container.addChild(this.bgGfx);
    this.container.addChild(this.contentContainer);
    this.buildLayers(0);
  }

  private buildLayers(zone: number): void {
    // Clean up old ghost layers
    for (const layer of this.ghostLayers) {
      this.contentContainer.removeChild(layer.container);
      layer.container.destroy({ children: true });
    }
    this.ghostLayers = [];

    // Move old features to fading-out list
    for (const f of this.features) {
      this.fadingOutFeatures.push({ ...f, alpha: f.gfx.alpha });
    }
    this.features = [];

    // Features — 5 evenly spaced, alternating sides
    const featureCount = 5;
    const totalSpan = GAME_HEIGHT * 3;
    for (let i = 0; i < featureCount; i++) {
      const y = -GAME_HEIGHT + (i / featureCount) * totalSpan;
      const x =
        i % 2 === 0
          ? 5 + Math.random() * (GAME_WIDTH * 0.35)
          : GAME_WIDTH * 0.5 + Math.random() * (GAME_WIDTH * 0.35);

      const gfx = new Graphics();
      gfx.x = x;
      gfx.alpha = 0.25;
      this.contentContainer.addChild(gfx);
      const speed = 0.012 + i * 0.004;
      this.features.push({ gfx, baseY: y, x, speed });
    }

    // Ghost platform layers — faded platform-like shapes at different parallax depths
    for (const config of GHOST_LAYERS) {
      const layer: GhostLayer = {
        container: new Container(),
        speed: config.speed,
        items: [],
      };
      layer.container.alpha = config.alpha;
      this.contentContainer.addChild(layer.container);

      // Use zone-based seed for deterministic placement
      const rand = seededRandom(zone * 1000 + Math.round(config.speed * 1000));

      for (let i = 0; i < config.count; i++) {
        const width =
          PLATFORM_WIDTH_MIN +
          rand() * (PLATFORM_WIDTH_MAX - PLATFORM_WIDTH_MIN);
        const x = rand() * (GAME_WIDTH - width);
        const baseY = -GAME_HEIGHT + rand() * GAME_HEIGHT * 3;

        const gfx = new Graphics();
        this.drawGhostPlatform(gfx, width);
        gfx.x = x;
        layer.container.addChild(gfx);
        layer.items.push({ baseY, x, width, gfx });
      }

      this.ghostLayers.push(layer);
    }

    // Fade everything in
    this.contentContainer.alpha = 0;
    this.fadeProgress = 0;
    this.featureFadeIn = 0;
  }

  private cosmeticTheme = "theme_default";
  setCosmeticTheme(theme: string): void { this.cosmeticTheme = theme; }

  private drawGhostPlatform(gfx: Graphics, width: number): void {
    gfx.clear();
    if (this.cosmeticTheme === "theme_neon") {
      gfx.roundRect(0, 0, width, PLATFORM_HEIGHT, 4);
      gfx.stroke({ width: 1.5, color: 0x00ffff, alpha: 0.3 });
    } else if (this.cosmeticTheme === "theme_dark") {
      gfx.roundRect(0, 0, width, PLATFORM_HEIGHT, 4);
      gfx.fill({ color: 0x221133, alpha: 0.5 });
    } else {
      gfx.roundRect(0, 0, width, PLATFORM_HEIGHT, 4);
      gfx.fill(this.lastPlatformColor);
    }
  }

  update(cameraY: number): void {
    if (!this.container.parent) return; // destroyed
    this.animTick++;

    // Fade transition (~3 seconds)
    if (this.fadeProgress < 1) {
      this.fadeProgress = Math.min(1, this.fadeProgress + FADE_SPEED);
      this.contentContainer.alpha = this.fadeProgress;
    }

    // Ghost platform layers — parallax scroll + wrap
    for (const layer of this.ghostLayers) {
      for (const item of layer.items) {
        let screenY = item.baseY - cameraY * layer.speed;
        screenY =
          (((screenY % (GAME_HEIGHT * 2)) + GAME_HEIGHT * 2) %
            (GAME_HEIGHT * 2)) -
          GAME_HEIGHT * 0.5;
        item.gfx.y = screenY;
      }
    }

    // Feature fade in/out
    if (this.featureFadeIn < 1) {
      this.featureFadeIn = Math.min(1, this.featureFadeIn + FEATURE_FADE_SPEED);
    }

    // Fade out old features
    for (let i = this.fadingOutFeatures.length - 1; i >= 0; i--) {
      const f = this.fadingOutFeatures[i];
      f.alpha -= FEATURE_FADE_SPEED;
      if (f.alpha <= 0) {
        this.contentContainer.removeChild(f.gfx);
        f.gfx.destroy();
        this.fadingOutFeatures.splice(i, 1);
      } else {
        f.gfx.alpha = f.alpha;
        const screenY = f.baseY - cameraY * f.speed;
        const wrappedY =
          (((screenY % (GAME_HEIGHT * 2)) + GAME_HEIGHT * 2) %
            (GAME_HEIGHT * 2)) -
          GAME_HEIGHT * 0.3;
        f.gfx.y = wrappedY;
      }
    }

    // Draw current features with fade-in
    const drawFeature = [
      drawPlateWithPasta, drawBoilingPot, drawVoidPortal,
      drawFreezer, drawVolcano, drawCandyLand, drawGoldenKitchen,
    ][Math.min(this.featureZone, 6)];
    if (drawFeature) {
      const sizes = [110, 95, 100, 90, 105];
      for (let i = 0; i < this.features.length; i++) {
        const f = this.features[i];
        const featureAlpha = this.cosmeticTheme === "theme_dark" ? 0.12 : 0.25;
        f.gfx.alpha = featureAlpha * this.featureFadeIn;
        const featureTints: Record<string, number> = {
          theme_neon: 0x00ffff, theme_candy: 0xffaacc, theme_dark: 0x8866aa,
        };
        f.gfx.tint = featureTints[this.cosmeticTheme] ?? 0xffffff;
        const screenY = f.baseY - cameraY * f.speed;
        const wrappedY =
          (((screenY % (GAME_HEIGHT * 2)) + GAME_HEIGHT * 2) %
            (GAME_HEIGHT * 2)) -
          GAME_HEIGHT * 0.3;
        f.gfx.y = wrappedY;
        drawFeature(f.gfx, sizes[i % sizes.length], this.animTick + i * 180);
      }
    }
  }

  applyTheme(theme: ZoneTheme, zone: number): void {
    const bgHex = "#" + theme.background.toString(16).padStart(6, "0");
    document.body.style.backgroundColor = bgHex;
    document.documentElement.style.backgroundColor = bgHex;
    const gameDiv = document.getElementById("game");
    if (gameDiv) gameDiv.style.backgroundColor = bgHex;

    // Update ghost platform color to match zone
    if (theme.platform !== this.lastPlatformColor) {
      this.lastPlatformColor = theme.platform;
      for (const layer of this.ghostLayers) {
        for (const item of layer.items) {
          this.drawGhostPlatform(item.gfx, item.width);
        }
      }
    }

    if (zone !== this.currentZone) {
      this.currentZone = zone;
      this.featureZone = zone;
      this.buildLayers(zone);
    }

    if (this.currentBgColor === theme.background) return;
    this.currentBgColor = theme.background;

    this.bgGfx.clear();
    this.bgGfx.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.bgGfx.fill(theme.background);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
