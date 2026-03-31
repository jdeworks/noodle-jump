/** Boss sprites — multi-phase boss enemies and health bar. */

import { Graphics } from "pixi.js";

/** Draw a boss sprite based on type. */
export function drawBoss(
  gfx: Graphics,
  width: number,
  height: number,
  type: string,
  phase: number,
  animTick: number,
): void {
  gfx.clear();
  const cx = width / 2;
  const cy = height / 2;

  switch (type) {
    case "chef_rival": {
      // Evil chef — red outfit, angry face
      // Body
      gfx.roundRect(cx - 12, cy - 5, 24, 22, 4);
      gfx.fill(0xcc2222);
      // Head
      gfx.circle(cx, cy - 12, 10);
      gfx.fill(0xffcc99);
      // Evil hat
      gfx.roundRect(cx - 10, cy - 28, 20, 14, 3);
      gfx.fill(0x222222);
      gfx.circle(cx - 4, cy - 28, 6);
      gfx.circle(cx + 4, cy - 28, 6);
      gfx.circle(cx, cy - 30, 7);
      gfx.fill(0x333333);
      // Angry eyes
      gfx.moveTo(cx - 6, cy - 15);
      gfx.lineTo(cx - 2, cy - 13);
      gfx.stroke({ width: 2, color: 0x000000 });
      gfx.moveTo(cx + 6, cy - 15);
      gfx.lineTo(cx + 2, cy - 13);
      gfx.stroke({ width: 2, color: 0x000000 });
      gfx.circle(cx - 4, cy - 12, 1.5);
      gfx.circle(cx + 4, cy - 12, 1.5);
      gfx.fill(0x000000);
      // Evil grin
      gfx.moveTo(cx - 4, cy - 7);
      gfx.quadraticCurveTo(cx, cy - 4, cx + 4, cy - 7);
      gfx.stroke({ width: 1.5, color: 0x000000 });
      // Feet
      gfx.roundRect(cx - 10, cy + 15, 8, 5, 2);
      gfx.roundRect(cx + 2, cy + 15, 8, 5, 2);
      gfx.fill(0x111111);
      // Phase glow
      if (phase > 0) {
        const glowAlpha = 0.1 + phase * 0.1 + Math.sin(animTick * 0.1) * 0.05;
        gfx.circle(cx, cy, width * 0.5);
        gfx.fill({ color: 0xff0000, alpha: glowAlpha });
      }
      break;
    }

    case "kraken": {
      // Kraken head at top with tentacles reaching down
      // Head
      gfx.ellipse(cx, cy - 8, 22, 18);
      gfx.fill(0x446688);
      // Eyes
      gfx.ellipse(cx - 8, cy - 12, 5, 7);
      gfx.ellipse(cx + 8, cy - 12, 5, 7);
      gfx.fill(0xffee44);
      gfx.circle(cx - 8, cy - 12, 2);
      gfx.circle(cx + 8, cy - 12, 2);
      gfx.fill(0x000000);
      // Tentacles — animated wave
      for (let t = 0; t < 6; t++) {
        const tx = cx + (t - 2.5) * 9;
        const wave = Math.sin(animTick * 0.05 + t * 1.2) * 5;
        gfx.moveTo(tx, cy + 5);
        gfx.bezierCurveTo(
          tx + wave, cy + 15,
          tx - wave, cy + 25,
          tx + wave * 0.5, cy + 32,
        );
        gfx.stroke({ width: 3, color: 0x557799 });
        // Suction cups
        gfx.circle(tx + wave * 0.3, cy + 20, 1.5);
        gfx.fill({ color: 0x88aabb, alpha: 0.5 });
      }
      // Phase — gets redder/angrier
      if (phase > 0) {
        const tint = 0.05 * phase;
        gfx.ellipse(cx, cy - 8, 22, 18);
        gfx.fill({ color: 0xff2200, alpha: tint });
      }
      break;
    }

    case "ufo": {
      // Classic flying saucer
      // Dome
      gfx.ellipse(cx, cy - 6, 14, 10);
      gfx.fill({ color: 0x88ddff, alpha: 0.5 });
      gfx.ellipse(cx, cy - 6, 14, 10);
      gfx.stroke({ width: 1, color: 0xaaeeff, alpha: 0.6 });
      // Body disc
      gfx.ellipse(cx, cy + 2, 26, 8);
      gfx.fill(0x888899);
      gfx.ellipse(cx, cy, 26, 8);
      gfx.stroke({ width: 1.5, color: 0xaaaacc });
      // Lights — animated rotation
      for (let l = 0; l < 6; l++) {
        const angle = (l / 6) * Math.PI * 2 + animTick * 0.04;
        const lx = cx + Math.cos(angle) * 18;
        const ly = cy + 2 + Math.sin(angle) * 4;
        const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
        gfx.circle(lx, ly, 2);
        gfx.fill(colors[l]);
      }
      // Beam below (phase 1+)
      if (phase >= 1) {
        const beamAlpha = 0.1 + Math.sin(animTick * 0.08) * 0.05;
        gfx.moveTo(cx - 10, cy + 10);
        gfx.lineTo(cx + 10, cy + 10);
        gfx.lineTo(cx + 20, height);
        gfx.lineTo(cx - 20, height);
        gfx.closePath();
        gfx.fill({ color: 0xffff88, alpha: beamAlpha });
      }
      break;
    }
  }
}

/** Draw a boss health bar. */
export function drawBossHealthBar(
  gfx: Graphics,
  x: number,
  y: number,
  width: number,
  health: number,
  maxHealth: number,
): void {
  gfx.clear();
  const barH = 6;
  // Background
  gfx.roundRect(x, y, width, barH, 3);
  gfx.fill({ color: 0x000000, alpha: 0.5 });
  // Health fill
  const fillW = (health / maxHealth) * width;
  const color = health / maxHealth > 0.5 ? 0xff4444 : health / maxHealth > 0.25 ? 0xffaa22 : 0xff2222;
  gfx.roundRect(x, y, fillW, barH, 3);
  gfx.fill(color);
  // Border
  gfx.roundRect(x, y, width, barH, 3);
  gfx.stroke({ width: 1, color: 0xffffff, alpha: 0.3 });
}
