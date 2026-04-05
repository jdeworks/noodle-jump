/** Trail rendering for equipped cosmetic trails. */

import { Container, Graphics } from "pixi.js";

interface TrailPoint { x: number; y: number; age: number }

const MAX_TRAIL_LENGTH = 28;
const MAX_AGE = 30;
const RAINBOW_MAX = 80; // ~1.3 second fade
const RAINBOW_SKIP = 2; // record every 2nd frame — smoother curves

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

  private frameCount = 0;
  addPoint(x: number, y: number): void {
    if (!this.trailType) return;
    this.frameCount++;
    // Rainbow: skip frames to reduce point count (and draw calls)
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
      const hash = Math.sin(p.y * 0.37 + p.x * 0.13) * 16;
      const t = 1 - p.age / MAX_AGE; // 1 at spawn, 0 at death
      const c = colors[Math.abs(Math.floor(p.y * 0.7)) % colors.length];

      if (shape === "heart") {
        this.drawHeart(gfx, p, hash, t, alpha, c, camY);
      } else if (shape === "star") {
        this.drawStar(gfx, p, hash, t, alpha, c, camY);
      } else if (shape === "snowflake") {
        this.drawSnowflake(gfx, p, hash, t, alpha, c, camY);
      } else if (this.trailType === "trail_fire") {
        this.drawFire(gfx, p, hash, t, alpha, c, camY);
      } else if (this.trailType === "trail_neon") {
        this.drawNeon(gfx, p, hash, t, alpha, c, camY);
      } else {
        this.drawSparkle(gfx, p, hash, t, alpha, c, camY);
      }
      gfx.visible = true;
    }
    this.activeCount = this.points.length;
  }

  // ── Heart: float upward, dissolve into sub-particles ──────────────────
  private drawHeart(gfx: Graphics, p: TrailPoint, hash: number, t: number, alpha: number, c: number, camY: number): void {
    const s = 2 + t * 6;
    const drift = -p.age * 0.4; // float upward
    const wobble = Math.sin(p.age * 0.12 + p.y * 0.05) * 3;
    gfx.x = p.x + hash + wobble; gfx.y = p.y - camY + drift;
    gfx.circle(-s * 0.3, -s * 0.2, s * 0.5); gfx.fill({ color: c, alpha: alpha * 0.7 });
    gfx.circle(s * 0.3, -s * 0.2, s * 0.5); gfx.fill({ color: c, alpha: alpha * 0.7 });
    gfx.moveTo(0, s * 0.5); gfx.lineTo(-s * 0.6, -s * 0.1);
    gfx.lineTo(s * 0.6, -s * 0.1); gfx.closePath(); gfx.fill({ color: c, alpha: alpha * 0.7 });
    // Dissolving sub-particles
    if (p.age > MAX_AGE * 0.4) {
      const subA = alpha * 0.5;
      for (let j = 0; j < 3; j++) {
        const a = (j / 3) * Math.PI * 2 + p.age * 0.2;
        const r = s * 0.6 + p.age * 0.15;
        gfx.circle(Math.cos(a) * r, Math.sin(a) * r, 1.2);
        gfx.fill({ color: c, alpha: subA });
      }
    }
  }

  // ── Star: bright flash on spawn, rotating, twinkling ──────────────────
  private drawStar(gfx: Graphics, p: TrailPoint, hash: number, t: number, alpha: number, c: number, camY: number): void {
    const s = 2 + t * 6;
    gfx.x = p.x + hash; gfx.y = p.y - camY;
    const rot = p.age * 0.08; // faster spin
    // Spawn flash — extra bright and large for first few frames
    const flashAlpha = p.age < 4 ? alpha * 1.0 : alpha * 0.7;
    const flashSize = p.age < 4 ? s * 1.4 : s;
    gfx.moveTo(Math.sin(rot) * flashSize, -Math.cos(rot) * flashSize);
    for (let a = 1; a < 8; a++) {
      const r = a % 2 === 0 ? flashSize : flashSize * 0.35;
      const angle = rot + (a / 8) * Math.PI * 2;
      gfx.lineTo(Math.sin(angle) * r, -Math.cos(angle) * r);
    }
    gfx.closePath(); gfx.fill({ color: c, alpha: flashAlpha });
    // Twinkle: pulsing inner glow
    const twinkle = 0.3 + Math.sin(p.age * 0.3 + p.y * 0.1) * 0.3;
    gfx.circle(0, 0, s * 0.3); gfx.fill({ color: 0xffffff, alpha: alpha * twinkle });
  }

  // ── Snow: gentle drift, varied size, some linger longer ───────────────
  private drawSnowflake(gfx: Graphics, p: TrailPoint, hash: number, t: number, alpha: number, c: number, camY: number): void {
    const sizeVar = 0.7 + Math.sin(p.y * 0.3) * 0.3; // varied sizes
    const s = (2 + t * 5) * sizeVar;
    const drift = Math.sin(p.age * 0.06 + p.y * 0.05) * 5; // wider gentle side drift
    const fallDrift = p.age * 0.3; // gentle downward fall
    gfx.x = p.x + hash + drift; gfx.y = p.y - camY + fallDrift;
    // 6-pointed snowflake arms
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2;
      gfx.moveTo(0, 0); gfx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
      gfx.stroke({ width: 1.2, color: c, alpha: alpha * 0.7 });
      // Branch details on larger snowflakes
      if (s > 4) {
        const bx = Math.cos(angle) * s * 0.6, by = Math.sin(angle) * s * 0.6;
        const ba = angle + 0.5;
        gfx.moveTo(bx, by); gfx.lineTo(bx + Math.cos(ba) * s * 0.3, by + Math.sin(ba) * s * 0.3);
        gfx.stroke({ width: 0.8, color: c, alpha: alpha * 0.5 });
      }
    }
    gfx.circle(0, 0, s * 0.35); gfx.fill({ color: 0xffffff, alpha: alpha * 0.35 });
  }

  // ── Fire: rise upward, flicker in size, warm glow layers ──────────────
  private drawFire(gfx: Graphics, p: TrailPoint, hash: number, t: number, alpha: number, c: number, camY: number): void {
    const rise = -p.age * 0.6; // flames rise up
    const flicker = 1 + Math.sin(p.age * 0.5 + p.y * 0.2) * 0.3;
    const size = (2 + t * 6) * flicker;
    const sway = Math.sin(p.age * 0.15 + p.x * 0.1) * 3; // gentle sway
    gfx.x = p.x + hash + sway; gfx.y = p.y - camY + rise;
    // Multi-layer warm glow
    gfx.circle(0, 0, size + 5); gfx.fill({ color: 0xff2200, alpha: alpha * 0.06 });
    gfx.circle(0, 0, size + 3); gfx.fill({ color: 0xff4400, alpha: alpha * 0.1 });
    gfx.circle(0, 0, size + 1); gfx.fill({ color: c, alpha: alpha * 0.2 });
    // Bright core — shifts from yellow to red as it ages
    const coreColor = t > 0.5 ? 0xffcc00 : 0xff6600;
    gfx.circle(0, 0, size * 0.7); gfx.fill({ color: coreColor, alpha: alpha * 0.6 });
    // Sparks — tiny bright dots rising faster
    if (p.age % 3 === 0 && t > 0.2) {
      const sparkY = rise * 1.3;
      gfx.circle(sway * 0.5, sparkY * 0.3 - size, 1); gfx.fill({ color: 0xffee44, alpha: alpha * 0.8 });
    }
  }

  // ── Neon: electric pulse, alpha oscillation, jitter ───────────────────
  private drawNeon(gfx: Graphics, p: TrailPoint, hash: number, t: number, alpha: number, c: number, camY: number): void {
    const jitter = (Math.random() - 0.5) * 2; // electric jitter
    const size = 2 + t * 5;
    const pulse = 0.5 + Math.sin(p.age * 0.4 + p.y * 0.1) * 0.5; // rapid alpha pulse
    gfx.x = p.x + hash + jitter; gfx.y = p.y - camY + jitter * 0.5;
    // Wide outer glow
    gfx.circle(0, 0, size + 6); gfx.fill({ color: c, alpha: alpha * 0.04 * pulse });
    gfx.circle(0, 0, size + 3); gfx.fill({ color: c, alpha: alpha * 0.12 * pulse });
    // Core with color cycling
    const colors = TRAIL_COLORS.trail_neon;
    const ci = Math.floor(p.age * 0.15) % colors.length;
    gfx.circle(0, 0, size); gfx.fill({ color: colors[ci], alpha: alpha * 0.7 * pulse });
    // Electric line to next point
    if (t > 0.3) {
      const lineLen = size * 1.5;
      const la = p.age * 0.3;
      gfx.moveTo(0, 0);
      gfx.lineTo(Math.cos(la) * lineLen + jitter, Math.sin(la) * lineLen);
      gfx.stroke({ width: 1, color: c, alpha: alpha * 0.4 * pulse });
    }
  }

  // ── Sparkle: twinkling with size alternation ──────────────────────────
  private drawSparkle(gfx: Graphics, p: TrailPoint, hash: number, t: number, alpha: number, c: number, camY: number): void {
    const size = 2 + t * 5;
    gfx.x = p.x + hash; gfx.y = p.y - camY;
    // Twinkle — rapid alpha oscillation (stars twinkling)
    const twinkle = 0.4 + Math.sin(p.age * 0.6 + p.y * 0.15) * 0.4;
    const sizeAlt = size * (0.8 + Math.sin(p.age * 0.5) * 0.2); // size alternation
    // Outer glow
    gfx.circle(0, 0, sizeAlt + 4); gfx.fill({ color: c, alpha: alpha * 0.06 * twinkle });
    gfx.circle(0, 0, sizeAlt + 2); gfx.fill({ color: c, alpha: alpha * 0.12 * twinkle });
    // Core
    gfx.circle(0, 0, sizeAlt); gfx.fill({ color: c, alpha: alpha * 0.6 * twinkle });
    // Cross sparkle lines for extra shine
    if (t > 0.5) {
      const lineSize = sizeAlt * 0.8;
      gfx.moveTo(-lineSize, 0); gfx.lineTo(lineSize, 0);
      gfx.moveTo(0, -lineSize); gfx.lineTo(0, lineSize);
      gfx.stroke({ width: 0.8, color: 0xffffff, alpha: alpha * 0.3 * twinkle });
    }
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

    // Draw smooth curved bands between consecutive chronological points
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
      // Sparkle star every ~5th segment
      if (i % 5 === 0 && alpha > 0.15) {
        const sx = midX + Math.sin(cur.y * 0.17) * charW * 0.5;
        const ss = 3 + Math.sin(cur.age * 0.2) * 1.5;
        gfx.moveTo(sx, midY - ss); gfx.lineTo(sx, midY + ss);
        gfx.moveTo(sx - ss, midY); gfx.lineTo(sx + ss, midY);
        gfx.stroke({ width: 1.5, color: 0xffffff, alpha: alpha * 0.6 });
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
