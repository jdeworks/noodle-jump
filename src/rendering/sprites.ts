/** Pixel art sprite generation using PixiJS Graphics. Swappable with real assets later. */

import { Graphics } from "pixi.js";

// ── Power-up effect sprites ────────────────────────────────────────────────
// Each draws at (0,0)→(width,height) so pivot/squash animation works identically.

/** Horseshoe magnet with field-line arcs. */
export function drawMagnetSprite(
  gfx: Graphics,
  w: number,
  h: number,
  animTick: number,
): void {
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
export function drawTornadoSprite(
  gfx: Graphics,
  w: number,
  h: number,
  animTick: number,
): void {
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
export function drawLasagnaSprite(
  gfx: Graphics,
  w: number,
  h: number,
  animTick: number,
): void {
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
    gfx.quadraticCurveTo(w * dx + 1, top + 6 * layerH + dripLen, w * dx + 2, top + 6 * layerH + dripLen + 2);
    gfx.stroke({ width: 2, color: 0xffcc44 });
  }
  // Golden glow
  gfx.roundRect(w * 0.05, top - 3, w * 0.9, 6 * layerH + 6, 4);
  gfx.fill({ color: 0xffdd44, alpha: 0.1 });
}

/** Red pepper with sneeze explosion. */
export function drawPepperSprite(
  gfx: Graphics,
  w: number,
  h: number,
  animTick: number,
): void {
  gfx.clear();
  // Pepper body
  const cx = w / 2, cy = h * 0.45;
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
export function drawChiliSprite(
  gfx: Graphics,
  w: number,
  h: number,
  animTick: number,
): void {
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
export function drawSoggySprite(
  gfx: Graphics,
  w: number,
  h: number,
  animTick: number,
): void {
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
export function drawGarlicSprite(
  gfx: Graphics,
  w: number,
  h: number,
  animTick: number,
): void {
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
    gfx.fill({ color: 0x88ee44, alpha: 0.35 + Math.sin(animTick * 0.1 + i) * 0.15 });
  }
}

/** Charred toast with smoke wisps. */
export function drawBurntToastSprite(
  gfx: Graphics,
  w: number,
  h: number,
  animTick: number,
): void {
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

/** Draw chef riding a ravioli rocket. */
export function drawChefOnRocket(
  gfx: Graphics,
  width: number,
  height: number,
  animTick: number,
): void {
  gfx.clear();
  const w = width;
  const h = height;
  const rocketW = w * 1.2;
  const rocketH = h * 1.4;
  const ox = (w - rocketW) / 2; // center offset

  // ── Rocket body (ravioli shaped — rounded pillow) ──
  gfx.roundRect(
    ox + rocketW * 0.15,
    rocketH * 0.05,
    rocketW * 0.7,
    rocketH * 0.55,
    10,
  );
  gfx.fill(0xc0392b); // tomato red
  // Highlight
  gfx.roundRect(
    ox + rocketW * 0.25,
    rocketH * 0.08,
    rocketW * 0.3,
    rocketH * 0.15,
    6,
  );
  gfx.fill({ color: 0xffffff, alpha: 0.25 });

  // Ravioli crimp edges
  for (let cx = 0.2; cx <= 0.8; cx += 0.12) {
    gfx.circle(ox + rocketW * cx, rocketH * 0.05, 3);
    gfx.fill(0xd45a4a);
    gfx.circle(ox + rocketW * cx, rocketH * 0.58, 3);
    gfx.fill(0xd45a4a);
  }

  // ── Nose cone ──
  gfx.moveTo(ox + rocketW * 0.3, rocketH * 0.05);
  gfx.quadraticCurveTo(
    ox + rocketW * 0.5,
    -rocketH * 0.1,
    ox + rocketW * 0.7,
    rocketH * 0.05,
  );
  gfx.fill(0xe74c3c);

  // Window (porthole)
  gfx.circle(ox + rocketW * 0.5, rocketH * 0.2, rocketW * 0.1);
  gfx.fill(0x85c1e9);
  gfx.circle(ox + rocketW * 0.5, rocketH * 0.2, rocketW * 0.1);
  gfx.stroke({ width: 1, color: 0x333333, alpha: 0.5 });
  // Window highlight
  gfx.circle(ox + rocketW * 0.47, rocketH * 0.17, rocketW * 0.04);
  gfx.fill({ color: 0xffffff, alpha: 0.5 });

  // ── Fins ──
  // Left fin
  gfx.moveTo(ox + rocketW * 0.15, rocketH * 0.45);
  gfx.lineTo(ox, rocketH * 0.65);
  gfx.lineTo(ox + rocketW * 0.2, rocketH * 0.55);
  gfx.closePath();
  gfx.fill(0xe74c3c);
  // Right fin
  gfx.moveTo(ox + rocketW * 0.85, rocketH * 0.45);
  gfx.lineTo(ox + rocketW, rocketH * 0.65);
  gfx.lineTo(ox + rocketW * 0.8, rocketH * 0.55);
  gfx.closePath();
  gfx.fill(0xe74c3c);

  // ── Fire exhaust (animated) ──
  const fireFlicker = Math.sin(animTick * 0.3) * 0.15 + 0.85;
  const fireFlicker2 = Math.cos(animTick * 0.5) * 0.2 + 0.8;

  // Outer flame (yellow-orange)
  const flameH = rocketH * 0.4 * fireFlicker;
  gfx.moveTo(ox + rocketW * 0.3, rocketH * 0.58);
  gfx.quadraticCurveTo(
    ox + rocketW * 0.5,
    rocketH * 0.58 + flameH,
    ox + rocketW * 0.7,
    rocketH * 0.58,
  );
  gfx.fill(0xff8c00);

  // Inner flame (bright yellow)
  const innerFlameH = rocketH * 0.25 * fireFlicker2;
  gfx.moveTo(ox + rocketW * 0.35, rocketH * 0.58);
  gfx.quadraticCurveTo(
    ox + rocketW * 0.5,
    rocketH * 0.58 + innerFlameH,
    ox + rocketW * 0.65,
    rocketH * 0.58,
  );
  gfx.fill(0xffdd00);

  // Core flame (white-hot)
  const coreFlameH = rocketH * 0.12 * fireFlicker;
  gfx.moveTo(ox + rocketW * 0.4, rocketH * 0.58);
  gfx.quadraticCurveTo(
    ox + rocketW * 0.5,
    rocketH * 0.58 + coreFlameH,
    ox + rocketW * 0.6,
    rocketH * 0.58,
  );
  gfx.fill({ color: 0xffffff, alpha: 0.8 });
}

/** Draw a simple pixel-art chef character with optional effect visuals. */
export function drawChef(
  gfx: Graphics,
  width: number,
  height: number,
  tint?: number,
  effectType?: string,
): void {
  gfx.clear();
  const w = width;
  const h = height;

  // ── Effect-specific body modifications ──
  const bodyColor =
    effectType === "soggy_noodle"
      ? 0x99ccee
      : effectType === "burnt_toast"
        ? 0x665544
        : effectType === "garlic_breath"
          ? 0xccddaa
          : 0xffffff;
  const skinColor =
    effectType === "chili_pepper"
      ? 0xff8866
      : effectType === "garlic_breath"
        ? 0xbbcc88
        : effectType === "soggy_noodle"
          ? 0x99bbdd
          : 0xf5cba7;
  const hatColor =
    effectType === "fusilli_tornado"
      ? 0xffdd44
      : effectType === "lasagna_layers"
        ? 0xff8c00
        : effectType === "pepper_sneeze"
          ? 0xff4444
          : effectType === "meatball_magnet"
            ? 0xff66aa
            : effectType === "burnt_toast"
              ? 0x443322
              : bodyColor;

  // Body
  gfx.roundRect(w * 0.15, h * 0.4, w * 0.7, h * 0.5, 3);
  gfx.fill(bodyColor);

  // Head
  gfx.roundRect(w * 0.2, h * 0.2, w * 0.6, h * 0.25, 4);
  gfx.fill(skinColor);

  // Chef hat
  gfx.roundRect(w * 0.15, h * 0.0, w * 0.7, h * 0.25, 4);
  gfx.fill(hatColor);
  gfx.roundRect(w * 0.25, h * 0.0, w * 0.5, h * 0.08, 2);
  gfx.fill({ color: 0x000000, alpha: 0.08 });

  // ── Effect-specific hat decorations ──
  if (effectType === "fusilli_tornado") {
    // Swirl on hat
    for (let a = 0; a < Math.PI * 2; a += 0.5) {
      const r = 2 + a * 0.8;
      gfx.circle(w * 0.5 + Math.cos(a) * r, h * 0.1 + Math.sin(a) * r * 0.5, 1);
    }
    gfx.fill({ color: 0xaa8800, alpha: 0.4 });
  } else if (effectType === "lasagna_layers") {
    // Cheese drip from hat
    const cols = [0xff8c00, 0xffcc44, 0xff4444];
    for (let i = 0; i < 3; i++) {
      gfx.roundRect(w * 0.2, h * 0.02 + i * h * 0.06, w * 0.6, h * 0.05, 1);
      gfx.fill(cols[i]);
    }
  } else if (effectType === "pepper_sneeze") {
    // Pepper on hat
    gfx.moveTo(w * 0.45, h * 0.02);
    gfx.quadraticCurveTo(w * 0.6, h * 0.05, w * 0.55, h * 0.15);
    gfx.quadraticCurveTo(w * 0.45, h * 0.12, w * 0.45, h * 0.02);
    gfx.fill(0xcc0000);
  } else if (effectType === "meatball_magnet") {
    // Magnet icon on hat
    gfx.moveTo(w * 0.35, h * 0.03);
    gfx.lineTo(w * 0.35, h * 0.1);
    gfx.quadraticCurveTo(w * 0.5, h * 0.16, w * 0.65, h * 0.1);
    gfx.lineTo(w * 0.65, h * 0.03);
    gfx.stroke({ width: 2, color: 0xff3366 });
  } else if (effectType === "chili_pepper") {
    // Flame wisps on hat
    gfx.moveTo(w * 0.3, h * 0.04);
    gfx.lineTo(w * 0.35, h * -0.04);
    gfx.lineTo(w * 0.4, h * 0.04);
    gfx.fill(0xff6600);
    gfx.moveTo(w * 0.55, h * 0.04);
    gfx.lineTo(w * 0.6, h * -0.06);
    gfx.lineTo(w * 0.65, h * 0.04);
    gfx.fill(0xff8800);
  } else if (effectType === "garlic_breath") {
    // Stink cloud above hat
    gfx.circle(w * 0.35, h * -0.04, 3);
    gfx.circle(w * 0.55, h * -0.06, 2.5);
    gfx.circle(w * 0.7, h * -0.02, 2);
    gfx.fill({ color: 0x88ee44, alpha: 0.5 });
  } else if (effectType === "burnt_toast") {
    // Smoke from hat
    gfx.circle(w * 0.4, h * -0.04, 2.5);
    gfx.circle(w * 0.55, h * -0.08, 3);
    gfx.circle(w * 0.65, h * -0.03, 2);
    gfx.fill({ color: 0x666666, alpha: 0.4 });
  }

  // Eyes — expression changes per effect
  if (effectType === "chili_pepper") {
    // Angry X eyes
    gfx.moveTo(w * 0.3, h * 0.3);
    gfx.lineTo(w * 0.4, h * 0.36);
    gfx.moveTo(w * 0.4, h * 0.3);
    gfx.lineTo(w * 0.3, h * 0.36);
    gfx.moveTo(w * 0.6, h * 0.3);
    gfx.lineTo(w * 0.7, h * 0.36);
    gfx.moveTo(w * 0.7, h * 0.3);
    gfx.lineTo(w * 0.6, h * 0.36);
    gfx.stroke({ width: 1.5, color: 0xff0000 });
  } else if (effectType === "soggy_noodle") {
    // Droopy sad eyes
    gfx.circle(w * 0.35, h * 0.34, 2);
    gfx.circle(w * 0.65, h * 0.34, 2);
    gfx.fill(0x222222);
    // Tear drops
    gfx.circle(w * 0.35, h * 0.39, 1.2);
    gfx.circle(w * 0.65, h * 0.39, 1.2);
    gfx.fill(0x4499ee);
  } else if (effectType === "garlic_breath") {
    // Dizzy spiral eyes
    gfx.circle(w * 0.35, h * 0.33, 2.5);
    gfx.circle(w * 0.65, h * 0.33, 2.5);
    gfx.stroke({ width: 1, color: 0x228822 });
  } else if (effectType === "burnt_toast") {
    // Dazed dots
    gfx.circle(w * 0.35, h * 0.33, 1.5);
    gfx.circle(w * 0.65, h * 0.33, 1.5);
    gfx.fill(0x444444);
  } else {
    // Normal eyes
    gfx.circle(w * 0.35, h * 0.33, 2);
    gfx.fill(0x222222);
    gfx.circle(w * 0.65, h * 0.33, 2);
    gfx.fill(0x222222);
  }

  // Mouth — expression changes per effect
  if (effectType === "chili_pepper") {
    // Open screaming mouth
    gfx.circle(w * 0.5, h * 0.41, 3);
    gfx.fill(0x220000);
  } else if (effectType === "soggy_noodle" || effectType === "garlic_breath") {
    // Frown
    gfx.moveTo(w * 0.35, h * 0.42);
    gfx.quadraticCurveTo(w * 0.5, h * 0.38, w * 0.65, h * 0.42);
    gfx.stroke({ width: 1, color: 0x333333 });
  } else if (effectType === "burnt_toast") {
    // Wavy distressed mouth
    gfx.moveTo(w * 0.3, h * 0.4);
    gfx.quadraticCurveTo(w * 0.4, h * 0.43, w * 0.5, h * 0.39);
    gfx.quadraticCurveTo(w * 0.6, h * 0.43, w * 0.7, h * 0.4);
    gfx.stroke({ width: 1, color: 0x333333 });
  } else if (
    effectType === "fusilli_tornado" ||
    effectType === "ravioli_rocket" ||
    effectType === "pepper_sneeze" ||
    effectType === "meatball_magnet"
  ) {
    // Big grin
    gfx.moveTo(w * 0.3, h * 0.38);
    gfx.quadraticCurveTo(w * 0.5, h * 0.48, w * 0.7, h * 0.38);
    gfx.stroke({ width: 1.5, color: 0x333333 });
  } else {
    // Normal smile
    gfx.moveTo(w * 0.35, h * 0.38);
    gfx.quadraticCurveTo(w * 0.5, h * 0.45, w * 0.65, h * 0.38);
    gfx.stroke({ width: 1, color: 0x333333 });
  }

  // Apron
  const apronColor =
    effectType === "soggy_noodle"
      ? 0x88bbdd
      : effectType === "burnt_toast"
        ? 0x554433
        : 0xe8e8e8;
  gfx.roundRect(w * 0.25, h * 0.5, w * 0.5, h * 0.3, 2);
  gfx.fill(apronColor);

  // Feet
  gfx.roundRect(w * 0.15, h * 0.88, w * 0.25, h * 0.12, 3);
  gfx.fill(0x333333);
  gfx.roundRect(w * 0.6, h * 0.88, w * 0.25, h * 0.12, 3);
  gfx.fill(0x333333);

  // Power-up tint overlay
  if (tint != null) {
    gfx.roundRect(0, 0, w, h, 4);
    gfx.fill({ color: tint, alpha: 0.2 });
  }
}

export type PlatformStyle =
  | "normal"
  | "breaking"
  | "brittle"
  | "moving"
  | "lasagna";

/** Draw a platform with depth, texture, and type-specific visual markers. */
export function drawPlatform(
  gfx: Graphics,
  width: number,
  height: number,
  color: number,
  style: PlatformStyle = "normal",
): void {
  gfx.clear();

  // Shadow underneath
  gfx.roundRect(1, 2, width - 2, height, 4);
  gfx.fill({ color: 0x000000, alpha: 0.12 });

  // Main body
  gfx.roundRect(0, 0, width, height, 4);
  gfx.fill(color);

  switch (style) {
    case "breaking":
      // Crack lines across the surface
      gfx.moveTo(width * 0.2, 2);
      gfx.lineTo(width * 0.35, height - 2);
      gfx.stroke({ width: 1.5, color: 0x000000, alpha: 0.35 });
      gfx.moveTo(width * 0.6, 1);
      gfx.lineTo(width * 0.5, height / 2);
      gfx.lineTo(width * 0.7, height - 1);
      gfx.stroke({ width: 1, color: 0x000000, alpha: 0.3 });
      // Slightly rough edges
      gfx.roundRect(0, 0, width, height, 4);
      gfx.stroke({ width: 1, color: 0x000000, alpha: 0.15 });
      break;

    case "brittle":
      // Dotted/crumbly pattern — clearly different from breaking
      for (let dx = 6; dx < width - 6; dx += 8) {
        for (let dy = 3; dy < height - 2; dy += 5) {
          gfx.circle(dx + Math.random() * 3, dy, 1.5);
          gfx.fill({ color: 0x000000, alpha: 0.2 });
        }
      }
      // Dashed border
      for (let dx = 4; dx < width - 4; dx += 8) {
        gfx.rect(dx, 0, 4, 1.5);
        gfx.fill({ color: 0x000000, alpha: 0.2 });
        gfx.rect(dx, height - 1.5, 4, 1.5);
        gfx.fill({ color: 0x000000, alpha: 0.2 });
      }
      break;

    case "moving":
      // Arrow indicators on sides showing it moves
      // Left arrow
      gfx.moveTo(4, height / 2);
      gfx.lineTo(8, height / 2 - 3);
      gfx.lineTo(8, height / 2 + 3);
      gfx.closePath();
      gfx.fill({ color: 0xffffff, alpha: 0.4 });
      // Right arrow
      gfx.moveTo(width - 4, height / 2);
      gfx.lineTo(width - 8, height / 2 - 3);
      gfx.lineTo(width - 8, height / 2 + 3);
      gfx.closePath();
      gfx.fill({ color: 0xffffff, alpha: 0.4 });
      // Top highlight
      gfx.roundRect(3, 1, width - 6, 3, 2);
      gfx.fill({ color: 0xffffff, alpha: 0.2 });
      break;

    case "lasagna":
      // Stacked layers
      const stripeH = 3;
      for (let sy = 2; sy < height - 2; sy += stripeH + 1) {
        const stripeColor = sy % 2 === 0 ? 0xffcc00 : 0xff6600;
        gfx.roundRect(3, sy, width - 6, stripeH, 1);
        gfx.fill({ color: stripeColor, alpha: 0.5 });
      }
      // Cheese dots
      for (let cx = 10; cx < width - 10; cx += 16) {
        gfx.circle(cx, 4, 2);
        gfx.fill({ color: 0xffee88, alpha: 0.6 });
      }
      // Glowing border
      gfx.roundRect(0, 0, width, height, 4);
      gfx.stroke({ width: 1.5, color: 0xffaa00, alpha: 0.6 });
      break;

    default:
      // Normal platform
      gfx.roundRect(3, 1, width - 6, 3, 2);
      gfx.fill({ color: 0xffffff, alpha: 0.25 });
      for (let x = 8; x < width - 8; x += 12) {
        gfx.rect(x, 4, 6, 1);
        gfx.fill({ color: 0x000000, alpha: 0.06 });
      }
      break;
  }
}

/**
 * Draw a meatball with faux-3D shading.
 * Use scaleX oscillation on the container to simulate spinning.
 */
export function drawMeatball(gfx: Graphics, size: number): void {
  gfx.clear();
  const r = size / 2;

  // Shadow
  gfx.ellipse(r, r + 2, r * 0.8, r * 0.3);
  gfx.fill({ color: 0x000000, alpha: 0.15 });

  // Main ball
  gfx.circle(r, r, r);
  gfx.fill(0x8b4513);

  // Dark rim (3D depth)
  gfx.circle(r, r, r);
  gfx.stroke({ width: 1.5, color: 0x5a2d0c, alpha: 0.4 });

  // Specular highlight
  gfx.circle(r - r * 0.25, r - r * 0.25, r * 0.35);
  gfx.fill({ color: 0xffffff, alpha: 0.3 });

  // Small secondary highlight
  gfx.circle(r + r * 0.2, r - r * 0.15, r * 0.15);
  gfx.fill({ color: 0xffffff, alpha: 0.15 });
}

/** Draw a power-up diamond with type-specific inner icon and glow. */
const NEGATIVE_TYPES = [
  "chili_pepper",
  "soggy_noodle",
  "garlic_breath",
  "burnt_toast",
];

export function drawPowerUp(
  gfx: Graphics,
  size: number,
  color: number,
  type: string,
): void {
  gfx.clear();
  const s = size / 2;
  const isNegative = NEGATIVE_TYPES.includes(type);

  // Circular background with glow
  gfx.circle(s, s, s + 3);
  gfx.fill({ color: isNegative ? 0xff0000 : color, alpha: 0.2 });
  gfx.circle(s, s, s);
  gfx.fill(isNegative ? 0x221111 : 0x112211);
  gfx.circle(s, s, s);
  gfx.stroke({ width: 1.5, color: isNegative ? 0xff4444 : color });

  // Draw type-specific icon
  drawPowerUpIcon(gfx, s, type, color);
}

function drawPowerUpIcon(
  gfx: Graphics,
  s: number,
  type: string,
  color: number,
): void {
  switch (type) {
    // ── Positive power-ups ─────────────────────────────────────────
    case "spaghetti_spring": {
      // Bouncy spring — bright yellow coils
      for (let i = 0; i < 5; i++) {
        const y = s - 6 + i * 3;
        gfx.moveTo(s - 5, y);
        gfx.quadraticCurveTo(s, y - 2.5, s + 5, y);
        gfx.quadraticCurveTo(s, y + 2.5, s - 5, y + 1.5);
      }
      gfx.stroke({ width: 2, color: 0xffdd33 });
      // Arrow up
      gfx.moveTo(s, s - 8);
      gfx.lineTo(s - 3, s - 5);
      gfx.moveTo(s, s - 8);
      gfx.lineTo(s + 3, s - 5);
      gfx.stroke({ width: 1.5, color: 0xffffff });
      break;
    }
    case "fusilli_tornado": {
      // Golden tornado spiral
      for (let a = 0; a < Math.PI * 4; a += 0.3) {
        const r = 1.5 + a * 0.7;
        const px = s + Math.cos(a) * r;
        const py = s + Math.sin(a) * r * 0.5;
        gfx.circle(px, py, 1.2);
      }
      gfx.fill(0xffcc33);
      // Wind lines
      for (let i = -2; i <= 2; i += 2) {
        gfx.moveTo(s - 7, s + i);
        gfx.lineTo(s - 4, s + i);
        gfx.moveTo(s + 4, s + i);
        gfx.lineTo(s + 7, s + i);
      }
      gfx.stroke({ width: 1, color: 0xffee88 });
      break;
    }
    case "ravioli_rocket": {
      // Red rocket with flame
      gfx.roundRect(s - 2.5, s - 5, 5, 9, 1.5);
      gfx.fill(0xff3333);
      gfx.moveTo(s, s - 8);
      gfx.lineTo(s + 3, s - 4);
      gfx.lineTo(s - 3, s - 4);
      gfx.closePath();
      gfx.fill(0xff6666);
      // Fins
      gfx.moveTo(s - 2.5, s + 2);
      gfx.lineTo(s - 6, s + 6);
      gfx.lineTo(s - 2.5, s + 4);
      gfx.closePath();
      gfx.fill(0xcc2222);
      gfx.moveTo(s + 2.5, s + 2);
      gfx.lineTo(s + 6, s + 6);
      gfx.lineTo(s + 2.5, s + 4);
      gfx.closePath();
      gfx.fill(0xcc2222);
      // Flame
      gfx.moveTo(s - 2, s + 4);
      gfx.lineTo(s, s + 9);
      gfx.lineTo(s + 2, s + 4);
      gfx.fill(0xff8800);
      gfx.moveTo(s - 1, s + 5);
      gfx.lineTo(s, s + 7);
      gfx.lineTo(s + 1, s + 5);
      gfx.fill(0xffee44);
      break;
    }
    case "lasagna_layers": {
      // Colorful stacked layers
      const layerColors = [0xff8c00, 0xffdd44, 0xff4444, 0xffdd44, 0xff8c00];
      for (let i = 0; i < 5; i++) {
        gfx.roundRect(s - 6, s - 5 + i * 2.5, 12, 2.5, 0.8);
        gfx.fill(layerColors[i]);
      }
      // Cheese drips
      gfx.moveTo(s - 4, s + 7);
      gfx.quadraticCurveTo(s - 4, s + 9, s - 3, s + 9);
      gfx.stroke({ width: 1.5, color: 0xffdd44 });
      gfx.moveTo(s + 3, s + 7);
      gfx.quadraticCurveTo(s + 3, s + 10, s + 4, s + 10);
      gfx.stroke({ width: 1.5, color: 0xffdd44 });
      break;
    }
    case "pepper_sneeze": {
      // Dark red pepper with sneeze burst
      gfx.moveTo(s, s - 5);
      gfx.quadraticCurveTo(s + 6, s - 2, s + 4, s + 4);
      gfx.quadraticCurveTo(s + 1, s + 7, s - 1, s + 5);
      gfx.quadraticCurveTo(s - 5, s + 1, s - 3, s - 3);
      gfx.quadraticCurveTo(s - 2, s - 6, s, s - 5);
      gfx.fill(0xcc0000);
      // Stem
      gfx.moveTo(s - 1, s - 5);
      gfx.lineTo(s, s - 8);
      gfx.lineTo(s + 1, s - 5);
      gfx.fill(0x33aa33);
      // Sneeze stars
      for (const [dx, dy] of [
        [6, -3],
        [7, 0],
        [5, 3],
      ]) {
        gfx.star(s + dx, s + dy, 4, 1.5, 0.6, 0);
        gfx.fill(0xffff44);
      }
      break;
    }
    case "meatball_magnet": {
      // Bright horseshoe magnet
      gfx.moveTo(s - 5, s - 6);
      gfx.lineTo(s - 5, s + 1);
      gfx.quadraticCurveTo(s, s + 7, s + 5, s + 1);
      gfx.lineTo(s + 5, s - 6);
      gfx.lineTo(s + 3, s - 6);
      gfx.lineTo(s + 3, s + 1);
      gfx.quadraticCurveTo(s, s + 4, s - 3, s + 1);
      gfx.lineTo(s - 3, s - 6);
      gfx.closePath();
      gfx.fill(0xff3366);
      // Blue + red tips
      gfx.rect(s - 5, s - 6, 2, 4);
      gfx.fill(0x3366ff);
      gfx.rect(s + 3, s - 6, 2, 4);
      gfx.fill(0xff3333);
      // Field arcs
      for (let i = 1; i <= 2; i++) {
        gfx.moveTo(s - 1, s - 6 - i * 2);
        gfx.quadraticCurveTo(s, s - 8 - i * 2, s + 1, s - 6 - i * 2);
        gfx.stroke({ width: 0.8, color: 0xffffff, alpha: 0.4 });
      }
      break;
    }

    // ── Negative power-ups ─────────────────────────────────────────
    case "chili_pepper": {
      // Bright red chili with flames — inverts controls
      gfx.moveTo(s - 1, s - 4);
      gfx.quadraticCurveTo(s + 6, s - 1, s + 3, s + 5);
      gfx.quadraticCurveTo(s, s + 8, s - 2, s + 5);
      gfx.quadraticCurveTo(s - 5, s + 1, s - 1, s - 4);
      gfx.fill(0xff2200);
      gfx.stroke({ width: 1, color: 0xff6644 });
      // Stem
      gfx.moveTo(s - 1, s - 4);
      gfx.lineTo(s, s - 7);
      gfx.lineTo(s + 1, s - 4);
      gfx.fill(0x33bb33);
      // Flame wisps
      gfx.moveTo(s - 4, s + 2);
      gfx.lineTo(s - 6, s - 1);
      gfx.lineTo(s - 3, s);
      gfx.fill(0xff8800);
      gfx.moveTo(s + 4, s + 1);
      gfx.lineTo(s + 6, s - 2);
      gfx.lineTo(s + 3, s);
      gfx.fill(0xff8800);
      // Reversed arrows
      gfx.moveTo(s - 7, s + 6);
      gfx.lineTo(s - 4, s + 5);
      gfx.lineTo(s - 4, s + 7);
      gfx.fill(0xffff44);
      gfx.moveTo(s + 7, s + 6);
      gfx.lineTo(s + 4, s + 5);
      gfx.lineTo(s + 4, s + 7);
      gfx.fill(0xffff44);
      break;
    }
    case "soggy_noodle": {
      // Blue water droplet — platforms crumble
      gfx.moveTo(s, s - 6);
      gfx.quadraticCurveTo(s + 7, s + 2, s, s + 7);
      gfx.quadraticCurveTo(s - 7, s + 2, s, s - 6);
      gfx.fill(0x4499ee);
      gfx.stroke({ width: 1, color: 0x66bbff });
      // Highlight
      gfx.circle(s - 2, s, 2);
      gfx.fill({ color: 0xffffff, alpha: 0.35 });
      // Drip lines
      gfx.moveTo(s - 3, s + 7);
      gfx.lineTo(s - 3, s + 9);
      gfx.moveTo(s + 2, s + 7);
      gfx.lineTo(s + 2, s + 10);
      gfx.stroke({ width: 1, color: 0x66bbff });
      break;
    }
    case "garlic_breath": {
      // Green garlic bulb — weakens jumps
      // Bulb body
      gfx.circle(s, s + 1, 5);
      gfx.fill(0xccdd88);
      gfx.stroke({ width: 1, color: 0x88aa44 });
      // Clove lines
      gfx.moveTo(s, s - 4);
      gfx.lineTo(s, s + 6);
      gfx.moveTo(s - 4, s + 1);
      gfx.lineTo(s + 4, s + 1);
      gfx.stroke({ width: 0.8, color: 0x88aa44 });
      // Stem
      gfx.moveTo(s - 1, s - 4);
      gfx.lineTo(s, s - 7);
      gfx.lineTo(s + 1, s - 4);
      gfx.fill(0x66aa33);
      // Stink waves
      for (let i = -1; i <= 1; i++) {
        const wx = s + i * 4;
        gfx.moveTo(wx, s - 5);
        gfx.quadraticCurveTo(wx + 1, s - 7, wx, s - 9);
        gfx.stroke({ width: 1, color: 0x88ee44, alpha: 0.6 });
      }
      break;
    }
    case "burnt_toast": {
      // Charred toast slice — shrinks platforms
      gfx.roundRect(s - 5, s - 5, 10, 12, 2);
      gfx.fill(0x553311);
      gfx.stroke({ width: 1, color: 0x884422 });
      // Char marks
      gfx.roundRect(s - 3, s - 3, 6, 2, 0.5);
      gfx.fill(0x221100);
      gfx.roundRect(s - 2, s + 1, 4, 2, 0.5);
      gfx.fill(0x221100);
      // Smoke wisps
      gfx.moveTo(s - 3, s - 5);
      gfx.quadraticCurveTo(s - 4, s - 8, s - 2, s - 9);
      gfx.stroke({ width: 1, color: 0x888888, alpha: 0.5 });
      gfx.moveTo(s + 2, s - 5);
      gfx.quadraticCurveTo(s + 3, s - 8, s + 1, s - 10);
      gfx.stroke({ width: 1, color: 0x888888, alpha: 0.5 });
      break;
    }
  }
}
