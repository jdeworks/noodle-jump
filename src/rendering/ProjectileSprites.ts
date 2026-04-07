/** Projectile sprites — per-character projectile drawing functions. */

import { Graphics } from "pixi.js";

/** Chef — kitchen knife (default). */
function drawKnife(gfx: Graphics): void {
  gfx.moveTo(0, -16);
  gfx.lineTo(4, -12);
  gfx.lineTo(5, -4);
  gfx.lineTo(5, 0);
  gfx.lineTo(-2, 0);
  gfx.lineTo(-2, -14);
  gfx.closePath();
  gfx.fill(0xccccdd);
  gfx.moveTo(2, -12);
  gfx.lineTo(4, -6);
  gfx.lineTo(4, 0);
  gfx.lineTo(3, 0);
  gfx.lineTo(3, -6);
  gfx.lineTo(1, -12);
  gfx.closePath();
  gfx.fill({ color: 0xffffff, alpha: 0.4 });
  gfx.moveTo(-2, -14);
  gfx.lineTo(-2, 0);
  gfx.stroke({ width: 1, color: 0x888899 });
  gfx.rect(-3, 0, 9, 3);
  gfx.fill(0x999999);
  gfx.roundRect(-2, 3, 6, 12, 2);
  gfx.fill(0x553322);
  gfx.roundRect(-1, 4, 2, 10, 1);
  gfx.fill({ color: 0x774433, alpha: 0.6 });
  gfx.circle(1, 6, 1);
  gfx.fill(0xbbbbbb);
  gfx.circle(1, 11, 1);
  gfx.fill(0xbbbbbb);
}

/** Ninja — shuriken (4-pointed star). */
function drawShuriken(gfx: Graphics): void {
  const r = 8;
  const ri = 3;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 - Math.PI / 2;
    const midAngle = angle + Math.PI / 4;
    const ox = Math.cos(angle) * r;
    const oy = Math.sin(angle) * r;
    const mx = Math.cos(midAngle) * ri;
    const my = Math.sin(midAngle) * ri;
    if (i === 0) gfx.moveTo(ox, oy);
    else gfx.lineTo(ox, oy);
    gfx.lineTo(mx, my);
  }
  gfx.closePath();
  gfx.fill(0x888899);
  gfx.circle(0, 0, 2);
  gfx.fill(0x444444);
  gfx.circle(0, -r + 2, 1);
  gfx.fill({ color: 0xffffff, alpha: 0.4 });
}

/** Goblin — crude wooden club. */
function drawClub(gfx: Graphics): void {
  gfx.ellipse(0, -10, 6, 5);
  gfx.fill(0x6b4226);
  gfx.circle(-3, -11, 1.5);
  gfx.fill(0x4a2f1a);
  gfx.circle(2, -8, 1.2);
  gfx.fill(0x4a2f1a);
  gfx.moveTo(-2.5, -6);
  gfx.lineTo(-2, 10);
  gfx.lineTo(2, 10);
  gfx.lineTo(2.5, -6);
  gfx.closePath();
  gfx.fill(0x8b5e3c);
  gfx.moveTo(0, -5);
  gfx.lineTo(0, 9);
  gfx.stroke({ width: 0.8, color: 0x6b4226 });
}

/** Grandma — rolling pin. */
function drawRollingPin(gfx: Graphics): void {
  gfx.roundRect(-4, -10, 8, 20, 3);
  gfx.fill(0xc9a86c);
  gfx.roundRect(-1, -9, 2, 18, 1);
  gfx.fill({ color: 0xffffff, alpha: 0.25 });
  gfx.roundRect(-2.5, -14, 5, 5, 2);
  gfx.fill(0x8b6914);
  gfx.roundRect(-2.5, 9, 5, 5, 2);
  gfx.fill(0x8b6914);
}

/** Robot — laser bolt. */
function drawLaserBolt(gfx: Graphics): void {
  gfx.roundRect(-3, -10, 6, 20, 3);
  gfx.fill({ color: 0x00ffcc, alpha: 0.3 });
  gfx.roundRect(-1.5, -8, 3, 16, 2);
  gfx.fill(0x00ffcc);
  gfx.roundRect(-0.5, -6, 1, 12, 1);
  gfx.fill({ color: 0xffffff, alpha: 0.8 });
}

