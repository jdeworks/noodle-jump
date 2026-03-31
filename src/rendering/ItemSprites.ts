/** Item sprites — meatball, power-up diamond, and power-up icons. */

import { Graphics } from "pixi.js";
import { drawPowerUpIcon } from "./PowerUpIcons";

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
