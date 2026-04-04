/** Themed draw wrappers — reskin enemies, bosses, and platforms per visual theme. */

import { Graphics } from "pixi.js";
import { drawEnemy } from "./EnemySprites";
import { drawBoss } from "./BossSprites";
import { drawPlatform, type PlatformStyle } from "./PlatformSprites";

// ── Themed enemy drawing ──────────────────────────────────────────────

export function drawThemedEnemy(gfx: Graphics, width: number, type: string, theme: string): void {
  switch (theme) {
    case "theme_neon": return drawNeonEnemy(gfx, width, type);
    case "theme_pixel": return drawPixelEnemy(gfx, width, type);
    case "theme_candy": return drawCandyEnemy(gfx, width, type);
    case "theme_dark": return drawDarkEnemy(gfx, width, type);
    default: return drawEnemy(gfx, width, type);
  }
}

function drawNeonEnemy(gfx: Graphics, w: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number> = { rat: 0x00ffff, fish: 0x00ff88, alien: 0xff00ff };
  const c = colors[type] ?? 0x00ffff;
  // Neon glow body
  gfx.ellipse(w / 2, w / 2, w * 0.38, w * 0.28);
  gfx.fill({ color: c, alpha: 0.15 });
  gfx.ellipse(w / 2, w / 2, w * 0.38, w * 0.28);
  gfx.stroke({ width: 2, color: c, alpha: 0.9 });
  // Inner core
  gfx.ellipse(w / 2, w / 2, w * 0.2, w * 0.14);
  gfx.fill({ color: c, alpha: 0.3 });
  // Eyes
  gfx.circle(w * 0.6, w * 0.42, 2); gfx.fill(0xffffff);
  gfx.circle(w * 0.4, w * 0.42, 2); gfx.fill(0xffffff);
}

function drawPixelEnemy(gfx: Graphics, w: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number> = { rat: 0x888888, fish: 0x4488cc, alien: 0x88ff44 };
  const c = colors[type] ?? 0x888888;
  const px = Math.max(4, Math.floor(w / 6));
  // Pixelated body — grid of squares
  for (let x = 1; x < 5; x++) {
    for (let y = 1; y < 4; y++) {
      gfx.rect(x * px, y * px, px - 1, px - 1);
      gfx.fill(c);
    }
  }
  // Pixel eyes
  gfx.rect(3 * px, 1 * px, px - 1, px - 1); gfx.fill(0x111111);
  gfx.rect(1 * px, 1 * px, px - 1, px - 1); gfx.fill(0x111111);
}

function drawCandyEnemy(gfx: Graphics, w: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number[]> = {
    rat: [0xff88aa, 0xffaacc], fish: [0x88ccff, 0xaaddff], alien: [0xaaff88, 0xccffaa],
  };
  const [main, light] = colors[type] ?? [0xff88aa, 0xffaacc];
  // Round candy body
  gfx.circle(w / 2, w / 2, w * 0.35); gfx.fill(main);
  // Candy swirl
  gfx.circle(w / 2, w / 2, w * 0.35);
  gfx.stroke({ width: 2, color: light, alpha: 0.6 });
  // Candy dot eyes
  gfx.circle(w * 0.6, w * 0.4, 2.5); gfx.fill(0xffffff);
  gfx.circle(w * 0.4, w * 0.4, 2.5); gfx.fill(0xffffff);
  gfx.circle(w * 0.6, w * 0.4, 1); gfx.fill(0x111111);
  gfx.circle(w * 0.4, w * 0.4, 1); gfx.fill(0x111111);
}

function drawDarkEnemy(gfx: Graphics, w: number, _type: string): void {
  gfx.clear();
  // Shadowy blob
  gfx.ellipse(w / 2, w / 2 + 2, w * 0.4, w * 0.3);
  gfx.fill({ color: 0x222233, alpha: 0.9 });
  // Dark glow
  gfx.ellipse(w / 2, w / 2 + 2, w * 0.4, w * 0.3);
  gfx.stroke({ width: 1.5, color: 0x6644aa, alpha: 0.5 });
  // Glowing eyes
  gfx.circle(w * 0.6, w * 0.42, 2); gfx.fill(0xff4444);
  gfx.circle(w * 0.4, w * 0.42, 2); gfx.fill(0xff4444);
}

