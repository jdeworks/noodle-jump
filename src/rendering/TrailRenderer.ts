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

  /** Nyan Cat rainbow — independent color blocks at each position, tall enough to fill gaps. */
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

    // Sort by Y ascending (highest point first = newest at top)
    const sorted = this.points.filter((p) => {
      const sy = p.y - camY;
      return sy > -10 && sy < 760 && p.age < RAINBOW_MAX;
    }).sort((a, b) => a.y - b.y);

    // Draw each point as an independent block of vertical color bands.
    // Block height stretches to reach the next point below, eliminating gaps.
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const sy = p.y - camY;
      const alpha = Math.max(0, 0.85 * (1 - p.age / RAINBOW_MAX));
      if (alpha < 0.01) continue;
      // Height: distance to next point below (or minimum 4px for the last one)
      const nextY = i < sorted.length - 1 ? sorted[i + 1].y - camY : sy + 4;
      const blockH = Math.max(4, nextY - sy + 1);
      // Subtle jiggle
      const jig = Math.sin(p.y * 0.03) * 1.2;
      const left = p.x - charW / 2 + jig;
      for (let s = 0; s < colors.length; s++) {
        gfx.rect(left + s * bandW, sy, bandW, blockH);
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
