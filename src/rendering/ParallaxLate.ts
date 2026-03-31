/** Parallax zone features — Freezer, Volcano, Candy, Golden Kitchen. */

import { Graphics } from "pixi.js";

export function drawFreezer(gfx: Graphics, size: number, animTick: number): void {
  gfx.clear();
  const cx = size / 2;
  const cy = size / 2;

  for (let a = 0; a < 6; a++) {
    const angle = (a / 6) * Math.PI * 2 + animTick * 0.005;
    const len = size * 0.35;
    gfx.moveTo(cx, cy);
    gfx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    gfx.stroke({ width: 2, color: 0xaaddff, alpha: 0.5 });
    const bLen = len * 0.4;
    const bx = cx + Math.cos(angle) * len * 0.6;
    const by = cy + Math.sin(angle) * len * 0.6;
    gfx.moveTo(bx, by);
    gfx.lineTo(bx + Math.cos(angle + 0.8) * bLen, by + Math.sin(angle + 0.8) * bLen);
    gfx.moveTo(bx, by);
    gfx.lineTo(bx + Math.cos(angle - 0.8) * bLen, by + Math.sin(angle - 0.8) * bLen);
    gfx.stroke({ width: 1.5, color: 0xcceeff, alpha: 0.4 });
  }
  for (let i = 0; i < 4; i++) {
    const ix = cx + (i - 1.5) * 15;
    const iy = cy + size * 0.25;
    const h = 10 + Math.sin(animTick * 0.01 + i) * 3;
    gfx.moveTo(ix - 3, iy);
    gfx.lineTo(ix, iy + h);
    gfx.lineTo(ix + 3, iy);
    gfx.fill({ color: 0xccddff, alpha: 0.4 });
  }
}

export function drawVolcano(gfx: Graphics, size: number, animTick: number): void {
  gfx.clear();
  const cx = size / 2;
  gfx.moveTo(cx - size * 0.4, size * 0.85);
  gfx.lineTo(cx - size * 0.12, size * 0.25);
  gfx.lineTo(cx + size * 0.12, size * 0.25);
  gfx.lineTo(cx + size * 0.4, size * 0.85);
  gfx.closePath();
  gfx.fill({ color: 0x664422, alpha: 0.4 });
  gfx.ellipse(cx, size * 0.28, size * 0.1, size * 0.04);
  gfx.fill({ color: 0xff4400, alpha: 0.3 + Math.sin(animTick * 0.04) * 0.15 });
  for (let d = 0; d < 3; d++) {
    const dx = cx + (d - 1) * 8;
    const progress = (animTick * 0.008 + d * 0.33) % 1;
    const dy = size * 0.3 + progress * size * 0.4;
    gfx.circle(dx, dy, 2);
    gfx.fill({ color: 0xff6622, alpha: 0.5 * (1 - progress) });
  }
  for (let e = 0; e < 5; e++) {
    const phase = (animTick * 0.006 + e * 0.2) % 1;
    const ex = cx + Math.sin(animTick * 0.02 + e * 2) * 15;
    const ey = size * 0.25 - phase * size * 0.4;
    gfx.circle(ex, ey, 1.5);
    gfx.fill({ color: 0xff8844, alpha: 0.4 * (1 - phase) });
  }
}

export function drawCandyLand(gfx: Graphics, size: number, animTick: number): void {
  gfx.clear();
  const cx = size / 2;
  gfx.roundRect(cx - 2, size * 0.45, 4, size * 0.4, 1);
  gfx.fill({ color: 0xdddddd, alpha: 0.5 });
  const candyR = size * 0.2;
  gfx.circle(cx, size * 0.35, candyR);
  gfx.fill({ color: 0xff88cc, alpha: 0.4 });
  for (let a = 0; a < Math.PI * 4; a += 0.5) {
    const r = candyR * (a / (Math.PI * 4));
    const sx = cx + Math.cos(a + animTick * 0.01) * r;
    const sy = size * 0.35 + Math.sin(a + animTick * 0.01) * r;
    gfx.circle(sx, sy, 1.2);
    gfx.fill({ color: 0xffffff, alpha: 0.3 });
  }
  for (let c = 0; c < 3; c++) {
    const ccx = cx + (c - 1) * 25;
    const ccy = size * 0.7;
    gfx.roundRect(ccx - 1.5, ccy, 3, 15, 1);
    gfx.fill({ color: 0xff4444, alpha: 0.3 });
    gfx.roundRect(ccx - 1.5, ccy, 3, 4, 1);
    gfx.fill({ color: 0xffffff, alpha: 0.3 });
  }
  for (let g = 0; g < 4; g++) {
    const gx = cx + Math.sin(g * 2.1 + 0.5) * size * 0.3;
    const gy = size * 0.15 + g * size * 0.15 + Math.sin(animTick * 0.02 + g) * 3;
    const colors = [0xff6688, 0x88ff66, 0xffaa33, 0x66bbff];
    gfx.circle(gx, gy, 4);
    gfx.fill({ color: colors[g], alpha: 0.35 });
  }
}

export function drawGoldenKitchen(gfx: Graphics, size: number, animTick: number): void {
  gfx.clear();
  const cx = size / 2;
  const hatY = size * 0.2;
  gfx.roundRect(cx - 15, hatY, 30, 25, 4);
  gfx.fill({ color: 0xffdd44, alpha: 0.4 });
  gfx.circle(cx - 8, hatY, 10);
  gfx.circle(cx, hatY - 4, 12);
  gfx.circle(cx + 8, hatY, 10);
  gfx.fill({ color: 0xffee88, alpha: 0.35 });
  const tY = size * 0.55;
  gfx.roundRect(cx - 8, tY, 16, 20, 2);
  gfx.fill({ color: 0xeecc33, alpha: 0.4 });
  gfx.roundRect(cx - 12, tY + 18, 24, 5, 2);
  gfx.fill({ color: 0xddbb22, alpha: 0.4 });
  gfx.moveTo(cx - 8, tY + 4);
  gfx.quadraticCurveTo(cx - 16, tY + 8, cx - 8, tY + 14);
  gfx.moveTo(cx + 8, tY + 4);
  gfx.quadraticCurveTo(cx + 16, tY + 8, cx + 8, tY + 14);
  gfx.stroke({ width: 2, color: 0xddbb22, alpha: 0.4 });
  for (let s = 0; s < 5; s++) {
    const sx = cx + Math.sin(s * 2.5 + animTick * 0.008) * size * 0.35;
    const sy = size * 0.1 + s * size * 0.15;
    const twinkle = 0.2 + Math.sin(animTick * 0.06 + s * 1.5) * 0.2;
    gfx.star(sx, sy, 4, 3, 1.2, animTick * 0.01 + s);
    gfx.fill({ color: 0xffee44, alpha: twinkle });
  }
}
