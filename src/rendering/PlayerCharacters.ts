/** Player character definitions — 10 visually distinct tiny sprites (32x40). */

import { Graphics } from "pixi.js";

export interface CharacterDef {
  id: string;
  name: string;
  draw: (gfx: Graphics, w: number, h: number) => void;
}

// ── 1. Chef (default) ──────────────────────────────────────────────
function drawChefBase(gfx: Graphics, w: number, h: number): void {
  gfx.roundRect(w * 0.15, h * 0.4, w * 0.7, h * 0.5, 3);
  gfx.fill(0xffffff);
  gfx.roundRect(w * 0.2, h * 0.2, w * 0.6, h * 0.25, 4);
  gfx.fill(0xf5cba7);
  gfx.roundRect(w * 0.15, h * 0.0, w * 0.7, h * 0.25, 4);
  gfx.fill(0xffffff);
  gfx.roundRect(w * 0.25, h * 0.0, w * 0.5, h * 0.08, 2);
  gfx.fill({ color: 0x000000, alpha: 0.08 });
  gfx.circle(w * 0.35, h * 0.33, 2); gfx.fill(0x222222);
  gfx.circle(w * 0.65, h * 0.33, 2); gfx.fill(0x222222);
  gfx.moveTo(w * 0.35, h * 0.38);
  gfx.quadraticCurveTo(w * 0.5, h * 0.45, w * 0.65, h * 0.38);
  gfx.stroke({ width: 1, color: 0x333333 });
  gfx.roundRect(w * 0.25, h * 0.5, w * 0.5, h * 0.3, 2);
  gfx.fill(0xe8e8e8);
  gfx.roundRect(w * 0.15, h * 0.88, w * 0.25, h * 0.12, 3);
  gfx.fill(0x333333);
  gfx.roundRect(w * 0.6, h * 0.88, w * 0.25, h * 0.12, 3);
  gfx.fill(0x333333);
}

// ── 2. Goblin ──────────────────────────────────────────────────────
function drawGoblin(gfx: Graphics, w: number, h: number): void {
  // Body — ragged brown tunic
  gfx.roundRect(w * 0.15, h * 0.4, w * 0.7, h * 0.48, 3);
  gfx.fill(0x8b6914);
  // Head — green
  gfx.roundRect(w * 0.2, h * 0.18, w * 0.6, h * 0.28, 4);
  gfx.fill(0x44aa33);
  // Pointy ears
  gfx.moveTo(w * 0.1, h * 0.3); gfx.lineTo(w * 0.2, h * 0.18);
  gfx.lineTo(w * 0.2, h * 0.35); gfx.closePath(); gfx.fill(0x44aa33);
  gfx.moveTo(w * 0.9, h * 0.3); gfx.lineTo(w * 0.8, h * 0.18);
  gfx.lineTo(w * 0.8, h * 0.35); gfx.closePath(); gfx.fill(0x44aa33);
  // Eyes — yellow
  gfx.circle(w * 0.35, h * 0.32, 2.5); gfx.fill(0xffff00);
  gfx.circle(w * 0.65, h * 0.32, 2.5); gfx.fill(0xffff00);
  gfx.circle(w * 0.35, h * 0.32, 1); gfx.fill(0x111111);
  gfx.circle(w * 0.65, h * 0.32, 1); gfx.fill(0x111111);
  // Grin
  gfx.moveTo(w * 0.3, h * 0.4);
  gfx.quadraticCurveTo(w * 0.5, h * 0.5, w * 0.7, h * 0.4);
  gfx.stroke({ width: 1, color: 0x225511 });
  // Feet
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 3); gfx.fill(0x44aa33);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 3); gfx.fill(0x44aa33);
}

