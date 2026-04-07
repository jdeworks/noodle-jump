/** Enemy sprites — pure PixiJS drawing. */

import { Graphics } from "pixi.js";

// Re-export projectile API so existing imports from EnemySprites still work
export {
  drawProjectile,
  getProjectileVisual,
  projectileSpins,
  type ProjectileVisual,
} from "./ProjectileSprites";

/** Draw an enemy based on type. */
export function drawEnemy(gfx: Graphics, width: number, type: string): void {
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
