/** Enemy and projectile sprites — pure PixiJS drawing. */

import { Graphics } from "pixi.js";

/** Draw an enemy based on type. */
export function drawEnemy(
  gfx: Graphics,
  width: number,
  type: string,
): void {
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

// ── Character projectile drawing functions ────────────────────────────────

/** Chef — kitchen knife (default). */
function drawKnife(gfx: Graphics): void {
  // Blade — wide chef knife shape
  gfx.moveTo(0, -16);
  gfx.lineTo(4, -12);
  gfx.lineTo(5, -4);
  gfx.lineTo(5, 0);
  gfx.lineTo(-2, 0);
  gfx.lineTo(-2, -14);
  gfx.closePath();
  gfx.fill(0xccccdd);
  // Blade highlight
  gfx.moveTo(2, -12); gfx.lineTo(4, -6); gfx.lineTo(4, 0);
  gfx.lineTo(3, 0); gfx.lineTo(3, -6); gfx.lineTo(1, -12);
  gfx.closePath();
  gfx.fill({ color: 0xffffff, alpha: 0.4 });
  // Cutting edge
  gfx.moveTo(-2, -14); gfx.lineTo(-2, 0);
  gfx.stroke({ width: 1, color: 0x888899 });
  // Bolster
  gfx.rect(-3, 0, 9, 3); gfx.fill(0x999999);
  // Handle
  gfx.roundRect(-2, 3, 6, 12, 2); gfx.fill(0x553322);
  gfx.roundRect(-1, 4, 2, 10, 1); gfx.fill({ color: 0x774433, alpha: 0.6 });
  // Rivets
  gfx.circle(1, 6, 1); gfx.fill(0xbbbbbb);
  gfx.circle(1, 11, 1); gfx.fill(0xbbbbbb);
}

/** Ninja — shuriken (4-pointed star). */
function drawShuriken(gfx: Graphics): void {
  const r = 8; // outer radius
  const ri = 3; // inner radius
  // 4-pointed star
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
  // Center circle
  gfx.circle(0, 0, 2); gfx.fill(0x444444);
  // Highlight edges
  gfx.circle(0, -r + 2, 1); gfx.fill({ color: 0xffffff, alpha: 0.4 });
}

/** Goblin — crude wooden club. */
function drawClub(gfx: Graphics): void {
  // Club head — rough oval
  gfx.ellipse(0, -10, 6, 5); gfx.fill(0x6b4226);
  // Knots on club head
  gfx.circle(-3, -11, 1.5); gfx.fill(0x4a2f1a);
  gfx.circle(2, -8, 1.2); gfx.fill(0x4a2f1a);
  // Handle — tapered wood
  gfx.moveTo(-2.5, -6); gfx.lineTo(-2, 10);
  gfx.lineTo(2, 10); gfx.lineTo(2.5, -6);
  gfx.closePath(); gfx.fill(0x8b5e3c);
  // Wood grain line
  gfx.moveTo(0, -5); gfx.lineTo(0, 9);
  gfx.stroke({ width: 0.8, color: 0x6b4226 });
}

/** Grandma — rolling pin. */
function drawRollingPin(gfx: Graphics): void {
  // Main barrel
  gfx.roundRect(-4, -10, 8, 20, 3); gfx.fill(0xc9a86c);
  // Highlight stripe
  gfx.roundRect(-1, -9, 2, 18, 1); gfx.fill({ color: 0xffffff, alpha: 0.25 });
  // Handles
  gfx.roundRect(-2.5, -14, 5, 5, 2); gfx.fill(0x8b6914);
  gfx.roundRect(-2.5, 9, 5, 5, 2); gfx.fill(0x8b6914);
}

/** Robot — laser bolt. */
function drawLaserBolt(gfx: Graphics): void {
  // Outer glow
  gfx.roundRect(-3, -10, 6, 20, 3); gfx.fill({ color: 0x00ffcc, alpha: 0.3 });
  // Core beam
  gfx.roundRect(-1.5, -8, 3, 16, 2); gfx.fill(0x00ffcc);
  // Bright center
  gfx.roundRect(-0.5, -6, 1, 12, 1); gfx.fill({ color: 0xffffff, alpha: 0.8 });
}

/** Princess — magic wand bolt (sparkle). */
/** Princess — golden crown. */
function drawCrown(gfx: Graphics): void {
  // Crown base band
  gfx.roundRect(-7, 0, 14, 5, 1);
  gfx.fill(0xffcc00);
  gfx.roundRect(-7, 0, 14, 5, 1);
  gfx.stroke({ width: 0.8, color: 0xcc9900 });
  // Three crown points
  gfx.moveTo(-7, 0);
  gfx.lineTo(-6, -7); gfx.lineTo(-3, -2);
  gfx.lineTo(0, -9);
  gfx.lineTo(3, -2); gfx.lineTo(6, -7);
  gfx.lineTo(7, 0);
  gfx.closePath();
  gfx.fill(0xffcc00);
  gfx.moveTo(-7, 0);
  gfx.lineTo(-6, -7); gfx.lineTo(-3, -2);
  gfx.lineTo(0, -9);
  gfx.lineTo(3, -2); gfx.lineTo(6, -7);
  gfx.lineTo(7, 0);
  gfx.stroke({ width: 0.8, color: 0xcc9900 });
  // Jewel accents on points
  gfx.circle(0, -7, 1.3); gfx.fill(0xff4488);
  gfx.circle(-5, -5, 1); gfx.fill(0x44ccff);
  gfx.circle(5, -5, 1); gfx.fill(0x44ccff);
  // Shimmer highlight
  gfx.roundRect(-4, 1, 3, 2, 0.5); gfx.fill({ color: 0xffffff, alpha: 0.4 });
}

/** Alien — mini flying saucer disc. */
function drawPlasmaOrb(gfx: Graphics): void {
  // Beam glow underneath
  gfx.ellipse(0, 4, 5, 3); gfx.fill({ color: 0x66ff44, alpha: 0.25 });
  // Saucer body — metallic disc
  gfx.ellipse(0, 0, 9, 4); gfx.fill(0x88aa99);
  gfx.ellipse(0, 0, 9, 4); gfx.stroke({ width: 0.6, color: 0x556655 });
  // Dome on top
  gfx.ellipse(0, -2, 4, 3); gfx.fill({ color: 0x66ff88, alpha: 0.7 });
  gfx.ellipse(0, -2, 4, 3); gfx.stroke({ width: 0.5, color: 0x44cc66 });
  // Alien eye inside dome
  gfx.circle(0, -2.5, 1.5); gfx.fill(0x111111);
  gfx.circle(0.5, -3, 0.6); gfx.fill({ color: 0xffffff, alpha: 0.8 });
  // Running lights on rim
  gfx.circle(-6, 0, 1); gfx.fill({ color: 0xff4444, alpha: 0.8 });
  gfx.circle(0, 1.5, 1); gfx.fill({ color: 0xffff44, alpha: 0.8 });
  gfx.circle(6, 0, 1); gfx.fill({ color: 0xff4444, alpha: 0.8 });
}

/** Viking — throwing axe. */
function drawThrowingAxe(gfx: Graphics): void {
  // Axe head — wedge shape
  gfx.moveTo(-6, -10); gfx.lineTo(2, -10);
  gfx.lineTo(6, -4); gfx.lineTo(2, 0);
  gfx.lineTo(-1, 0); gfx.lineTo(-1, -10);
  gfx.closePath(); gfx.fill(0x888888);
  // Axe edge highlight
  gfx.moveTo(-6, -10); gfx.lineTo(6, -4);
  gfx.stroke({ width: 1, color: 0xaaaaaa });
  // Handle
  gfx.roundRect(-1.5, -1, 3, 14, 1); gfx.fill(0x8b5e3c);
  // Handle wrap
  gfx.roundRect(-2, 4, 4, 3, 0.5); gfx.fill(0x664422);
}

/** Pirate — bomb with lit fuse. */
function drawCannonball(gfx: Graphics): void {
  // Bomb body
  gfx.circle(0, 1, 7); gfx.fill(0x222222);
  gfx.circle(0, 1, 7); gfx.stroke({ width: 0.8, color: 0x444444 });
  // Metallic highlight
  gfx.circle(-2, -1, 3); gfx.fill({ color: 0x555555, alpha: 0.4 });
  gfx.circle(-1.5, -1.5, 1); gfx.fill({ color: 0x888888, alpha: 0.3 });
  // Skull face
  gfx.circle(-2, 1, 1.5); gfx.fill({ color: 0xcccccc, alpha: 0.7 }); // left eye
  gfx.circle(2, 1, 1.5); gfx.fill({ color: 0xcccccc, alpha: 0.7 }); // right eye
  gfx.circle(-2, 1, 0.7); gfx.fill(0x111111); // left pupil
  gfx.circle(2, 1, 0.7); gfx.fill(0x111111); // right pupil
  gfx.ellipse(0, 3.5, 1.5, 0.8); gfx.fill({ color: 0xcccccc, alpha: 0.5 }); // mouth
  // Fuse nub on top
  gfx.roundRect(-1.5, -8, 3, 3, 1); gfx.fill(0x555544);
  // Fuse rope
  gfx.moveTo(0, -8); gfx.bezierCurveTo(3, -11, 5, -9, 4, -12);
  gfx.stroke({ width: 1.2, color: 0x887744 });
  // Spark at fuse tip
  gfx.circle(4, -12, 2.5); gfx.fill({ color: 0xff6600, alpha: 0.7 });
  gfx.circle(4, -12, 1.5); gfx.fill({ color: 0xffcc00, alpha: 0.9 });
  gfx.circle(4, -12.5, 0.6); gfx.fill(0xffffff);
}

/** Wizard — magic orb. */
function drawMagicOrb(gfx: Graphics): void {
  // Outer glow — purple
  gfx.circle(0, 0, 8); gfx.fill({ color: 0x9944ff, alpha: 0.25 });
  // Mid ring
  gfx.circle(0, 0, 5.5); gfx.fill({ color: 0x7733dd, alpha: 0.5 });
  // Core
  gfx.circle(0, 0, 3); gfx.fill(0xbb88ff);
  // Star accent
  gfx.circle(0, 0, 1.2); gfx.fill(0xffdd44);
  // Sparkle accents
  gfx.circle(3, -3, 0.8); gfx.fill({ color: 0xffdd44, alpha: 0.6 });
  gfx.circle(-2, 4, 0.6); gfx.fill({ color: 0xffdd44, alpha: 0.4 });
}

/** Neon Chef — glowing neon knife. */
function drawNeonKnife(gfx: Graphics): void {
  gfx.roundRect(-2, -8, 4, 12, 1);
  gfx.stroke({ width: 2, color: 0x00ffff }); gfx.fill({ color: 0x00ffff, alpha: 0.15 });
  gfx.moveTo(0, -8); gfx.lineTo(3, -12); gfx.lineTo(-3, -12); gfx.closePath();
  gfx.stroke({ width: 1.5, color: 0x00ffff }); gfx.fill({ color: 0x00ffff, alpha: 0.1 });
  gfx.circle(0, 0, 1.5); gfx.fill(0x00ffff); // center glow
}

/** Nyan Cat — pixel toast. */
function drawPixelToast(gfx: Graphics): void {
  gfx.roundRect(-6, -5, 12, 10, 2); gfx.fill(0xffcc88); // toast body
  gfx.roundRect(-4, -3, 8, 6, 1); gfx.fill(0xff88aa); // pink frosting
  gfx.rect(-2, -1, 2, 2); gfx.fill(0xff4444); // sprinkle
  gfx.rect(1, 1, 2, 2); gfx.fill(0x44ff44); // sprinkle
}

/** Skeleton — thrown bone. */
function drawBone(gfx: Graphics): void {
  gfx.roundRect(-1.5, -8, 3, 16, 1); gfx.fill(0xeeeeee); // shaft
  gfx.circle(-3, -7, 3); gfx.fill(0xdddddd); // top knobs
  gfx.circle(3, -7, 3); gfx.fill(0xdddddd);
  gfx.circle(-3, 7, 3); gfx.fill(0xdddddd); // bottom knobs
  gfx.circle(3, 7, 3); gfx.fill(0xdddddd);
}

// ── Projectile type per character ─────────────────────────────────────────

export type ProjectileVisual = "knife" | "shuriken" | "club" | "rolling-pin"
  | "laser" | "crown" | "plasma" | "axe" | "cannonball" | "magic-orb"
  | "neon-knife" | "pixel-toast" | "bone";

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
  "knife": drawKnife,
  "shuriken": drawShuriken,
  "club": drawClub,
  "rolling-pin": drawRollingPin,
  "laser": drawLaserBolt,
  "crown": drawCrown,
  "plasma": drawPlasmaOrb,
  "axe": drawThrowingAxe,
  "cannonball": drawCannonball,
  "magic-orb": drawMagicOrb,
  "neon-knife": drawNeonKnife,
  "pixel-toast": drawPixelToast,
  "bone": drawBone,
};

/** Get the projectile visual type for a character. */
export function getProjectileVisual(characterId: string): ProjectileVisual {
  return characterProjectileMap[characterId] ?? "knife";
}

/** Whether this projectile type should spin continuously (vs tumble). */
export function projectileSpins(visual: ProjectileVisual): boolean {
  return visual === "shuriken" || visual === "axe" || visual === "cannonball"
    || visual === "plasma" || visual === "magic-orb" || visual === "crown"
    || visual === "bone";
}

/** Draw the projectile for a given character. */
export function drawProjectile(gfx: Graphics, _size: number, characterId?: string): void {
  gfx.clear();
  const visual = getProjectileVisual(characterId ?? "chef");
  drawFns[visual](gfx);
}