// ── 3. Grandma ─────────────────────────────────────────────────────
function drawGrandma(gfx: Graphics, w: number, h: number): void {
  // Purple dress
  gfx.roundRect(w * 0.1, h * 0.4, w * 0.8, h * 0.5, 3);
  gfx.fill(0x9944cc);
  // Head
  gfx.roundRect(w * 0.2, h * 0.2, w * 0.6, h * 0.25, 4);
  gfx.fill(0xf5cba7);
  // Gray bun hair
  gfx.circle(w * 0.5, h * 0.12, w * 0.22); gfx.fill(0xbbbbbb);
  gfx.circle(w * 0.5, h * 0.06, w * 0.14); gfx.fill(0xcccccc);
  // Glasses — two circles + bridge
  gfx.circle(w * 0.35, h * 0.32, 3); gfx.stroke({ width: 1, color: 0x444444 });
  gfx.circle(w * 0.65, h * 0.32, 3); gfx.stroke({ width: 1, color: 0x444444 });
  gfx.moveTo(w * 0.42, h * 0.32); gfx.lineTo(w * 0.58, h * 0.32);
  gfx.stroke({ width: 1, color: 0x444444 });
  // Eyes behind glasses
  gfx.circle(w * 0.35, h * 0.32, 1.2); gfx.fill(0x222222);
  gfx.circle(w * 0.65, h * 0.32, 1.2); gfx.fill(0x222222);
  // Smile
  gfx.moveTo(w * 0.38, h * 0.39);
  gfx.quadraticCurveTo(w * 0.5, h * 0.44, w * 0.62, h * 0.39);
  gfx.stroke({ width: 1, color: 0x333333 });
  // Shoes
  gfx.roundRect(w * 0.15, h * 0.88, w * 0.25, h * 0.12, 3); gfx.fill(0x663399);
  gfx.roundRect(w * 0.6, h * 0.88, w * 0.25, h * 0.12, 3); gfx.fill(0x663399);
}

// ── 4. Robot ───────────────────────────────────────────────────────
function drawRobot(gfx: Graphics, w: number, h: number): void {
  // Boxy body — metallic gray
  gfx.roundRect(w * 0.12, h * 0.38, w * 0.76, h * 0.5, 2);
  gfx.fill(0x8899aa);
  // Chest panel
  gfx.roundRect(w * 0.25, h * 0.48, w * 0.5, h * 0.2, 2);
  gfx.fill(0x334455);
  // Blinking lights on chest
  gfx.circle(w * 0.35, h * 0.56, 2); gfx.fill(0x00ff44);
  gfx.circle(w * 0.5, h * 0.56, 2); gfx.fill(0xff4444);
  gfx.circle(w * 0.65, h * 0.56, 2); gfx.fill(0x44aaff);
  // Head — boxy
  gfx.roundRect(w * 0.2, h * 0.18, w * 0.6, h * 0.24, 2);
  gfx.fill(0x99aabb);
  // Screen face
  gfx.roundRect(w * 0.26, h * 0.22, w * 0.48, h * 0.14, 2);
  gfx.fill(0x112233);
  // Eyes on screen — glowing
  gfx.circle(w * 0.38, h * 0.29, 2.5); gfx.fill(0x00ffcc);
  gfx.circle(w * 0.62, h * 0.29, 2.5); gfx.fill(0x00ffcc);
  // Antenna
  gfx.rect(w * 0.48, h * 0.04, w * 0.04, h * 0.15); gfx.fill(0x667788);
  gfx.circle(w * 0.5, h * 0.04, 3); gfx.fill(0xff3333);
  // Feet — boxy
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 2); gfx.fill(0x667788);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 2); gfx.fill(0x667788);
}

// ── 5. Ninja ───────────────────────────────────────────────────────
function drawNinja(gfx: Graphics, w: number, h: number): void {
  // Black body
  gfx.roundRect(w * 0.15, h * 0.38, w * 0.7, h * 0.5, 3);
  gfx.fill(0x222222);
  // Head — black mask
  gfx.roundRect(w * 0.2, h * 0.15, w * 0.6, h * 0.28, 4);
  gfx.fill(0x222222);
  // Eye slit — skin strip
  gfx.roundRect(w * 0.18, h * 0.26, w * 0.64, h * 0.1, 2);
  gfx.fill(0xf5cba7);
  // Eyes
  gfx.circle(w * 0.35, h * 0.31, 2); gfx.fill(0x111111);
  gfx.circle(w * 0.65, h * 0.31, 2); gfx.fill(0x111111);
  // Red headband
  gfx.roundRect(w * 0.15, h * 0.22, w * 0.7, h * 0.06, 1);
  gfx.fill(0xdd2222);
  // Headband tails
  gfx.moveTo(w * 0.85, h * 0.22); gfx.lineTo(w * 0.95, h * 0.18);
  gfx.lineTo(w * 0.85, h * 0.28); gfx.fill(0xdd2222);
  // Belt
  gfx.roundRect(w * 0.15, h * 0.6, w * 0.7, h * 0.06, 1);
  gfx.fill(0x555555);
  // Feet — dark
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 3); gfx.fill(0x333333);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 3); gfx.fill(0x333333);
}