/** Princess — golden crown. */
function drawCrown(gfx: Graphics): void {
  gfx.roundRect(-7, 0, 14, 5, 1);
  gfx.fill(0xffcc00);
  gfx.roundRect(-7, 0, 14, 5, 1);
  gfx.stroke({ width: 0.8, color: 0xcc9900 });
  gfx.moveTo(-7, 0);
  gfx.lineTo(-6, -7);
  gfx.lineTo(-3, -2);
  gfx.lineTo(0, -9);
  gfx.lineTo(3, -2);
  gfx.lineTo(6, -7);
  gfx.lineTo(7, 0);
  gfx.closePath();
  gfx.fill(0xffcc00);
  gfx.moveTo(-7, 0);
  gfx.lineTo(-6, -7);
  gfx.lineTo(-3, -2);
  gfx.lineTo(0, -9);
  gfx.lineTo(3, -2);
  gfx.lineTo(6, -7);
  gfx.lineTo(7, 0);
  gfx.stroke({ width: 0.8, color: 0xcc9900 });
  gfx.circle(0, -7, 1.3);
  gfx.fill(0xff4488);
  gfx.circle(-5, -5, 1);
  gfx.fill(0x44ccff);
  gfx.circle(5, -5, 1);
  gfx.fill(0x44ccff);
  gfx.roundRect(-4, 1, 3, 2, 0.5);
  gfx.fill({ color: 0xffffff, alpha: 0.4 });
}

/** Alien — mini flying saucer disc. */
function drawPlasmaOrb(gfx: Graphics): void {
  gfx.ellipse(0, 4, 5, 3);
  gfx.fill({ color: 0x66ff44, alpha: 0.25 });
  gfx.ellipse(0, 0, 9, 4);
  gfx.fill(0x88aa99);
  gfx.ellipse(0, 0, 9, 4);
  gfx.stroke({ width: 0.6, color: 0x556655 });
  gfx.ellipse(0, -2, 4, 3);
  gfx.fill({ color: 0x66ff88, alpha: 0.7 });
  gfx.ellipse(0, -2, 4, 3);
  gfx.stroke({ width: 0.5, color: 0x44cc66 });
  gfx.circle(0, -2.5, 1.5);
  gfx.fill(0x111111);
  gfx.circle(0.5, -3, 0.6);
  gfx.fill({ color: 0xffffff, alpha: 0.8 });
  gfx.circle(-6, 0, 1);
  gfx.fill({ color: 0xff4444, alpha: 0.8 });
  gfx.circle(0, 1.5, 1);
  gfx.fill({ color: 0xffff44, alpha: 0.8 });
  gfx.circle(6, 0, 1);
  gfx.fill({ color: 0xff4444, alpha: 0.8 });
}

/** Viking — throwing axe. */
function drawThrowingAxe(gfx: Graphics): void {
  gfx.moveTo(-6, -10);
  gfx.lineTo(2, -10);
  gfx.lineTo(6, -4);
  gfx.lineTo(2, 0);
  gfx.lineTo(-1, 0);
  gfx.lineTo(-1, -10);
  gfx.closePath();
  gfx.fill(0x888888);
  gfx.moveTo(-6, -10);
  gfx.lineTo(6, -4);
  gfx.stroke({ width: 1, color: 0xaaaaaa });
  gfx.roundRect(-1.5, -1, 3, 14, 1);
  gfx.fill(0x8b5e3c);
  gfx.roundRect(-2, 4, 4, 3, 0.5);
  gfx.fill(0x664422);
}

/** Pirate — bomb with lit fuse. */
function drawCannonball(gfx: Graphics): void {
  gfx.circle(0, 1, 7);
  gfx.fill(0x222222);
  gfx.circle(0, 1, 7);
  gfx.stroke({ width: 0.8, color: 0x444444 });
  gfx.circle(-2, -1, 3);
  gfx.fill({ color: 0x555555, alpha: 0.4 });
  gfx.circle(-1.5, -1.5, 1);
  gfx.fill({ color: 0x888888, alpha: 0.3 });
  gfx.circle(-2, 1, 1.5);
  gfx.fill({ color: 0xcccccc, alpha: 0.7 });
  gfx.circle(2, 1, 1.5);
  gfx.fill({ color: 0xcccccc, alpha: 0.7 });
  gfx.circle(-2, 1, 0.7);
  gfx.fill(0x111111);
  gfx.circle(2, 1, 0.7);
  gfx.fill(0x111111);
  gfx.ellipse(0, 3.5, 1.5, 0.8);
  gfx.fill({ color: 0xcccccc, alpha: 0.5 });
  gfx.roundRect(-1.5, -8, 3, 3, 1);
  gfx.fill(0x555544);
  gfx.moveTo(0, -8);
  gfx.bezierCurveTo(3, -11, 5, -9, 4, -12);
  gfx.stroke({ width: 1.2, color: 0x887744 });
  gfx.circle(4, -12, 2.5);
  gfx.fill({ color: 0xff6600, alpha: 0.7 });
  gfx.circle(4, -12, 1.5);
  gfx.fill({ color: 0xffcc00, alpha: 0.9 });
  gfx.circle(4, -12.5, 0.6);
  gfx.fill(0xffffff);
}

