/** Parallax zone features — Space zone (Void Portal / Solar System). */

import type { Graphics } from "pixi.js";

export function drawVoidPortal(
  gfx: Graphics,
  size: number,
  animTick: number,
): void {
  gfx.clear();
  const cx = size / 2;
  const cy = size / 2;

  // Central star (sun)
  const sunPulse = 0.85 + Math.sin(animTick * 0.03) * 0.15;
  gfx.circle(cx, cy, size * 0.18 * sunPulse);
  gfx.fill({ color: 0xffaa33, alpha: 0.15 });
  gfx.circle(cx, cy, size * 0.12 * sunPulse);
  gfx.fill({ color: 0xffcc44, alpha: 0.3 });
  gfx.circle(cx, cy, size * 0.07 * sunPulse);
  gfx.fill(0xffdd66);
  gfx.circle(cx - 2, cy - 2, size * 0.03);
  gfx.fill({ color: 0xffffff, alpha: 0.5 });

  // Orbiting planets
  const planets = [
    { dist: 0.22, speed: 0.008, r: 4, color: 0x8888ff, hasRing: false },
    { dist: 0.32, speed: -0.005, r: 6, color: 0xcc5533, hasRing: false },
    { dist: 0.42, speed: 0.003, r: 5, color: 0x44bb88, hasRing: true },
  ];

  for (const planet of planets) {
    const angle = animTick * planet.speed;
    const px = cx + Math.cos(angle) * size * planet.dist;
    const py = cy + Math.sin(angle) * size * planet.dist * 0.5;

    for (let t = 0; t < 8; t++) {
      const trailAngle = angle - t * 0.15 * Math.sign(planet.speed);
      const tx = cx + Math.cos(trailAngle) * size * planet.dist;
      const ty = cy + Math.sin(trailAngle) * size * planet.dist * 0.5;
      gfx.circle(tx, ty, 1);
      gfx.fill({ color: planet.color, alpha: 0.15 - t * 0.015 });
    }

    gfx.circle(px, py, planet.r);
    gfx.fill(planet.color);
    gfx.circle(px - 1, py - 1, planet.r * 0.35);
    gfx.fill({ color: 0xffffff, alpha: 0.3 });

    if (planet.hasRing) {
      gfx.moveTo(px - planet.r * 2, py);
      gfx.lineTo(px + planet.r * 2, py);
      gfx.stroke({ width: 1.5, color: planet.color, alpha: 0.5 });
    }
  }

  // Comet
  const cometPhase = (animTick * 0.003) % 1;
  const cometAngle = cometPhase * Math.PI * 2 - Math.PI;
  const cometDist = size * 0.5 * (1 - cometPhase * 0.6);
  const cometX = cx + Math.cos(cometAngle) * cometDist;
  const cometY = cy + Math.sin(cometAngle) * cometDist * 0.4;

  for (let t = 0; t < 12; t++) {
    const tailAngle = cometAngle - t * 0.12;
    const tailDist = cometDist + t * 4;
    const tx = cx + Math.cos(tailAngle) * tailDist;
    const ty = cy + Math.sin(tailAngle) * tailDist * 0.4;
    const tailR = 2.5 - t * 0.18;
    if (tailR > 0) {
      gfx.circle(tx, ty, tailR);
      gfx.fill({ color: 0xff6644, alpha: 0.5 - t * 0.04 });
    }
  }

  gfx.circle(cometX, cometY, 3.5);
  gfx.fill(0xff8844);
  gfx.circle(cometX - 1, cometY - 1, 1.5);
  gfx.fill({ color: 0xffffff, alpha: 0.6 });

  // Collision shockwave
  if (cometPhase > 0.85) {
    const shockProgress = (cometPhase - 0.85) / 0.15;
    const shockR = shockProgress * size * 0.45;
    gfx.circle(cx, cy, shockR);
    gfx.stroke({ width: 2, color: 0xffaa44, alpha: 0.6 * (1 - shockProgress) });
    for (let d = 0; d < 6; d++) {
      const da = (d / 6) * Math.PI * 2;
      const dd = shockR * 0.8;
      gfx.circle(cx + Math.cos(da) * dd, cy + Math.sin(da) * dd * 0.5, 2);
      gfx.fill({ color: 0xffcc44, alpha: 0.4 * (1 - shockProgress) });
    }
  }

  // Distant stars
  for (let s = 0; s < 8; s++) {
    const sx = (Math.sin(s * 3.7) * 0.5 + 0.5) * size;
    const sy = (Math.cos(s * 2.3) * 0.5 + 0.5) * size;
    const twinkle = 0.3 + Math.sin(animTick * 0.05 + s * 1.5) * 0.3;
    gfx.circle(sx, sy, 1);
    gfx.fill({ color: 0xffffff, alpha: twinkle });
  }
}
