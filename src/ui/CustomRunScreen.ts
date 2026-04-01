/** Custom run configuration screen — PixiJS modal. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import {
  createDefaultRunConfig,
  ALL_POWER_UP_TYPES,
  type RunConfig,
} from "../systems/CustomRunConfig";
import { seedToCode } from "../systems/DailyChallenge";

export class CustomRunScreen {
  readonly container = new Container();
  private active = false;
  private config: RunConfig = createDefaultRunConfig();
  private onStart: ((config: RunConfig) => void) | null = null;
  onClose: (() => void) | null = null;

  constructor() {
    this.container.visible = false;
  }

  /** Show the custom run screen. Calls onStart when user starts the run. */
  show(callback: (config: RunConfig) => void): void {
    this.active = true;
    this.config = createDefaultRunConfig();
    this.onStart = callback;
    this.container.visible = true;
    this.render();
  }

  hide(): void {
    this.active = false;
    this.container.visible = false;
    this.onStart = null;
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

  private render(): void {
    while (this.container.children.length > 0) {
      const child = this.container.children[0];
      this.container.removeChild(child);
      child.destroy();
    }

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x000000, alpha: 0.9 });
    bg.eventMode = "static";
    bg.on("pointertap", (e: Event) => e.stopPropagation());
    this.container.addChild(bg);

    // Title
    const title = new Text({
      text: "CUSTOM RUN",
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 20,
        fill: "#ffdd44", fontWeight: "bold",
      }),
    });
    title.x = GAME_WIDTH / 2;
    title.y = 20;
    title.anchor.set(0.5, 0);
    this.container.addChild(title);

    const labelStyle = new TextStyle({
      fontFamily: "monospace", fontSize: 12,
      fill: "#ffffff", fontWeight: "bold",
    });
    const valStyle = (on: boolean) => new TextStyle({
      fontFamily: "monospace", fontSize: 13,
      fill: on ? "#44ff44" : "#aa8877", fontWeight: "bold",
    });

    let y = 55;

    // Seed
    const seedLabel = new Text({ text: `Seed: ${this.config.seed === 0 ? "RANDOM" : seedToCode(this.config.seed)}`, style: labelStyle });
    seedLabel.x = 20;
    seedLabel.y = y;
    this.container.addChild(seedLabel);

    const seedBtn = this.makeButton("[Change]", GAME_WIDTH - 25, y, () => {
      // Cycle through some preset seeds + random
      const seeds = [0, 12345, 42, 99999, 314159];
      const idx = seeds.indexOf(this.config.seed);
      this.config.seed = seeds[(idx + 1) % seeds.length];
      this.render();
    });
    this.container.addChild(seedBtn);
    y += 25;

    // Enemies
    const enemyLabel = new Text({ text: "Enemies:", style: labelStyle });
    enemyLabel.x = 20;
    enemyLabel.y = y;
    this.container.addChild(enemyLabel);

    const enemyVal = this.makeButton(
      this.config.enemiesEnabled ? "ON" : "OFF",
      GAME_WIDTH - 25, y,
      () => { this.config.enemiesEnabled = !this.config.enemiesEnabled; this.render(); },
    );
    enemyVal.style = valStyle(this.config.enemiesEnabled);
    this.container.addChild(enemyVal);
    y += 25;

    // Difficulty
    const diffLabel = new Text({
      text: `Difficulty: ${this.config.difficultyMultiplier.toFixed(1)}x`,
      style: labelStyle,
    });
    diffLabel.x = 20;
    diffLabel.y = y;
    this.container.addChild(diffLabel);

    const diffBtn = this.makeButton("[Cycle]", GAME_WIDTH - 25, y, () => {
      const levels = [0.5, 0.75, 1.0, 1.5, 2.0];
      const idx = levels.indexOf(this.config.difficultyMultiplier);
      this.config.difficultyMultiplier = levels[(idx + 1) % levels.length];
      this.render();
    });
    this.container.addChild(diffBtn);
    y += 25;

    // Starting zone
    const zoneNames = ["Kitchen", "Boiling Pot", "Space", "Freezer", "Volcano", "Candy", "Final Kitchen"];
    const zoneLabel = new Text({
      text: `Start Zone: ${zoneNames[this.config.startingZone]}`,
      style: labelStyle,
    });
    zoneLabel.x = 20;
    zoneLabel.y = y;
    this.container.addChild(zoneLabel);

    const zoneBtn = this.makeButton("[Next]", GAME_WIDTH - 25, y, () => {
      this.config.startingZone = (this.config.startingZone + 1) % 7;
      this.render();
    });
    this.container.addChild(zoneBtn);
    y += 25;

    // Practice mode
    const practiceLabel = new Text({ text: "Practice (no death):", style: labelStyle });
    practiceLabel.x = 20;
    practiceLabel.y = y;
    this.container.addChild(practiceLabel);

    const practiceVal = this.makeButton(
      this.config.practiceMode ? "ON" : "OFF",
      GAME_WIDTH - 25, y,
      () => { this.config.practiceMode = !this.config.practiceMode; this.render(); },
    );
    practiceVal.style = valStyle(this.config.practiceMode);
    this.container.addChild(practiceVal);
    y += 30;

    // Power-ups section
    const puTitle = new Text({
      text: "POWER-UPS (tap to toggle)",
      style: new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#ccbbaa", fontWeight: "bold" }),
    });
    puTitle.x = GAME_WIDTH / 2;
    puTitle.y = y;
    puTitle.anchor.set(0.5, 0);
    this.container.addChild(puTitle);
    y += 16;

    // Power-up toggles in two columns
    const enabled = this.config.enabledPowerUps;
    for (let i = 0; i < ALL_POWER_UP_TYPES.length; i++) {
      const type = ALL_POWER_UP_TYPES[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const px = col === 0 ? 15 : GAME_WIDTH / 2 + 5;
      const py = y + row * 20;

      const isOn = enabled.has(type);
      const name = type.replace(/_/g, " ");
      const puText = new Text({
        text: `${isOn ? "+" : "-"} ${name}`,
        style: new TextStyle({
          fontFamily: "monospace", fontSize: 11,
          fill: isOn ? "#eeddcc" : "#666655",
        }),
      });
      puText.x = px;
      puText.y = py;
      puText.eventMode = "static";
      puText.cursor = "pointer";
      puText.on("pointertap", (e: Event) => {
        e.stopPropagation();
        if (enabled.has(type)) enabled.delete(type);
        else enabled.add(type);
        this.render();
      });
      this.container.addChild(puText);
    }

    y += Math.ceil(ALL_POWER_UP_TYPES.length / 2) * 20 + 15;

    // Start button
    const startBtn = new Text({
      text: "[ START RUN ]",
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 18,
        fill: "#44ff44", fontWeight: "bold",
      }),
    });
    startBtn.x = GAME_WIDTH / 2;
    startBtn.y = Math.min(y, GAME_HEIGHT - 60);
    startBtn.anchor.set(0.5, 0.5);
    startBtn.eventMode = "static";
    startBtn.cursor = "pointer";
    startBtn.on("pointertap", () => {
      if (this.onStart) this.onStart(this.config);
      this.hide();
    });
    this.container.addChild(startBtn);

    // Back button
    const backBtn = new Text({
      text: "[Back]",
      style: new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#ccbbaa" }),
    });
    backBtn.x = GAME_WIDTH / 2;
    backBtn.y = GAME_HEIGHT - 25;
    backBtn.anchor.set(0.5, 0.5);
    backBtn.eventMode = "static";
    backBtn.cursor = "pointer";
    backBtn.on("pointertap", () => this.hide());
    this.container.addChild(backBtn);
  }

  private makeButton(label: string, x: number, y: number, onClick: () => void): Text {
    const btn = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 12,
        fill: "#88aaff", fontWeight: "bold",
      }),
    });
    btn.x = x;
    btn.y = y;
    btn.anchor.set(1, 0);
    btn.eventMode = "static";
    btn.cursor = "pointer";
    btn.on("pointertap", (e: Event) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
