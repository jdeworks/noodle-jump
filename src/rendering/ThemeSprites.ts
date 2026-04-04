/** Themed draw wrappers — reskin enemies, bosses, and platforms per visual theme. */

import { Graphics } from "pixi.js";
import { drawEnemy } from "./EnemySprites";
import { drawBoss } from "./BossSprites";
import { drawPlatform, type PlatformStyle } from "./PlatformSprites";

/** Consistent pixel size for the pixel theme — everything uses this grid. */
const PX = 5;

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
  const cx = w / 2, cy = w / 2;
  // Multi-layer glow
  gfx.ellipse(cx, cy, w * 0.46, w * 0.36); gfx.fill({ color: c, alpha: 0.05 });
  gfx.ellipse(cx, cy, w * 0.42, w * 0.32); gfx.fill({ color: c, alpha: 0.1 });
  gfx.ellipse(cx, cy, w * 0.38, w * 0.28); gfx.fill({ color: c, alpha: 0.15 });
  // Bright outline
  gfx.ellipse(cx, cy, w * 0.35, w * 0.25); gfx.stroke({ width: 2, color: c });
  // White-hot inner highlight
  gfx.ellipse(cx, cy, w * 0.2, w * 0.14); gfx.stroke({ width: 0.8, color: 0xffffff, alpha: 0.3 });
  // Glowing eyes
  gfx.circle(w * 0.6, w * 0.42, 2.5); gfx.fill({ color: 0xffffff, alpha: 0.9 });
  gfx.circle(w * 0.4, w * 0.42, 2.5); gfx.fill({ color: 0xffffff, alpha: 0.9 });
}

function drawPixelEnemy(gfx: Graphics, w: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number> = { rat: 0x888888, fish: 0x4488cc, alien: 0x88ff44 };
  const c = colors[type] ?? 0x888888;
  const px = PX;
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
  // Wide glow
  gfx.ellipse(cx, cy, w * 0.46 * pulse, h * 0.42 * pulse);
  gfx.fill({ color: c, alpha: 0.06 });
  gfx.ellipse(cx, cy, w * 0.42 * pulse, h * 0.38 * pulse);
  gfx.fill({ color: c, alpha: 0.1 });
  if (type === "chef_rival") {
    // Neon chef — body + hat outline
    gfx.roundRect(cx - 12, cy - 5, 24, 22, 4); gfx.stroke({ width: 2.5, color: c });
    gfx.circle(cx, cy - 12, 10); gfx.stroke({ width: 2.5, color: c });
    gfx.roundRect(cx - 10, cy - 28, 20, 14, 3); gfx.stroke({ width: 2, color: c });
    gfx.fill({ color: c, alpha: 0.08 });
  } else if (type === "kraken") {
    // Neon kraken — dome + tentacles
    gfx.ellipse(cx, cy - 6, w * 0.35, h * 0.25); gfx.stroke({ width: 2.5, color: c });
    gfx.fill({ color: c, alpha: 0.08 });
    for (let i = 0; i < 5; i++) {
      const tx = cx - 20 + i * 10;
      const wave = Math.sin(animTick * 0.06 + i) * 4;
      gfx.moveTo(tx, cy + 4); gfx.lineTo(tx + wave, cy + h * 0.4);
      gfx.stroke({ width: 2, color: c, alpha: 0.7 });
    }
  } else {
    // Neon UFO — disc + dome
    gfx.ellipse(cx, cy + 4, w * 0.4, h * 0.15); gfx.stroke({ width: 2.5, color: c });
    gfx.ellipse(cx, cy - 4, w * 0.2, h * 0.2); gfx.stroke({ width: 2, color: c });
    gfx.fill({ color: c, alpha: 0.1 });
    // Running lights
    for (let i = 0; i < 3; i++) {
      gfx.circle(cx - 12 + i * 12, cy + 4, 2);
      gfx.fill({ color: 0xffffff, alpha: 0.5 + Math.sin(animTick * 0.15 + i) * 0.4 });
    }
  }
  // Neon eyes
  gfx.circle(cx - 6, cy - 4, 2.5); gfx.fill(0xffffff);
  gfx.circle(cx + 6, cy - 4, 2.5); gfx.fill(0xffffff);
}

function drawPixelBoss(gfx: Graphics, w: number, h: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number> = { chef_rival: 0xcc2222, kraken: 0x22aa66, ufo: 0x8844cc };
  const c = colors[type] ?? 0xcc2222;
  const px = PX;
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
    case "theme_neon": return drawNeonPlatform(gfx, w, h, style, color);
    case "theme_pixel": return drawPixelPlatform(gfx, w, h, color);
    case "theme_candy": return drawCandyPlatform(gfx, w, h, style);
    case "theme_dark": return drawDarkPlatform(gfx, w, h, style);
    default: return drawPlatform(gfx, w, h, color, style);
  }
}