// ── 6. Princess ────────────────────────────────────────────────────
function drawPrincess(gfx: Graphics, w: number, h: number): void {
  // Pink dress — flared bottom
  gfx.roundRect(w * 0.08, h * 0.45, w * 0.84, h * 0.45, 4);
  gfx.fill(0xff66aa);
  gfx.roundRect(w * 0.2, h * 0.38, w * 0.6, h * 0.2, 3);
  gfx.fill(0xff66aa);
  // Head
  gfx.roundRect(w * 0.22, h * 0.18, w * 0.56, h * 0.25, 4);
  gfx.fill(0xf5cba7);
  // Blonde hair
  gfx.roundRect(w * 0.18, h * 0.12, w * 0.64, h * 0.14, 4);
  gfx.fill(0xffdd44);
  // Hair sides
  gfx.roundRect(w * 0.15, h * 0.2, w * 0.1, h * 0.25, 2); gfx.fill(0xffdd44);
  gfx.roundRect(w * 0.75, h * 0.2, w * 0.1, h * 0.25, 2); gfx.fill(0xffdd44);
  // Crown
  gfx.moveTo(w * 0.25, h * 0.12); gfx.lineTo(w * 0.3, h * 0.02);
  gfx.lineTo(w * 0.4, h * 0.1); gfx.lineTo(w * 0.5, h * 0.0);
  gfx.lineTo(w * 0.6, h * 0.1); gfx.lineTo(w * 0.7, h * 0.02);
  gfx.lineTo(w * 0.75, h * 0.12); gfx.closePath(); gfx.fill(0xffcc00);
  // Crown gems
  gfx.circle(w * 0.5, h * 0.07, 1.5); gfx.fill(0xff0044);
  // Eyes
  gfx.circle(w * 0.38, h * 0.32, 2); gfx.fill(0x2244aa);
  gfx.circle(w * 0.62, h * 0.32, 2); gfx.fill(0x2244aa);
  // Smile
  gfx.moveTo(w * 0.4, h * 0.38);
  gfx.quadraticCurveTo(w * 0.5, h * 0.43, w * 0.6, h * 0.38);
  gfx.stroke({ width: 1, color: 0xcc3366 });
  // Shoes
  gfx.roundRect(w * 0.18, h * 0.88, w * 0.22, h * 0.12, 3); gfx.fill(0xff88bb);
  gfx.roundRect(w * 0.6, h * 0.88, w * 0.22, h * 0.12, 3); gfx.fill(0xff88bb);
}

// ── 7. Alien ───────────────────────────────────────────────────────
function drawAlien(gfx: Graphics, w: number, h: number): void {
  // Silver suit
  gfx.roundRect(w * 0.15, h * 0.42, w * 0.7, h * 0.46, 3);
  gfx.fill(0xaabbcc);
  // Big green head
  gfx.roundRect(w * 0.12, h * 0.15, w * 0.76, h * 0.32, 8);
  gfx.fill(0x55cc44);
  // Big black eyes
  gfx.ellipse(w * 0.35, h * 0.3, w * 0.12, h * 0.1); gfx.fill(0x111111);
  gfx.ellipse(w * 0.65, h * 0.3, w * 0.12, h * 0.1); gfx.fill(0x111111);
  // Eye shine
  gfx.circle(w * 0.32, h * 0.27, 1.5); gfx.fill(0xffffff);
  gfx.circle(w * 0.62, h * 0.27, 1.5); gfx.fill(0xffffff);
  // Small mouth
  gfx.circle(w * 0.5, h * 0.42, 2); gfx.fill(0x338822);
  // Antenna
  gfx.rect(w * 0.48, h * 0.02, w * 0.04, h * 0.14); gfx.fill(0x55cc44);
  gfx.circle(w * 0.5, h * 0.02, 3); gfx.fill(0x88ff66);
  // Suit detail — belt
  gfx.roundRect(w * 0.2, h * 0.6, w * 0.6, h * 0.06, 1);
  gfx.fill(0x6688aa);
  // Feet
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 3); gfx.fill(0x889999);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 3); gfx.fill(0x889999);
}

