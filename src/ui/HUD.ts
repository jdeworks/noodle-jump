/** HUD system — PixiJS overlay for gameplay information. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { POWER_UP_INFO } from "./PowerUpDescriptions";
import type { GameWorldState } from "../scenes/GameState";

const ZONE_NAMES = [
  "Kitchen", "Ocean", "Space", "Freezer",
  "Volcano", "Candy", "Final Kitchen",
];
const ZONE_THRESHOLDS = [0, 80, 280, 500, 750, 1000, 1300];

export class HUD {
  readonly container = new Container();

  private bgBar = new Graphics();
  private timerText: Text;
  private heightText: Text;
  private scoreText: Text;
  private zoneBar = new Graphics();
  private zoneLabel: Text;
  private effectDescText: Text;
  private comboText: Text;
  private pauseBtn: Text;
  private pauseHitArea = new Graphics();
  private miniMapContainer = new Container();
  private miniMapBg = new Graphics();
  private miniMapDots: Graphics[] = [];
  private _onPause: (() => void) | null = null;

  constructor() {
    const hudStyle = new TextStyle({
      fontFamily: "monospace",
      fontSize: 14,
      fill: "#ffffff",
      fontWeight: "bold",
    });

    // Background bar
    this.bgBar.rect(0, 0, GAME_WIDTH, 36);
    this.bgBar.fill({ color: 0x000000, alpha: 0.3 });
    this.container.addChild(this.bgBar);

    // Timer
    this.timerText = new Text({ text: "0:00", style: hudStyle });
    this.timerText.x = 10;
    this.timerText.y = 9;
    this.container.addChild(this.timerText);

    // Height
    this.heightText = new Text({ text: "H: 0", style: hudStyle });
    this.heightText.x = GAME_WIDTH / 2;
    this.heightText.anchor.set(0.5, 0);
    this.heightText.y = 9;
    this.container.addChild(this.heightText);

    // Score — left of pause button
    this.scoreText = new Text({ text: "0", style: hudStyle });
    this.scoreText.x = GAME_WIDTH - 50;
    this.scoreText.anchor.set(1, 0);
    this.scoreText.y = 9;
    this.container.addChild(this.scoreText);

    // Pause button — inside HUD bar, large touch target
    this.pauseHitArea.rect(GAME_WIDTH - 44, 0, 44, 36);
    this.pauseHitArea.fill({ color: 0x000000, alpha: 0.001 });
    this.pauseHitArea.eventMode = "static";
    this.pauseHitArea.cursor = "pointer";
    this.pauseHitArea.on("pointertap", () => this._onPause?.());
    this.container.addChild(this.pauseHitArea);

    this.pauseBtn = new Text({
      text: "| |",
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 16,
        fill: "#ffaa33", fontWeight: "bold",
      }),
    });
    this.pauseBtn.x = GAME_WIDTH - 22;
    this.pauseBtn.y = 9;
    this.pauseBtn.anchor.set(0.5, 0);
    this.container.addChild(this.pauseBtn);

    // Zone progress bar
    this.container.addChild(this.zoneBar);

    // Zone label — needs stroke for light zone backgrounds
    this.zoneLabel = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 12,
        fill: "#ffffff",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    this.zoneLabel.x = GAME_WIDTH / 2;
    this.zoneLabel.y = 36;
    this.zoneLabel.anchor.set(0.5, 0);
    this.container.addChild(this.zoneLabel);

    // Active effect description
    this.effectDescText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 13,
        fill: "#ffdd44",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 3 },
      }),
    });
    this.effectDescText.x = GAME_WIDTH / 2;
    this.effectDescText.y = GAME_HEIGHT - 22;
    this.effectDescText.anchor.set(0.5, 1);
    this.effectDescText.visible = false;
    this.container.addChild(this.effectDescText);

    // Combo display
    this.comboText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 18,
        fill: "#ff8800",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 3 },
      }),
    });
    this.comboText.x = GAME_WIDTH - 10;
    this.comboText.y = 38;
    this.comboText.anchor.set(1, 0);
    this.comboText.visible = false;
    this.container.addChild(this.comboText);

    // Mini-map
    this.miniMapBg.roundRect(0, 0, 30, 80, 3);
    this.miniMapBg.fill({ color: 0x000000, alpha: 0.25 });
    this.miniMapContainer.x = GAME_WIDTH - 35;
    this.miniMapContainer.y = 55;
    this.miniMapContainer.addChild(this.miniMapBg);
    this.container.addChild(this.miniMapContainer);
  }

  /** Set pause callback. */
  set onPause(fn: () => void) { this._onPause = fn; }

  /** Update all HUD elements from game state. */
  update(state: GameWorldState, elapsedSeconds: number): void {
    // Timer
    const m = Math.floor(elapsedSeconds / 60);
    const s = elapsedSeconds % 60;
    this.timerText.text = `${m}:${s.toString().padStart(2, "0")}`;

    // Height + score
    this.heightText.text = `H: ${state.scoreState.height}`;
    this.scoreText.text = `${state.scoreState.points}`;

    // Zone progress bar
    this.zoneBar.clear();
    const zone = state.zoneState.currentZone;
    const zp = this.getZoneProgress(state.platformsPassed, zone);
    const barTop = 36;
    if (zp < 1) {
      this.zoneBar.rect(0, barTop, GAME_WIDTH, 3);
      this.zoneBar.fill({ color: 0x333333, alpha: 0.3 });
      this.zoneBar.rect(0, barTop, GAME_WIDTH * zp, 3);
      this.zoneBar.fill({ color: 0xffdd44, alpha: 0.6 });
    }
    this.zoneLabel.text = ZONE_NAMES[zone] ?? `Zone ${zone + 1}`;
    this.zoneLabel.visible = true;

    // Active effect description
    if (state.activeEffect) {
      const info = POWER_UP_INFO[state.activeEffect.type];
      if (info) {
        this.effectDescText.text = info.shortDesc;
        this.effectDescText.style.fill = info.positive ? "#ffdd44" : "#ff4444";
        this.effectDescText.visible = true;
      }
    } else {
      this.effectDescText.visible = false;
    }

    // Combo display
    if (state.scoreState.comboMultiplier > 1) {
      this.comboText.text = `${state.scoreState.comboMultiplier}x`;
      const pulse = 1 + Math.sin(state.animTick * 0.15) * 0.15;
      this.comboText.scale.set(pulse);
      this.comboText.visible = true;
    } else {
      this.comboText.visible = false;
    }

    // Mini-map — show nearby platforms as dots
    this.updateMiniMap(state);
  }

  private getZoneProgress(platformsPassed: number, zone: number): number {
    if (zone >= ZONE_THRESHOLDS.length - 1) return 1;
    const start = ZONE_THRESHOLDS[zone];
    const end = ZONE_THRESHOLDS[zone + 1];
    return Math.min(1, (platformsPassed - start) / (end - start));
  }

  private updateMiniMap(state: GameWorldState): void {
    // Remove old dots
    for (const dot of this.miniMapDots) {
      this.miniMapContainer.removeChild(dot);
      dot.destroy();
    }
    this.miniMapDots = [];

    const camY = state.camera.y;
    const viewRange = GAME_HEIGHT * 3; // show 3 screens of platforms

    for (const p of state.platforms) {
      if (p.broken) continue;
      const relY = (p.y - camY) / viewRange;
      if (relY < -0.1 || relY > 1.1) continue;

      const dot = new Graphics();
      const dotX = (p.x / GAME_WIDTH) * 28 + 1;
      const dotY = relY * 78 + 1;
      dot.rect(dotX, dotY, 3, 1);
      dot.fill({ color: 0xffffff, alpha: 0.5 });
      this.miniMapContainer.addChild(dot);
      this.miniMapDots.push(dot);
    }

    // Player position dot
    const playerDot = new Graphics();
    const playerRelY = (state.player.y - camY) / viewRange;
    const playerDotX = (state.player.x / GAME_WIDTH) * 28 + 1;
    playerDot.circle(playerDotX, playerRelY * 78 + 1, 2);
    playerDot.fill(0xff4444);
    this.miniMapContainer.addChild(playerDot);
    this.miniMapDots.push(playerDot);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
