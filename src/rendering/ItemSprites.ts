/** Item sprites — meatball, power-up diamond, and power-up icons. */

import { Graphics } from "pixi.js";

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

/** Variant colors for zone-specific meatballs. */
const VARIANT_COLORS: Record<string, { main: number; rim: number }> = {
  meatball: { main: 0x8b4513, rim: 0x5a2d0c },
  fishball: { main: 0x4488cc, rim: 0x2266aa },
  meteor: { main: 0x666666, rim: 0x444444 },
  snowball: { main: 0xeeeeff, rim: 0xaabbcc },
  fireball: { main: 0xff4400, rim: 0xcc2200 },
  gummy: { main: 0xff66aa, rim: 0xdd4488 },
  golden_meatball: { main: 0xffcc00, rim: 0xddaa00 },
};

/** Draw a meatball with zone-specific variant styling. */
export function drawMeatballVariant(
  gfx: Graphics,
  size: number,
  variant: string,
): void {
  gfx.clear();
  const r = size / 2;
  const colors = VARIANT_COLORS[variant] ?? VARIANT_COLORS.meatball;

  gfx.ellipse(r, r + 2, r * 0.8, r * 0.3);
  gfx.fill({ color: 0x000000, alpha: 0.15 });
  gfx.circle(r, r, r);
  gfx.fill(colors.main);
  gfx.circle(r, r, r);
  gfx.stroke({ width: 1.5, color: colors.rim, alpha: 0.4 });
  gfx.circle(r - r * 0.25, r - r * 0.25, r * 0.35);
  gfx.fill({ color: 0xffffff, alpha: 0.3 });
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

    // ── New positive power-ups ────────────────────────────────────
    case "pasta_shield": {
      // Shield bubble
      gfx.circle(s, s, 7);
      gfx.stroke({ width: 2, color: 0x44ddff, alpha: 0.8 });
      gfx.circle(s, s, 4);
      gfx.fill({ color: 0x88eeff, alpha: 0.3 });
      // Shield cross
      gfx.moveTo(s, s - 3);
      gfx.lineTo(s, s + 3);
      gfx.moveTo(s - 3, s);
      gfx.lineTo(s + 3, s);
      gfx.stroke({ width: 1.5, color: 0xffffff, alpha: 0.6 });
      break;
    }
    case "rigatoni_drill": {
      // Drill bit pointing down
      gfx.moveTo(s, s + 8);
      gfx.lineTo(s - 4, s - 2);
      gfx.lineTo(s + 4, s - 2);
      gfx.closePath();
      gfx.fill(0xaa6633);
      // Rigatoni tube body
      gfx.roundRect(s - 3, s - 6, 6, 5, 1);
      gfx.fill(0xcc8844);
      // Ridges
      for (let ry = -5; ry <= -2; ry += 2) {
        gfx.moveTo(s - 3, s + ry);
        gfx.lineTo(s + 3, s + ry);
        gfx.stroke({ width: 0.8, color: 0x886622 });
      }
      // Down arrow
      gfx.moveTo(s, s + 8);
      gfx.lineTo(s - 2, s + 5);
      gfx.moveTo(s, s + 8);
      gfx.lineTo(s + 2, s + 5);
      gfx.stroke({ width: 1.5, color: 0xffffff, alpha: 0.6 });
      break;
    }
    case "penne_cannon": {
      // Penne tube as cannon barrel
      gfx.roundRect(s - 2, s - 7, 4, 10, 1);
      gfx.fill(0xffcc33);
      // Cannon base
      gfx.roundRect(s - 4, s + 2, 8, 4, 2);
      gfx.fill(0xddaa22);
      // Muzzle flash
      gfx.star(s, s - 8, 3, 2, 0.8, 0);
      gfx.fill({ color: 0xffffff, alpha: 0.6 });
      break;
    }
    case "gnocchi_bounce": {
      // Potato dumpling shape
      gfx.circle(s, s + 1, 5);
      gfx.fill(0xffe4c4);
      gfx.circle(s, s + 1, 5);
      gfx.stroke({ width: 1, color: 0xddbb99 });
      // Fork marks
      for (let fx = -2; fx <= 2; fx += 2) {
        gfx.circle(s + fx, s, 0.8);
        gfx.fill(0xddbb99);
      }
      // Bounce arrows
      gfx.moveTo(s - 5, s + 6);
      gfx.lineTo(s, s + 3);
      gfx.lineTo(s + 5, s + 6);
      gfx.stroke({ width: 1.5, color: 0xffffff, alpha: 0.5 });
      break;
    }
    case "minestrone_soup": {
      // Soup bowl
      gfx.roundRect(s - 6, s - 1, 12, 7, 3);
      gfx.fill(0xcc4422);
      // Soup surface
      gfx.roundRect(s - 5, s - 1, 10, 3, 2);
      gfx.fill(0xdd6633);
      // Vegetable bits
      gfx.circle(s - 2, s, 1.2);
      gfx.fill(0x44aa33);
      gfx.circle(s + 2, s + 1, 1);
      gfx.fill(0xffcc00);
      // Steam
      gfx.moveTo(s - 2, s - 2);
      gfx.quadraticCurveTo(s - 3, s - 5, s - 1, s - 6);
      gfx.moveTo(s + 2, s - 2);
      gfx.quadraticCurveTo(s + 3, s - 5, s + 1, s - 7);
      gfx.stroke({ width: 1, color: 0xffffff, alpha: 0.4 });
      // Rising wave indicator
      gfx.moveTo(s - 7, s + 6);
      gfx.lineTo(s - 5, s + 4);
      gfx.lineTo(s - 3, s + 6);
      gfx.lineTo(s - 1, s + 4);
      gfx.stroke({ width: 1, color: 0xff8866, alpha: 0.5 });
      break;
    }
  }
}