// ── 8. Viking ──────────────────────────────────────────────────────
function drawViking(gfx: Graphics, w: number, h: number): void {
  // Fur vest — brown
  gfx.roundRect(w * 0.12, h * 0.4, w * 0.76, h * 0.48, 3);
  gfx.fill(0x8b5e3c);
  // Fur trim
  gfx.roundRect(w * 0.12, h * 0.4, w * 0.76, h * 0.08, 2);
  gfx.fill(0xc9a86c);
  // Head
  gfx.roundRect(w * 0.22, h * 0.2, w * 0.56, h * 0.25, 4);
  gfx.fill(0xf5cba7);
  // Brown beard
  gfx.roundRect(w * 0.22, h * 0.35, w * 0.56, h * 0.15, 3);
  gfx.fill(0x8b4513);
  // Helmet — gray
  gfx.roundRect(w * 0.18, h * 0.12, w * 0.64, h * 0.14, 3);
  gfx.fill(0x888888);
  // Horns
  gfx.moveTo(w * 0.18, h * 0.18); gfx.lineTo(w * 0.02, h * 0.04);
  gfx.lineTo(w * 0.15, h * 0.12); gfx.closePath(); gfx.fill(0xcccc88);
  gfx.moveTo(w * 0.82, h * 0.18); gfx.lineTo(w * 0.98, h * 0.04);
  gfx.lineTo(w * 0.85, h * 0.12); gfx.closePath(); gfx.fill(0xcccc88);
  // Eyes
  gfx.circle(w * 0.38, h * 0.3, 2); gfx.fill(0x2255aa);
  gfx.circle(w * 0.62, h * 0.3, 2); gfx.fill(0x2255aa);
  // Feet
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 3); gfx.fill(0x664422);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 3); gfx.fill(0x664422);
}

// ── 9. Pirate ──────────────────────────────────────────────────────
function drawPirate(gfx: Graphics, w: number, h: number): void {
  // Striped shirt — red/white
  gfx.roundRect(w * 0.15, h * 0.4, w * 0.7, h * 0.48, 3);
  gfx.fill(0xffffff);
  for (let i = 0; i < 4; i++) {
    gfx.roundRect(w * 0.15, h * (0.44 + i * 0.1), w * 0.7, h * 0.04, 0);
    gfx.fill(0xdd2222);
  }
  // Head
  gfx.roundRect(w * 0.22, h * 0.2, w * 0.56, h * 0.25, 4);
  gfx.fill(0xf5cba7);
  // Tricorn hat
  gfx.roundRect(w * 0.1, h * 0.14, w * 0.8, h * 0.06, 1);
  gfx.fill(0x222222);
  gfx.roundRect(w * 0.2, h * 0.02, w * 0.6, h * 0.14, 3);
  gfx.fill(0x333333);
  // Skull on hat
  gfx.circle(w * 0.5, h * 0.09, 3); gfx.fill(0xffffff);
  // Eyepatch on right eye
  gfx.circle(w * 0.63, h * 0.32, 3); gfx.fill(0x111111);
  gfx.moveTo(w * 0.55, h * 0.22); gfx.lineTo(w * 0.63, h * 0.3);
  gfx.stroke({ width: 1, color: 0x111111 });
  // Left eye
  gfx.circle(w * 0.37, h * 0.32, 2); gfx.fill(0x222222);
  // Grin
  gfx.moveTo(w * 0.35, h * 0.4);
  gfx.quadraticCurveTo(w * 0.5, h * 0.47, w * 0.65, h * 0.4);
  gfx.stroke({ width: 1, color: 0x333333 });
  // Feet
  gfx.roundRect(w * 0.15, h * 0.86, w * 0.25, h * 0.14, 3); gfx.fill(0x443322);
  gfx.roundRect(w * 0.6, h * 0.86, w * 0.25, h * 0.14, 3); gfx.fill(0x443322);
}

