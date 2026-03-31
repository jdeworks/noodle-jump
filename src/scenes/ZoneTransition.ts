/** Zone transition cinematic — flash + zone name reveal. PixiJS. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

const ZONE_NAMES = [
  "The Kitchen",
  "Ocean Deep",
  "Outer Space",
  "The Freezer",
  "Volcano Core",
  "Candy World",
  "Final Kitchen",
];

const TRANSITION_TICKS = 90; // 1.5 seconds

export class ZoneTransition {
  readonly container = new Container();
  private flash = new Graphics();
  private label: Text;
  private ticks = 0;
  private active = false;

  constructor() {
    this.container.visible = false;

    this.flash.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.flash.fill({ color: 0xffffff, alpha: 1 });
    this.container.addChild(this.flash);

    this.label = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 28,
        fill: "#ffffff",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 4 },
        align: "center",
      }),
    });
    this.label.x = GAME_WIDTH / 2;
    this.label.y = GAME_HEIGHT * 0.4;
    this.label.anchor.set(0.5, 0.5);
    this.container.addChild(this.label);
  }

  /** Start a zone transition cinematic. */
  play(toZone: number): void {
    this.active = true;
    this.ticks = TRANSITION_TICKS;
    this.label.text = ZONE_NAMES[Math.min(toZone, ZONE_NAMES.length - 1)];
    this.container.visible = true;
  }

  /** Update the transition. Returns true while active. */
  update(): boolean {
    if (!this.active) return false;

    this.ticks--;
    const progress = 1 - this.ticks / TRANSITION_TICKS;

    // Flash fades out quickly
    this.flash.alpha = Math.max(0, 1 - progress * 3);

    // Text fades in then out
    if (progress < 0.3) {
      this.label.alpha = progress / 0.3;
      const scale = 0.5 + (progress / 0.3) * 0.5;
      this.label.scale.set(scale);
    } else if (progress > 0.7) {
      this.label.alpha = (1 - progress) / 0.3;
    } else {
      this.label.alpha = 1;
      this.label.scale.set(1);
    }

    if (this.ticks <= 0) {
      this.active = false;
      this.container.visible = false;
      return false;
    }

    return true;
  }

  isActive(): boolean {
    return this.active;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
