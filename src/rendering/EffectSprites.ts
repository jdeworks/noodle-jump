/** Power-up effect sprites — animated overlays drawn on the active effect display. */

import { Graphics } from "pixi.js";

/** Horseshoe magnet with field-line arcs. */
export function drawMagnetSprite(gfx: Graphics, w: number, h: number, animTick: number): void {
  gfx.clear();
  // Magnet body (U-shape)
  const mx = w * 0.15,
    mw = w * 0.7,
    my = h * 0.1,
    mh = h * 0.75;
  gfx.moveTo(mx, my);
  gfx.lineTo(mx, my + mh * 0.6);
  gfx.quadraticCurveTo(mx + mw / 2, my + mh + 4, mx + mw, my + mh * 0.6);
  gfx.lineTo(mx + mw, my);
  gfx.lineTo(mx + mw - w * 0.2, my);
  gfx.lineTo(mx + mw - w * 0.2, my + mh * 0.55);
  gfx.quadraticCurveTo(mx + mw / 2, my + mh - 4, mx + w * 0.2, my + mh * 0.55);
  gfx.lineTo(mx + w * 0.2, my);
  gfx.closePath();
  gfx.fill(0xdd3355);
  // Tips
  gfx.rect(mx, my, w * 0.2, h * 0.18);
  gfx.fill(0x3366ff);
  gfx.rect(mx + mw - w * 0.2, my, w * 0.2, h * 0.18);
  gfx.fill(0xff3333);
  // Pulsing field arcs
  const pulse = 0.8 + Math.sin(animTick * 0.15) * 0.2;
  for (let i = 1; i <= 3; i++) {
    const r = i * 5 * pulse;
    gfx.moveTo(w / 2 - r, my - 2);
    gfx.quadraticCurveTo(w / 2, my - 2 - r, w / 2 + r, my - 2);
    gfx.stroke({ width: 1.2, color: 0xffffff, alpha: 0.5 - i * 0.12 });
  }
}

/** Spinning fusilli tornado. */
export function drawTornadoSprite(gfx: Graphics, w: number, h: number, animTick: number): void {
  gfx.clear();
  // Funnel shape — wide at top, narrow at bottom, spinning
  const layers = 8;
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const cy = h * 0.1 + t * h * 0.8;
    const spread = w * 0.45 * (1 - t * 0.6);
    const wobble = Math.sin(animTick * 0.2 + i * 0.8) * spread * 0.3;
    const color = i % 2 === 0 ? 0xdda833 : 0xeebb44;
    gfx.ellipse(w / 2 + wobble, cy, spread, h * 0.06);
    gfx.fill({ color, alpha: 0.85 - t * 0.2 });
  }
  // Wind lines
  for (let i = 0; i < 3; i++) {
    const ly = h * 0.2 + i * h * 0.25;
    const lx = w * 0.1 + Math.sin(animTick * 0.12 + i) * 6;
    gfx.moveTo(lx, ly);
    gfx.lineTo(lx - 8, ly + 2);
    gfx.moveTo(w - lx, ly + 5);
    gfx.lineTo(w - lx + 8, ly + 7);
    gfx.stroke({ width: 1, color: 0xffee88, alpha: 0.5 });
  }
}

/** Floating lasagna stack with cheese drips. */
export function drawLasagnaSprite(gfx: Graphics, w: number, h: number, animTick: number): void {
  gfx.clear();
  const colors = [0xcc6600, 0xffcc44, 0xcc3333, 0xffcc44, 0xcc6600, 0xff8c00];
  const layerH = h * 0.1;
  const top = h * 0.15;
  for (let i = 0; i < 6; i++) {
    const wobble = Math.sin(animTick * 0.06 + i * 0.5) * 1.5;
    gfx.roundRect(w * 0.1, top + i * layerH + wobble, w * 0.8, layerH, 2);
    gfx.fill(colors[i]);
  }
  // Cheese drips
  const drips = [0.2, 0.5, 0.75];
  for (const dx of drips) {
    const dripLen = 4 + Math.sin(animTick * 0.05 + dx * 10) * 3;
    gfx.moveTo(w * dx, top + 6 * layerH);
    gfx.quadraticCurveTo(
      w * dx + 1,
      top + 6 * layerH + dripLen,
      w * dx + 2,
      top + 6 * layerH + dripLen + 2,
    );
    gfx.stroke({ width: 2, color: 0xffcc44 });
  }
  // Golden glow
  gfx.roundRect(w * 0.05, top - 3, w * 0.9, 6 * layerH + 6, 4);
  gfx.fill({ color: 0xffdd44, alpha: 0.1 });
}

