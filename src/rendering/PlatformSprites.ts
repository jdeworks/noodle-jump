/** Platform drawing — type-specific visual styles for all platform variants. */

import { Graphics } from "pixi.js";

export type PlatformStyle =
  | "normal"
  | "breaking"
  | "brittle"
  | "moving"
  | "lasagna"
  | "conveyor"
  | "spring"
  | "ice"
  | "crumbling"
  | "teleport"
  | "weighted";

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
      {
        const stripeH = 3;
        for (let sy = 2; sy < height - 2; sy += stripeH + 1) {
          const stripeColor = sy % 2 === 0 ? 0xffcc00 : 0xff6600;
          gfx.roundRect(3, sy, width - 6, stripeH, 1);
          gfx.fill({ color: stripeColor, alpha: 0.5 });
        }
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

    case "conveyor":
      // Belt texture — horizontal stripes
      for (let cx = 6; cx < width - 6; cx += 10) {
        gfx.rect(cx, 3, 6, height - 6);
        gfx.fill({ color: 0x000000, alpha: 0.1 });
      }
      // Direction arrow
      {
        const arrowX = width / 2;
        const arrowY = height / 2;
        gfx.moveTo(arrowX - 8, arrowY);
        gfx.lineTo(arrowX + 8, arrowY);
        gfx.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
        gfx.moveTo(arrowX + 4, arrowY - 3);
        gfx.lineTo(arrowX + 8, arrowY);
        gfx.lineTo(arrowX + 4, arrowY + 3);
        gfx.fill({ color: 0xffffff, alpha: 0.5 });
      }
      // Metal edge
      gfx.roundRect(0, 0, width, height, 4);
      gfx.stroke({ width: 1, color: 0x888888, alpha: 0.4 });
      break;

    case "spring":
      // Coil spring visual — zigzag lines
      for (let sx = 8; sx < width - 8; sx += 12) {
        gfx.moveTo(sx, 2);
        gfx.lineTo(sx + 6, height - 2);
        gfx.lineTo(sx + 12, 2);
        gfx.stroke({ width: 1.5, color: 0xffffff, alpha: 0.4 });
      }
      // Bright top edge
      gfx.roundRect(2, 0, width - 4, 3, 2);
      gfx.fill({ color: 0xffdd44, alpha: 0.5 });
      // Glow
      gfx.roundRect(0, 0, width, height, 4);
      gfx.stroke({ width: 1.5, color: 0xffdd44, alpha: 0.4 });
      break;

    case "ice":
      // Frosted/translucent look — lighter color, sparkle dots
      gfx.roundRect(3, 1, width - 6, 3, 2);
      gfx.fill({ color: 0xffffff, alpha: 0.4 });
      // Ice sparkles
      for (let ix = 10; ix < width - 10; ix += 14) {
        gfx.circle(ix, height / 2, 1.5);
        gfx.fill({ color: 0xffffff, alpha: 0.6 });
      }
      // Slippery sheen
      gfx.roundRect(4, 2, width * 0.4, 2, 1);
      gfx.fill({ color: 0xffffff, alpha: 0.3 });
      break;

    case "crumbling":
      // Cracked appearance with visible timer — cracks spread
      gfx.moveTo(width * 0.15, 1);
      gfx.lineTo(width * 0.25, height * 0.6);
      gfx.lineTo(width * 0.4, height - 1);
      gfx.stroke({ width: 1, color: 0x000000, alpha: 0.25 });
      gfx.moveTo(width * 0.55, 1);
      gfx.lineTo(width * 0.65, height * 0.5);
      gfx.stroke({ width: 1, color: 0x000000, alpha: 0.2 });
      gfx.moveTo(width * 0.75, height - 1);
      gfx.lineTo(width * 0.85, 2);
      gfx.stroke({ width: 0.8, color: 0x000000, alpha: 0.15 });
      // Warning border
      gfx.roundRect(0, 0, width, height, 4);
      gfx.stroke({ width: 1, color: 0xff6600, alpha: 0.3 });
      break;

    case "teleport":
      // Portal-like glow with shimmer
      gfx.roundRect(0, 0, width, height, 4);
      gfx.stroke({ width: 2, color: 0x8844ff, alpha: 0.6 });
      // Inner glow
      gfx.roundRect(3, 2, width - 6, height - 4, 3);
      gfx.fill({ color: 0xaa66ff, alpha: 0.15 });
      // Portal dots
      for (let tx = 12; tx < width - 12; tx += 16) {
        gfx.circle(tx, height / 2, 2);
        gfx.fill({ color: 0xcc88ff, alpha: 0.5 });
      }
      break;

    case "weighted":
      // Seesaw / fulcrum indicator
      // Fulcrum triangle at center bottom
      {
        const cx = width / 2;
        gfx.moveTo(cx - 6, height + 4);
        gfx.lineTo(cx + 6, height + 4);
        gfx.lineTo(cx, height - 1);
        gfx.closePath();
        gfx.fill({ color: 0x888888, alpha: 0.4 });
      }
      // Top highlight
      gfx.roundRect(3, 1, width - 6, 3, 2);
      gfx.fill({ color: 0xffffff, alpha: 0.2 });
      // Weight indicators on edges
      gfx.circle(8, height / 2, 3);
      gfx.fill({ color: 0x000000, alpha: 0.15 });
      gfx.circle(width - 8, height / 2, 3);
      gfx.fill({ color: 0x000000, alpha: 0.15 });
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
