/** Unlockable character draw functions — Neon Chef, Nyan Cat, Skeleton. */

import { Graphics } from "pixi.js";

export function drawNeonChef(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.2, h * 0.4, w * 0.6, h * 0.45, 4);
  gfx.stroke({ width: 2, color: 0x00ffff });
  gfx.fill({ color: 0x00ffff, alpha: 0.08 });
  gfx.circle(w / 2, h * 0.3, w * 0.25);
  gfx.stroke({ width: 2, color: 0x00ffff });
  gfx.fill({ color: 0x00ffff, alpha: 0.08 });
  gfx.roundRect(w * 0.22, h * 0.02, w * 0.56, h * 0.22, 3);
  gfx.stroke({ width: 2, color: 0xff00ff });
  gfx.fill({ color: 0xff00ff, alpha: 0.06 });
  gfx.circle(w * 0.38, h * 0.3, 2);
  gfx.fill(0x00ffff);
  gfx.circle(w * 0.62, h * 0.3, 2);
  gfx.fill(0x00ffff);
  gfx.roundRect(w * 0.18, h * 0.85, w * 0.25, h * 0.1, 2);
  gfx.stroke({ width: 1.5, color: 0x00ffff });
  gfx.roundRect(w * 0.57, h * 0.85, w * 0.25, h * 0.1, 2);
  gfx.stroke({ width: 1.5, color: 0x00ffff });
}

export function drawNyanCat(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.12, h * 0.28, w * 0.76, h * 0.44, 3);
  gfx.fill(0xffcc88);
  gfx.roundRect(w * 0.16, h * 0.32, w * 0.68, h * 0.36, 2);
  gfx.fill(0xff88aa);
  gfx.rect(w * 0.3, h * 0.4, 2, 2);
  gfx.fill(0xff4444);
  gfx.rect(w * 0.5, h * 0.45, 2, 2);
  gfx.fill(0x44ff44);
  gfx.rect(w * 0.65, h * 0.38, 2, 2);
  gfx.fill(0x4444ff);
  gfx.rect(w * 0.4, h * 0.52, 2, 2);
  gfx.fill(0xffff44);
  gfx.circle(w * 0.5, h * 0.22, w * 0.18);
  gfx.fill(0x999999);
  gfx.moveTo(w * 0.35, h * 0.12);
  gfx.lineTo(w * 0.3, h * 0.02);
  gfx.lineTo(w * 0.42, h * 0.1);
  gfx.closePath();
  gfx.fill(0x999999);
  gfx.moveTo(w * 0.65, h * 0.12);
  gfx.lineTo(w * 0.7, h * 0.02);
  gfx.lineTo(w * 0.58, h * 0.1);
  gfx.closePath();
  gfx.fill(0x999999);
  gfx.circle(w * 0.42, h * 0.2, 2);
  gfx.fill(0x111111);
  gfx.circle(w * 0.58, h * 0.2, 2);
  gfx.fill(0x111111);
  gfx.ellipse(w * 0.5, h * 0.25, 3, 1.5);
  gfx.fill(0xff6688);
  gfx.roundRect(w * 0.2, h * 0.72, w * 0.12, h * 0.18, 2);
  gfx.fill(0x888888);
  gfx.roundRect(w * 0.68, h * 0.72, w * 0.12, h * 0.18, 2);
  gfx.fill(0x888888);
}

export function drawSkeleton(gfx: Graphics, w: number, h: number): void {
  gfx.circle(w / 2, h * 0.2, w * 0.25);
  gfx.fill(0xeeeeee);
  gfx.circle(w * 0.38, h * 0.18, 3);
  gfx.fill(0x111111);
  gfx.circle(w * 0.62, h * 0.18, 3);
  gfx.fill(0x111111);
  gfx.moveTo(w * 0.48, h * 0.24);
  gfx.lineTo(w * 0.52, h * 0.24);
  gfx.lineTo(w * 0.5, h * 0.27);
  gfx.closePath();
  gfx.fill(0x222222);
  gfx.roundRect(w * 0.32, h * 0.28, w * 0.36, h * 0.06, 2);
  gfx.fill(0xdddddd);
  for (let i = 0; i < 4; i++) {
    const y = h * 0.38 + i * 6;
    gfx.roundRect(w * 0.25, y, w * 0.5, 2, 1);
    gfx.fill(0xdddddd);
  }
  gfx.roundRect(w * 0.48, h * 0.35, w * 0.04, h * 0.35, 1);
  gfx.fill(0xcccccc);
  gfx.roundRect(w * 0.3, h * 0.72, w * 0.08, h * 0.22, 2);
  gfx.fill(0xdddddd);
  gfx.roundRect(w * 0.62, h * 0.72, w * 0.08, h * 0.22, 2);
  gfx.fill(0xdddddd);
  gfx.roundRect(w * 0.12, h * 0.38, w * 0.1, h * 0.25, 2);
  gfx.fill(0xdddddd);
  gfx.roundRect(w * 0.78, h * 0.38, w * 0.1, h * 0.25, 2);
  gfx.fill(0xdddddd);
}
