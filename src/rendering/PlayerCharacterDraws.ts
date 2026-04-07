/** Player character draw functions — 10 base + 3 unlockable characters. */

import { Graphics } from "pixi.js";

// ── 1. Chef (default) ──────────────────────────────────────────────
export function drawChefBase(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.15, h * 0.4, w * 0.7, h * 0.5, 3);
  gfx.fill(0xffffff);
  gfx.roundRect(w * 0.2, h * 0.2, w * 0.6, h * 0.25, 4);
  gfx.fill(0xf5cba7);
  gfx.roundRect(w * 0.15, h * 0.0, w * 0.7, h * 0.25, 4);
  gfx.fill(0xffffff);
  gfx.roundRect(w * 0.25, h * 0.0, w * 0.5, h * 0.08, 2);
  gfx.fill({ color: 0x000000, alpha: 0.08 });
  gfx.circle(w * 0.35, h * 0.33, 2);
  gfx.fill(0x222222);
  gfx.circle(w * 0.65, h * 0.33, 2);
  gfx.fill(0x222222);
  gfx.moveTo(w * 0.35, h * 0.38);
  gfx.quadraticCurveTo(w * 0.5, h * 0.45, w * 0.65, h * 0.38);
  gfx.stroke({ width: 1, color: 0x333333 });
  gfx.roundRect(w * 0.25, h * 0.5, w * 0.5, h * 0.3, 2);
  gfx.fill(0xe8e8e8);
  gfx.roundRect(w * 0.15, h * 0.88, w * 0.25, h * 0.12, 3);
  gfx.fill(0x333333);
  gfx.roundRect(w * 0.6, h * 0.88, w * 0.25, h * 0.12, 3);
  gfx.fill(0x333333);
}

// ── 2. Goblin ──────────────────────────────────────────────────────
export function drawGoblin(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.15, h * 0.4, w * 0.7, h * 0.48, 3);
  gfx.fill(0x8b6914);
  gfx.roundRect(w * 0.2, h * 0.18, w * 0.6, h * 0.28, 4);
  gfx.fill(0x44aa33);
  gfx.moveTo(w * 0.1, h * 0.3);
  gfx.lineTo(w * 0.2, h * 0.18);
  gfx.lineTo(w * 0.2, h * 0.35);
  gfx.closePath();
  gfx.fill(0x44aa33);
  gfx.moveTo(w * 0.9, h * 0.3);
  gfx.lineTo(w * 0.8, h * 0.18);
  gfx.lineTo(w * 0.8, h * 0.35);
  gfx.closePath();
  gfx.fill(0x44aa33);
  gfx.circle(w * 0.35, h * 0.32, 2.5);
  gfx.fill(0xffff00);
  gfx.circle(w * 0.65, h * 0.32, 2.5);
  gfx.fill(0xffff00);
  gfx.circle(w * 0.35, h * 0.32, 1);
  gfx.fill(0x111111);
  gfx.circle(w * 0.65, h * 0.32, 1);
  gfx.fill(0x111111);
  gfx.moveTo(w * 0.3, h * 0.4);
  gfx.quadraticCurveTo(w * 0.5, h * 0.5, w * 0.7, h * 0.4);
  gfx.stroke({ width: 1, color: 0x225511 });
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 3);
  gfx.fill(0x44aa33);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 3);
  gfx.fill(0x44aa33);
}

