/** Explanation screen — animated help modal showing all game mechanics. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config/constants";
import { POWER_UP_INFO } from "./PowerUpDescriptions";
import { drawPlatform, type PlatformStyle } from "../rendering/PlatformSprites";
import { drawPowerUp } from "../rendering/ItemSprites";
import { InertiaScroll } from "./InertiaScroll";

interface Section {
  title: string;
  items: {
    label: string;
    desc: string;
    color?: number;
    platformStyle?: PlatformStyle;
    powerUpType?: string;
  }[];
}

const SECTIONS: Section[] = [
  {
    title: "CONTROLS",
    items: [
      { label: "Tilt / Arrows / WASD", desc: "Move left and right" },
      { label: "Tap / Click", desc: "Throw a knife (when enemies are on)" },
    ],
  },
  {
    title: "SCORING",
    items: [
      { label: "Climb higher", desc: "Height = points" },
      { label: "Meatballs", desc: "1000 points each — collect quickly for combos" },
      { label: "Edge landings", desc: "Close call bonus for landing near edges" },
      { label: "Streaks", desc: "Every 5 consecutive landings = bonus" },
    ],
  },
  {
    title: "PLATFORMS",
    items: [
      { label: "Normal", desc: "Standard — always bouncy", color: 0xd4a574, platformStyle: "normal" as PlatformStyle },
      { label: "Breaking", desc: "Bounces once then breaks", color: 0x8b6914, platformStyle: "breaking" as PlatformStyle },
      { label: "Brittle", desc: "Fall through instantly!", color: 0xc4a882, platformStyle: "brittle" as PlatformStyle },
      { label: "Moving", desc: "Slides left and right", color: 0xc8915a, platformStyle: "moving" as PlatformStyle },
      { label: "Conveyor", desc: "Pushes you sideways", color: 0x999999, platformStyle: "conveyor" as PlatformStyle },
      { label: "Spring", desc: "Extra high bounce", color: 0x44cc44, platformStyle: "spring" as PlatformStyle },
      { label: "Ice", desc: "Slippery — you slide", color: 0xaaddff, platformStyle: "ice" as PlatformStyle },
      { label: "Crumbling", desc: "Breaks after 1.5 seconds", color: 0xbb8855, platformStyle: "crumbling" as PlatformStyle },
      { label: "Teleport", desc: "Warps you to another", color: 0x8844ff, platformStyle: "teleport" as PlatformStyle },
      { label: "Weighted", desc: "Tilts where you land", color: 0xaa8866, platformStyle: "weighted" as PlatformStyle },
    ],
  },
  {
    title: "POSITIVE POWER-UPS",
    items: Object.entries(POWER_UP_INFO)
      .filter(([, info]) => info.positive)
      .map(([type, info]) => ({
        label: info.name,
        desc: info.description,
        color: COLORS.powerups[type] ?? 0x44ff44,
        powerUpType: type,
      })),
  },
  {
    title: "NEGATIVE POWER-UPS  —  avoid these!",
    items: Object.entries(POWER_UP_INFO)
      .filter(([, info]) => !info.positive)
      .map(([type, info]) => ({
        label: info.name,
        desc: info.description,
        color: COLORS.powerups[type] ?? 0xff4444,
        powerUpType: type,
      })),
  },
  {
    title: "7 ZONES",
    items: [
      { label: "Kitchen", desc: "Warm start — where it all begins" },
      { label: "Boiling Pot", desc: "Steamy bubbling zone — watch the heat" },
      { label: "Space", desc: "Dark void — stars and planets" },
      { label: "Freezer", desc: "Icy cold — snow and slippery platforms" },
      { label: "Volcano", desc: "Fiery — embers and rising heat" },
      { label: "Candy World", desc: "Sweet pastels — sugar crystals" },
      { label: "Final Kitchen", desc: "Golden — everything combined" },
    ],
  },
  {
    title: "ENEMIES & BOSSES",
    items: [
      { label: "Enemies", desc: "Toggle in settings — rats, fish, aliens per zone" },
      { label: "Knives", desc: "Tap to throw! 3 ammo, regenerates over time" },
      { label: "Killed enemies", desc: "Turn into meatballs you can collect" },
      { label: "Bosses", desc: "Appear at zone transitions — 3 unique types" },
    ],
  },
];

interface AnimatedSprite {
  gfx: Graphics;
  type: "platform" | "powerup";
  style?: PlatformStyle;
  puType?: string;
  color: number;
  baseY: number;
}

export class ExplanationScreen {
  readonly container = new Container();
  private active = false;
  private scroller = new InertiaScroll();
  private contentHeight = 0;
  private animTick = 0;
  private animSprites: AnimatedSprite[] = [];
  onClose: (() => void) | null = null;

  constructor() {
    this.container.visible = false;
  }

  show(): void {
    this.active = true;
    this.scroller.reset();
    this.animTick = 0;
    this.container.visible = true;
    this.render();
  }

  hide(): void {
    this.active = false;
    this.container.visible = false;
    while (this.container.children.length > 0) {
      const child = this.container.children[0];
      this.container.removeChild(child);
      child.destroy();
    }
    this.onClose?.();
  }

  isActive(): boolean {
    return this.active;
  }


  update(): void {
    if (!this.active) return;
    this.animTick++;

    // Inertia scrolling
    this.scroller.tick();
    this.updateScroll();
    const t = this.animTick;
    for (const sprite of this.animSprites) {
      if (sprite.type === "platform") {
        // Animate via transform only — no redraw
        if (sprite.style === "spring") {
          sprite.gfx.scale.y = 1 + Math.sin(t * 0.1) * 0.15;
        } else if (sprite.style === "teleport") {
          sprite.gfx.alpha = 0.7 + Math.sin(t * 0.12) * 0.3;
        } else if (sprite.style === "crumbling") {
          sprite.gfx.x = 15 + Math.sin(t * 0.3) * 1;
        } else if (sprite.style === "moving") {
          sprite.gfx.x = 15 + Math.sin(t * 0.05) * 4;
        } else if (sprite.style === "conveyor") {
          sprite.gfx.x = 15 + (t % 20) * 0.2;
        }
      } else if (sprite.type === "powerup") {
        // Each power-up gets unique phase from its baseY position
        const phase = sprite.baseY * 0.3;
        const bobSpeed = 0.04 + (sprite.baseY % 7) * 0.005;
        const bobAmp = 3 + (sprite.baseY % 4);
        sprite.gfx.y = sprite.baseY + Math.sin(t * bobSpeed + phase) * bobAmp;
        // Spin with per-item variation
        const spinSpeed = 0.06 + (sprite.baseY % 5) * 0.01;
        sprite.gfx.scale.x = 0.5 + Math.abs(Math.cos(t * spinSpeed + phase)) * 0.5;
        // Gentle rotation wobble
        sprite.gfx.rotation = Math.sin(t * 0.08 + phase) * 0.1;
      }
    }
  }

  private render(): void {
    this.animSprites = [];
    while (this.container.children.length > 0) {
      const child = this.container.children[0];
      this.container.removeChild(child);
      child.destroy();
    }

    // Background — dark with slight warmth
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x1a1410, alpha: 0.97 });
    bg.eventMode = "static";
    this.container.addChild(bg);

    // Scrollable content
    const content = new Container();
    content.label = "scroll-content";
    this.container.addChild(content);

    let y = 24;

    // Header
    const header = new Text({
      text: "HOW TO PLAY",
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 24,
        fill: "#ffdd44", fontWeight: "bold",
        stroke: { color: "#000000", width: 3 },
      }),
    });
    header.x = GAME_WIDTH / 2;
    header.y = y;
    header.anchor.set(0.5, 0);
    content.addChild(header);
    y += 44;

    for (const section of SECTIONS) {
      // Section title — larger, colored
      const titleText = new Text({
        text: section.title,
        style: new TextStyle({
          fontFamily: "monospace", fontSize: 15,
          fill: "#ffaa33", fontWeight: "bold",
        }),
      });
      titleText.x = 15;
      titleText.y = y;
      content.addChild(titleText);
      y += 22;

      // Divider — warm color
      const div = new Graphics();
      div.rect(15, y, GAME_WIDTH - 30, 1);
      div.fill({ color: 0x554433 });
      content.addChild(div);
      y += 8;

      for (const item of section.items) {
        const hasPlatform = item.platformStyle != null;
        const hasPowerUp = item.powerUpType != null;
        const hasSprite = hasPlatform || hasPowerUp;
        const textX = hasPowerUp ? 56 : (hasPlatform ? 80 : 20);
        const rowH = hasSprite ? 42 : 34;

        // Platform sprite preview (animated)
        if (item.platformStyle != null && item.color != null) {
          const platGfx = new Graphics();
          drawPlatform(platGfx, 56, 10, item.color, item.platformStyle);
          platGfx.x = 15;
          platGfx.y = y + 6;
          content.addChild(platGfx);
          this.animSprites.push({
            gfx: platGfx, type: "platform",
            style: item.platformStyle, color: item.color, baseY: y + 6,
          });
        }

        // Power-up sprite preview (animated) — pivot at center
        if (item.powerUpType != null && item.color != null) {
          const puSize = 36;
          const puCenter = puSize / 2;
          const puGfx = new Graphics();
          drawPowerUp(puGfx, puSize, item.color, item.powerUpType);
          // Pivot at the drawn center (drawPowerUp draws at (s,s))
          puGfx.pivot.set(puCenter, puCenter);
          puGfx.x = 10 + puCenter;
          puGfx.y = y + puCenter - 2;
          content.addChild(puGfx);
          this.animSprites.push({
            gfx: puGfx, type: "powerup",
            puType: item.powerUpType, color: item.color, baseY: y + puCenter - 2,
          });
        }

        // Color dot fallback for items without sprites
        if (!hasSprite && item.color != null) {
          const dot = new Graphics();
          dot.circle(22, y + 7, 5);
          dot.fill(item.color);
          content.addChild(dot);
        }

        // Label
        const labelText = new Text({
          text: item.label,
          style: new TextStyle({
            fontFamily: "monospace", fontSize: 13,
            fill: "#ffffff", fontWeight: "bold",
          }),
        });
        labelText.x = textX;
        labelText.y = y;
        content.addChild(labelText);

        // Description
        const descText = new Text({
          text: item.desc,
          style: new TextStyle({
            fontFamily: "monospace", fontSize: 12,
            fill: "#ccbbaa",
          }),
        });
        descText.x = textX;
        descText.y = y + 16;
        content.addChild(descText);

        y += rowH;
      }

      y += 12;
    }

    this.contentHeight = y;

    // Bottom bar with gradient fade
    const fadeBar = new Graphics();
    fadeBar.rect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
    fadeBar.fill({ color: 0x1a1410, alpha: 0.9 });
    this.container.addChild(fadeBar);

    // Scroll hint
    const scrollHint = new Text({
      text: "Scroll to see more",
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 12,
        fill: "#ccbbaa",
      }),
    });
    scrollHint.x = GAME_WIDTH / 2;
    scrollHint.y = GAME_HEIGHT - 18;
    scrollHint.anchor.set(0.5, 0.5);
    this.container.addChild(scrollHint);

    // Close button — bigger, more visible
    const closeBg = new Graphics();
    closeBg.roundRect(GAME_WIDTH - 42, 6, 36, 28, 6);
    closeBg.fill({ color: 0x442222, alpha: 0.8 });
    closeBg.eventMode = "static";
    closeBg.cursor = "pointer";
    closeBg.on("pointertap", () => this.hide());
    this.container.addChild(closeBg);

    const closeBtn = new Text({
      text: "X",
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 16,
        fill: "#ff6644", fontWeight: "bold",
      }),
    });
    closeBtn.x = GAME_WIDTH - 24;
    closeBtn.y = 20;
    closeBtn.anchor.set(0.5, 0.5);
    closeBtn.eventMode = "static";
    closeBtn.cursor = "pointer";
    closeBtn.on("pointertap", () => this.hide());
    this.container.addChild(closeBtn);

    // Wire scroll events (wheel + touch drag with inertia)
    this.scroller.setMaxScroll(this.contentHeight - GAME_HEIGHT + 80);
    this.scroller.attach(bg);

    this.updateScroll();
  }

  private updateScroll(): void {
    const content = this.container.children.find(
      (c) => c.label === "scroll-content",
    );
    if (content) {
      content.y = -this.scroller.scrollY;
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