// ── 10. Wizard ─────────────────────────────────────────────────────
function drawWizard(gfx: Graphics, w: number, h: number): void {
  // Star robe — dark purple
  gfx.roundRect(w * 0.1, h * 0.4, w * 0.8, h * 0.5, 3);
  gfx.fill(0x332266);
  // Star decorations on robe
  gfx.circle(w * 0.3, h * 0.55, 1.5); gfx.fill(0xffdd44);
  gfx.circle(w * 0.5, h * 0.65, 1.5); gfx.fill(0xffdd44);
  gfx.circle(w * 0.7, h * 0.55, 1.5); gfx.fill(0xffdd44);
  // Head
  gfx.roundRect(w * 0.25, h * 0.25, w * 0.5, h * 0.2, 4);
  gfx.fill(0xf5cba7);
  // Long gray beard
  gfx.moveTo(w * 0.3, h * 0.38); gfx.lineTo(w * 0.5, h * 0.65);
  gfx.lineTo(w * 0.7, h * 0.38); gfx.closePath(); gfx.fill(0xcccccc);
  // Pointy purple hat
  gfx.moveTo(w * 0.15, h * 0.27); gfx.lineTo(w * 0.5, h * -0.05);
  gfx.lineTo(w * 0.85, h * 0.27); gfx.closePath(); gfx.fill(0x5533aa);
  // Hat brim
  gfx.roundRect(w * 0.1, h * 0.24, w * 0.8, h * 0.06, 2);
  gfx.fill(0x5533aa);
  // Star on hat
  gfx.circle(w * 0.5, h * 0.12, 2.5); gfx.fill(0xffdd44);
  // Eyes
  gfx.circle(w * 0.38, h * 0.33, 2); gfx.fill(0x222222);
  gfx.circle(w * 0.62, h * 0.33, 2); gfx.fill(0x222222);
  // Feet
  gfx.roundRect(w * 0.15, h * 0.88, w * 0.25, h * 0.12, 3); gfx.fill(0x221144);
  gfx.roundRect(w * 0.6, h * 0.88, w * 0.25, h * 0.12, 3); gfx.fill(0x221144);
}

// ── Unlockable characters ─────────────────────────────────────────

function drawNeonChef(gfx: Graphics, w: number, h: number): void {
  // Neon outline chef — glowing cyan lines
  gfx.roundRect(w * 0.2, h * 0.4, w * 0.6, h * 0.45, 4);
  gfx.stroke({ width: 2, color: 0x00ffff }); gfx.fill({ color: 0x00ffff, alpha: 0.08 });
  gfx.circle(w / 2, h * 0.3, w * 0.25);
  gfx.stroke({ width: 2, color: 0x00ffff }); gfx.fill({ color: 0x00ffff, alpha: 0.08 });
  // Neon hat
  gfx.roundRect(w * 0.22, h * 0.02, w * 0.56, h * 0.22, 3);
  gfx.stroke({ width: 2, color: 0xff00ff }); gfx.fill({ color: 0xff00ff, alpha: 0.06 });
  // Eyes
  gfx.circle(w * 0.38, h * 0.3, 2); gfx.fill(0x00ffff);
  gfx.circle(w * 0.62, h * 0.3, 2); gfx.fill(0x00ffff);
  // Neon feet
  gfx.roundRect(w * 0.18, h * 0.85, w * 0.25, h * 0.1, 2);
  gfx.stroke({ width: 1.5, color: 0x00ffff });
  gfx.roundRect(w * 0.57, h * 0.85, w * 0.25, h * 0.1, 2);
  gfx.stroke({ width: 1.5, color: 0x00ffff });
}

