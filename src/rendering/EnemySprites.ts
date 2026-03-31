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

/** Draw a thrown knife — large, bright, clearly visible. */
export function drawProjectile(gfx: Graphics, _size: number): void {
  gfx.clear();

  // Blade — elongated triangle, bright white/silver
  const bladeLen = 18;
  const bladeW = 5;
  gfx.moveTo(0, -bladeLen);
  gfx.lineTo(bladeW, 0);
  gfx.lineTo(0, -2); // notch for depth
  gfx.lineTo(-bladeW, 0);
  gfx.closePath();
  gfx.fill(0xeeeeff);

  // Blade center line (sharp edge)
  gfx.moveTo(0, -bladeLen);
  gfx.lineTo(0, 0);
  gfx.stroke({ width: 1.5, color: 0xffffff, alpha: 0.8 });

  // Blade outline
  gfx.moveTo(0, -bladeLen);
  gfx.lineTo(bladeW, 0);
  gfx.lineTo(-bladeW, 0);
  gfx.closePath();
  gfx.stroke({ width: 1, color: 0xaaaacc, alpha: 0.5 });

  // Guard
  gfx.roundRect(-6, 0, 12, 3, 1);
  gfx.fill(0xaa8844);

  // Handle
  gfx.roundRect(-2.5, 3, 5, 10, 2);
  gfx.fill(0x774422);
  gfx.roundRect(-2.5, 3, 5, 10, 2);
  gfx.stroke({ width: 0.5, color: 0x553311, alpha: 0.4 });

  // Pommel
  gfx.circle(0, 14, 2.5);
  gfx.fill(0xaa8844);
}
