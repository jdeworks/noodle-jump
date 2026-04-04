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
  trail_stars: [0xffffcc, 0xffff88, 0xffffff],
  trail_hearts: [0xff6688, 0xff99bb, 0xffccdd],
  trail_snow: [0xccddff, 0xeeeeff, 0xffffff],
  trail_neon: [0x00ffff, 0xff00ff, 0x00ff88],
  speed_rocket: [0xff4400, 0xff8800, 0xffcc00],
  speed_tornado: [0xffcc33, 0xffee88, 0xffffff],
  speed_sneeze: [0xffff44, 0xffdd00, 0xffffff],
};

export class TrailRenderer {
  readonly container = new Container();
  private points: TrailPoint[] = [];
  private pool: Graphics[] = [];
  private activeCount = 0;
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

  private getFromPool(index: number): Graphics {
    if (index < this.pool.length) return this.pool[index];
    const gfx = new Graphics();
    this.container.addChild(gfx);
    this.pool.push(gfx);
    return gfx;
  }

  update(camY: number): void {
    // Hide all previously active graphics
    for (let i = 0; i < this.activeCount; i++) {
      this.pool[i].visible = false;
    }
    this.activeCount = 0;

    if (!this.trailType || this.points.length === 0) return;

    const colors = TRAIL_COLORS[this.trailType] ?? [0xffffff];

    // Age and prune — iterate backward, swap-and-pop for removal
    let len = this.points.length;
    for (let i = len - 1; i >= 0; i--) {
      this.points[i].age++;
      if (this.points[i].age > MAX_AGE) {
        this.points[i] = this.points[len - 1];
        len--;
      }
    }
    if (len < this.points.length) this.points.length = len;

    // Render trail points using pooled graphics
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const alpha = 1 - p.age / MAX_AGE;
      const size = 2 + (1 - p.age / MAX_AGE) * 2;
      const color = colors[i % colors.length];

      const gfx = this.getFromPool(i);
      gfx.clear();
      gfx.circle(0, 0, size);
      gfx.fill({ color, alpha: alpha * 0.6 });
      gfx.x = p.x;
      gfx.y = p.y - camY;
      gfx.visible = true;
    }
    this.activeCount = this.points.length;
  }

  clear(): void {
    this.points = [];
    for (let i = 0; i < this.activeCount; i++) {
      this.pool[i].visible = false;
    }
    this.activeCount = 0;
  }

  destroy(): void {
    this.clear();
    for (const gfx of this.pool) gfx.destroy();
    this.pool = [];
    this.container.destroy({ children: true });
  }
}