// ── 3. Grandma ─────────────────────────────────────────────────────
export function drawGrandma(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.1, h * 0.4, w * 0.8, h * 0.5, 3);
  gfx.fill(0x9944cc);
  gfx.roundRect(w * 0.2, h * 0.2, w * 0.6, h * 0.25, 4);
  gfx.fill(0xf5cba7);
  gfx.circle(w * 0.5, h * 0.12, w * 0.22);
  gfx.fill(0xbbbbbb);
  gfx.circle(w * 0.5, h * 0.06, w * 0.14);
  gfx.fill(0xcccccc);
  gfx.circle(w * 0.35, h * 0.32, 3);
  gfx.stroke({ width: 1, color: 0x444444 });
  gfx.circle(w * 0.65, h * 0.32, 3);
  gfx.stroke({ width: 1, color: 0x444444 });
  gfx.moveTo(w * 0.42, h * 0.32);
  gfx.lineTo(w * 0.58, h * 0.32);
  gfx.stroke({ width: 1, color: 0x444444 });
  gfx.circle(w * 0.35, h * 0.32, 1.2);
  gfx.fill(0x222222);
  gfx.circle(w * 0.65, h * 0.32, 1.2);
  gfx.fill(0x222222);
  gfx.moveTo(w * 0.38, h * 0.39);
  gfx.quadraticCurveTo(w * 0.5, h * 0.44, w * 0.62, h * 0.39);
  gfx.stroke({ width: 1, color: 0x333333 });
  gfx.roundRect(w * 0.15, h * 0.88, w * 0.25, h * 0.12, 3);
  gfx.fill(0x663399);
  gfx.roundRect(w * 0.6, h * 0.88, w * 0.25, h * 0.12, 3);
  gfx.fill(0x663399);
}

// ── 4. Robot ───────────────────────────────────────────────────────
export function drawRobot(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.12, h * 0.38, w * 0.76, h * 0.5, 2);
  gfx.fill(0x8899aa);
  gfx.roundRect(w * 0.25, h * 0.48, w * 0.5, h * 0.2, 2);
  gfx.fill(0x334455);
  gfx.circle(w * 0.35, h * 0.56, 2);
  gfx.fill(0x00ff44);
  gfx.circle(w * 0.5, h * 0.56, 2);
  gfx.fill(0xff4444);
  gfx.circle(w * 0.65, h * 0.56, 2);
  gfx.fill(0x44aaff);
  gfx.roundRect(w * 0.2, h * 0.18, w * 0.6, h * 0.24, 2);
  gfx.fill(0x99aabb);
  gfx.roundRect(w * 0.26, h * 0.22, w * 0.48, h * 0.14, 2);
  gfx.fill(0x112233);
  gfx.circle(w * 0.38, h * 0.29, 2.5);
  gfx.fill(0x00ffcc);
  gfx.circle(w * 0.62, h * 0.29, 2.5);
  gfx.fill(0x00ffcc);
  gfx.rect(w * 0.48, h * 0.04, w * 0.04, h * 0.15);
  gfx.fill(0x667788);
  gfx.circle(w * 0.5, h * 0.04, 3);
  gfx.fill(0xff3333);
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 2);
  gfx.fill(0x667788);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 2);
  gfx.fill(0x667788);
}

// ── 5. Ninja ───────────────────────────────────────────────────────
export function drawNinja(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.15, h * 0.38, w * 0.7, h * 0.5, 3);
  gfx.fill(0x222222);
  gfx.roundRect(w * 0.2, h * 0.15, w * 0.6, h * 0.28, 4);
  gfx.fill(0x222222);
  gfx.roundRect(w * 0.18, h * 0.26, w * 0.64, h * 0.1, 2);
  gfx.fill(0xf5cba7);
  gfx.circle(w * 0.35, h * 0.31, 2);
  gfx.fill(0x111111);
  gfx.circle(w * 0.65, h * 0.31, 2);
  gfx.fill(0x111111);
  gfx.roundRect(w * 0.15, h * 0.22, w * 0.7, h * 0.06, 1);
  gfx.fill(0xdd2222);
  gfx.moveTo(w * 0.85, h * 0.22);
  gfx.lineTo(w * 0.95, h * 0.18);
  gfx.lineTo(w * 0.85, h * 0.28);
  gfx.fill(0xdd2222);
  gfx.roundRect(w * 0.15, h * 0.6, w * 0.7, h * 0.06, 1);
  gfx.fill(0x555555);
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 3);
  gfx.fill(0x333333);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 3);
  gfx.fill(0x333333);
}

