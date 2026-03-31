/** Parallax zone features — Kitchen zones (Plate with Pasta, Boiling Pot). */

import type { Graphics } from "pixi.js";

export function drawPlateWithPasta(
  gfx: Graphics,
  size: number,
  animTick: number,
): void {
  gfx.clear();
  const cx = size / 2;
  const plateY = size * 0.65;

  // Checkered napkin underneath
  const napkinW = size * 0.85;
  const napkinH = size * 0.2;
  const napkinX = cx - napkinW / 2;
  const napkinY = plateY + size * 0.06;
  gfx.roundRect(napkinX, napkinY, napkinW, napkinH, 4);
  gfx.fill(0xcc3333);
  for (let nx = 0; nx < napkinW; nx += 10) {
    gfx.rect(napkinX + nx, napkinY, 5, napkinH);
    gfx.fill({ color: 0xffffff, alpha: 0.3 });
  }
  for (let ny = 0; ny < napkinH; ny += 6) {
    gfx.rect(napkinX, napkinY + ny, napkinW, 3);
    gfx.fill({ color: 0xffffff, alpha: 0.15 });
  }

  // Fork on the right
  const forkX = cx + size * 0.42;
  const forkY = plateY - 5;
  gfx.roundRect(forkX, forkY + 12, 3, 28, 1);
  gfx.fill(0xbbbbbb);
  for (const off of [-4, -1, 2, 5]) {
    gfx.roundRect(forkX + off - 1, forkY - 2, 2.5, 15, 1);
    gfx.fill(0xc0c0c0);
  }

  // Plate
  gfx.roundRect(
    cx - size * 0.42,
    plateY - size * 0.08,
    size * 0.84,
    size * 0.22,
    size * 0.11,
  );
  gfx.fill({ color: 0x000000, alpha: 0.08 });
  gfx.roundRect(
    cx - size * 0.4,
    plateY - size * 0.1,
    size * 0.8,
    size * 0.2,
    size * 0.1,
  );
  gfx.fill(0xeeeeee);
  gfx.roundRect(
    cx - size * 0.3,
    plateY - size * 0.06,
    size * 0.6,
    size * 0.12,
    size * 0.06,
  );
  gfx.fill(0xf8f8f8);

  // Sauce base
  gfx.roundRect(
    cx - size * 0.2,
    plateY - size * 0.03,
    size * 0.4,
    size * 0.06,
    size * 0.03,
  );
  gfx.fill({ color: 0xcc3333, alpha: 0.4 });

  // Pasta pile — dense noodle strands
  const pastaColors = [0xf0c050, 0xe8b840, 0xf5d070, 0xdaa830, 0xffe080];
  const pileCenter = plateY - size * 0.02;
  const pileRadius = size * 0.22;

  for (let s = 0; s < 10; s++) {
    const sx = cx + Math.sin(s * 1.3) * pileRadius * 0.7;
    const sy = pileCenter + (s % 3) * 1.5 - 2;
    const w = Math.sin(animTick * 0.015 + s) * 1.5;
    gfx.moveTo(sx - 12, sy + w);
    gfx.bezierCurveTo(
      sx - 4,
      sy - 3 + w,
      sx + 5,
      sy + 2 - w,
      sx + 12,
      sy - 1 + w,
    );
    gfx.stroke({ width: 2, color: pastaColors[s % 5], alpha: 0.7 });
  }
  for (let s = 0; s < 10; s++) {
    const sx = cx + Math.cos(s * 0.9) * pileRadius * 0.5;
    const sy = pileCenter - 4 - (s % 3) * 2;
    const w = Math.sin(animTick * 0.02 + s * 0.8) * 2;
    const curl = Math.sin(s * 1.5) * 7;
    gfx.moveTo(sx - 8 + curl, sy + 2 + w);
    gfx.bezierCurveTo(
      sx + w * 2,
      sy - 6,
      sx + curl,
      sy + 3,
      sx + 10 - curl,
      sy - 2 + w,
    );
    gfx.stroke({ width: 1.8, color: pastaColors[(s + 2) % 5], alpha: 0.85 });
  }
  for (let s = 0; s < 6; s++) {
    const sx = cx + Math.sin(s * 1.4) * pileRadius * 0.35;
    const sy = pileCenter - 5 - (s % 3) * 2;
    const w = Math.sin(animTick * 0.022 + s * 1.2) * 1.5;
    gfx.moveTo(sx - 4, sy + w);
    gfx.bezierCurveTo(sx, sy - 4 + w, sx + 5, sy - 3 - w, sx + 3, sy + 1 + w);
    gfx.stroke({ width: 1.6, color: pastaColors[(s + 1) % 5] });
  }

  // Hanging strands
  for (let h = 0; h < 4; h++) {
    const hx = cx + (h - 1.5) * 16;
    const w = Math.sin(animTick * 0.013 + h * 1.8) * 3;
    gfx.moveTo(hx, pileCenter + 2);
    gfx.bezierCurveTo(
      hx + w + 5,
      plateY + 8,
      hx + w - 3,
      plateY + 15,
      hx + w + 3,
      plateY + 22,
    );
    gfx.stroke({ width: 1.8, color: pastaColors[h % 5], alpha: 0.55 });
  }

  // Sauce drizzle
  gfx.moveTo(cx - 10, pileCenter - 8);
  gfx.bezierCurveTo(
    cx,
    pileCenter - 14,
    cx + 8,
    pileCenter - 5,
    cx + 14,
    pileCenter - 10,
  );
  gfx.stroke({ width: 2.5, color: 0xcc3333, alpha: 0.5 });

  // Falling strands
  for (let s = 0; s < 3; s++) {
    const progress = (animTick * 0.004 + s * 0.33) % 1;
    const startY = pileCenter - size * 0.2;
    const endY = pileCenter - 3;
    const curY = startY + (endY - startY) * progress;
    const wobble = Math.sin(animTick * 0.03 + s * 2.5) * 5;
    const sx = cx + (s - 1) * 15 + wobble;

    gfx.moveTo(sx, curY - 10);
    gfx.bezierCurveTo(sx + 4, curY - 4, sx - 3, curY + 2, sx + 2, curY + 8);
    gfx.stroke({ width: 1.8, color: 0xf0c050, alpha: 0.3 + progress * 0.6 });

    if (progress > 0.8) {
      const intensity = (progress - 0.8) / 0.2;
      for (let sp = 0; sp < 3; sp++) {
        const spAngle = (sp / 3) * Math.PI + Math.PI;
        const spDist = intensity * 5;
        gfx.circle(
          sx + Math.cos(spAngle) * spDist,
          endY + Math.sin(spAngle) * spDist * 0.4,
          1.2,
        );
        gfx.fill({ color: 0xf0c050, alpha: 0.5 * (1 - intensity) });
      }
    }
  }

  // Parmesan flakes
  for (let f = 0; f < 6; f++) {
    const fx = cx + Math.sin(f * 1.7 + 0.3) * 14;
    const fy = plateY - 10 - f * 2.5;
    gfx.rect(fx, fy, 2.5, 1.5);
    gfx.fill({ color: 0xffffcc, alpha: 0.6 });
  }

  // Steam
  for (let s = 0; s < 5; s++) {
    const phase = (animTick * 0.006 + s * 0.2) % 1;
    const sx = cx + (s - 2) * 9;
    const sy = plateY - 22 - phase * 35;
    const wobble = Math.sin(animTick * 0.025 + s * 2) * 7;
    const puffR = 3.5 + (1 - phase) * 5;
    gfx.circle(sx + wobble, sy, puffR);
    gfx.fill({ color: 0xffffff, alpha: 0.25 * (1 - phase) });
    gfx.circle(sx + wobble + 3, sy - 3, puffR * 0.6);
    gfx.fill({ color: 0xffffff, alpha: 0.15 * (1 - phase) });
  }
}

