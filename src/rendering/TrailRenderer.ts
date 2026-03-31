/** Trail rendering for equipped cosmetic trails. */

import { Container, Graphics } from "pixi.js";

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

const MAX_TRAIL_LENGTH = 12;
const MAX_AGE = 15;

const TRAIL_COLORS: Record<string, number[]> = {
  trail_sparkle: [0xffdd44, 0xffeeaa, 0xffffff],
  trail_fire: [0xff4400, 0xff8800, 0xffcc00],
  trail_rainbow: [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff],
  speed_rocket: [0xff4400, 0xff8800, 0xffcc00],
  speed_tornado: [0xffcc33, 0xffee88, 0xffffff],
  speed_sneeze: [0xffff44, 0xffdd00, 0xffffff],
};

export class TrailRenderer {
  readonly container = new Container();
  private points: TrailPoint[] = [];
  private graphics: Graphics[] = [];
  private trailType: string | null = null;

  setTrailType(type: string | null): void {
    if (type === "trail_none" || type === null) {
      this.trailType = null;
      this.clear();
      return;
    }
    this.trailType = type;
  }

  addPoint(x: number, y: number): void {
    if (!this.trailType) return;
    this.points.push({ x, y, age: 0 });
    if (this.points.length > MAX_TRAIL_LENGTH) {
      this.points.shift();
    }
  }

  update(camY: number): void {
    // Clean old graphics
    for (const gfx of this.graphics) {
      this.container.removeChild(gfx);
      gfx.destroy();
    }
    this.graphics = [];

    if (!this.trailType || this.points.length === 0) return;

    const colors = TRAIL_COLORS[this.trailType] ?? [0xffffff];

    // Age and prune
    for (let i = this.points.length - 1; i >= 0; i--) {
      this.points[i].age++;
      if (this.points[i].age > MAX_AGE) {
        this.points.splice(i, 1);
      }
    }

    // Render trail points
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const alpha = 1 - p.age / MAX_AGE;
      const size = 2 + (1 - p.age / MAX_AGE) * 2;
      const color = colors[i % colors.length];

      const gfx = new Graphics();
      gfx.circle(0, 0, size);
      gfx.fill({ color, alpha: alpha * 0.6 });
      gfx.x = p.x;
      gfx.y = p.y - camY;
      this.container.addChild(gfx);
      this.graphics.push(gfx);
    }
  }

  clear(): void {
    this.points = [];
    for (const gfx of this.graphics) {
      this.container.removeChild(gfx);
      gfx.destroy();
    }
    this.graphics = [];
  }

  destroy(): void {
    this.clear();
    this.container.destroy({ children: true });
  }
}