// ── 6. Princess ────────────────────────────────────────────────────
export function drawPrincess(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.08, h * 0.45, w * 0.84, h * 0.45, 4);
  gfx.fill(0xff66aa);
  gfx.roundRect(w * 0.2, h * 0.38, w * 0.6, h * 0.2, 3);
  gfx.fill(0xff66aa);
  gfx.roundRect(w * 0.22, h * 0.18, w * 0.56, h * 0.25, 4);
  gfx.fill(0xf5cba7);
  gfx.roundRect(w * 0.18, h * 0.12, w * 0.64, h * 0.14, 4);
  gfx.fill(0xffdd44);
  gfx.roundRect(w * 0.15, h * 0.2, w * 0.1, h * 0.25, 2);
  gfx.fill(0xffdd44);
  gfx.roundRect(w * 0.75, h * 0.2, w * 0.1, h * 0.25, 2);
  gfx.fill(0xffdd44);
  gfx.moveTo(w * 0.25, h * 0.12);
  gfx.lineTo(w * 0.3, h * 0.02);
  gfx.lineTo(w * 0.4, h * 0.1);
  gfx.lineTo(w * 0.5, h * 0.0);
  gfx.lineTo(w * 0.6, h * 0.1);
  gfx.lineTo(w * 0.7, h * 0.02);
  gfx.lineTo(w * 0.75, h * 0.12);
  gfx.closePath();
  gfx.fill(0xffcc00);
  gfx.circle(w * 0.5, h * 0.07, 1.5);
  gfx.fill(0xff0044);
  gfx.circle(w * 0.38, h * 0.32, 2);
  gfx.fill(0x2244aa);
  gfx.circle(w * 0.62, h * 0.32, 2);
  gfx.fill(0x2244aa);
  gfx.moveTo(w * 0.4, h * 0.38);
  gfx.quadraticCurveTo(w * 0.5, h * 0.43, w * 0.6, h * 0.38);
  gfx.stroke({ width: 1, color: 0xcc3366 });
  gfx.roundRect(w * 0.18, h * 0.88, w * 0.22, h * 0.12, 3);
  gfx.fill(0xff88bb);
  gfx.roundRect(w * 0.6, h * 0.88, w * 0.22, h * 0.12, 3);
  gfx.fill(0xff88bb);
}

// ── 7. Alien ───────────────────────────────────────────────────────
export function drawAlien(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.15, h * 0.42, w * 0.7, h * 0.46, 3);
  gfx.fill(0xaabbcc);
  gfx.roundRect(w * 0.12, h * 0.15, w * 0.76, h * 0.32, 8);
  gfx.fill(0x55cc44);
  gfx.ellipse(w * 0.35, h * 0.3, w * 0.12, h * 0.1);
  gfx.fill(0x111111);
  gfx.ellipse(w * 0.65, h * 0.3, w * 0.12, h * 0.1);
  gfx.fill(0x111111);
  gfx.circle(w * 0.32, h * 0.27, 1.5);
  gfx.fill(0xffffff);
  gfx.circle(w * 0.62, h * 0.27, 1.5);
  gfx.fill(0xffffff);
  gfx.circle(w * 0.5, h * 0.42, 2);
  gfx.fill(0x338822);
  gfx.rect(w * 0.48, h * 0.02, w * 0.04, h * 0.14);
  gfx.fill(0x55cc44);
  gfx.circle(w * 0.5, h * 0.02, 3);
  gfx.fill(0x88ff66);
  gfx.roundRect(w * 0.2, h * 0.6, w * 0.6, h * 0.06, 1);
  gfx.fill(0x6688aa);
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 3);
  gfx.fill(0x889999);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 3);
  gfx.fill(0x889999);
}

// ── 8. Viking ──────────────────────────────────────────────────────
export function drawViking(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.12, h * 0.4, w * 0.76, h * 0.48, 3);
  gfx.fill(0x8b5e3c);
  gfx.roundRect(w * 0.12, h * 0.4, w * 0.76, h * 0.08, 2);
  gfx.fill(0xc9a86c);
  gfx.roundRect(w * 0.22, h * 0.2, w * 0.56, h * 0.25, 4);
  gfx.fill(0xf5cba7);
  gfx.roundRect(w * 0.22, h * 0.35, w * 0.56, h * 0.15, 3);
  gfx.fill(0x8b4513);
  gfx.roundRect(w * 0.18, h * 0.12, w * 0.64, h * 0.14, 3);
  gfx.fill(0x888888);
  gfx.moveTo(w * 0.18, h * 0.18);
  gfx.lineTo(w * 0.02, h * 0.04);
  gfx.lineTo(w * 0.15, h * 0.12);
  gfx.closePath();
  gfx.fill(0xcccc88);
  gfx.moveTo(w * 0.82, h * 0.18);
  gfx.lineTo(w * 0.98, h * 0.04);
  gfx.lineTo(w * 0.85, h * 0.12);
  gfx.closePath();
  gfx.fill(0xcccc88);
  gfx.circle(w * 0.38, h * 0.3, 2);
  gfx.fill(0x2255aa);
  gfx.circle(w * 0.62, h * 0.3, 2);
  gfx.fill(0x2255aa);
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 3);
  gfx.fill(0x664422);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 3);
  gfx.fill(0x664422);
}

