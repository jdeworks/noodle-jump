/** Trail rendering for equipped cosmetic trails. */

import { Container, Graphics } from "pixi.js";

interface TrailPoint { x: number; y: number; age: number }

const MAX_TRAIL_LENGTH = 14;
const MAX_AGE = 18;
const RAINBOW_MAX = 90; // ~1.5 seconds, doesn't block the view

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
      gfx.clear();
      // Fixed spread per point — stays where spawned, doesn't drift
      const hash = Math.sin(p.y * 0.37 + p.x * 0.13) * 16;
      gfx.x = p.x + hash; gfx.y = p.y - camY;
      const t = 1 - p.age / MAX_AGE; // 1 at spawn, 0 at death
      const c = colors[Math.abs(Math.floor(p.y * 0.7)) % colors.length];

      if (shape === "heart") {
        // Spawn full size, shrink as they fade
        const s = 2 + t * 5;
        gfx.circle(-s * 0.3, -s * 0.2, s * 0.5); gfx.fill({ color: c, alpha: alpha * 0.7 });
        gfx.circle(s * 0.3, -s * 0.2, s * 0.5); gfx.fill({ color: c, alpha: alpha * 0.7 });
        gfx.moveTo(0, s * 0.5); gfx.lineTo(-s * 0.6, -s * 0.1);
        gfx.lineTo(s * 0.6, -s * 0.1); gfx.closePath(); gfx.fill({ color: c, alpha: alpha * 0.7 });
      } else if (shape === "star") {
        const s = 2 + t * 5;
        const rot = p.age * 0.05; // slow spin
        gfx.moveTo(Math.sin(rot) * s, -Math.cos(rot) * s);
        for (let a = 1; a < 8; a++) {
          const r = a % 2 === 0 ? s : s * 0.4;
          const angle = rot + (a / 8) * Math.PI * 2;
          gfx.lineTo(Math.sin(angle) * r, -Math.cos(angle) * r);
        }
        gfx.closePath(); gfx.fill({ color: c, alpha: alpha * 0.7 });
      } else if (shape === "snowflake") {
        const s = 2 + t * 5;
        const drift = Math.sin(p.age * 0.08 + p.y * 0.05) * 3; // gentle side drift
        gfx.x += drift;
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2;
          gfx.moveTo(0, 0); gfx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
          gfx.stroke({ width: 1.2, color: c, alpha: alpha * 0.7 });
        }
        gfx.circle(0, 0, s * 0.3); gfx.fill({ color: 0xffffff, alpha: alpha * 0.3 });
      } else {
        // Fire/sparkle/neon: glow particles that spawn and fade in place
        const size = 2 + t * 5;
        if (this.trailType === "trail_fire" || this.trailType === "trail_sparkle" || this.trailType === "trail_neon") {
          gfx.circle(0, 0, size + 4); gfx.fill({ color: c, alpha: alpha * 0.08 });
          gfx.circle(0, 0, size + 2); gfx.fill({ color: c, alpha: alpha * 0.15 });
        }
        gfx.circle(0, 0, size); gfx.fill({ color: c, alpha: alpha * 0.6 });
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
    gfx.clear(); gfx.visible = true;

    const colors = TRAIL_COLORS.trail_rainbow;
    const charW = 32;
    const bandW = charW / colors.length;

    // Age and prune from front (oldest first — preserves chronological order)
    for (const p of this.points) p.age++;
    while (this.points.length > 0 && this.points[0].age > RAINBOW_MAX) this.points.shift();

    // Filter to on-screen points (keep order)
    const visible: TrailPoint[] = [];
    for (const p of this.points) {
      const sy = p.y - camY;
      if (sy > -10 && sy < 760) visible.push(p);
    }

    // Draw curved bands between consecutive chronological points
    for (let i = 0; i < visible.length - 1; i++) {
      const cur = visible[i]; // older
      const nxt = visible[i + 1]; // newer (higher on screen)
      const sy1 = cur.y - camY;
      const sy2 = nxt.y - camY;
      const alpha = Math.max(0, 0.85 * (1 - cur.age / RAINBOW_MAX));
      if (alpha < 0.01) continue;
      // Smooth control point: average X at midpoint Y
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
      // Sparkle stars
      if (i % 8 === 0 && alpha > 0.2) {
        const sx = midX + Math.sin(cur.y * 0.17) * charW * 0.6;
        const ss = 3 + Math.sin(cur.age * 0.2) * 1.5;
        const sa = alpha * (0.5 + Math.sin(cur.age * 0.3) * 0.4);
        gfx.moveTo(sx, midY - ss); gfx.lineTo(sx + ss * 0.3, midY - ss * 0.3);
        gfx.lineTo(sx + ss, midY); gfx.lineTo(sx + ss * 0.3, midY + ss * 0.3);
        gfx.lineTo(sx, midY + ss); gfx.lineTo(sx - ss * 0.3, midY + ss * 0.3);
        gfx.lineTo(sx - ss, midY); gfx.lineTo(sx - ss * 0.3, midY - ss * 0.3);
        gfx.closePath(); gfx.fill({ color: 0xffffff, alpha: sa });
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