export function drawBoilingPot(
  gfx: Graphics,
  size: number,
  animTick: number,
): void {
  gfx.clear();
  const cx = size / 2;

  // Big steam cloud
  for (let layer = 0; layer < 3; layer++) {
    for (let s = 0; s < 4; s++) {
      const phase = (animTick * 0.006 + s * 0.25 + layer * 0.08) % 1;
      const sx =
        cx + (s - 1.5) * 14 + Math.sin(animTick * 0.02 + s * 2 + layer) * 12;
      const sy = size * 0.25 - phase * size * 0.6 - layer * 8;
      const puffR = 8 + (1 - phase) * 10 + layer * 3;
      gfx.circle(sx, sy, puffR);
      gfx.fill({ color: 0xffffff, alpha: 0.5 * (1 - phase) });
      gfx.circle(sx + puffR * 0.4, sy - puffR * 0.3, puffR * 0.65);
      gfx.fill({ color: 0xffffff, alpha: 0.35 * (1 - phase) });
    }
  }

  // Pot body
  gfx.roundRect(cx - size * 0.38, size * 0.4, size * 0.76, size * 0.52, 6);
  gfx.fill(0x777777);
  gfx.roundRect(cx - size * 0.28, size * 0.44, size * 0.14, size * 0.38, 3);
  gfx.fill({ color: 0xffffff, alpha: 0.12 });
  // Rim
  gfx.roundRect(cx - size * 0.42, size * 0.38, size * 0.84, size * 0.08, 4);
  gfx.fill(0x999999);
  gfx.roundRect(cx - size * 0.42, size * 0.38, size * 0.84, size * 0.03, 2);
  gfx.fill(0xbbbbbb);
  // Handles
  gfx.roundRect(cx - size * 0.52, size * 0.5, size * 0.13, size * 0.06, 3);
  gfx.fill(0x666666);
  gfx.roundRect(cx + size * 0.39, size * 0.5, size * 0.13, size * 0.06, 3);
  gfx.fill(0x666666);

  // Water surface
  const waterWobble = Math.sin(animTick * 0.06) * 2;
  gfx.roundRect(
    cx - size * 0.32,
    size * 0.4 + waterWobble,
    size * 0.64,
    size * 0.06,
    size * 0.03,
  );
  gfx.fill({ color: 0x88ccff, alpha: 0.6 });

  // Bubbles
  for (let b = 0; b < 8; b++) {
    const phase = (animTick * 0.02 + b * 0.12) % 1;
    const bx = cx + Math.sin(b * 2.3 + animTick * 0.015) * size * 0.25;
    const by = size * 0.85 - phase * size * 0.45;
    const br = 2 + Math.sin(animTick * 0.15 + b) * 2 + (1 - phase) * 2;
    gfx.circle(bx, by, br);
    gfx.fill({ color: 0xffffff, alpha: 0.6 * (1 - phase) });
  }

  // Spaghetti poking out — tighter cluster
  const pastaColors = [0xf0c050, 0xe8b840, 0xf5d070, 0xdaa830];
  for (let sp = 0; sp < 8; sp++) {
    const spx = cx + (sp - 3.5) * 5; // tighter spacing (was 7)
    const wobble = Math.sin(animTick * 0.018 + sp * 1.3) * 3;
    const height = size * 0.3 + (sp % 3) * size * 0.08;
    gfx.moveTo(spx, size * 0.4);
    gfx.bezierCurveTo(
      spx + wobble,
      size * 0.4 - height * 0.4,
      spx - wobble * 1.5,
      size * 0.4 - height * 0.7,
      spx + wobble * 0.8,
      size * 0.4 - height,
    );
    gfx.stroke({ width: 2, color: pastaColors[sp % 4] });
  }
  // Drooping strands
  for (let d = 0; d < 3; d++) {
    const dx = cx + (d - 1) * 22;
    const wobble = Math.sin(animTick * 0.015 + d * 2) * 2;
    gfx.moveTo(dx, size * 0.4);
    gfx.bezierCurveTo(
      dx + wobble + 8,
      size * 0.45,
      dx + wobble + 5,
      size * 0.52,
      dx + wobble + 10,
      size * 0.58,
    );
    gfx.stroke({ width: 1.8, color: pastaColors[d % 4], alpha: 0.7 });
  }

  // Water droplets
  for (let d = 0; d < 3; d++) {
    const phase = (animTick * 0.025 + d * 0.33) % 1;
    if (phase < 0.5) {
      const dx = cx + (d - 1) * 20;
      const dy = size * 0.35 - phase * 15;
      gfx.circle(dx, dy, 1.5);
      gfx.fill({ color: 0xaaddff, alpha: 0.6 * (1 - phase * 2) });
    }
  }
}
