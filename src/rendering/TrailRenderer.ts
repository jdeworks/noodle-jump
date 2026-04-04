/** Trail rendering for equipped cosmetic trails. */

import { Container, Graphics } from "pixi.js";

interface TrailPoint { x: number; y: number; age: number }

const MAX_TRAIL_LENGTH = 14;
const MAX_AGE = 18;

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

// Trails that render as horizontal bands instead of dots
const BAND_TRAILS = new Set(["trail_rainbow", "trail_neon"]);
// Trails that render as special shapes
const SHAPE_TRAILS: Record<string, string> = {
  trail_hearts: "heart", trail_stars: "star", trail_snow: "snowflake",
};

export class TrailRenderer {
  readonly container = new Container();
  private points: TrailPoint[] = [];
  private pool: Graphics[] = [];
  private activeCount = 0;
  private trailType: string | null = null;

  setTrailType(type: string | null): void {
    if (type === "trail_none" || type === null) {
      this.trailType = null; this.clear(); return;
    }
    this.trailType = type;
  }

  addPoint(x: number, y: number): void {
    if (!this.trailType) return;
    this.points.push({ x, y, age: 0 });
    if (this.points.length > MAX_TRAIL_LENGTH) this.points.shift();
  }

  private getFromPool(index: number): Graphics {
    if (index < this.pool.length) return this.pool[index];
    const gfx = new Graphics();
    this.container.addChild(gfx);
    this.pool.push(gfx);
    return gfx;
  }

  update(camY: number): void {
    for (let i = 0; i < this.activeCount; i++) this.pool[i].visible = false;
    this.activeCount = 0;
    if (!this.trailType || this.points.length === 0) return;

    const colors = TRAIL_COLORS[this.trailType] ?? [0xffffff];

    // Age and prune
    let len = this.points.length;
    for (let i = len - 1; i >= 0; i--) {
      this.points[i].age++;
      if (this.points[i].age > MAX_AGE) { this.points[i] = this.points[len - 1]; len--; }
    }
    if (len < this.points.length) this.points.length = len;

    const isBand = BAND_TRAILS.has(this.trailType);
    const shape = SHAPE_TRAILS[this.trailType];

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const alpha = 1 - p.age / MAX_AGE;
      const gfx = this.getFromPool(i);
      gfx.clear();
      gfx.x = p.x; gfx.y = p.y - camY;

      if (isBand) {
        // Horizontal rainbow/neon band — wider, stretches left-right
        const bandW = 20 + (1 - p.age / MAX_AGE) * 12;
        const bandH = 3 + (1 - p.age / MAX_AGE) * 3;
        const c = colors[i % colors.length];
        gfx.roundRect(-bandW / 2, -bandH / 2, bandW, bandH, 2);
        gfx.fill({ color: c, alpha: alpha * 0.7 });
        // Glow behind
        gfx.roundRect(-bandW / 2 - 2, -bandH / 2 - 1, bandW + 4, bandH + 2, 3);
        gfx.fill({ color: c, alpha: alpha * 0.15 });
      } else if (shape === "heart") {
        const s = 2 + (1 - p.age / MAX_AGE) * 3;
        const c = colors[i % colors.length];
        gfx.circle(-s * 0.3, -s * 0.2, s * 0.5); gfx.fill({ color: c, alpha: alpha * 0.7 });
        gfx.circle(s * 0.3, -s * 0.2, s * 0.5); gfx.fill({ color: c, alpha: alpha * 0.7 });
        gfx.moveTo(0, s * 0.5); gfx.lineTo(-s * 0.6, -s * 0.1);
        gfx.lineTo(s * 0.6, -s * 0.1); gfx.closePath(); gfx.fill({ color: c, alpha: alpha * 0.7 });
      } else if (shape === "star") {
        const s = 2 + (1 - p.age / MAX_AGE) * 3;
        const c = colors[i % colors.length];
        // 4-point star
        gfx.moveTo(0, -s); gfx.lineTo(s * 0.3, -s * 0.3); gfx.lineTo(s, 0);
        gfx.lineTo(s * 0.3, s * 0.3); gfx.lineTo(0, s);
        gfx.lineTo(-s * 0.3, s * 0.3); gfx.lineTo(-s, 0);
        gfx.lineTo(-s * 0.3, -s * 0.3); gfx.closePath();
        gfx.fill({ color: c, alpha: alpha * 0.7 });
      } else if (shape === "snowflake") {
        const s = 2 + (1 - p.age / MAX_AGE) * 2;
        const c = colors[i % colors.length];
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2;
          gfx.moveTo(0, 0);
          gfx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
          gfx.stroke({ width: 1, color: c, alpha: alpha * 0.7 });
        }
        gfx.circle(0, 0, s * 0.3); gfx.fill({ color: c, alpha: alpha * 0.5 });
      } else {
        // Default: circles with glow for fire/sparkle
        const size = 2 + (1 - p.age / MAX_AGE) * 3;
        const c = colors[i % colors.length];
        if (this.trailType === "trail_fire" || this.trailType === "trail_sparkle") {
          gfx.circle(0, 0, size + 2); gfx.fill({ color: c, alpha: alpha * 0.12 });
        }
        gfx.circle(0, 0, size); gfx.fill({ color: c, alpha: alpha * 0.6 });
      }
      gfx.visible = true;
    }
    this.activeCount = this.points.length;
  }

  clear(): void {
    this.points = [];
    for (let i = 0; i < this.activeCount; i++) this.pool[i].visible = false;
    this.activeCount = 0;
  }

  destroy(): void {
    this.clear();
    for (const gfx of this.pool) gfx.destroy();
    this.pool = [];
    this.container.destroy({ children: true });
  }
}
