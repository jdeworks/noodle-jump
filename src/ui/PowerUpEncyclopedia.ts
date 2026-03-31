/** Power-up encyclopedia — shows all collected power-ups with descriptions. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config/constants";
import { POWER_UP_INFO, getCollectedPowerUps } from "./PowerUpDescriptions";

export class PowerUpEncyclopedia {
  readonly container = new Container();
  private active = false;

  constructor() {
    this.container.visible = false;
  }

  show(): void {
    this.active = true;
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

  private render(): void {
    // Clear
    while (this.container.children.length > 0) {
      const child = this.container.children[0];
      this.container.removeChild(child);
      child.destroy();
    }

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x000000, alpha: 0.85 });
    bg.eventMode = "static";
    this.container.addChild(bg);

    // Title
    const title = new Text({
      text: "POWER-UP ENCYCLOPEDIA",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 16,
        fill: "#ffdd44",
        fontWeight: "bold",
      }),
    });
    title.x = GAME_WIDTH / 2;
    title.y = 20;
    title.anchor.set(0.5, 0);
    this.container.addChild(title);

    const collected = getCollectedPowerUps();
    const types = Object.keys(POWER_UP_INFO);
    let y = 50;

    for (const type of types) {
      const info = POWER_UP_INFO[type];
      const isCollected = collected.has(type);

      // Color indicator
      const dot = new Graphics();
      const color = isCollected
        ? (COLORS.powerups[type] ?? 0xffffff)
        : 0x444444;
      dot.circle(15, y + 7, 5);
      dot.fill(color);
      this.container.addChild(dot);

      // Name
      const name = new Text({
        text: isCollected ? info.name : "???",
        style: new TextStyle({
          fontFamily: "monospace",
          fontSize: 13,
          fill: isCollected ? "#ffffff" : "#887766",
          fontWeight: "bold",
        }),
      });
      name.x = 28;
      name.y = y;
      this.container.addChild(name);

      // Description
      if (isCollected) {
        const desc = new Text({
          text: info.description,
          style: new TextStyle({
            fontFamily: "monospace",
            fontSize: 11,
            fill: "#ccbbaa",
          }),
        });
        desc.x = 28;
        desc.y = y + 14;
        this.container.addChild(desc);
      }

      y += 32;
    }

    // Close button
    const closeText = new Text({
      text: "[Close]",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 16,
        fill: "#ffddbb",
        fontWeight: "bold",
      }),
    });
    closeText.x = GAME_WIDTH / 2;
    closeText.y = GAME_HEIGHT - 30;
    closeText.anchor.set(0.5, 0.5);
    closeText.eventMode = "static";
    closeText.cursor = "pointer";
    closeText.on("pointertap", () => this.hide());
    this.container.addChild(closeText);

    // Collected count
    const countText = new Text({
      text: `${collected.size} / ${types.length} discovered`,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 12,
        fill: "#ccbbaa",
      }),
    });
    countText.x = GAME_WIDTH / 2;
    countText.y = GAME_HEIGHT - 50;
    countText.anchor.set(0.5, 0.5);
    this.container.addChild(countText);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
