/** Chef character sprites — player avatar and rocket variant. */

import { Graphics } from "pixi.js";
import { drawCharacter } from "./PlayerCharacters";
import { getSelectedCharacter } from "../systems/CharacterSettings";

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
  gfx.roundRect(ox + rocketW * 0.15, rocketH * 0.05, rocketW * 0.7, rocketH * 0.55, 10);
  gfx.fill(0xc0392b); // tomato red
  // Highlight
  gfx.roundRect(ox + rocketW * 0.25, rocketH * 0.08, rocketW * 0.3, rocketH * 0.15, 6);
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
  gfx.quadraticCurveTo(ox + rocketW * 0.5, -rocketH * 0.1, ox + rocketW * 0.7, rocketH * 0.05);
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

/** Draw a simple pixel-art chef character with optional effect visuals.
 *  Delegates base drawing to the selected character from PlayerCharacters,
 *  then applies power-up effect overlays on top. */
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

  // No active effect → draw the selected character; with effect → always use
  // the chef body so all characters get the same effect-specific visuals
  // (burnt toast looks like toast, soggy looks soggy, etc.)
  if (!effectType) {
    const charId = getSelectedCharacter();
    if (charId !== "chef") {
      drawCharacter(gfx, w, h, charId);
      if (tint != null) {
        gfx.roundRect(0, 0, w, h, 4);
        gfx.fill({ color: tint, alpha: 0.2 });
      }
      return;
    }
  }

  // ── Chef body with full effect-specific visuals (used for all characters) ──

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
    for (let a = 0; a < Math.PI * 2; a += 0.5) {
      const r = 2 + a * 0.8;
      gfx.circle(w * 0.5 + Math.cos(a) * r, h * 0.1 + Math.sin(a) * r * 0.5, 1);
    }
    gfx.fill({ color: 0xaa8800, alpha: 0.4 });
  } else if (effectType === "lasagna_layers") {
    const cols = [0xff8c00, 0xffcc44, 0xff4444];
    for (let i = 0; i < 3; i++) {
      gfx.roundRect(w * 0.2, h * 0.02 + i * h * 0.06, w * 0.6, h * 0.05, 1);
      gfx.fill(cols[i]);
    }
  } else if (effectType === "pepper_sneeze") {
    gfx.moveTo(w * 0.45, h * 0.02);
    gfx.quadraticCurveTo(w * 0.6, h * 0.05, w * 0.55, h * 0.15);
    gfx.quadraticCurveTo(w * 0.45, h * 0.12, w * 0.45, h * 0.02);
    gfx.fill(0xcc0000);
  } else if (effectType === "meatball_magnet") {
    gfx.moveTo(w * 0.35, h * 0.03);
    gfx.lineTo(w * 0.35, h * 0.1);
    gfx.quadraticCurveTo(w * 0.5, h * 0.16, w * 0.65, h * 0.1);
    gfx.lineTo(w * 0.65, h * 0.03);
    gfx.stroke({ width: 2, color: 0xff3366 });
  } else if (effectType === "chili_pepper") {
    gfx.moveTo(w * 0.3, h * 0.04);
    gfx.lineTo(w * 0.35, h * -0.04);
    gfx.lineTo(w * 0.4, h * 0.04);
    gfx.fill(0xff6600);
    gfx.moveTo(w * 0.55, h * 0.04);
    gfx.lineTo(w * 0.6, h * -0.06);
    gfx.lineTo(w * 0.65, h * 0.04);
    gfx.fill(0xff8800);
  } else if (effectType === "garlic_breath") {
    gfx.circle(w * 0.35, h * -0.04, 3);
    gfx.circle(w * 0.55, h * -0.06, 2.5);
    gfx.circle(w * 0.7, h * -0.02, 2);
    gfx.fill({ color: 0x88ee44, alpha: 0.5 });
  } else if (effectType === "burnt_toast") {
    gfx.circle(w * 0.4, h * -0.04, 2.5);
    gfx.circle(w * 0.55, h * -0.08, 3);
    gfx.circle(w * 0.65, h * -0.03, 2);
    gfx.fill({ color: 0x666666, alpha: 0.4 });
  }

  // Eyes — expression changes per effect
  if (effectType === "chili_pepper") {
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
    gfx.circle(w * 0.35, h * 0.34, 2);
    gfx.circle(w * 0.65, h * 0.34, 2);
    gfx.fill(0x222222);
    gfx.circle(w * 0.35, h * 0.39, 1.2);
    gfx.circle(w * 0.65, h * 0.39, 1.2);
    gfx.fill(0x4499ee);
  } else if (effectType === "garlic_breath") {
    gfx.circle(w * 0.35, h * 0.33, 2.5);
    gfx.circle(w * 0.65, h * 0.33, 2.5);
    gfx.stroke({ width: 1, color: 0x228822 });
  } else if (effectType === "burnt_toast") {
    gfx.circle(w * 0.35, h * 0.33, 1.5);
    gfx.circle(w * 0.65, h * 0.33, 1.5);
    gfx.fill(0x444444);
  } else {
    gfx.circle(w * 0.35, h * 0.33, 2);
    gfx.fill(0x222222);
    gfx.circle(w * 0.65, h * 0.33, 2);
    gfx.fill(0x222222);
  }

  // Mouth
  if (effectType === "chili_pepper") {
    gfx.circle(w * 0.5, h * 0.41, 3);
    gfx.fill(0x220000);
  } else if (effectType === "soggy_noodle" || effectType === "garlic_breath") {
    gfx.moveTo(w * 0.35, h * 0.42);
    gfx.quadraticCurveTo(w * 0.5, h * 0.38, w * 0.65, h * 0.42);
    gfx.stroke({ width: 1, color: 0x333333 });
  } else if (effectType === "burnt_toast") {
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
    gfx.moveTo(w * 0.3, h * 0.38);
    gfx.quadraticCurveTo(w * 0.5, h * 0.48, w * 0.7, h * 0.38);
    gfx.stroke({ width: 1.5, color: 0x333333 });
  } else {
    gfx.moveTo(w * 0.35, h * 0.38);
    gfx.quadraticCurveTo(w * 0.5, h * 0.45, w * 0.65, h * 0.38);
    gfx.stroke({ width: 1, color: 0x333333 });
  }

  // Apron
  const apronColor =
    effectType === "soggy_noodle" ? 0x88bbdd : effectType === "burnt_toast" ? 0x554433 : 0xe8e8e8;
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
