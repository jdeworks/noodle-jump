/** Enemy and projectile sprites. */

import { Graphics } from "pixi.js";

/** Draw an enemy sprite based on type. */
export function drawEnemy(
  gfx: Graphics,
  size: number,
  type: string,
): void {
  gfx.clear();
  const s = size / 2;

  switch (type) {
    case "rat":
      // Gray body
      gfx.ellipse(s, s + 2, s * 0.8, s * 0.6);
      gfx.fill(0x888888);
      // Ears
      gfx.circle(s - 4, s - 3, 3);
      gfx.circle(s + 4, s - 3, 3);
      gfx.fill(0xaa9999);
      // Eyes
      gfx.circle(s - 3, s, 1.5);
      gfx.circle(s + 3, s, 1.5);
      gfx.fill(0x000000);
      // Tail
      gfx.moveTo(s + 6, s + 3);
      gfx.quadraticCurveTo(s + 12, s + 1, s + 10, s - 3);
      gfx.stroke({ width: 1.5, color: 0xcc9999 });
      break;

    case "fish":
      // Blue body
      gfx.moveTo(s - 6, s);
      gfx.quadraticCurveTo(s, s - 6, s + 6, s);
      gfx.quadraticCurveTo(s, s + 6, s - 6, s);
      gfx.fill(0x4488cc);
      // Eye
      gfx.circle(s + 2, s - 1, 1.5);
      gfx.fill(0xffffff);
      gfx.circle(s + 2.5, s - 1, 0.8);
      gfx.fill(0x000000);
      // Tail fin
      gfx.moveTo(s - 6, s);
      gfx.lineTo(s - 10, s - 4);
      gfx.lineTo(s - 10, s + 4);
      gfx.closePath();
      gfx.fill(0x3377bb);
      break;

    case "alien":
      // Green body
      gfx.ellipse(s, s, s * 0.6, s * 0.8);
      gfx.fill(0x44cc44);
      // Big eyes
      gfx.ellipse(s - 3, s - 2, 3, 4);
      gfx.ellipse(s + 3, s - 2, 3, 4);
      gfx.fill(0x111111);
      gfx.circle(s - 3, s - 3, 1);
      gfx.circle(s + 3, s - 3, 1);
      gfx.fill({ color: 0xffffff, alpha: 0.4 });
      // Antennae
      gfx.moveTo(s - 2, s - 8);
      gfx.lineTo(s - 4, s - 12);
      gfx.moveTo(s + 2, s - 8);
      gfx.lineTo(s + 4, s - 12);
      gfx.stroke({ width: 1, color: 0x44cc44 });
      gfx.circle(s - 4, s - 12, 1.5);
      gfx.circle(s + 4, s - 12, 1.5);
      gfx.fill(0x88ff88);
      break;

    default:
      gfx.circle(s, s, s * 0.7);
      gfx.fill(0xff0000);
      break;
  }
}

/** Draw a projectile (thrown knife) — visible, knife-shaped. */
export function drawProjectile(gfx: Graphics, _size: number): void {
  gfx.clear();
  // Draw at fixed visible size regardless of collision size
  const bladeLen = 14;
  const bladeW = 4;
  const handleLen = 8;
  const handleW = 3;

  // Blade — sharp silver triangle pointing up
  gfx.moveTo(0, -bladeLen);          // tip
  gfx.lineTo(bladeW, 0);             // right base
  gfx.lineTo(-bladeW, 0);            // left base
  gfx.closePath();
  gfx.fill(0xdddddd);
  // Blade edge highlight
  gfx.moveTo(0, -bladeLen);
  gfx.lineTo(1, -2);
  gfx.stroke({ width: 1, color: 0xffffff, alpha: 0.6 });
  // Blade edge dark side
  gfx.moveTo(0, -bladeLen);
  gfx.lineTo(-1, -2);
  gfx.stroke({ width: 1, color: 0x999999, alpha: 0.4 });

  // Guard — small crossbar
  gfx.roundRect(-bladeW - 1, 0, (bladeW + 1) * 2, 2, 1);
  gfx.fill(0x888888);

  // Handle — brown wooden grip
  gfx.roundRect(-handleW / 2, 2, handleW, handleLen, 1);
  gfx.fill(0x885533);
  // Handle grip lines
  for (let hy = 4; hy < handleLen; hy += 3) {
    gfx.moveTo(-handleW / 2, hy);
    gfx.lineTo(handleW / 2, hy);
    gfx.stroke({ width: 0.5, color: 0x664422, alpha: 0.4 });
  }

  // Pommel — small circle at bottom
  gfx.circle(0, 2 + handleLen + 1, 2);
  gfx.fill(0x888888);
}
