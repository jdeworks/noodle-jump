/** Themed draw wrappers — reskin platforms and meatballs per visual theme. */

import { Graphics } from "pixi.js";
import { drawPlatform, type PlatformStyle } from "./PlatformSprites";

// Re-export creature theming so existing imports from ThemeSprites still work
export { drawThemedEnemy, drawThemedBoss } from "./ThemedCreatureSprites";

/** Consistent pixel size for the pixel theme — everything uses this grid. */
const PX = 5;

// ── Themed platform drawing ───────────────────────────────────────────

export function drawThemedPlatform(
  gfx: Graphics,
  w: number,
  h: number,
  color: number,
  style: PlatformStyle,
  theme: string,
): void {
  switch (theme) {
    case "theme_neon":
      return drawNeonPlatform(gfx, w, h, style, color);
    case "theme_pixel":
      return drawPixelPlatform(gfx, w, h, color);
    case "theme_candy":
      return drawCandyPlatform(gfx, w, h, style);
    case "theme_dark":
      return drawDarkPlatform(gfx, w, h, style);
    default:
      return drawPlatform(gfx, w, h, color, style);
  }
}

function drawNeonPlatform(
  gfx: Graphics,
  w: number,
  h: number,
  style: PlatformStyle,
  zoneColor: number,
): void {
  gfx.clear();
  const neonOverrides: Record<string, number> = {
    breaking: 0xff3333,
    brittle: 0xff8844,
    spring: 0xffff00,
    ice: 0x66ddff,
    teleport: 0xcc44ff,
    crumbling: 0xff6644,
  };
  const c = neonOverrides[style] ?? neonify(zoneColor);
  gfx.roundRect(-10, -6, w + 20, h + 12, 12);
  gfx.fill({ color: c, alpha: 0.04 });
  gfx.roundRect(-6, -4, w + 12, h + 8, 9);
  gfx.fill({ color: c, alpha: 0.08 });
  gfx.roundRect(-3, -2, w + 6, h + 4, 6);
  gfx.fill({ color: c, alpha: 0.15 });
  gfx.roundRect(-1, -1, w + 2, h + 2, 5);
  gfx.fill({ color: c, alpha: 0.25 });
  gfx.roundRect(0, 0, w, h, 4);
  gfx.stroke({ width: 2.5, color: c });
  gfx.roundRect(2, 1, w - 4, h - 2, 3);
  gfx.stroke({ width: 0.8, color: 0xffffff, alpha: 0.35 });
}

function drawPixelPlatform(gfx: Graphics, w: number, _h: number, color: number): void {
  gfx.clear();
  const cols = Math.floor(w / PX);
  const rows = Math.max(2, Math.floor(_h / PX));
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const shade = (x + y) % 2 === 0 ? color : darken(color, 0.12);
      gfx.rect(x * PX, y * PX, PX - 1, PX - 1);
      gfx.fill(shade);
    }
  }
}

function drawCandyPlatform(gfx: Graphics, w: number, h: number, style: PlatformStyle): void {
  gfx.clear();
  const pastel: Record<string, number> = {
    normal: 0xffaacc,
    breaking: 0xff8888,
    brittle: 0xffbb88,
    moving: 0xaaffcc,
    spring: 0xccff88,
    ice: 0xaaddff,
    conveyor: 0xddaaff,
    lasagna: 0xffcc66,
    crumbling: 0xff9966,
    teleport: 0xcc88ff,
    weighted: 0xbbffbb,
  };
  const c = pastel[style] ?? 0xffaacc;
  gfx.roundRect(0, 0, w, h, 6);
  gfx.fill(c);
  for (let x = 4; x < w - 4; x += 12) {
    gfx.roundRect(x, 1, 4, h - 2, 2);
    gfx.fill({ color: 0xffffff, alpha: 0.3 });
  }
}

function drawDarkPlatform(gfx: Graphics, w: number, h: number, style: PlatformStyle): void {
  gfx.clear();
  const colors: Record<string, [number, number]> = {
    normal: [0x2a2040, 0x6644aa],
    moving: [0x2a2050, 0x4488cc],
    breaking: [0x3a1525, 0xaa3344],
    brittle: [0x3a2020, 0xcc6644],
    spring: [0x1a3020, 0x44aa44],
    ice: [0x1a2535, 0x4488cc],
    conveyor: [0x2a2535, 0x8866aa],
    crumbling: [0x352020, 0xaa5533],
    teleport: [0x251535, 0xaa44cc],
    weighted: [0x2a2520, 0x888844],
    lasagna: [0x352a1a, 0xcc8833],
  };
  const [fill, border] = colors[style] ?? [0x2a2040, 0x6644aa];
  gfx.roundRect(0, 0, w, h, 4);
  gfx.fill(fill);
  gfx.roundRect(0, 0, w, h, 4);
  gfx.stroke({ width: 1, color: border, alpha: 0.5 });
}

// ── Themed meatball drawing ───────────────────────────────────────────

export function drawThemedMeatball(gfx: Graphics, size: number, theme: string): void {
  const r = size / 2;
  gfx.clear();
  if (theme === "theme_neon") {
    gfx.circle(r, r, r + 2);
    gfx.fill({ color: 0x00ffff, alpha: 0.12 });
    gfx.circle(r, r, r);
    gfx.stroke({ width: 2, color: 0x00ffff });
  } else if (theme === "theme_pixel") {
    const px = PX;
    for (let x = 0; x < 4; x++)
      for (let y = 0; y < 4; y++) {
        if ((x === 0 || x === 3) && (y === 0 || y === 3)) continue;
        gfx.rect(x * px, y * px, px - 1, px - 1);
        gfx.fill(0xcc8844);
      }
  } else if (theme === "theme_candy") {
    gfx.circle(r, r, r);
    gfx.fill(0xff88cc);
    gfx.circle(r, r, r);
    gfx.stroke({ width: 1.5, color: 0xffaadd });
    gfx.circle(r * 0.7, r * 0.7, r * 0.25);
    gfx.fill({ color: 0xffffff, alpha: 0.4 });
  } else if (theme === "theme_dark") {
    gfx.circle(r, r, r);
    gfx.fill(0x332244);
    gfx.circle(r, r, r);
    gfx.stroke({ width: 1.5, color: 0x6644aa, alpha: 0.5 });
    gfx.circle(r * 0.6, r * 0.6, r * 0.2);
    gfx.fill({ color: 0xff4466, alpha: 0.4 });
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
