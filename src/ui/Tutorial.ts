/** First-play tutorial overlay — PixiJS. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

const TUTORIAL_KEY = "noodle-jump-tutorial-seen";

export class Tutorial {
  readonly container = new Container();
  private active = false;
  private step = 0;
  private steps: { text: string; icon: string }[];

  constructor() {
    this.steps = [
      { text: "Tilt your device to move\n(or use Arrow keys / WASD)", icon: "move" },
      { text: "Jump on platforms\nto climb higher!", icon: "jump" },
      { text: "Collect meatballs\nfor bonus points!", icon: "collect" },
      { text: "Grab power-ups for\nspecial abilities!", icon: "powerup" },
      { text: "Watch out for red items\n— they're bad news!", icon: "warning" },
    ];
    this.container.visible = false;
  }

  /** Check if tutorial should show (first play). */
  shouldShow(): boolean {
    try {
      return !localStorage.getItem(TUTORIAL_KEY);
    } catch {
      return false;
    }
  }

  /** Start the tutorial. */
  show(): void {
    if (!this.shouldShow()) return;
    this.active = true;
    this.step = 0;
    this.container.visible = true;
    this.renderStep();
  }

  /** Advance to next step or close. Returns true if tutorial is still active. */
  advance(): boolean {
    if (!this.active) return false;
    this.step++;
    if (this.step >= this.steps.length) {
      this.close();
      return false;
    }
    this.renderStep();
    return true;
  }

  isActive(): boolean {
    return this.active;
  }

  private close(): void {
    this.active = false;
    this.container.visible = false;
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {
      // ignore
    }
  }

  private renderStep(): void {
    // Clear previous
    while (this.container.children.length > 0) {
      const child = this.container.children[0];
      this.container.removeChild(child);
      child.destroy();
    }

    // Dim overlay
    const dim = new Graphics();
    dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    dim.fill({ color: 0x000000, alpha: 0.6 });
    dim.eventMode = "static";
    this.container.addChild(dim);

    const step = this.steps[this.step];

    // Step text
    const text = new Text({
      text: step.text,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 18,
        fill: "#ffffff",
        fontWeight: "bold",
        align: "center",
        lineHeight: 24,
        stroke: { color: "#000000", width: 3 },
      }),
    });
    text.x = GAME_WIDTH / 2;
    text.y = GAME_HEIGHT * 0.35;
    text.anchor.set(0.5, 0.5);
    this.container.addChild(text);

    // Step counter
    const counter = new Text({
      text: `${this.step + 1} / ${this.steps.length}`,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 14,
        fill: "#ccbbaa",
      }),
    });
    counter.x = GAME_WIDTH / 2;
    counter.y = GAME_HEIGHT * 0.55;
    counter.anchor.set(0.5, 0.5);
    this.container.addChild(counter);

    // Tap to continue
    const tapText = new Text({
      text: "Tap to continue",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 15,
        fill: "#ddccbb",
      }),
    });
    tapText.x = GAME_WIDTH / 2;
    tapText.y = GAME_HEIGHT * 0.7;
    tapText.anchor.set(0.5, 0.5);
    this.container.addChild(tapText);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
