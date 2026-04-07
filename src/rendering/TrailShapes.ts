/** Trail shape drawing helpers — individual trail effect renderers. */

import { Graphics } from "pixi.js";

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

const MAX_AGE = 30;

/** Heart: float upward, dissolve into sub-particles. */
export function drawHeart(
  gfx: Graphics,
  p: TrailPoint,
  hash: number,
  t: number,
  alpha: number,
  c: number,
  camY: number,
): void {
  const s = 2 + t * 6;
  const drift = -p.age * 0.4;
  const wobble = Math.sin(p.age * 0.12 + p.y * 0.05) * 3;
  gfx.x = p.x + hash + wobble;
  gfx.y = p.y - camY + drift;
  gfx.circle(-s * 0.3, -s * 0.2, s * 0.5);
  gfx.fill({ color: c, alpha: alpha * 0.7 });
  gfx.circle(s * 0.3, -s * 0.2, s * 0.5);
  gfx.fill({ color: c, alpha: alpha * 0.7 });
  gfx.moveTo(0, s * 0.5);
  gfx.lineTo(-s * 0.6, -s * 0.1);
  gfx.lineTo(s * 0.6, -s * 0.1);
  gfx.closePath();
  gfx.fill({ color: c, alpha: alpha * 0.7 });
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

/** Star: bright flash on spawn, rotating, twinkling. */
export function drawStar(
  gfx: Graphics,
  p: TrailPoint,
  hash: number,
  t: number,
  alpha: number,
  c: number,
  camY: number,
): void {
  const s = 2 + t * 6;
  gfx.x = p.x + hash;
  gfx.y = p.y - camY;
  const rot = p.age * 0.08;
  const flashAlpha = p.age < 4 ? alpha * 1.0 : alpha * 0.7;
  const flashSize = p.age < 4 ? s * 1.4 : s;
  gfx.moveTo(Math.sin(rot) * flashSize, -Math.cos(rot) * flashSize);
  for (let a = 1; a < 8; a++) {
    const r = a % 2 === 0 ? flashSize : flashSize * 0.35;
    const angle = rot + (a / 8) * Math.PI * 2;
    gfx.lineTo(Math.sin(angle) * r, -Math.cos(angle) * r);
  }
  gfx.closePath();
  gfx.fill({ color: c, alpha: flashAlpha });
  const twinkle = 0.3 + Math.sin(p.age * 0.3 + p.y * 0.1) * 0.3;
  gfx.circle(0, 0, s * 0.3);
  gfx.fill({ color: 0xffffff, alpha: alpha * twinkle });
}

/** Snow: gentle drift, varied size, some linger longer. */
export function drawSnowflake(
  gfx: Graphics,
  p: TrailPoint,
  hash: number,
  t: number,
  alpha: number,
  c: number,
  camY: number,
): void {
  const sizeVar = 0.7 + Math.sin(p.y * 0.3) * 0.3;
  const s = (2 + t * 5) * sizeVar;
  const drift = Math.sin(p.age * 0.06 + p.y * 0.05) * 5;
  const fallDrift = p.age * 0.3;
  gfx.x = p.x + hash + drift;
  gfx.y = p.y - camY + fallDrift;
  for (let a = 0; a < 6; a++) {
    const angle = (a / 6) * Math.PI * 2;
    gfx.moveTo(0, 0);
    gfx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
    gfx.stroke({ width: 1.2, color: c, alpha: alpha * 0.7 });
    if (s > 4) {
      const bx = Math.cos(angle) * s * 0.6,
        by = Math.sin(angle) * s * 0.6;
      const ba = angle + 0.5;
      gfx.moveTo(bx, by);
      gfx.lineTo(bx + Math.cos(ba) * s * 0.3, by + Math.sin(ba) * s * 0.3);
      gfx.stroke({ width: 0.8, color: c, alpha: alpha * 0.5 });
    }
  }
  gfx.circle(0, 0, s * 0.35);
  gfx.fill({ color: 0xffffff, alpha: alpha * 0.35 });
}

/** Fire: rise upward, flicker in size, warm glow layers. */
export function drawFire(
  gfx: Graphics,
  p: TrailPoint,
  hash: number,
  t: number,
  alpha: number,
  c: number,
  camY: number,
): void {
  const rise = -p.age * 0.6;
  const flicker = 1 + Math.sin(p.age * 0.5 + p.y * 0.2) * 0.3;
  const size = (2 + t * 6) * flicker;
  const sway = Math.sin(p.age * 0.15 + p.x * 0.1) * 3;
  gfx.x = p.x + hash + sway;
  gfx.y = p.y - camY + rise;
  gfx.circle(0, 0, size + 5);
  gfx.fill({ color: 0xff2200, alpha: alpha * 0.06 });
  gfx.circle(0, 0, size + 3);
  gfx.fill({ color: 0xff4400, alpha: alpha * 0.1 });
  gfx.circle(0, 0, size + 1);
  gfx.fill({ color: c, alpha: alpha * 0.2 });
  const coreColor = t > 0.5 ? 0xffcc00 : 0xff6600;
  gfx.circle(0, 0, size * 0.7);
  gfx.fill({ color: coreColor, alpha: alpha * 0.6 });
  if (p.age % 3 === 0 && t > 0.2) {
    const sparkY = rise * 1.3;
    gfx.circle(sway * 0.5, sparkY * 0.3 - size, 1);
    gfx.fill({ color: 0xffee44, alpha: alpha * 0.8 });
  }
}

/** Neon: electric pulse, alpha oscillation, jitter. */
export function drawNeon(
  gfx: Graphics,
  p: TrailPoint,
  hash: number,
  t: number,
  alpha: number,
  c: number,
  camY: number,
  neonColors: number[],
): void {
  const jitter = (Math.random() - 0.5) * 2;
  const size = 2 + t * 5;
  const pulse = 0.5 + Math.sin(p.age * 0.4 + p.y * 0.1) * 0.5;
  gfx.x = p.x + hash + jitter;
  gfx.y = p.y - camY + jitter * 0.5;
  gfx.circle(0, 0, size + 6);
  gfx.fill({ color: c, alpha: alpha * 0.04 * pulse });
  gfx.circle(0, 0, size + 3);
  gfx.fill({ color: c, alpha: alpha * 0.12 * pulse });
  const ci = Math.floor(p.age * 0.15) % neonColors.length;
  gfx.circle(0, 0, size);
  gfx.fill({ color: neonColors[ci], alpha: alpha * 0.7 * pulse });
  if (t > 0.3) {
    const lineLen = size * 1.5;
    const la = p.age * 0.3;
    gfx.moveTo(0, 0);
    gfx.lineTo(Math.cos(la) * lineLen + jitter, Math.sin(la) * lineLen);
    gfx.stroke({ width: 1, color: c, alpha: alpha * 0.4 * pulse });
  }
}

/** Sparkle: twinkling with size alternation. */
export function drawSparkle(
  gfx: Graphics,
  p: TrailPoint,
  hash: number,
  t: number,
  alpha: number,
  c: number,
  camY: number,
): void {
  const size = 2 + t * 5;
  gfx.x = p.x + hash;
  gfx.y = p.y - camY;
  const twinkle = 0.4 + Math.sin(p.age * 0.6 + p.y * 0.15) * 0.4;
  const sizeAlt = size * (0.8 + Math.sin(p.age * 0.5) * 0.2);
  gfx.circle(0, 0, sizeAlt + 4);
  gfx.fill({ color: c, alpha: alpha * 0.06 * twinkle });
  gfx.circle(0, 0, sizeAlt + 2);
  gfx.fill({ color: c, alpha: alpha * 0.12 * twinkle });
  gfx.circle(0, 0, sizeAlt);
  gfx.fill({ color: c, alpha: alpha * 0.6 * twinkle });
  if (t > 0.5) {
    const lineSize = sizeAlt * 0.8;
    gfx.moveTo(-lineSize, 0);
    gfx.lineTo(lineSize, 0);
    gfx.moveTo(0, -lineSize);
    gfx.lineTo(0, lineSize);
    gfx.stroke({ width: 0.8, color: 0xffffff, alpha: alpha * 0.3 * twinkle });
  }
}
