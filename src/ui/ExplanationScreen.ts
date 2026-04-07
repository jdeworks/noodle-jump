/** Explanation screen — animated help modal showing all game mechanics. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { type PlatformStyle } from "../rendering/PlatformSprites";
import { drawThemedPlatform } from "../rendering/ThemeSprites";
import { drawPowerUp } from "../rendering/ItemSprites";
import { InertiaScroll } from "./InertiaScroll";
import { getUITheme } from "./ThemeUI";
import { loadCosmetics } from "../systems/Cosmetics";
import { SECTIONS } from "./ExplanationData";

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

    this.scroller.tick();
    this.updateScroll();
    const t = this.animTick;
    for (const sprite of this.animSprites) {
      if (sprite.type === "platform") {
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
        const phase = sprite.baseY * 0.3;
        const bobSpeed = 0.04 + (sprite.baseY % 7) * 0.005;
        const bobAmp = 3 + (sprite.baseY % 4);
        sprite.gfx.y = sprite.baseY + Math.sin(t * bobSpeed + phase) * bobAmp;
        const spinSpeed = 0.06 + (sprite.baseY % 5) * 0.01;
        sprite.gfx.scale.x = 0.5 + Math.abs(Math.cos(t * spinSpeed + phase)) * 0.5;
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

    const uiT = getUITheme();
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: uiT.bg, alpha: 0.97 });
    bg.eventMode = "static";
    this.container.addChild(bg);

    const content = new Container();
    content.label = "scroll-content";
    this.container.addChild(content);

    let y = 24;

    const header = new Text({
      text: "HOW TO PLAY",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 24,
        fill: "#ffdd44",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 3 },
      }),
    });
    header.x = GAME_WIDTH / 2;
    header.y = y;
    header.anchor.set(0.5, 0);
    content.addChild(header);
    y += 44;

    for (const section of SECTIONS) {
      const titleText = new Text({
        text: section.title,
        style: new TextStyle({
          fontFamily: "monospace",
          fontSize: 15,
          fill: "#ffaa33",
          fontWeight: "bold",
        }),
      });
      titleText.x = 15;
      titleText.y = y;
      content.addChild(titleText);
      y += 22;

      const div = new Graphics();
      div.rect(15, y, GAME_WIDTH - 30, 1);
      div.fill({ color: 0x554433 });
      content.addChild(div);
      y += 8;

      for (const item of section.items) {
        const hasPlatform = item.platformStyle != null;
        const hasPowerUp = item.powerUpType != null;
        const hasSprite = hasPlatform || hasPowerUp;
        const textX = hasPowerUp ? 56 : hasPlatform ? 80 : 20;
        const rowH = hasSprite ? 42 : 34;

        if (item.platformStyle != null && item.color != null) {
          const platGfx = new Graphics();
          const cosm = loadCosmetics();
          drawThemedPlatform(
            platGfx,
            56,
            10,
            item.color,
            item.platformStyle,
            cosm.equipped.theme ?? "theme_default",
          );
          platGfx.x = 15;
          platGfx.y = y + 6;
          content.addChild(platGfx);
          this.animSprites.push({
            gfx: platGfx,
            type: "platform",
            style: item.platformStyle,
            color: item.color,
            baseY: y + 6,
          });
        }

        if (item.powerUpType != null && item.color != null) {
          const puSize = 36;
          const puCenter = puSize / 2;
          const puGfx = new Graphics();
          drawPowerUp(puGfx, puSize, item.color, item.powerUpType);
          puGfx.pivot.set(puCenter, puCenter);
          puGfx.x = 10 + puCenter;
          puGfx.y = y + puCenter - 2;
          content.addChild(puGfx);
          this.animSprites.push({
            gfx: puGfx,
            type: "powerup",
            puType: item.powerUpType,
            color: item.color,
            baseY: y + puCenter - 2,
          });
        }

        if (!hasSprite && item.color != null) {
          const dot = new Graphics();
          dot.circle(22, y + 7, 5);
          dot.fill(item.color);
          content.addChild(dot);
        }

        const labelText = new Text({
          text: item.label,
          style: new TextStyle({
            fontFamily: "monospace",
            fontSize: 13,
            fill: "#ffffff",
            fontWeight: "bold",
          }),
        });
        labelText.x = textX;
        labelText.y = y;
        content.addChild(labelText);

        const descText = new Text({
          text: item.desc,
          style: new TextStyle({
            fontFamily: "monospace",
            fontSize: 12,
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

    const fadeBar = new Graphics();
    fadeBar.rect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
    fadeBar.fill({ color: 0x1a1410, alpha: 0.9 });
    this.container.addChild(fadeBar);

    const scrollHint = new Text({
      text: "Scroll to see more",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 12,
        fill: "#ccbbaa",
      }),
    });
    scrollHint.x = GAME_WIDTH / 2;
    scrollHint.y = GAME_HEIGHT - 18;
    scrollHint.anchor.set(0.5, 0.5);
    this.container.addChild(scrollHint);

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
        fontFamily: "monospace",
        fontSize: 16,
        fill: "#ff6644",
        fontWeight: "bold",
      }),
    });
    closeBtn.x = GAME_WIDTH - 24;
    closeBtn.y = 20;
    closeBtn.anchor.set(0.5, 0.5);
    closeBtn.eventMode = "static";
    closeBtn.cursor = "pointer";
    closeBtn.on("pointertap", () => this.hide());
    this.container.addChild(closeBtn);

    this.scroller.setMaxScroll(this.contentHeight - GAME_HEIGHT + 80);
    this.scroller.attach(bg);

    this.updateScroll();
  }

  private updateScroll(): void {
    const content = this.container.children.find((c) => c.label === "scroll-content");
    if (content) {
      content.y = -this.scroller.scrollY;
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