/** Wizard — magic orb. */
function drawMagicOrb(gfx: Graphics): void {
  gfx.circle(0, 0, 8);
  gfx.fill({ color: 0x9944ff, alpha: 0.25 });
  gfx.circle(0, 0, 5.5);
  gfx.fill({ color: 0x7733dd, alpha: 0.5 });
  gfx.circle(0, 0, 3);
  gfx.fill(0xbb88ff);
  gfx.circle(0, 0, 1.2);
  gfx.fill(0xffdd44);
  gfx.circle(3, -3, 0.8);
  gfx.fill({ color: 0xffdd44, alpha: 0.6 });
  gfx.circle(-2, 4, 0.6);
  gfx.fill({ color: 0xffdd44, alpha: 0.4 });
}

/** Neon Chef — glowing neon knife. */
function drawNeonKnife(gfx: Graphics): void {
  gfx.roundRect(-2, -8, 4, 12, 1);
  gfx.stroke({ width: 2, color: 0x00ffff });
  gfx.fill({ color: 0x00ffff, alpha: 0.15 });
  gfx.moveTo(0, -8);
  gfx.lineTo(3, -12);
  gfx.lineTo(-3, -12);
  gfx.closePath();
  gfx.stroke({ width: 1.5, color: 0x00ffff });
  gfx.fill({ color: 0x00ffff, alpha: 0.1 });
  gfx.circle(0, 0, 1.5);
  gfx.fill(0x00ffff);
}

/** Nyan Cat — pixel toast. */
function drawPixelToast(gfx: Graphics): void {
  gfx.roundRect(-6, -5, 12, 10, 2);
  gfx.fill(0xffcc88);
  gfx.roundRect(-4, -3, 8, 6, 1);
  gfx.fill(0xff88aa);
  gfx.rect(-2, -1, 2, 2);
  gfx.fill(0xff4444);
  gfx.rect(1, 1, 2, 2);
  gfx.fill(0x44ff44);
}

/** Skeleton — thrown bone. */
function drawBone(gfx: Graphics): void {
  gfx.roundRect(-1.5, -8, 3, 16, 1);
  gfx.fill(0xeeeeee);
  gfx.circle(-3, -7, 3);
  gfx.fill(0xdddddd);
  gfx.circle(3, -7, 3);
  gfx.fill(0xdddddd);
  gfx.circle(-3, 7, 3);
  gfx.fill(0xdddddd);
  gfx.circle(3, 7, 3);
  gfx.fill(0xdddddd);
}

// ── Projectile type per character ─────────────────────────────────────────

export type ProjectileVisual =
  | "knife"
  | "shuriken"
  | "club"
  | "rolling-pin"
  | "laser"
  | "crown"
  | "plasma"
  | "axe"
  | "cannonball"
  | "magic-orb"
  | "neon-knife"
  | "pixel-toast"
  | "bone";

const characterProjectileMap: Record<string, ProjectileVisual> = {
  chef: "knife",
  goblin: "club",
  grandma: "rolling-pin",
  robot: "laser",
  ninja: "shuriken",
  princess: "crown",
  alien: "plasma",
  viking: "axe",
  pirate: "cannonball",
  wizard: "magic-orb",
  neon_chef: "neon-knife",
  nyan_cat: "pixel-toast",
  skeleton: "bone",
};

const drawFns: Record<ProjectileVisual, (gfx: Graphics) => void> = {
  knife: drawKnife,
  shuriken: drawShuriken,
  club: drawClub,
  "rolling-pin": drawRollingPin,
  laser: drawLaserBolt,
  crown: drawCrown,
  plasma: drawPlasmaOrb,
  axe: drawThrowingAxe,
  cannonball: drawCannonball,
  "magic-orb": drawMagicOrb,
  "neon-knife": drawNeonKnife,
  "pixel-toast": drawPixelToast,
  bone: drawBone,
};

/** Get the projectile visual type for a character. */
export function getProjectileVisual(characterId: string): ProjectileVisual {
  return characterProjectileMap[characterId] ?? "knife";
}

/** Whether this projectile type should spin continuously (vs tumble). */
export function projectileSpins(visual: ProjectileVisual): boolean {
  return (
    visual === "shuriken" ||
    visual === "axe" ||
    visual === "cannonball" ||
    visual === "plasma" ||
    visual === "magic-orb" ||
    visual === "crown" ||
    visual === "bone"
  );
}

/** Draw the projectile for a given character. */
export function drawProjectile(gfx: Graphics, _size: number, characterId?: string): void {
  gfx.clear();
  const visual = getProjectileVisual(characterId ?? "chef");
  drawFns[visual](gfx);
}
