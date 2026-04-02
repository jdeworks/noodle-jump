/** Power-up type-specific icon drawing — extracted from ItemSprites. */

import { Graphics } from "pixi.js";

/** Draw the inner icon for a power-up based on its type. */
export function drawPowerUpIcon(
  gfx: Graphics,
  s: number,
  type: string,
  _color: number,
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
    case "chili_pepper":
      drawChiliIcon(gfx, s);
      break;
    case "soggy_noodle":
      drawSoggyIcon(gfx, s);
      break;
    case "garlic_breath":
      drawGarlicIcon(gfx, s);
      break;
    case "burnt_toast":
      drawBurntToastIcon(gfx, s);
      break;

    // ── New positive power-ups ────────────────────────────────────
    case "pasta_shield":
      drawPastaShieldIcon(gfx, s);
      break;
    case "gnocchi_bounce":
      drawGnocchiBounceIcon(gfx, s);
      break;
    case "minestrone_soup":
      drawMinestroneSoupIcon(gfx, s);
      break;
  }
}

function drawChiliIcon(gfx: Graphics, s: number): void {
  gfx.moveTo(s - 1, s - 4);
  gfx.quadraticCurveTo(s + 6, s - 1, s + 3, s + 5);
  gfx.quadraticCurveTo(s, s + 8, s - 2, s + 5);
  gfx.quadraticCurveTo(s - 5, s + 1, s - 1, s - 4);
  gfx.fill(0xff2200);
  gfx.stroke({ width: 1, color: 0xff6644 });
  gfx.moveTo(s - 1, s - 4);
  gfx.lineTo(s, s - 7);
  gfx.lineTo(s + 1, s - 4);
  gfx.fill(0x33bb33);
  gfx.moveTo(s - 4, s + 2);
  gfx.lineTo(s - 6, s - 1);
  gfx.lineTo(s - 3, s);
  gfx.fill(0xff8800);
  gfx.moveTo(s + 4, s + 1);
  gfx.lineTo(s + 6, s - 2);
  gfx.lineTo(s + 3, s);
  gfx.fill(0xff8800);
  gfx.moveTo(s - 7, s + 6);
  gfx.lineTo(s - 4, s + 5);
  gfx.lineTo(s - 4, s + 7);
  gfx.fill(0xffff44);
  gfx.moveTo(s + 7, s + 6);
  gfx.lineTo(s + 4, s + 5);
  gfx.lineTo(s + 4, s + 7);
  gfx.fill(0xffff44);
}

function drawSoggyIcon(gfx: Graphics, s: number): void {
  gfx.moveTo(s, s - 6);
  gfx.quadraticCurveTo(s + 7, s + 2, s, s + 7);
  gfx.quadraticCurveTo(s - 7, s + 2, s, s - 6);
  gfx.fill(0x4499ee);
  gfx.stroke({ width: 1, color: 0x66bbff });
  gfx.circle(s - 2, s, 2);
  gfx.fill({ color: 0xffffff, alpha: 0.35 });
  gfx.moveTo(s - 3, s + 7);
  gfx.lineTo(s - 3, s + 9);
  gfx.moveTo(s + 2, s + 7);
  gfx.lineTo(s + 2, s + 10);
  gfx.stroke({ width: 1, color: 0x66bbff });
}

function drawGarlicIcon(gfx: Graphics, s: number): void {
  gfx.circle(s, s + 1, 5);
  gfx.fill(0xccdd88);
  gfx.stroke({ width: 1, color: 0x88aa44 });
  gfx.moveTo(s, s - 4);
  gfx.lineTo(s, s + 6);
  gfx.moveTo(s - 4, s + 1);
  gfx.lineTo(s + 4, s + 1);
  gfx.stroke({ width: 0.8, color: 0x88aa44 });
  gfx.moveTo(s - 1, s - 4);
  gfx.lineTo(s, s - 7);
  gfx.lineTo(s + 1, s - 4);
  gfx.fill(0x66aa33);
  for (let i = -1; i <= 1; i++) {
    const wx = s + i * 4;
    gfx.moveTo(wx, s - 5);
    gfx.quadraticCurveTo(wx + 1, s - 7, wx, s - 9);
    gfx.stroke({ width: 1, color: 0x88ee44, alpha: 0.6 });
  }
}

function drawBurntToastIcon(gfx: Graphics, s: number): void {
  gfx.roundRect(s - 5, s - 5, 10, 12, 2);
  gfx.fill(0x553311);
  gfx.stroke({ width: 1, color: 0x884422 });
  gfx.roundRect(s - 3, s - 3, 6, 2, 0.5);
  gfx.fill(0x221100);
  gfx.roundRect(s - 2, s + 1, 4, 2, 0.5);
  gfx.fill(0x221100);
  gfx.moveTo(s - 3, s - 5);
  gfx.quadraticCurveTo(s - 4, s - 8, s - 2, s - 9);
  gfx.stroke({ width: 1, color: 0x888888, alpha: 0.5 });
  gfx.moveTo(s + 2, s - 5);
  gfx.quadraticCurveTo(s + 3, s - 8, s + 1, s - 10);
  gfx.stroke({ width: 1, color: 0x888888, alpha: 0.5 });
}

function drawPastaShieldIcon(gfx: Graphics, s: number): void {
  gfx.circle(s, s, 7);
  gfx.stroke({ width: 2, color: 0x44ddff, alpha: 0.8 });
  gfx.circle(s, s, 4);
  gfx.fill({ color: 0x88eeff, alpha: 0.3 });
  gfx.moveTo(s, s - 3);
  gfx.lineTo(s, s + 3);
  gfx.moveTo(s - 3, s);
  gfx.lineTo(s + 3, s);
  gfx.stroke({ width: 1.5, color: 0xffffff, alpha: 0.6 });
}

function drawGnocchiBounceIcon(gfx: Graphics, s: number): void {
  gfx.circle(s, s + 1, 5);
  gfx.fill(0xffe4c4);
  gfx.circle(s, s + 1, 5);
  gfx.stroke({ width: 1, color: 0xddbb99 });
  for (let fx = -2; fx <= 2; fx += 2) {
    gfx.circle(s + fx, s, 0.8);
    gfx.fill(0xddbb99);
  }
  gfx.moveTo(s - 5, s + 6);
  gfx.lineTo(s, s + 3);
  gfx.lineTo(s + 5, s + 6);
  gfx.stroke({ width: 1.5, color: 0xffffff, alpha: 0.5 });
}

function drawMinestroneSoupIcon(gfx: Graphics, s: number): void {
  gfx.roundRect(s - 6, s - 1, 12, 7, 3);
  gfx.fill(0xcc4422);
  gfx.roundRect(s - 5, s - 1, 10, 3, 2);
  gfx.fill(0xdd6633);
  gfx.circle(s - 2, s, 1.2);
  gfx.fill(0x44aa33);
  gfx.circle(s + 2, s + 1, 1);
  gfx.fill(0xffcc00);
  gfx.moveTo(s - 2, s - 2);
  gfx.quadraticCurveTo(s - 3, s - 5, s - 1, s - 6);
  gfx.moveTo(s + 2, s - 2);
  gfx.quadraticCurveTo(s + 3, s - 5, s + 1, s - 7);
  gfx.stroke({ width: 1, color: 0xffffff, alpha: 0.4 });
  gfx.moveTo(s - 7, s + 6);
  gfx.lineTo(s - 5, s + 4);
  gfx.lineTo(s - 3, s + 6);
  gfx.lineTo(s - 1, s + 4);
  gfx.stroke({ width: 1, color: 0xff8866, alpha: 0.5 });
}
