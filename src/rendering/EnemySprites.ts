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
function drawSparkle(gfx: Graphics): void {
  // 4-point sparkle star
  const r = 8, ri = 3;
  gfx.moveTo(0, -r);
  gfx.lineTo(ri * 0.5, -ri * 0.5); gfx.lineTo(r, 0);
  gfx.lineTo(ri * 0.5, ri * 0.5); gfx.lineTo(0, r);
  gfx.lineTo(-ri * 0.5, ri * 0.5); gfx.lineTo(-r, 0);
  gfx.lineTo(-ri * 0.5, -ri * 0.5);
  gfx.closePath();
  gfx.fill(0xff88cc);
  // Center glow
  gfx.circle(0, 0, 2.5); gfx.fill(0xffffff);
  // Tiny accent sparkles
  gfx.circle(3, -4, 1); gfx.fill({ color: 0xffffff, alpha: 0.6 });
  gfx.circle(-3, 3, 0.8); gfx.fill({ color: 0xffffff, alpha: 0.5 });
}

/** Alien — plasma orb. */
function drawPlasmaOrb(gfx: Graphics): void {
  // Outer glow
  gfx.circle(0, 0, 8); gfx.fill({ color: 0x88ff66, alpha: 0.3 });
  // Mid ring
  gfx.circle(0, 0, 5.5); gfx.fill({ color: 0x66ee44, alpha: 0.5 });
  // Core
  gfx.circle(0, 0, 3); gfx.fill(0xccff88);
  // Bright center
  gfx.circle(-1, -1, 1.2); gfx.fill({ color: 0xffffff, alpha: 0.7 });
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

/** Pirate — cannonball. */
function drawCannonball(gfx: Graphics): void {
  // Ball
  gfx.circle(0, 0, 6); gfx.fill(0x333333);
  // Highlight
  gfx.circle(-2, -2, 2); gfx.fill({ color: 0x666666, alpha: 0.6 });
  // Bright spot
  gfx.circle(-1.5, -1.5, 0.8); gfx.fill({ color: 0xaaaaaa, alpha: 0.5 });
  // Fuse spark trail (small dots behind)
  gfx.circle(3, 5, 1.2); gfx.fill({ color: 0xff8800, alpha: 0.7 });
  gfx.circle(4, 7, 0.8); gfx.fill({ color: 0xffcc00, alpha: 0.5 });
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

// ── Projectile type per character ─────────────────────────────────────────

export type ProjectileVisual = "knife" | "shuriken" | "club" | "rolling-pin"
  | "laser" | "sparkle" | "plasma" | "axe" | "cannonball" | "magic-orb";

const characterProjectileMap: Record<string, ProjectileVisual> = {
  chef: "knife",
  goblin: "club",
  grandma: "rolling-pin",
  robot: "laser",
  ninja: "shuriken",
  princess: "sparkle",
  alien: "plasma",
  viking: "axe",
  pirate: "cannonball",
  wizard: "magic-orb",
};

const drawFns: Record<ProjectileVisual, (gfx: Graphics) => void> = {
  "knife": drawKnife,
  "shuriken": drawShuriken,
  "club": drawClub,
  "rolling-pin": drawRollingPin,
  "laser": drawLaserBolt,
  "sparkle": drawSparkle,
  "plasma": drawPlasmaOrb,
  "axe": drawThrowingAxe,
  "cannonball": drawCannonball,
  "magic-orb": drawMagicOrb,
};

/** Get the projectile visual type for a character. */
export function getProjectileVisual(characterId: string): ProjectileVisual {
  return characterProjectileMap[characterId] ?? "knife";
}

/** Whether this projectile type should spin continuously (vs tumble). */
export function projectileSpins(visual: ProjectileVisual): boolean {
  return visual === "shuriken" || visual === "axe" || visual === "cannonball"
    || visual === "plasma" || visual === "magic-orb";
}

/** Draw the projectile for a given character. */
export function drawProjectile(gfx: Graphics, _size: number, characterId?: string): void {
  gfx.clear();
  const visual = getProjectileVisual(characterId ?? "chef");
  drawFns[visual](gfx);
}
