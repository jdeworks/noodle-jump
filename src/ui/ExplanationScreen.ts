/** Explanation screen — animated help modal showing all game mechanics. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config/constants";
import { POWER_UP_INFO } from "./PowerUpDescriptions";

interface Section {
  title: string;
  items: { label: string; desc: string; color?: number }[];
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
      { label: "Normal", desc: "Standard — always bouncy", color: 0xd4a574 },
      { label: "Breaking", desc: "Bounces once then breaks", color: 0x8b6914 },
      { label: "Brittle", desc: "Fall through instantly!", color: 0xc4a882 },
      { label: "Moving", desc: "Slides left and right", color: 0xc8915a },
      { label: "Conveyor", desc: "Pushes you sideways", color: 0x999999 },
      { label: "Spring", desc: "Extra high bounce", color: 0x44cc44 },
      { label: "Ice", desc: "Slippery — you slide", color: 0xaaddff },
      { label: "Crumbling", desc: "Breaks after 1.5 seconds", color: 0xbb8855 },
      { label: "Teleport", desc: "Warps you to another", color: 0x8844ff },
      { label: "Weighted", desc: "Tilts where you land", color: 0xaa8866 },
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
      })),
  },
  {
    title: "NEGATIVE POWER-UPS",
    items: Object.entries(POWER_UP_INFO)
      .filter(([, info]) => !info.positive)
      .map(([type, info]) => ({
        label: info.name,
        desc: info.description,
        color: COLORS.powerups[type] ?? 0xff4444,
      })),
  },
  {
    title: "7 ZONES",
    items: [
      { label: "Kitchen", desc: "Warm start — where it all begins" },
      { label: "Ocean", desc: "Deep sea — bubbles and currents" },
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

export class ExplanationScreen {
  readonly container = new Container();
  private active = false;
  private scrollY = 0;
  private contentHeight = 0;
  private animTick = 0;

  constructor() {
    this.container.visible = false;
  }

  show(): void {
    this.active = true;
    this.scrollY = 0;
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
  }

  isActive(): boolean {
    return this.active;
  }

  scroll(deltaY: number): void {
    this.scrollY = Math.max(
      0,
      Math.min(this.contentHeight - GAME_HEIGHT + 80, this.scrollY + deltaY),
    );
    this.updateScroll();
  }

  update(): void {
    this.animTick++;
  }

  private render(): void {
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
        // Color dot
        if (item.color != null) {
          const dot = new Graphics();
          dot.circle(22, y + 7, 5);
          dot.fill(item.color);
          dot.circle(22, y + 7, 5);
          dot.stroke({ width: 1, color: 0x000000, alpha: 0.3 });
          content.addChild(dot);
        }

        // Label — bright white, readable size
        const labelText = new Text({
          text: item.label,
          style: new TextStyle({
            fontFamily: "monospace", fontSize: 12,
            fill: "#ffffff", fontWeight: "bold",
          }),
        });
        labelText.x = item.color != null ? 34 : 20;
        labelText.y = y;
        content.addChild(labelText);

        // Description — light gray (good contrast on dark bg)
        const descText = new Text({
          text: item.desc,
          style: new TextStyle({
            fontFamily: "monospace", fontSize: 11,
            fill: "#ccbbaa",
          }),
        });
        descText.x = item.color != null ? 34 : 20;
        descText.y = y + 15;
        content.addChild(descText);

        y += 32;
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
        fontFamily: "monospace", fontSize: 11,
        fill: "#998877",
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

    // Wire scroll events
    bg.on("wheel", (e: WheelEvent) => {
      this.scroll(e.deltaY * 0.5);
    });

    // Touch drag scrolling
    let touchStartY = 0;
    bg.on("pointerdown", (e) => { touchStartY = e.globalY; });
    bg.on("pointermove", (e) => {
      if (e.pressure > 0) {
        this.scroll(touchStartY - e.globalY);
        touchStartY = e.globalY;
      }
    });

    this.updateScroll();
  }

  private updateScroll(): void {
    const content = this.container.children.find(
      (c) => c.label === "scroll-content",
    );
    if (content) {
      content.y = -this.scrollY;
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
