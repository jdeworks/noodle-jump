/** Themed enemy and boss draw wrappers — reskin per visual theme. */

import { Graphics } from "pixi.js";
import { drawEnemy } from "./EnemySprites";
import { drawBoss } from "./BossSprites";

/** Consistent pixel size for the pixel theme. */
const PX = 5;

// ── Themed enemy drawing ──────────────────────────────────────────────

export function drawThemedEnemy(gfx: Graphics, width: number, type: string, theme: string): void {
  switch (theme) {
    case "theme_neon":
      return drawNeonEnemy(gfx, width, type);
    case "theme_pixel":
      return drawPixelEnemy(gfx, width, type);
    case "theme_candy":
      return drawCandyEnemy(gfx, width, type);
    case "theme_dark":
      return drawDarkEnemy(gfx, width, type);
    default:
      return drawEnemy(gfx, width, type);
  }
}

function drawNeonEnemy(gfx: Graphics, w: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number> = { rat: 0x00ffff, fish: 0x00ff88, alien: 0xff00ff };
  const c = colors[type] ?? 0x00ffff;
  const cx = w / 2,
    cy = w / 2;
  gfx.ellipse(cx, cy, w * 0.42, w * 0.32);
  gfx.fill({ color: c, alpha: 0.12 });
  gfx.ellipse(cx, cy, w * 0.35, w * 0.25);
  gfx.stroke({ width: 2, color: c });
  gfx.circle(w * 0.6, w * 0.42, 2.5);
  gfx.fill({ color: 0xffffff, alpha: 0.9 });
  gfx.circle(w * 0.4, w * 0.42, 2.5);
  gfx.fill({ color: 0xffffff, alpha: 0.9 });
}

function drawPixelEnemy(gfx: Graphics, w: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number> = { rat: 0x888888, fish: 0x4488cc, alien: 0x88ff44 };
  const c = colors[type] ?? 0x888888;
  const px = PX;
  for (let x = 1; x < 5; x++) {
    for (let y = 1; y < 4; y++) {
      gfx.rect(x * px, y * px, px - 1, px - 1);
      gfx.fill(c);
    }
  }
  gfx.rect(3 * px, 1 * px, px - 1, px - 1);
  gfx.fill(0x111111);
  gfx.rect(1 * px, 1 * px, px - 1, px - 1);
  gfx.fill(0x111111);
}

function drawCandyEnemy(gfx: Graphics, w: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number[]> = {
    rat: [0xff88aa, 0xffaacc],
    fish: [0x88ccff, 0xaaddff],
    alien: [0xaaff88, 0xccffaa],
  };
  const [main, light] = colors[type] ?? [0xff88aa, 0xffaacc];
  gfx.circle(w / 2, w / 2, w * 0.35);
  gfx.fill(main);
  gfx.circle(w / 2, w / 2, w * 0.35);
  gfx.stroke({ width: 2, color: light, alpha: 0.6 });
  gfx.circle(w * 0.6, w * 0.4, 2.5);
  gfx.fill(0xffffff);
  gfx.circle(w * 0.4, w * 0.4, 2.5);
  gfx.fill(0xffffff);
  gfx.circle(w * 0.6, w * 0.4, 1);
  gfx.fill(0x111111);
  gfx.circle(w * 0.4, w * 0.4, 1);
  gfx.fill(0x111111);
}

function drawDarkEnemy(gfx: Graphics, w: number, _type: string): void {
  gfx.clear();
  gfx.ellipse(w / 2, w / 2 + 2, w * 0.4, w * 0.3);
  gfx.fill({ color: 0x222233, alpha: 0.9 });
  gfx.ellipse(w / 2, w / 2 + 2, w * 0.4, w * 0.3);
  gfx.stroke({ width: 1.5, color: 0x6644aa, alpha: 0.5 });
  gfx.circle(w * 0.6, w * 0.42, 2);
  gfx.fill(0xff4444);
  gfx.circle(w * 0.4, w * 0.42, 2);
  gfx.fill(0xff4444);
}

// ── Themed boss drawing ───────────────────────────────────────────────

export function drawThemedBoss(
  gfx: Graphics,
  w: number,
  h: number,
  type: string,
  phase: number,
  animTick: number,
  theme: string,
): void {
  switch (theme) {
    case "theme_neon":
      return drawNeonBoss(gfx, w, h, type, animTick);
    case "theme_pixel":
      return drawPixelBoss(gfx, w, h, type);
    case "theme_candy":
      return drawCandyBoss(gfx, w, h, type);
    case "theme_dark":
      return drawDarkBoss(gfx, w, h, type);
    default:
      return drawBoss(gfx, w, h, type, phase, animTick);
  }
}

