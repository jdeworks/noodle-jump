/** Compact in-game leaderboard for multiplayer — shows live height rankings. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { getPeerColor } from "./PeerColors";

const MAX_VISIBLE = 8;
const UPDATE_MS = 500;
const ROW_H = 18;
const PAD_X = 8;
const PAD_Y = 4;
const WIDTH = 120;

interface LeaderboardEntry {
  peerId: string;
  label: string;
  height: number;
  dead: boolean;
  disconnected: boolean;
  isLocal: boolean;
  colorIndex: number;
}

export class LiveLeaderboard {
  readonly container = new Container();
  private entries = new Map<string, LeaderboardEntry>();
  private rows: Text[] = [];
  private dots: Graphics[] = [];
  private bg = new Graphics();
  private lastUpdate = 0;

  constructor() {
    this.container.x = 6;
    this.container.y = 40;
    this.container.alpha = 0.7;
    this.container.addChild(this.bg);
  }

  addPlayer(peerId: string, label: string, colorIndex: number, isLocal: boolean): void {
    this.entries.set(peerId, { peerId, label, height: 0, dead: false, disconnected: false, isLocal, colorIndex });
  }

  removePlayer(peerId: string): void {
    this.entries.delete(peerId);
  }

  updateHeight(peerId: string, height: number): void {
    const e = this.entries.get(peerId);
    if (e) e.height = height;
  }

  setDead(peerId: string, dead: boolean): void {
    const e = this.entries.get(peerId);
    if (e) e.dead = dead;
  }

  setDisconnected(peerId: string): void {
    const e = this.entries.get(peerId);
    if (e) { e.disconnected = true; e.dead = true; }
  }

  /** Call each frame; internally throttles to UPDATE_MS. */
  tick(): void {
    const now = performance.now();
    if (now - this.lastUpdate < UPDATE_MS) return;
    this.lastUpdate = now;
    this.render();
  }

  private render(): void {
    // Sort by height descending
    const sorted = [...this.entries.values()].sort((a, b) => b.height - a.height);
    const visible = sorted.slice(0, MAX_VISIBLE);

    // Ensure enough rows
    while (this.rows.length < visible.length) {
      const t = new Text({
        text: "",
        style: new TextStyle({
          fontFamily: "monospace", fontSize: 10, fill: "#ffffff",
          stroke: { color: "#000000", width: 1 },
        }),
      });
      t.x = PAD_X + 12;
      this.container.addChild(t);
      this.rows.push(t);

      const d = new Graphics();
      this.container.addChild(d);
      this.dots.push(d);
    }

    // Hide extra rows
    for (let i = visible.length; i < this.rows.length; i++) {
      this.rows[i].visible = false;
      this.dots[i].visible = false;
    }

    // Update visible rows
    for (let i = 0; i < visible.length; i++) {
      const e = visible[i];
      const y = PAD_Y + i * ROW_H;
      const row = this.rows[i];
      const dot = this.dots[i];

      row.visible = true;
      dot.visible = true;
      row.y = y;
      const suffix = e.disconnected ? " left" : e.dead ? " ✗" : "";
      row.text = `${i + 1}. ${e.label} ${e.height}m${suffix}`;
      row.style.fill = e.isLocal ? "#ffdd44" : "#ffffff";
      row.style.fontWeight = e.isLocal ? "bold" : "normal";

      dot.clear();
      dot.circle(PAD_X + 4, y + 5, 3);
      dot.fill(getPeerColor(e.colorIndex));
    }

    // Background
    const h = PAD_Y * 2 + visible.length * ROW_H;
    this.bg.clear();
    this.bg.roundRect(0, 0, WIDTH, h, 4);
    this.bg.fill({ color: 0x000000, alpha: 0.4 });
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
