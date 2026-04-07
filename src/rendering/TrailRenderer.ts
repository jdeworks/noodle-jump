/** Trail rendering for equipped cosmetic trails. */

import { Container, Graphics } from "pixi.js";
import { drawHeart, drawStar, drawSnowflake, drawFire, drawNeon, drawSparkle } from "./TrailShapes";

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

const MAX_TRAIL_LENGTH = 28;
const MAX_AGE = 30;
const RAINBOW_MAX = 80;
const RAINBOW_SKIP = 2;

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

const RAINBOW_TRAILS = new Set(["trail_rainbow"]);
const SHAPE_TRAILS: Record<string, string> = {
  trail_hearts: "heart",
  trail_stars: "star",
  trail_snow: "snowflake",
};

export class TrailRenderer {
  readonly container = new Container();
  private points: TrailPoint[] = [];
  private pool: Graphics[] = [];
  private activeCount = 0;
  private trailType: string | null = null;
  private ribbonGfx: Graphics | null = null;

  setTrailType(type: string | null): void {
    if (type === "trail_none" || type === null) {
      this.trailType = null;
      this.clear();
      return;
    }
    this.trailType = type;
  }

  private frameCount = 0;
  addPoint(x: number, y: number): void {
    if (!this.trailType) return;
    this.frameCount++;
    if (RAINBOW_TRAILS.has(this.trailType) && this.frameCount % RAINBOW_SKIP !== 0) return;
    this.points.push({ x, y, age: 0 });
    const cap = RAINBOW_TRAILS.has(this.trailType) ? RAINBOW_MAX : MAX_TRAIL_LENGTH;
    while (this.points.length > cap) this.points.shift();
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
    if (this.ribbonGfx) {
      this.ribbonGfx.clear();
      this.ribbonGfx.visible = false;
    }
    if (!this.trailType || this.points.length === 0) return;

    const isRainbow = RAINBOW_TRAILS.has(this.trailType);
    if (isRainbow) {
      this.updateRainbow(camY);
      return;
    }

    const colors = TRAIL_COLORS[this.trailType] ?? [0xffffff];
    const shape = SHAPE_TRAILS[this.trailType];

    let len = this.points.length;
    for (let i = len - 1; i >= 0; i--) {
      this.points[i].age++;
      if (this.points[i].age > MAX_AGE) {
        this.points[i] = this.points[len - 1];
        len--;
      }
    }
    if (len < this.points.length) this.points.length = len;

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const alpha = 1 - p.age / MAX_AGE;
      const gfx = this.getFromPool(i);
      gfx.clear();
      const hash = Math.sin(p.y * 0.37 + p.x * 0.13) * 16;
      const t = 1 - p.age / MAX_AGE;
      const c = colors[Math.abs(Math.floor(p.y * 0.7)) % colors.length];

      if (shape === "heart") {
        drawHeart(gfx, p, hash, t, alpha, c, camY);
      } else if (shape === "star") {
        drawStar(gfx, p, hash, t, alpha, c, camY);
      } else if (shape === "snowflake") {
        drawSnowflake(gfx, p, hash, t, alpha, c, camY);
      } else if (this.trailType === "trail_fire") {
        drawFire(gfx, p, hash, t, alpha, c, camY);
      } else if (this.trailType === "trail_neon") {
        drawNeon(gfx, p, hash, t, alpha, c, camY, TRAIL_COLORS.trail_neon);
      } else {
        drawSparkle(gfx, p, hash, t, alpha, c, camY);
      }
      gfx.visible = true;
    }
    this.activeCount = this.points.length;
  }

  /** Nyan Cat rainbow — smooth curved color bands in chronological order. */
  private updateRainbow(camY: number): void {
    if (!this.ribbonGfx) {
      this.ribbonGfx = new Graphics();
      this.container.addChild(this.ribbonGfx);
    }
    const gfx = this.ribbonGfx;
    gfx.clear();
    gfx.visible = true;

    const colors = TRAIL_COLORS.trail_rainbow;
    const charW = 32;
    const bandW = charW / colors.length;

    for (const p of this.points) p.age++;
    while (this.points.length > 0 && this.points[0].age > RAINBOW_MAX) this.points.shift();

    const visible: TrailPoint[] = [];
    for (const p of this.points) {
      const sy = p.y - camY;
      if (sy > -10 && sy < 760) visible.push(p);
    }

    for (let i = 0; i < visible.length - 1; i++) {
      const cur = visible[i];
      const nxt = visible[i + 1];
      const sy1 = cur.y - camY;
      const sy2 = nxt.y - camY;
      const alpha = Math.max(0, 0.8 * (1 - cur.age / RAINBOW_MAX));
      if (alpha < 0.01) continue;
      const midX = (cur.x + nxt.x) / 2;
      const midY = (sy1 + sy2) / 2;
      for (let s = 0; s < colors.length; s++) {
        const off = (s - colors.length / 2) * bandW;
        gfx.moveTo(cur.x + off, sy1);
        gfx.quadraticCurveTo(midX + off, midY, nxt.x + off, sy2);
        gfx.lineTo(nxt.x + off + bandW, sy2);
        gfx.quadraticCurveTo(midX + off + bandW, midY, cur.x + off + bandW, sy1);
        gfx.closePath();
        gfx.fill({ color: colors[s], alpha });
      }
      if (i % 5 === 0 && alpha > 0.15) {
        const sx = midX + Math.sin(cur.y * 0.17) * charW * 0.5;
        const ss = 3 + Math.sin(cur.age * 0.2) * 1.5;
        gfx.moveTo(sx, midY - ss);
        gfx.lineTo(sx, midY + ss);
        gfx.moveTo(sx - ss, midY);
        gfx.lineTo(sx + ss, midY);
        gfx.stroke({ width: 1.5, color: 0xffffff, alpha: alpha * 0.6 });
      }
    }
  }

  clear(): void {
    this.points = [];
    for (let i = 0; i < this.activeCount; i++) this.pool[i].visible = false;
    this.activeCount = 0;
    if (this.ribbonGfx) {
      this.ribbonGfx.clear();
      this.ribbonGfx.visible = false;
    }
  }

  destroy(): void {
    this.clear();
    for (const gfx of this.pool) gfx.destroy();
    this.pool = [];
    if (this.ribbonGfx) {
      this.ribbonGfx.destroy();
      this.ribbonGfx = null;
    }
    this.container.destroy({ children: true });
  }
}
