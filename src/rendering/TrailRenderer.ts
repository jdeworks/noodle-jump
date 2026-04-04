/** Trail rendering for equipped cosmetic trails. */

import { Container, Graphics } from "pixi.js";

interface TrailPoint { x: number; y: number; age: number }

const MAX_TRAIL_LENGTH = 14;
const MAX_AGE = 18;
const RAINBOW_MAX = 200; // rainbow points persist much longer

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
  trail_hearts: "heart", trail_stars: "star", trail_snow: "snowflake",
};

export class TrailRenderer {
  readonly container = new Container();
  private points: TrailPoint[] = [];
  private pool: Graphics[] = [];
  private activeCount = 0;
  private trailType: string | null = null;
  // Rainbow uses a single Graphics for the whole ribbon
  private ribbonGfx: Graphics | null = null;

  setTrailType(type: string | null): void {
    if (type === "trail_none" || type === null) {
      this.trailType = null; this.clear(); return;
    }
    this.trailType = type;
  }

  addPoint(x: number, y: number): void {
    if (!this.trailType) return;
    this.points.push({ x, y, age: 0 });
    const max = RAINBOW_TRAILS.has(this.trailType) ? RAINBOW_MAX : MAX_TRAIL_LENGTH;
    if (this.points.length > max) this.points.shift();
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
    if (this.ribbonGfx) { this.ribbonGfx.clear(); this.ribbonGfx.visible = false; }
    if (!this.trailType || this.points.length === 0) return;

    const isRainbow = RAINBOW_TRAILS.has(this.trailType);
    if (isRainbow) { this.updateRainbow(camY); return; }

    const colors = TRAIL_COLORS[this.trailType] ?? [0xffffff];
    const shape = SHAPE_TRAILS[this.trailType];

    // Age and prune
    let len = this.points.length;
    for (let i = len - 1; i >= 0; i--) {
      this.points[i].age++;
      if (this.points[i].age > MAX_AGE) { this.points[i] = this.points[len - 1]; len--; }
    }
    if (len < this.points.length) this.points.length = len;

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const alpha = 1 - p.age / MAX_AGE;
      const gfx = this.getFromPool(i);
      gfx.clear(); gfx.x = p.x; gfx.y = p.y - camY;

      if (shape === "heart") {
        const s = 2 + (1 - p.age / MAX_AGE) * 3;
        const c = colors[i % colors.length];
        gfx.circle(-s * 0.3, -s * 0.2, s * 0.5); gfx.fill({ color: c, alpha: alpha * 0.7 });
        gfx.circle(s * 0.3, -s * 0.2, s * 0.5); gfx.fill({ color: c, alpha: alpha * 0.7 });
        gfx.moveTo(0, s * 0.5); gfx.lineTo(-s * 0.6, -s * 0.1);
        gfx.lineTo(s * 0.6, -s * 0.1); gfx.closePath(); gfx.fill({ color: c, alpha: alpha * 0.7 });
      } else if (shape === "star") {
        const s = 2 + (1 - p.age / MAX_AGE) * 3;
        const c = colors[i % colors.length];
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
          gfx.moveTo(0, 0); gfx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
          gfx.stroke({ width: 1, color: c, alpha: alpha * 0.7 });
        }
        gfx.circle(0, 0, s * 0.3); gfx.fill({ color: c, alpha: alpha * 0.5 });
      } else {
        const size = 2 + (1 - p.age / MAX_AGE) * 3;
        const c = colors[i % colors.length];
        if (this.trailType === "trail_fire" || this.trailType === "trail_sparkle" || this.trailType === "trail_neon") {
          gfx.circle(0, 0, size + 3); gfx.fill({ color: c, alpha: alpha * 0.1 });
          gfx.circle(0, 0, size + 1); gfx.fill({ color: c, alpha: alpha * 0.15 });
        }
        gfx.circle(0, 0, size); gfx.fill({ color: c, alpha: alpha * 0.6 });
      }
      gfx.visible = true;
    }
    this.activeCount = this.points.length;
  }

  /** Nyan Cat style rainbow — connected left-to-right color bands with jiggle. */
  private updateRainbow(camY: number): void {
    if (!this.ribbonGfx) {
      this.ribbonGfx = new Graphics();
      this.container.addChild(this.ribbonGfx);
    }
    const gfx = this.ribbonGfx;
    gfx.clear(); gfx.visible = true;

    const colors = TRAIL_COLORS.trail_rainbow;
    const charW = 32;
    const bandW = charW / colors.length;

    // Age and prune
    let len = this.points.length;
    for (let i = len - 1; i >= 0; i--) {
      this.points[i].age++;
      if (this.points[i].age > RAINBOW_MAX) { this.points[i] = this.points[len - 1]; len--; }
    }
    if (len < this.points.length) this.points.length = len;

    // Sort by Y descending (bottom of screen first = oldest trail)
    const sorted = this.points.filter((p) => {
      const sy = p.y - camY;
      return sy > -10 && sy < 760 && p.age < RAINBOW_MAX;
    }).sort((a, b) => b.y - a.y);

    // Draw connected quads between consecutive points for each color band
    for (let i = 0; i < sorted.length - 1; i++) {
      const cur = sorted[i];
      const nxt = sorted[i + 1];
      const sy1 = cur.y - camY;
      const sy2 = nxt.y - camY;
      const alpha1 = Math.max(0, 0.85 * (1 - cur.age / RAINBOW_MAX));
      const alpha2 = Math.max(0, 0.85 * (1 - nxt.age / RAINBOW_MAX));
      const alpha = (alpha1 + alpha2) / 2;
      if (alpha < 0.01) continue;
      // Jiggle: slight horizontal wobble based on age
      const jig1 = Math.sin(cur.age * 0.3 + cur.y * 0.02) * 1.5;
      const jig2 = Math.sin(nxt.age * 0.3 + nxt.y * 0.02) * 1.5;
      // Center on character (p.x is left edge of character)
      const cx1 = cur.x + charW / 2 + jig1;
      const cx2 = nxt.x + charW / 2 + jig2;
      for (let s = 0; s < colors.length; s++) {
        const lOff = (s - colors.length / 2) * bandW;
        const rOff = lOff + bandW;
        gfx.moveTo(cx1 + lOff, sy1);
        gfx.lineTo(cx1 + rOff, sy1);
        gfx.lineTo(cx2 + rOff, sy2);
        gfx.lineTo(cx2 + lOff, sy2);
        gfx.closePath();
        gfx.fill({ color: colors[s], alpha });
      }
    }
  }

  clear(): void {
    this.points = [];
    for (let i = 0; i < this.activeCount; i++) this.pool[i].visible = false;
    this.activeCount = 0;
    if (this.ribbonGfx) { this.ribbonGfx.clear(); this.ribbonGfx.visible = false; }
  }

  destroy(): void {
    this.clear();
    for (const gfx of this.pool) gfx.destroy();
    this.pool = [];
    if (this.ribbonGfx) { this.ribbonGfx.destroy(); this.ribbonGfx = null; }
    this.container.destroy({ children: true });
  }
}