/** Red pepper with sneeze explosion. */
export function drawPepperSprite(gfx: Graphics, w: number, h: number, animTick: number): void {
  gfx.clear();
  // Pepper body
  const cx = w / 2,
    cy = h * 0.45;
  gfx.moveTo(cx - 2, h * 0.15);
  gfx.quadraticCurveTo(cx + w * 0.35, h * 0.2, cx + w * 0.25, cy + h * 0.15);
  gfx.quadraticCurveTo(cx + w * 0.1, h * 0.85, cx - w * 0.05, h * 0.8);
  gfx.quadraticCurveTo(cx - w * 0.3, h * 0.5, cx - w * 0.2, h * 0.2);
  gfx.quadraticCurveTo(cx - w * 0.1, h * 0.1, cx - 2, h * 0.15);
  gfx.fill(0xcc0000);
  gfx.stroke({ width: 1, color: 0x880000 });
  // Stem
  gfx.moveTo(cx - 4, h * 0.15);
  gfx.quadraticCurveTo(cx, h * 0.02, cx + 4, h * 0.08);
  gfx.stroke({ width: 2.5, color: 0x33aa33 });
  // Sneeze burst particles
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI - Math.PI / 2 + Math.sin(animTick * 0.1) * 0.3;
    const dist = 8 + Math.sin(animTick * 0.15 + i) * 4;
    const px = cx + Math.cos(angle) * dist;
    const py = h * 0.15 + Math.sin(angle) * dist;
    gfx.star(px, py, 4, 2, 0.8, animTick * 0.05 + i);
    gfx.fill({ color: 0xffff44, alpha: 0.7 });
  }
}

/** Bright red chili with animated flames. */
export function drawChiliSprite(gfx: Graphics, w: number, h: number, animTick: number): void {
  gfx.clear();
  // Chili body
  const cx = w / 2;
  gfx.moveTo(cx, h * 0.2);
  gfx.quadraticCurveTo(cx + w * 0.35, h * 0.25, cx + w * 0.3, h * 0.55);
  gfx.quadraticCurveTo(cx + w * 0.15, h * 0.85, cx, h * 0.8);
  gfx.quadraticCurveTo(cx - w * 0.15, h * 0.85, cx - w * 0.3, h * 0.55);
  gfx.quadraticCurveTo(cx - w * 0.35, h * 0.25, cx, h * 0.2);
  gfx.fill(0xff2200);
  gfx.stroke({ width: 1, color: 0xcc0000 });
  // Highlight
  gfx.ellipse(cx - w * 0.08, h * 0.4, w * 0.08, h * 0.15);
  gfx.fill({ color: 0xff6644, alpha: 0.5 });
  // Stem
  gfx.moveTo(cx - 3, h * 0.2);
  gfx.quadraticCurveTo(cx, h * 0.05, cx + 4, h * 0.12);
  gfx.stroke({ width: 2.5, color: 0x33bb33 });
  // Animated flames on both sides
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i++) {
      const fy = h * 0.35 + i * h * 0.15;
      const fx = cx + side * (w * 0.32 + Math.sin(animTick * 0.2 + i) * 3);
      const fh = 6 + Math.sin(animTick * 0.25 + i * 2) * 3;
      gfx.moveTo(fx, fy + fh);
      gfx.quadraticCurveTo(fx + side * 4, fy, fx, fy - fh);
      gfx.fill(i === 0 ? 0xff8800 : 0xffcc00);
    }
  }
  // Angry eyes on the chili
  const ey = h * 0.42;
  gfx.moveTo(cx - 5, ey - 1);
  gfx.lineTo(cx - 2, ey + 2);
  gfx.moveTo(cx - 2, ey - 1);
  gfx.lineTo(cx - 5, ey + 2);
  gfx.moveTo(cx + 2, ey - 1);
  gfx.lineTo(cx + 5, ey + 2);
  gfx.moveTo(cx + 5, ey - 1);
  gfx.lineTo(cx + 2, ey + 2);
  gfx.stroke({ width: 1.5, color: 0xffff44 });
}