// ── 9. Pirate ──────────────────────────────────────────────────────
export function drawPirate(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.15, h * 0.4, w * 0.7, h * 0.48, 3);
  gfx.fill(0xffffff);
  for (let i = 0; i < 4; i++) {
    gfx.roundRect(w * 0.15, h * (0.44 + i * 0.1), w * 0.7, h * 0.04, 0);
    gfx.fill(0xdd2222);
  }
  gfx.roundRect(w * 0.22, h * 0.2, w * 0.56, h * 0.25, 4);
  gfx.fill(0xf5cba7);
  gfx.roundRect(w * 0.1, h * 0.14, w * 0.8, h * 0.06, 1);
  gfx.fill(0x222222);
  gfx.roundRect(w * 0.2, h * 0.02, w * 0.6, h * 0.14, 3);
  gfx.fill(0x333333);
  gfx.circle(w * 0.5, h * 0.09, 3);
  gfx.fill(0xffffff);
  gfx.circle(w * 0.63, h * 0.32, 3);
  gfx.fill(0x111111);
  gfx.moveTo(w * 0.55, h * 0.22);
  gfx.lineTo(w * 0.63, h * 0.3);
  gfx.stroke({ width: 1, color: 0x111111 });
  gfx.circle(w * 0.37, h * 0.32, 2);
  gfx.fill(0x222222);
  gfx.moveTo(w * 0.35, h * 0.4);
  gfx.quadraticCurveTo(w * 0.5, h * 0.47, w * 0.65, h * 0.4);
  gfx.stroke({ width: 1, color: 0x333333 });
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 3);
  gfx.fill(0x443322);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 3);
  gfx.fill(0x443322);
}

// ── 10. Wizard ─────────────────────────────────────────────────────
export function drawWizard(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.1, h * 0.4, w * 0.8, h * 0.5, 3);
  gfx.fill(0x332266);
  gfx.circle(w * 0.3, h * 0.55, 1.5);
  gfx.fill(0xffdd44);
  gfx.circle(w * 0.5, h * 0.65, 1.5);
  gfx.fill(0xffdd44);
  gfx.circle(w * 0.7, h * 0.55, 1.5);
  gfx.fill(0xffdd44);
  gfx.roundRect(w * 0.25, h * 0.25, w * 0.5, h * 0.2, 4);
  gfx.fill(0xf5cba7);
  gfx.moveTo(w * 0.3, h * 0.38);
  gfx.lineTo(w * 0.5, h * 0.65);
  gfx.lineTo(w * 0.7, h * 0.38);
  gfx.closePath();
  gfx.fill(0xcccccc);
  gfx.moveTo(w * 0.15, h * 0.27);
  gfx.lineTo(w * 0.5, h * -0.05);
  gfx.lineTo(w * 0.85, h * 0.27);
  gfx.closePath();
  gfx.fill(0x5533aa);
  gfx.roundRect(w * 0.1, h * 0.24, w * 0.8, h * 0.06, 2);
  gfx.fill(0x5533aa);
  gfx.circle(w * 0.5, h * 0.12, 2.5);
  gfx.fill(0xffdd44);
  gfx.circle(w * 0.38, h * 0.33, 2);
  gfx.fill(0x222222);
  gfx.circle(w * 0.62, h * 0.33, 2);
  gfx.fill(0x222222);
  gfx.roundRect(w * 0.15, h * 0.88, w * 0.25, h * 0.12, 3);
  gfx.fill(0x221144);
  gfx.roundRect(w * 0.6, h * 0.88, w * 0.25, h * 0.12, 3);
  gfx.fill(0x221144);
}