function drawNeonPlatform(gfx: Graphics, w: number, h: number, style: PlatformStyle, zoneColor: number): void {
  gfx.clear();
  // Neon-ify the zone color: boost saturation + brightness
  const neonOverrides: Record<string, number> = {
    breaking: 0xff3333, brittle: 0xff8844, spring: 0xffff00,
    ice: 0x66ddff, teleport: 0xcc44ff, crumbling: 0xff6644,
  };
  const c = neonOverrides[style] ?? neonify(zoneColor);
  // 5 concentric glow layers — wide outer halo for strong neon bloom
  gfx.roundRect(-12, -7, w + 24, h + 14, 12); gfx.fill({ color: c, alpha: 0.03 });
  gfx.roundRect(-8, -5, w + 16, h + 10, 9); gfx.fill({ color: c, alpha: 0.06 });
  gfx.roundRect(-5, -3, w + 10, h + 6, 7); gfx.fill({ color: c, alpha: 0.1 });
  gfx.roundRect(-2, -1, w + 4, h + 2, 5); gfx.fill({ color: c, alpha: 0.18 });
  gfx.roundRect(0, 0, w, h, 4); gfx.fill({ color: c, alpha: 0.25 });
  // Bright neon outline
  gfx.roundRect(0, 0, w, h, 4); gfx.stroke({ width: 2.5, color: c });
  // White-hot center
  gfx.roundRect(2, 1, w - 4, h - 2, 3); gfx.stroke({ width: 1, color: 0xffffff, alpha: 0.4 });
}

function drawPixelPlatform(gfx: Graphics, w: number, _h: number, color: number): void {
  gfx.clear();
  const cols = Math.floor(w / PX);
  const rows = Math.max(2, Math.floor(_h / PX));
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const shade = (x + y) % 2 === 0 ? color : darken(color, 0.12);
      gfx.rect(x * PX, y * PX, PX - 1, PX - 1); gfx.fill(shade);
    }
  }
}

function drawCandyPlatform(gfx: Graphics, w: number, h: number, style: PlatformStyle): void {
  gfx.clear();
  const pastel: Record<string, number> = {
    normal: 0xffaacc, breaking: 0xff8888, brittle: 0xffbb88,
    moving: 0xaaffcc, spring: 0xccff88, ice: 0xaaddff,
    conveyor: 0xddaaff, lasagna: 0xffcc66, crumbling: 0xff9966,
    teleport: 0xcc88ff, weighted: 0xbbffbb,
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
  const colors: Record<string, [number, number]> = {
    normal: [0x2a2040, 0x6644aa], moving: [0x2a2050, 0x4488cc],
    breaking: [0x3a1525, 0xaa3344], brittle: [0x3a2020, 0xcc6644],
    spring: [0x1a3020, 0x44aa44], ice: [0x1a2535, 0x4488cc],
    conveyor: [0x2a2535, 0x8866aa], crumbling: [0x352020, 0xaa5533],
    teleport: [0x251535, 0xaa44cc], weighted: [0x2a2520, 0x888844],
    lasagna: [0x352a1a, 0xcc8833],
  };
  const [fill, border] = colors[style] ?? [0x2a2040, 0x6644aa];
  gfx.roundRect(0, 0, w, h, 4); gfx.fill(fill);
  gfx.roundRect(0, 0, w, h, 4); gfx.stroke({ width: 1, color: border, alpha: 0.5 });
}

// ── Themed meatball drawing ───────────────────────────────────────────

export function drawThemedMeatball(gfx: Graphics, size: number, theme: string): void {
  const r = size / 2;
  gfx.clear();
  if (theme === "theme_neon") {
    gfx.circle(r, r, r + 5); gfx.fill({ color: 0x00ffff, alpha: 0.04 });
    gfx.circle(r, r, r + 3); gfx.fill({ color: 0x00ffff, alpha: 0.08 });
    gfx.circle(r, r, r + 1); gfx.fill({ color: 0x00ffff, alpha: 0.15 });
    gfx.circle(r, r, r); gfx.stroke({ width: 2, color: 0x00ffff });
    gfx.circle(r, r, r * 0.3); gfx.fill({ color: 0xffffff, alpha: 0.3 });
  } else if (theme === "theme_pixel") {
    const px = PX;
    for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) {
      if ((x === 0 || x === 3) && (y === 0 || y === 3)) continue;
      gfx.rect(x * px, y * px, px - 1, px - 1); gfx.fill(0xcc8844);
    }
  } else if (theme === "theme_candy") {
    gfx.circle(r, r, r); gfx.fill(0xff88cc);
    gfx.circle(r, r, r); gfx.stroke({ width: 1.5, color: 0xffaadd });
    gfx.circle(r * 0.7, r * 0.7, r * 0.25); gfx.fill({ color: 0xffffff, alpha: 0.4 });
  } else if (theme === "theme_dark") {
    gfx.circle(r, r, r); gfx.fill(0x332244);
    gfx.circle(r, r, r); gfx.stroke({ width: 1.5, color: 0x6644aa, alpha: 0.5 });
    gfx.circle(r * 0.6, r * 0.6, r * 0.2); gfx.fill({ color: 0xff4466, alpha: 0.4 });
  }
}

/** Whether a theme should override default meatball rendering. */
export function hasThemedMeatball(theme: string): boolean {
  return theme !== "theme_default";
}

/** Boost a color to neon brightness — increase each channel toward max. */
function neonify(color: number): number {
  let r = (color >> 16) & 0xff;
  let g = (color >> 8) & 0xff;
  let b = color & 0xff;
  // Find dominant channel and boost it, dim the others slightly
  const max = Math.max(r, g, b);
  if (max === 0) return 0x00ffff;
  r = Math.min(255, Math.floor(r * 1.6 + 40));
  g = Math.min(255, Math.floor(g * 1.6 + 40));
  b = Math.min(255, Math.floor(b * 1.6 + 40));
  return (r << 16) | (g << 8) | b;
}

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (color & 0xff) * (1 - amount));
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}