/** Blue water droplet — soggy noodle. */
export function drawSoggySprite(gfx: Graphics, w: number, h: number, animTick: number): void {
  gfx.clear();
  const cx = w / 2;
  // Main droplet
  gfx.moveTo(cx, h * 0.1);
  gfx.quadraticCurveTo(cx + w * 0.4, h * 0.45, cx, h * 0.82);
  gfx.quadraticCurveTo(cx - w * 0.4, h * 0.45, cx, h * 0.1);
  gfx.fill(0x4499ee);
  gfx.stroke({ width: 1.5, color: 0x2277cc });
  // Highlight
  gfx.ellipse(cx - w * 0.1, h * 0.35, w * 0.1, h * 0.15);
  gfx.fill({ color: 0xffffff, alpha: 0.35 });
  // Wobble ripples
  for (let i = 0; i < 3; i++) {
    const ry = h * 0.5 + i * h * 0.1;
    const rw = w * 0.2 + Math.sin(animTick * 0.1 + i) * w * 0.05;
    gfx.ellipse(cx, ry, rw, 2);
    gfx.stroke({ width: 0.8, color: 0x66bbff, alpha: 0.4 });
  }
  // Drips from bottom
  for (let i = 0; i < 2; i++) {
    const dx = cx + (i * 2 - 1) * w * 0.12;
    const dripY = h * 0.82 + Math.sin(animTick * 0.08 + i * 3) * 4;
    gfx.circle(dx, dripY + 4, 2);
    gfx.fill(0x66bbff);
  }
}

/** Green garlic bulb with stink clouds. */
export function drawGarlicSprite(gfx: Graphics, w: number, h: number, animTick: number): void {
  gfx.clear();
  const cx = w / 2;
  // Bulb body — three clove bumps
  gfx.circle(cx - w * 0.15, h * 0.5, w * 0.22);
  gfx.fill(0xddeeaa);
  gfx.circle(cx + w * 0.15, h * 0.5, w * 0.22);
  gfx.fill(0xddeeaa);
  gfx.circle(cx, h * 0.45, w * 0.25);
  gfx.fill(0xccdd88);
  // Clove lines
  gfx.moveTo(cx, h * 0.25);
  gfx.lineTo(cx, h * 0.7);
  gfx.stroke({ width: 1, color: 0x99aa66 });
  // Stem
  gfx.moveTo(cx - 3, h * 0.25);
  gfx.lineTo(cx, h * 0.08);
  gfx.lineTo(cx + 3, h * 0.25);
  gfx.fill(0x77aa44);
  // Animated stink clouds
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + animTick * 0.04;
    const dist = w * 0.35 + Math.sin(animTick * 0.06 + i) * 4;
    const px = cx + Math.cos(angle) * dist;
    const py = h * 0.4 + Math.sin(angle) * dist * 0.5;
    const sz = 3 + Math.sin(animTick * 0.08 + i * 2) * 1.5;
    gfx.circle(px, py, sz);
    gfx.fill({
      color: 0x88ee44,
      alpha: 0.35 + Math.sin(animTick * 0.1 + i) * 0.15,
    });
  }
}

/** Charred toast with smoke wisps. */
export function drawBurntToastSprite(gfx: Graphics, w: number, h: number, animTick: number): void {
  gfx.clear();
  // Toast body
  gfx.roundRect(w * 0.15, h * 0.2, w * 0.7, h * 0.65, 4);
  gfx.fill(0x553311);
  gfx.stroke({ width: 1.5, color: 0x774422 });
  // Char marks
  gfx.roundRect(w * 0.25, h * 0.32, w * 0.5, h * 0.06, 2);
  gfx.fill(0x221100);
  gfx.roundRect(w * 0.3, h * 0.45, w * 0.35, h * 0.06, 2);
  gfx.fill(0x221100);
  gfx.roundRect(w * 0.22, h * 0.58, w * 0.45, h * 0.06, 2);
  gfx.fill(0x221100);
  // Crust edge highlight
  gfx.roundRect(w * 0.15, h * 0.2, w * 0.7, h * 0.08, 4);
  gfx.fill({ color: 0x886644, alpha: 0.4 });
  // Animated smoke
  for (let i = 0; i < 3; i++) {
    const sx = w * 0.3 + i * w * 0.2;
    const sway = Math.sin(animTick * 0.06 + i * 2) * 4;
    const rise = (animTick * 0.5 + i * 20) % 20;
    const sy = h * 0.2 - rise;
    const alpha = Math.max(0, 0.4 - rise * 0.02);
    gfx.circle(sx + sway, sy, 3 + rise * 0.15);
    gfx.fill({ color: 0x888888, alpha });
  }
}