function drawNeonBoss(gfx: Graphics, w: number, h: number, type: string, animTick: number): void {
  gfx.clear();
  const colors: Record<string, number> = { chef_rival: 0xff0044, kraken: 0x00ffaa, ufo: 0xaa00ff };
  const c = colors[type] ?? 0xff0044;
  const cx = w / 2,
    cy = h / 2;
  const pulse = 1 + Math.sin(animTick * 0.08) * 0.05;
  gfx.ellipse(cx, cy, w * 0.42 * pulse, h * 0.38 * pulse);
  gfx.fill({ color: c, alpha: 0.12 });
  if (type === "chef_rival") {
    gfx.roundRect(cx - 12, cy - 5, 24, 22, 4);
    gfx.stroke({ width: 2.5, color: c });
    gfx.circle(cx, cy - 12, 10);
    gfx.stroke({ width: 2.5, color: c });
    gfx.roundRect(cx - 10, cy - 28, 20, 14, 3);
    gfx.stroke({ width: 2, color: c });
    gfx.fill({ color: c, alpha: 0.08 });
  } else if (type === "kraken") {
    gfx.ellipse(cx, cy - 6, w * 0.35, h * 0.25);
    gfx.stroke({ width: 2.5, color: c });
    gfx.fill({ color: c, alpha: 0.08 });
    for (let i = 0; i < 5; i++) {
      const tx = cx - 20 + i * 10;
      const wave = Math.sin(animTick * 0.06 + i) * 4;
      gfx.moveTo(tx, cy + 4);
      gfx.lineTo(tx + wave, cy + h * 0.4);
      gfx.stroke({ width: 2, color: c, alpha: 0.7 });
    }
  } else {
    gfx.ellipse(cx, cy + 4, w * 0.4, h * 0.15);
    gfx.stroke({ width: 2.5, color: c });
    gfx.ellipse(cx, cy - 4, w * 0.2, h * 0.2);
    gfx.stroke({ width: 2, color: c });
    gfx.fill({ color: c, alpha: 0.1 });
    for (let i = 0; i < 3; i++) {
      gfx.circle(cx - 12 + i * 12, cy + 4, 2);
      gfx.fill({ color: 0xffffff, alpha: 0.5 + Math.sin(animTick * 0.15 + i) * 0.4 });
    }
  }
  gfx.circle(cx - 6, cy - 4, 2.5);
  gfx.fill(0xffffff);
  gfx.circle(cx + 6, cy - 4, 2.5);
  gfx.fill(0xffffff);
}

function drawPixelBoss(gfx: Graphics, w: number, h: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number> = { chef_rival: 0xcc2222, kraken: 0x22aa66, ufo: 0x8844cc };
  const c = colors[type] ?? 0xcc2222;
  const px = PX;
  for (let x = 1; x < 7; x++) {
    for (let y = 0; y < Math.floor(h / px) - 1; y++) {
      if ((x + y) % 3 === 0) continue;
      gfx.rect(x * px, y * px, px - 1, px - 1);
      gfx.fill(c);
    }
  }
  gfx.rect(2 * px, 1 * px, px - 1, px - 1);
  gfx.fill(0xffffff);
  gfx.rect(4 * px, 1 * px, px - 1, px - 1);
  gfx.fill(0xffffff);
}

function drawCandyBoss(gfx: Graphics, w: number, h: number, type: string): void {
  gfx.clear();
  const colors: Record<string, number[]> = {
    chef_rival: [0xff6688, 0xffaacc],
    kraken: [0x66ddaa, 0xaaffcc],
    ufo: [0xbb88ff, 0xddbbff],
  };
  const [main, light] = colors[type] ?? [0xff6688, 0xffaacc];
  const cx = w / 2,
    cy = h / 2;
  gfx.ellipse(cx, cy, w * 0.4, h * 0.36);
  gfx.fill(main);
  for (let i = -3; i <= 3; i++) {
    gfx.moveTo(cx + i * 8, cy - h * 0.3);
    gfx.lineTo(cx + i * 8 + 4, cy + h * 0.3);
    gfx.stroke({ width: 2, color: light, alpha: 0.4 });
  }
  gfx.circle(cx - 10, cy - 4, 4);
  gfx.fill(0xffffff);
  gfx.circle(cx + 10, cy - 4, 4);
  gfx.fill(0xffffff);
  gfx.circle(cx - 10, cy - 4, 2);
  gfx.fill(0x222222);
  gfx.circle(cx + 10, cy - 4, 2);
  gfx.fill(0x222222);
}

function drawDarkBoss(gfx: Graphics, w: number, h: number, _type: string): void {
  gfx.clear();
  const cx = w / 2,
    cy = h / 2;
  gfx.ellipse(cx, cy, w * 0.42, h * 0.38);
  gfx.fill(0x111122);
  gfx.ellipse(cx, cy, w * 0.42, h * 0.38);
  gfx.stroke({ width: 2, color: 0x6633aa, alpha: 0.6 });
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    gfx.moveTo(cx, cy);
    gfx.lineTo(cx + Math.cos(angle) * w * 0.5, cy + Math.sin(angle) * h * 0.45);
    gfx.stroke({ width: 2, color: 0x442266, alpha: 0.4 });
  }
  gfx.circle(cx - 10, cy - 4, 4);
  gfx.fill({ color: 0xff2244, alpha: 0.9 });
  gfx.circle(cx + 10, cy - 4, 4);
  gfx.fill({ color: 0xff2244, alpha: 0.9 });
}