// ── Themed boss drawing ───────────────────────────────────────────────

export function drawThemedBoss(
  gfx: Graphics, w: number, h: number, type: string,
  phase: number, animTick: number, theme: string,
): void {
  switch (theme) {
    case "theme_neon": return drawNeonBoss(gfx, w, h, type, animTick);
    case "theme_pixel": return drawPixelBoss(gfx, w, h, type);
    case "theme_candy": return drawCandyBoss(gfx, w, h, type);
    case "theme_dark": return drawDarkBoss(gfx, w, h, type);
    default: return drawBoss(gfx, w, h, type, phase, animTick);
  }
}

function drawNeonBoss(gfx: Graphics, w: number, h: number, type: string, animTick: number): void {
  gfx.clear();
  const colors: Record<string, number> = { chef_rival: 0xff0044, kraken: 0x00ffaa, ufo: 0xaa00ff };
  const c = colors[type] ?? 0xff0044;
  const cx = w / 2, cy = h / 2;
  const pulse = 1 + Math.sin(animTick * 0.08) * 0.05;
  // Outer glow
  gfx.ellipse(cx, cy, w * 0.42 * pulse, h * 0.38 * pulse);
  gfx.fill({ color: c, alpha: 0.1 });
  // Neon outline body
  gfx.ellipse(cx, cy, w * 0.38 * pulse, h * 0.34 * pulse);
  gfx.stroke({ width: 3, color: c });
  // Inner details
  gfx.ellipse(cx, cy, w * 0.2, h * 0.18);
  gfx.fill({ color: c, alpha: 0.25 });
  // Neon eyes
  gfx.circle(cx - 8, cy - 4, 3); gfx.fill(0xffffff);
  gfx.circle(cx + 8, cy - 4, 3); gfx.fill(0xffffff);
}

function drawPixelBoss(gfx: Graphics, w: number, h: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number> = { chef_rival: 0xcc2222, kraken: 0x22aa66, ufo: 0x8844cc };
  const c = colors[type] ?? 0xcc2222;
  const px = Math.max(6, Math.floor(w / 8));
  for (let x = 1; x < 7; x++) {
    for (let y = 0; y < Math.floor(h / px) - 1; y++) {
      if ((x + y) % 3 === 0) continue; // holes for shape
      gfx.rect(x * px, y * px, px - 1, px - 1); gfx.fill(c);
    }
  }
  // Pixel eyes
  gfx.rect(2 * px, 1 * px, px - 1, px - 1); gfx.fill(0xffffff);
  gfx.rect(4 * px, 1 * px, px - 1, px - 1); gfx.fill(0xffffff);
}

function drawCandyBoss(gfx: Graphics, w: number, h: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number[]> = {
    chef_rival: [0xff6688, 0xffaacc], kraken: [0x66ddaa, 0xaaffcc], ufo: [0xbb88ff, 0xddbbff],
  };
  const [main, light] = colors[type] ?? [0xff6688, 0xffaacc];
  const cx = w / 2, cy = h / 2;
  gfx.ellipse(cx, cy, w * 0.4, h * 0.36); gfx.fill(main);
  // Candy stripes
  for (let i = -3; i <= 3; i++) {
    gfx.moveTo(cx + i * 8, cy - h * 0.3);
    gfx.lineTo(cx + i * 8 + 4, cy + h * 0.3);
    gfx.stroke({ width: 2, color: light, alpha: 0.4 });
  }
  // Face
  gfx.circle(cx - 10, cy - 4, 4); gfx.fill(0xffffff);
  gfx.circle(cx + 10, cy - 4, 4); gfx.fill(0xffffff);
  gfx.circle(cx - 10, cy - 4, 2); gfx.fill(0x222222);
  gfx.circle(cx + 10, cy - 4, 2); gfx.fill(0x222222);
}

