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
      { label: "Tilt", desc: "Tilt your device to move left/right" },
      { label: "Keyboard", desc: "Arrow keys or WASD to move" },
      { label: "Throw", desc: "Tap/click to throw a knife (enemies mode)" },
    ],
  },
  {
    title: "SCORING",
    items: [
      { label: "Height", desc: "Climb higher for more points" },
      { label: "Meatballs", desc: "Collect for 1000 points each" },
      { label: "Combos", desc: "Collect meatballs quickly for multipliers" },
      { label: "Close calls", desc: "Land on platform edges for bonus" },
      { label: "Streaks", desc: "Every 5 consecutive landings = bonus" },
    ],
  },
  {
    title: "PLATFORMS",
    items: [
      { label: "Normal", desc: "Standard platform — always bouncy", color: 0xd4a574 },
      { label: "Breaking", desc: "Cracks visible — bounces once then breaks", color: 0x8b6914 },
      { label: "Brittle", desc: "Crumbly dots — falls through instantly", color: 0xc4a882 },
      { label: "Moving", desc: "Arrows on sides — slides left/right", color: 0xc8915a },
      { label: "Conveyor", desc: "Belt pattern — pushes you sideways", color: 0x999999 },
      { label: "Spring", desc: "Coil pattern — extra high bounce", color: 0x44cc44 },
      { label: "Ice", desc: "Sparkly blue — slippery, you slide", color: 0xaaddff },
      { label: "Crumbling", desc: "Cracked + orange — breaks after 1.5s", color: 0xbb8855 },
      { label: "Teleport", desc: "Purple glow — warps you to another", color: 0x8844ff },
      { label: "Weighted", desc: "Fulcrum — tilts based on your position", color: 0xaa8866 },
    ],
  },
  {
    title: "POWER-UPS (POSITIVE)",
    items: Object.entries(POWER_UP_INFO)
      .filter(([, info]) => info.positive)
      .map(([type, info]) => ({
        label: info.name,
        desc: info.description,
        color: COLORS.powerups[type] ?? 0xffffff,
      })),
  },
  {
    title: "POWER-UPS (NEGATIVE)",
    items: Object.entries(POWER_UP_INFO)
      .filter(([, info]) => !info.positive)
      .map(([type, info]) => ({
        label: info.name,
        desc: info.description,
        color: COLORS.powerups[type] ?? 0xff0000,
      })),
  },
  {
    title: "ZONES",
    items: [
      { label: "1. Kitchen", desc: "Warm pasta kitchen — where it all begins", color: 0xfff8e7 },
      { label: "2. Ocean", desc: "Deep sea boiling zone — bubbles rise", color: 0xd4e6f1 },
      { label: "3. Space", desc: "Dark void — stars and planets", color: 0x1a1a2e },
      { label: "4. Freezer", desc: "Icy cold — snow falls, platforms slip", color: 0xe8f0ff },
      { label: "5. Volcano", desc: "Fiery depths — embers and lava", color: 0x2a0a00 },
      { label: "6. Candy", desc: "Sweet pastel world — sugar crystals", color: 0xffeeff },
      { label: "7. Final Kitchen", desc: "Golden finale — everything combined", color: 0xfff5d4 },
    ],
  },
  {
    title: "ENEMIES (opt-in)",
    items: [
      { label: "Rats", desc: "Kitchen zone — scurry left and right" },
      { label: "Fish", desc: "Ocean zone — swim horizontally" },
      { label: "Aliens", desc: "Space zone — hover and move" },
      { label: "Throw knife", desc: "Tap to throw! Killed enemies become meatballs" },
      { label: "Shield", desc: "Pasta Shield absorbs one enemy hit" },
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

  /** Handle scroll input (touch drag or mouse wheel). */
  scroll(deltaY: number): void {
    this.scrollY = Math.max(
      0,
      Math.min(this.contentHeight - GAME_HEIGHT + 80, this.scrollY + deltaY),
    );
    this.updateScroll();
  }

  /** Update animation tick (call each frame while visible). */
  update(): void {
    this.animTick++;
  }

  private render(): void {
    while (this.container.children.length > 0) {
      const child = this.container.children[0];
      this.container.removeChild(child);
      child.destroy();
    }

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x111111, alpha: 0.95 });
    bg.eventMode = "static";
    this.container.addChild(bg);

    // Scrollable content container
    const content = new Container();
    content.label = "scroll-content";
    this.container.addChild(content);

    let y = 20;

    // Header
    const header = new Text({
      text: "HOW TO PLAY",
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 22,
        fill: "#ffdd44", fontWeight: "bold",
        stroke: { color: "#000000", width: 3 },
      }),
    });
    header.x = GAME_WIDTH / 2;
    header.y = y;
    header.anchor.set(0.5, 0);
    content.addChild(header);
    y += 40;

    // Sections
    for (const section of SECTIONS) {
      // Section title
      const titleText = new Text({
        text: section.title,
        style: new TextStyle({
          fontFamily: "monospace", fontSize: 14,
          fill: "#ffaa33", fontWeight: "bold",
        }),
      });
      titleText.x = 15;
      titleText.y = y;
      content.addChild(titleText);
      y += 22;

      // Divider
      const div = new Graphics();
      div.rect(15, y, GAME_WIDTH - 30, 1);
      div.fill({ color: 0x444444 });
      content.addChild(div);
      y += 6;

      // Items
      for (const item of section.items) {
        // Color dot
        if (item.color != null) {
          const dot = new Graphics();
          dot.circle(22, y + 6, 4);
          dot.fill(item.color);
          content.addChild(dot);
        }

        const labelText = new Text({
          text: item.label,
          style: new TextStyle({
            fontFamily: "monospace", fontSize: 11,
            fill: "#ffffff", fontWeight: "bold",
          }),
        });
        labelText.x = item.color != null ? 32 : 20;
        labelText.y = y;
        content.addChild(labelText);

        const descText = new Text({
          text: item.desc,
          style: new TextStyle({
            fontFamily: "monospace", fontSize: 9,
            fill: "#999999",
          }),
        });
        descText.x = item.color != null ? 32 : 20;
        descText.y = y + 13;
        content.addChild(descText);

        y += 28;
      }

      y += 10;
    }

    this.contentHeight = y;

    // Scroll hint
    const scrollHint = new Text({
      text: "Scroll to see more | Tap [X] to close",
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 10,
        fill: "#666666",
      }),
    });
    scrollHint.x = GAME_WIDTH / 2;
    scrollHint.y = GAME_HEIGHT - 15;
    scrollHint.anchor.set(0.5, 0.5);
    this.container.addChild(scrollHint);

    // Close button
    const closeBtn = new Text({
      text: "[X]",
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 18,
        fill: "#ff4444", fontWeight: "bold",
      }),
    });
    closeBtn.x = GAME_WIDTH - 15;
    closeBtn.y = 10;
    closeBtn.anchor.set(1, 0);
    closeBtn.eventMode = "static";
    closeBtn.cursor = "pointer";
    closeBtn.on("pointertap", () => this.hide());
    this.container.addChild(closeBtn);

    // Wire scroll events
    bg.on("wheel", (e: WheelEvent) => {
      this.scroll(e.deltaY * 0.5);
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