function drawNyanCat(gfx: Graphics, w: number, h: number): void {
  // Pop-tart body
  gfx.roundRect(w * 0.12, h * 0.28, w * 0.76, h * 0.44, 3);
  gfx.fill(0xffcc88);
  // Pink frosting
  gfx.roundRect(w * 0.16, h * 0.32, w * 0.68, h * 0.36, 2);
  gfx.fill(0xff88aa);
  // Sprinkles
  gfx.rect(w * 0.3, h * 0.4, 2, 2); gfx.fill(0xff4444);
  gfx.rect(w * 0.5, h * 0.45, 2, 2); gfx.fill(0x44ff44);
  gfx.rect(w * 0.65, h * 0.38, 2, 2); gfx.fill(0x4444ff);
  gfx.rect(w * 0.4, h * 0.52, 2, 2); gfx.fill(0xffff44);
  // Cat head
  gfx.circle(w * 0.5, h * 0.22, w * 0.18); gfx.fill(0x999999);
  // Ears
  gfx.moveTo(w * 0.35, h * 0.12); gfx.lineTo(w * 0.3, h * 0.02); gfx.lineTo(w * 0.42, h * 0.1);
  gfx.closePath(); gfx.fill(0x999999);
  gfx.moveTo(w * 0.65, h * 0.12); gfx.lineTo(w * 0.7, h * 0.02); gfx.lineTo(w * 0.58, h * 0.1);
  gfx.closePath(); gfx.fill(0x999999);
  // Eyes + mouth
  gfx.circle(w * 0.42, h * 0.2, 2); gfx.fill(0x111111);
  gfx.circle(w * 0.58, h * 0.2, 2); gfx.fill(0x111111);
  gfx.ellipse(w * 0.5, h * 0.25, 3, 1.5); gfx.fill(0xff6688);
  // Legs
  gfx.roundRect(w * 0.2, h * 0.72, w * 0.12, h * 0.18, 2); gfx.fill(0x888888);
  gfx.roundRect(w * 0.68, h * 0.72, w * 0.12, h * 0.18, 2); gfx.fill(0x888888);
}

function drawSkeleton(gfx: Graphics, w: number, h: number): void {
  gfx.circle(w / 2, h * 0.2, w * 0.25); gfx.fill(0xeeeeee); // skull
  gfx.circle(w * 0.38, h * 0.18, 3); gfx.fill(0x111111); // eyes
  gfx.circle(w * 0.62, h * 0.18, 3); gfx.fill(0x111111);
  gfx.moveTo(w * 0.48, h * 0.24); gfx.lineTo(w * 0.52, h * 0.24); gfx.lineTo(w * 0.5, h * 0.27);
  gfx.closePath(); gfx.fill(0x222222); // nose
  gfx.roundRect(w * 0.32, h * 0.28, w * 0.36, h * 0.06, 2); gfx.fill(0xdddddd); // jaw
  for (let i = 0; i < 4; i++) { const y = h * 0.38 + i * 6; gfx.roundRect(w * 0.25, y, w * 0.5, 2, 1); gfx.fill(0xdddddd); }
  gfx.roundRect(w * 0.48, h * 0.35, w * 0.04, h * 0.35, 1); gfx.fill(0xcccccc); // spine
  gfx.roundRect(w * 0.3, h * 0.72, w * 0.08, h * 0.22, 2); gfx.fill(0xdddddd); // legs
  gfx.roundRect(w * 0.62, h * 0.72, w * 0.08, h * 0.22, 2); gfx.fill(0xdddddd);
  gfx.roundRect(w * 0.12, h * 0.38, w * 0.1, h * 0.25, 2); gfx.fill(0xdddddd); // arms
  gfx.roundRect(w * 0.78, h * 0.38, w * 0.1, h * 0.25, 2); gfx.fill(0xdddddd);
}

// ── Character registry ─────────────────────────────────────────────

export const CHARACTERS: CharacterDef[] = [
  { id: "chef", name: "Chef", draw: drawChefBase },
  { id: "goblin", name: "Goblin", draw: drawGoblin },
  { id: "grandma", name: "Grandma", draw: drawGrandma },
  { id: "robot", name: "Robot", draw: drawRobot },
  { id: "ninja", name: "Ninja", draw: drawNinja },
  { id: "princess", name: "Princess", draw: drawPrincess },
  { id: "alien", name: "Alien", draw: drawAlien },
  { id: "viking", name: "Viking", draw: drawViking },
  { id: "pirate", name: "Pirate", draw: drawPirate },
  { id: "wizard", name: "Wizard", draw: drawWizard },
  { id: "neon_chef", name: "Neon Chef", draw: drawNeonChef },
  { id: "nyan_cat", name: "Nyan Cat", draw: drawNyanCat },
  { id: "skeleton", name: "Skeleton", draw: drawSkeleton },
];

const characterMap = new Map(CHARACTERS.map((c) => [c.id, c.draw]));

/** Draw the character with the given ID (falls back to chef). */
export function drawCharacter(
  gfx: Graphics,
  w: number,
  h: number,
  id: string,
): void {
  gfx.clear();
  const draw = characterMap.get(id) ?? drawChefBase;
  draw(gfx, w, h);
}
