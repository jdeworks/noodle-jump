/** Enemy and projectile sprites — pure PixiJS drawing. */

import { Graphics } from "pixi.js";

/** Draw an enemy based on type. */
export function drawEnemy(
  gfx: Graphics,
  width: number,
  type: string,
): void {
  gfx.clear();
  const w = width;
  const h = width;

  switch (type) {
    case "rat": {
      // Body
      gfx.ellipse(w / 2, h / 2 + 2, w * 0.4, h * 0.3);
      gfx.fill(0x666666);
      // Head
      gfx.circle(w * 0.7, h * 0.35, w * 0.2);
      gfx.fill(0x777777);
      // Ears
      gfx.circle(w * 0.65, h * 0.2, w * 0.08);
      gfx.fill(0xffaaaa);
      gfx.circle(w * 0.8, h * 0.22, w * 0.08);
      gfx.fill(0xffaaaa);
      // Eye
      gfx.circle(w * 0.75, h * 0.33, 2);
      gfx.fill(0x111111);
      // Tail
      gfx.moveTo(w * 0.15, h * 0.5);
      gfx.quadraticCurveTo(w * 0.05, h * 0.3, w * 0.1, h * 0.15);
      gfx.stroke({ width: 1.5, color: 0xff9999 });
      break;
    }
    case "fish": {
      // Body
      gfx.ellipse(w / 2, h / 2, w * 0.4, h * 0.25);
      gfx.fill(0x4488cc);
      // Tail
      gfx.moveTo(w * 0.15, h / 2);
      gfx.lineTo(w * 0.02, h * 0.3);
      gfx.lineTo(w * 0.02, h * 0.7);
      gfx.closePath();
      gfx.fill(0x3377bb);
      // Eye
      gfx.circle(w * 0.65, h * 0.42, 2.5);
      gfx.fill(0xffffff);
      gfx.circle(w * 0.66, h * 0.42, 1.5);
      gfx.fill(0x111111);
      // Fin
      gfx.moveTo(w * 0.45, h * 0.3);
      gfx.lineTo(w * 0.5, h * 0.15);
      gfx.lineTo(w * 0.6, h * 0.3);
      gfx.fill(0x3399dd);
      break;
    }
    default: {
      // Alien — simple flying saucer
      // Dome
      gfx.ellipse(w / 2, h * 0.35, w * 0.25, h * 0.2);
      gfx.fill(0x88ff88);
      // Saucer body
      gfx.ellipse(w / 2, h * 0.5, w * 0.45, h * 0.15);
      gfx.fill(0x999999);
      // Lights
      for (let lx = 0.25; lx <= 0.75; lx += 0.25) {
        gfx.circle(w * lx, h * 0.5, 2);
        gfx.fill(0xffff44);
      }
      // Eye
      gfx.circle(w / 2, h * 0.32, 2);
      gfx.fill(0x111111);
      break;
    }
  }
}

/** Draw a thrown knife — pixel-art kitchen knife style. */
export function drawProjectile(gfx: Graphics, _size: number): void {
  gfx.clear();
  // Pixel-art kitchen knife — blade points up (negative Y)
  // Total height ~28px, wide enough to see clearly

  // Blade — wide chef knife shape (wider at base, narrows to tip)
  gfx.moveTo(0, -16);          // tip
  gfx.lineTo(4, -12);          // right edge upper
  gfx.lineTo(5, -4);           // right edge — widest point
  gfx.lineTo(5, 0);            // right base
  gfx.lineTo(-2, 0);           // left base (cutting edge is straighter)
  gfx.lineTo(-2, -14);         // left edge — cutting edge
  gfx.closePath();
  gfx.fill(0xccccdd);

  // Blade highlight — lighter strip along the spine
  gfx.moveTo(2, -12);
  gfx.lineTo(4, -6);
  gfx.lineTo(4, 0);
  gfx.lineTo(3, 0);
  gfx.lineTo(3, -6);
  gfx.lineTo(1, -12);
  gfx.closePath();
  gfx.fill({ color: 0xffffff, alpha: 0.4 });

  // Cutting edge — dark line along the sharp side
  gfx.moveTo(-2, -14);
  gfx.lineTo(-2, 0);
  gfx.stroke({ width: 1, color: 0x888899 });

  // Bolster (guard between blade and handle)
  gfx.rect(-3, 0, 9, 3);
  gfx.fill(0x999999);

  // Handle — dark wood
  gfx.roundRect(-2, 3, 6, 12, 2);
  gfx.fill(0x553322);
  // Handle highlight
  gfx.roundRect(-1, 4, 2, 10, 1);
  gfx.fill({ color: 0x774433, alpha: 0.6 });
  // Rivets
  gfx.circle(1, 6, 1);
  gfx.fill(0xbbbbbb);
  gfx.circle(1, 11, 1);
  gfx.fill(0xbbbbbb);
}