function drawDarkBoss(gfx: Graphics, w: number, h: number, _type: string): void {
  gfx.clear();
  const cx = w / 2, cy = h / 2;
  // Shadow mass
  gfx.ellipse(cx, cy, w * 0.42, h * 0.38); gfx.fill(0x111122);
  gfx.ellipse(cx, cy, w * 0.42, h * 0.38);
  gfx.stroke({ width: 2, color: 0x6633aa, alpha: 0.6 });
  // Dark tendrils
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    gfx.moveTo(cx, cy);
    gfx.lineTo(cx + Math.cos(angle) * w * 0.5, cy + Math.sin(angle) * h * 0.45);
    gfx.stroke({ width: 2, color: 0x442266, alpha: 0.4 });
  }
  // Glowing eyes
  gfx.circle(cx - 10, cy - 4, 4); gfx.fill({ color: 0xff2244, alpha: 0.9 });
  gfx.circle(cx + 10, cy - 4, 4); gfx.fill({ color: 0xff2244, alpha: 0.9 });
}

// ── Themed platform drawing ───────────────────────────────────────────

export function drawThemedPlatform(
  gfx: Graphics, w: number, h: number, color: number,
  style: PlatformStyle, theme: string,
): void {
  switch (theme) {
    case "theme_neon": return drawNeonPlatform(gfx, w, h, style);
    case "theme_pixel": return drawPixelPlatform(gfx, w, h, color);
    case "theme_candy": return drawCandyPlatform(gfx, w, h, style);
    case "theme_dark": return drawDarkPlatform(gfx, w, h, style);
    default: return drawPlatform(gfx, w, h, color, style);
  }
}

function drawNeonPlatform(gfx: Graphics, w: number, h: number, style: PlatformStyle): void {
  gfx.clear();
  const colors: Record<string, number> = {
    normal: 0x00ffff, breaking: 0xff4444, brittle: 0xff8844,
    moving: 0x44ff44, spring: 0xffff00, ice: 0x88ccff,
    conveyor: 0xff88ff, lasagna: 0xffaa00, crumbling: 0xff6644,
    teleport: 0xaa44ff, weighted: 0x88ff88,
  };
  const c = colors[style] ?? 0x00ffff;
  // Glow behind
  gfx.roundRect(-1, -1, w + 2, h + 2, 5);
  gfx.fill({ color: c, alpha: 0.15 });
  // Neon outline only
  gfx.roundRect(0, 0, w, h, 4);
  gfx.stroke({ width: 2, color: c });
  // Subtle inner fill
  gfx.roundRect(2, 2, w - 4, h - 4, 3);
  gfx.fill({ color: c, alpha: 0.08 });
}

function drawPixelPlatform(gfx: Graphics, w: number, h: number, color: number): void {
  gfx.clear();
  const px = Math.max(4, Math.floor(h));
  const cols = Math.floor(w / px);
  for (let i = 0; i < cols; i++) {
    gfx.rect(i * px, 0, px - 1, px - 1);
    gfx.fill(i % 2 === 0 ? color : darken(color, 0.15));
  }
}

function drawCandyPlatform(gfx: Graphics, w: number, h: number, style: PlatformStyle): void {
  gfx.clear();
  const pastel: Record<string, number> = {
    normal: 0xffaacc, breaking: 0xffccaa, brittle: 0xffddaa,
    moving: 0xaaffcc, spring: 0xffffaa, ice: 0xaaddff,
    conveyor: 0xddaaff, lasagna: 0xffccaa, crumbling: 0xffbbaa,
    teleport: 0xccaaff, weighted: 0xbbffbb,
  };
  const c = pastel[style] ?? 0xffaacc;
  gfx.roundRect(0, 0, w, h, 6); gfx.fill(c);
  // Candy stripe
  for (let x = 4; x < w - 4; x += 12) {
    gfx.roundRect(x, 1, 4, h - 2, 2);
    gfx.fill({ color: 0xffffff, alpha: 0.3 });
  }
}

function drawDarkPlatform(gfx: Graphics, w: number, h: number, style: PlatformStyle): void {
  gfx.clear();
  const isSafe = style === "normal" || style === "moving" || style === "spring";
  const c = isSafe ? 0x332244 : 0x442233;
  gfx.roundRect(0, 0, w, h, 4); gfx.fill(c);
  gfx.roundRect(0, 0, w, h, 4);
  gfx.stroke({ width: 1, color: 0x6644aa, alpha: 0.4 });
}

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (color & 0xff) * (1 - amount));
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}
