/** Parallax background — themed, animated decorations per zone. */

import { Container, Graphics } from 'pixi.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants'
import type { ZoneTheme } from './Zone'

const FAR_SPEED = 0.04
const MID_SPEED = 0.12
const MIN_SPACING = 80

type ShapeType = 'spaghetti' | 'tomato' | 'fork' | 'steam' | 'bubble' | 'fusilli' | 'star' | 'swirl' | 'nebula'

interface ParallaxItem {
  baseY: number
  x: number
  gfx: Graphics
  shape: ShapeType
  size: number
  animOffset: number
}

interface ParallaxLayer {
  container: Container
  speed: number
  items: ParallaxItem[]
}

const ZONE_CONFIGS: { shapes: ShapeType[]; }[] = [
  { shapes: ['spaghetti', 'tomato', 'fork', 'spaghetti', 'tomato'] },
  { shapes: ['steam', 'bubble', 'fusilli', 'steam', 'bubble'] },
  { shapes: ['star', 'swirl', 'nebula', 'star', 'swirl'] },
]

// ── Shape drawing ───────────────────────────────────────────────────────────

function drawShape(gfx: Graphics, shape: ShapeType, size: number): void {
  gfx.clear()
  switch (shape) {
    case 'spaghetti': {
      // Dense tangled bundle — 18 strands overlapping in a tight area
      const colors = [0xf0c050, 0xe8b840, 0xf5d070, 0xdaa830, 0xffe080]
      for (let s = 0; s < 18; s++) {
        // Tight cluster — all strands start/end within a narrow band
        const ox = (Math.sin(s * 0.8) * 0.3) * size
        const oy = (Math.cos(s * 1.1) * 0.15) * size
        const startX = size * 0.3 + ox
        const startY = oy
        const endX = size * 0.5 + ox * 0.8
        const endY = size + oy * 0.5

        // Varied curves — each strand bends differently
        const bend1X = startX + Math.sin(s * 1.7) * size * 0.35
        const bend1Y = size * (0.25 + Math.cos(s * 0.6) * 0.15)
        const bend2X = endX + Math.cos(s * 2.1) * size * 0.3
        const bend2Y = size * (0.6 + Math.sin(s * 0.9) * 0.1)

        gfx.moveTo(startX, startY)
        gfx.bezierCurveTo(bend1X, bend1Y, bend2X, bend2Y, endX, endY)
        gfx.stroke({ width: 1.8 + (s % 3) * 0.3, color: colors[s % colors.length] })
      }
      break
    }
    case 'tomato': {
      // Irregular tomato with green leaves
      const r = size * 0.35
      const cx = size / 2
      const cy = size * 0.55
      // Shadow
      gfx.ellipse(cx + 2, cy + r * 0.85, r * 0.65, r * 0.15)
      gfx.fill({ color: 0x000000, alpha: 0.1 })
      // Irregular body — slightly squashed ellipse with bumps
      gfx.ellipse(cx, cy, r * 1.05, r * 0.9)
      gfx.fill(0xcc3333)
      // Segment lines (tomato ridges)
      gfx.moveTo(cx - r * 0.3, cy - r * 0.7)
      gfx.quadraticCurveTo(cx - r * 0.4, cy, cx - r * 0.2, cy + r * 0.75)
      gfx.stroke({ width: 1, color: 0xaa2222, alpha: 0.3 })
      gfx.moveTo(cx + r * 0.25, cy - r * 0.65)
      gfx.quadraticCurveTo(cx + r * 0.35, cy, cx + r * 0.15, cy + r * 0.7)
      gfx.stroke({ width: 1, color: 0xaa2222, alpha: 0.25 })
      // Highlight
      gfx.ellipse(cx - r * 0.2, cy - r * 0.2, r * 0.25, r * 0.2)
      gfx.fill({ color: 0xffffff, alpha: 0.25 })
      // Stem — slightly crooked
      gfx.moveTo(cx - 1, cy - r * 0.9 - 5)
      gfx.lineTo(cx + 1, cy - r * 0.9 - 2)
      gfx.lineTo(cx, cy - r * 0.9 + 1)
      gfx.stroke({ width: 3, color: 0x228822 })
      // Irregular leaves — each a different length, angle, and curve
      const leafData = [
        { angle: -1.8, len: 9, curve: 4, width: 2.2 },
        { angle: -0.9, len: 7, curve: -3, width: 1.8 },
        { angle: -0.2, len: 10, curve: 5, width: 2.0 },
        { angle: 0.6, len: 6, curve: -2, width: 1.6 },
        { angle: 1.3, len: 8, curve: 3, width: 2.1 },
      ]
      const leafBase = cy - r * 0.9
      for (const leaf of leafData) {
        const tipX = cx + Math.cos(leaf.angle) * leaf.len
        const tipY = leafBase + Math.sin(leaf.angle) * leaf.len * 0.6
        const ctrlX = (cx + tipX) / 2 + leaf.curve
        const ctrlY = (leafBase + tipY) / 2 - 3
        gfx.moveTo(cx, leafBase)
        gfx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY)
        const greens = [0x2d8b2d, 0x33aa33, 0x3dbb3d, 0x28802d, 0x35993a]
        gfx.stroke({ width: leaf.width, color: greens[leafData.indexOf(leaf)] })
      }
      // Bottom dimple
      gfx.circle(cx, cy + r * 0.65, 2)
      gfx.fill({ color: 0x992222, alpha: 0.3 })
      break
    }
    case 'fork': {
      const cx = size / 2
      // Handle
      gfx.roundRect(cx - 3, size * 0.45, 6, size * 0.5, 2)
      gfx.fill(0xc0c0c0)
      // Prongs — symmetrical
      for (const offset of [-9, -3, 3, 9]) {
        gfx.roundRect(cx + offset - 2, size * 0.05, 4, size * 0.42, 2)
        gfx.fill(0xc0c0c0)
      }
      // Highlight
      gfx.roundRect(cx - 2, size * 0.1, 2, size * 0.3, 1)
      gfx.fill({ color: 0xffffff, alpha: 0.3 })
      break
    }
    case 'steam': {
      // Thick, voluminous steam — multiple overlapping puffs
      const cx = size / 2
      // Large puff cluster
      gfx.circle(cx, size * 0.6, size * 0.3)
      gfx.circle(cx - size * 0.15, size * 0.4, size * 0.25)
      gfx.circle(cx + size * 0.15, size * 0.35, size * 0.28)
      gfx.circle(cx, size * 0.2, size * 0.2)
      gfx.circle(cx + size * 0.1, size * 0.1, size * 0.15)
      gfx.fill({ color: 0xffffff, alpha: 0.6 })
      // Lighter wisp on top
      gfx.circle(cx - size * 0.05, size * 0.05, size * 0.1)
      gfx.fill({ color: 0xffffff, alpha: 0.35 })
      break
    }
    case 'bubble': {
      const br = size * 0.35
      const cx = size / 2
      const cy = size / 2
      gfx.circle(cx, cy, br)
      gfx.stroke({ width: 2, color: 0xaaddff })
      // Double highlight
      gfx.circle(cx - br * 0.2, cy - br * 0.2, br * 0.15)
      gfx.fill({ color: 0xffffff, alpha: 0.6 })
      gfx.circle(cx + br * 0.15, cy - br * 0.3, br * 0.08)
      gfx.fill({ color: 0xffffff, alpha: 0.4 })
      break
    }
    case 'fusilli': {
      const cx = size / 2
      const cy = size / 2
      for (let a = 0; a < Math.PI * 3.5; a += 0.3) {
        const r = 3 + a * 3
        gfx.circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, 2.5)
        gfx.fill(0xe8b84a)
      }
      break
    }
    case 'star': {
      // Natural-looking star — cross-shaped glow with soft rays
      const cx = size / 2
      const cy = size / 2
      // Outer glow
      gfx.circle(cx, cy, size * 0.3)
      gfx.fill({ color: 0xffdd66, alpha: 0.12 })
      // Four soft rays of different lengths
      const rays = [
        { angle: -Math.PI / 2, len: size * 0.4, w: 1.5 },  // up (longest)
        { angle: Math.PI / 2, len: size * 0.3, w: 1.5 },   // down
        { angle: 0, len: size * 0.35, w: 1.2 },             // right
        { angle: Math.PI, len: size * 0.28, w: 1.2 },       // left
        // Diagonal rays (shorter)
        { angle: -Math.PI / 4, len: size * 0.18, w: 0.8 },
        { angle: Math.PI / 4, len: size * 0.15, w: 0.8 },
        { angle: -3 * Math.PI / 4, len: size * 0.16, w: 0.8 },
        { angle: 3 * Math.PI / 4, len: size * 0.14, w: 0.8 },
      ]
      for (const ray of rays) {
        gfx.moveTo(cx, cy)
        gfx.lineTo(cx + Math.cos(ray.angle) * ray.len, cy + Math.sin(ray.angle) * ray.len)
        gfx.stroke({ width: ray.w, color: 0xffeeaa, alpha: 0.7 })
      }
      // Bright core
      gfx.circle(cx, cy, size * 0.06)
      gfx.fill(0xffffff)
      gfx.circle(cx, cy, size * 0.04)
      gfx.fill({ color: 0xffffff, alpha: 0.8 })
      break
    }
    case 'swirl': {
      const cx = size / 2
      const cy = size / 2
      gfx.circle(cx, cy, size * 0.1)
      gfx.fill(0xbb66ee)
      gfx.circle(cx, cy, size * 0.25)
      gfx.stroke({ width: 2, color: 0x9944cc })
      gfx.circle(cx, cy, size * 0.4)
      gfx.stroke({ width: 1.5, color: 0x7733aa, alpha: 0.6 })
      break
    }
    case 'nebula': {
      gfx.circle(size * 0.35, size * 0.5, size * 0.32)
      gfx.fill({ color: 0x8844bb, alpha: 0.4 })
      gfx.circle(size * 0.6, size * 0.4, size * 0.28)
      gfx.fill({ color: 0x6633aa, alpha: 0.3 })
      gfx.circle(size * 0.5, size * 0.65, size * 0.22)
      gfx.fill({ color: 0xaa55dd, alpha: 0.2 })
      break
    }
  }
}

// ── Feature animations ──────────────────────────────────────────────────────

function drawPlateWithPasta(gfx: Graphics, size: number, animTick: number): void {
  gfx.clear()
  const cx = size / 2
  const plateY = size * 0.65

  // ── Checkered napkin — angled underneath plate ──
  const napkinW = size * 0.85
  const napkinH = size * 0.2
  const napkinX = cx - napkinW / 2
  const napkinY = plateY + size * 0.06
  gfx.roundRect(napkinX, napkinY, napkinW, napkinH, 4)
  gfx.fill(0xcc3333)
  for (let nx = 0; nx < napkinW; nx += 10) {
    gfx.rect(napkinX + nx, napkinY, 5, napkinH)
    gfx.fill({ color: 0xffffff, alpha: 0.3 })
  }
  for (let ny = 0; ny < napkinH; ny += 6) {
    gfx.rect(napkinX, napkinY + ny, napkinW, 3)
    gfx.fill({ color: 0xffffff, alpha: 0.15 })
  }

  // ── Fork on the right, angled ──
  const forkX = cx + size * 0.42
  const forkY = plateY - 5
  gfx.roundRect(forkX, forkY + 12, 3, 28, 1)
  gfx.fill(0xbbbbbb)
  for (const off of [-4, -1, 2, 5]) {
    gfx.roundRect(forkX + off - 1, forkY - 2, 2.5, 15, 1)
    gfx.fill(0xc0c0c0)
  }

  // ── Plate ──
  // Shadow
  gfx.roundRect(cx - size * 0.42, plateY - size * 0.08, size * 0.84, size * 0.22, size * 0.11)
  gfx.fill({ color: 0x000000, alpha: 0.08 })
  // Outer rim
  gfx.roundRect(cx - size * 0.4, plateY - size * 0.1, size * 0.8, size * 0.2, size * 0.1)
  gfx.fill(0xeeeeee)
  // Inner plate
  gfx.roundRect(cx - size * 0.3, plateY - size * 0.06, size * 0.6, size * 0.12, size * 0.06)
  gfx.fill(0xf8f8f8)

  // ── Sauce base ──
  gfx.roundRect(cx - size * 0.2, plateY - size * 0.03, size * 0.4, size * 0.06, size * 0.03)
  gfx.fill({ color: 0xcc3333, alpha: 0.4 })

  // ── Pasta pile — centered on plate, 3 dense layers ──
  const pastaColors = [0xf0c050, 0xe8b840, 0xf5d070, 0xdaa830, 0xffe080]
  const pileCenter = plateY - size * 0.02
  const pileRadius = size * 0.22

  // Bottom layer — flat strands across the plate
  for (let s = 0; s < 10; s++) {
    const sx = cx + Math.sin(s * 1.3) * pileRadius * 0.7
    const sy = pileCenter + (s % 3) * 1.5 - 2
    const w = Math.sin(animTick * 0.015 + s) * 1.5
    gfx.moveTo(sx - 12, sy + w)
    gfx.bezierCurveTo(sx - 4, sy - 3 + w, sx + 5, sy + 2 - w, sx + 12, sy - 1 + w)
    gfx.stroke({ width: 2, color: pastaColors[s % 5], alpha: 0.7 })
  }
  // Middle layer — tangled curls
  for (let s = 0; s < 10; s++) {
    const sx = cx + Math.cos(s * 0.9) * pileRadius * 0.5
    const sy = pileCenter - 4 - (s % 3) * 2
    const w = Math.sin(animTick * 0.02 + s * 0.8) * 2
    const curl = Math.sin(s * 1.5) * 7
    gfx.moveTo(sx - 8 + curl, sy + 2 + w)
    gfx.bezierCurveTo(sx + w * 2, sy - 6, sx + curl, sy + 3, sx + 10 - curl, sy - 2 + w)
    gfx.stroke({ width: 1.8, color: pastaColors[(s + 2) % 5], alpha: 0.85 })
  }
  // Top layer — small curls sitting on top of the pile (not too high)
  for (let s = 0; s < 6; s++) {
    const sx = cx + Math.sin(s * 1.4) * pileRadius * 0.35
    const sy = pileCenter - 5 - (s % 3) * 2
    const w = Math.sin(animTick * 0.022 + s * 1.2) * 1.5
    gfx.moveTo(sx - 4, sy + w)
    gfx.bezierCurveTo(sx, sy - 4 + w, sx + 5, sy - 3 - w, sx + 3, sy + 1 + w)
    gfx.stroke({ width: 1.6, color: pastaColors[(s + 1) % 5] })
  }

  // ── Hanging strands over plate rim ──
  for (let h = 0; h < 4; h++) {
    const hx = cx + (h - 1.5) * 16
    const w = Math.sin(animTick * 0.013 + h * 1.8) * 3
    gfx.moveTo(hx, pileCenter + 2)
    gfx.bezierCurveTo(hx + w + 5, plateY + 8, hx + w - 3, plateY + 15, hx + w + 3, plateY + 22)
    gfx.stroke({ width: 1.8, color: pastaColors[h % 5], alpha: 0.55 })
  }

  // ── Sauce drizzle ──
  gfx.moveTo(cx - 10, pileCenter - 8)
  gfx.bezierCurveTo(cx, pileCenter - 14, cx + 8, pileCenter - 5, cx + 14, pileCenter - 10)
  gfx.stroke({ width: 2.5, color: 0xcc3333, alpha: 0.5 })

  // ── Falling strands — short drop from just above plate to the pile ──
  for (let s = 0; s < 3; s++) {
    const progress = ((animTick * 0.004 + s * 0.33) % 1)
    const startY = pileCenter - size * 0.2 // just above the pile
    const endY = pileCenter - 3
    const curY = startY + (endY - startY) * progress
    const wobble = Math.sin(animTick * 0.03 + s * 2.5) * 5
    const sx = cx + (s - 1) * 15 + wobble

    // Falling strand — short and curvy
    gfx.moveTo(sx, curY - 10)
    gfx.bezierCurveTo(sx + 4, curY - 4, sx - 3, curY + 2, sx + 2, curY + 8)
    gfx.stroke({ width: 1.8, color: 0xf0c050, alpha: 0.3 + progress * 0.6 })

    // Small splash on landing
    if (progress > 0.8) {
      const intensity = (progress - 0.8) / 0.2
      for (let sp = 0; sp < 3; sp++) {
        const spAngle = (sp / 3) * Math.PI + Math.PI
        const spDist = intensity * 5
        gfx.circle(sx + Math.cos(spAngle) * spDist, endY + Math.sin(spAngle) * spDist * 0.4, 1.2)
        gfx.fill({ color: 0xf0c050, alpha: 0.5 * (1 - intensity) })
      }
    }
  }

  // ── Parmesan flakes scattered on top ──
  for (let f = 0; f < 6; f++) {
    const fx = cx + Math.sin(f * 1.7 + 0.3) * 14
    const fy = plateY - 10 - f * 2.5
    gfx.rect(fx, fy, 2.5, 1.5)
    gfx.fill({ color: 0xffffcc, alpha: 0.6 })
  }

  // ── Steam rising ──
  for (let s = 0; s < 5; s++) {
    const phase = (animTick * 0.006 + s * 0.2) % 1
    const sx = cx + (s - 2) * 9
    const sy = plateY - 22 - phase * 35
    const wobble = Math.sin(animTick * 0.025 + s * 2) * 7
    const puffR = 3.5 + (1 - phase) * 5
    gfx.circle(sx + wobble, sy, puffR)
    gfx.fill({ color: 0xffffff, alpha: 0.25 * (1 - phase) })
    gfx.circle(sx + wobble + 3, sy - 3, puffR * 0.6)
    gfx.fill({ color: 0xffffff, alpha: 0.15 * (1 - phase) })
  }
}

function drawBoilingPot(gfx: Graphics, size: number, animTick: number): void {
  gfx.clear()
  const cx = size / 2

  // ── Big steam cloud billowing up (draw FIRST so pot is in front) ──
  // Multiple layers of large puffs rising
  for (let layer = 0; layer < 3; layer++) {
    for (let s = 0; s < 4; s++) {
      const phase = (animTick * 0.006 + s * 0.25 + layer * 0.08) % 1
      const sx = cx + (s - 1.5) * 14 + Math.sin(animTick * 0.02 + s * 2 + layer) * 12
      const sy = size * 0.25 - phase * size * 0.6 - layer * 8
      const puffR = 8 + (1 - phase) * 10 + layer * 3

      // Main puff
      gfx.circle(sx, sy, puffR)
      gfx.fill({ color: 0xffffff, alpha: 0.5 * (1 - phase) })
      // Secondary puff
      gfx.circle(sx + puffR * 0.4, sy - puffR * 0.3, puffR * 0.65)
      gfx.fill({ color: 0xffffff, alpha: 0.35 * (1 - phase) })
    }
  }

  // ── Pot body ──
  gfx.roundRect(cx - size * 0.38, size * 0.4, size * 0.76, size * 0.52, 6)
  gfx.fill(0x777777)
  // Pot highlight
  gfx.roundRect(cx - size * 0.28, size * 0.44, size * 0.14, size * 0.38, 3)
  gfx.fill({ color: 0xffffff, alpha: 0.12 })
  // Rim
  gfx.roundRect(cx - size * 0.42, size * 0.38, size * 0.84, size * 0.08, 4)
  gfx.fill(0x999999)
  gfx.roundRect(cx - size * 0.42, size * 0.38, size * 0.84, size * 0.03, 2)
  gfx.fill({ color: 0xbbbbbb })
  // Handles
  gfx.roundRect(cx - size * 0.52, size * 0.5, size * 0.13, size * 0.06, 3)
  gfx.fill(0x666666)
  gfx.roundRect(cx + size * 0.39, size * 0.5, size * 0.13, size * 0.06, 3)
  gfx.fill(0x666666)

  // ── Boiling water surface (roundRect instead of ellipse) ──
  const waterWobble = Math.sin(animTick * 0.06) * 2
  gfx.roundRect(cx - size * 0.32, size * 0.4 + waterWobble, size * 0.64, size * 0.06, size * 0.03)
  gfx.fill({ color: 0x88ccff, alpha: 0.6 })

  // ── Vigorous bubbles inside pot ──
  for (let b = 0; b < 8; b++) {
    const phase = (animTick * 0.02 + b * 0.12) % 1
    const bx = cx + Math.sin(b * 2.3 + animTick * 0.015) * size * 0.25
    const by = size * 0.85 - phase * size * 0.45
    const br = 2 + Math.sin(animTick * 0.15 + b) * 2 + (1 - phase) * 2
    gfx.circle(bx, by, br)
    gfx.fill({ color: 0xffffff, alpha: 0.6 * (1 - phase) })
  }

  // ── Dense spaghetti poking out of pot — 8 strands ──
  const pastaColors = [0xf0c050, 0xe8b840, 0xf5d070, 0xdaa830]
  for (let sp = 0; sp < 8; sp++) {
    const spx = cx + (sp - 3.5) * 7
    const wobble = Math.sin(animTick * 0.018 + sp * 1.3) * 4
    const height = size * 0.3 + (sp % 3) * size * 0.08
    gfx.moveTo(spx, size * 0.4)
    gfx.bezierCurveTo(
      spx + wobble, size * 0.4 - height * 0.4,
      spx - wobble * 1.5, size * 0.4 - height * 0.7,
      spx + wobble * 0.8, size * 0.4 - height,
    )
    gfx.stroke({ width: 2, color: pastaColors[sp % 4] })
  }
  // A couple of strands drooping over the pot edge
  for (let d = 0; d < 3; d++) {
    const dx = cx + (d - 1) * 22
    const wobble = Math.sin(animTick * 0.015 + d * 2) * 2
    gfx.moveTo(dx, size * 0.4)
    gfx.bezierCurveTo(dx + wobble + 8, size * 0.45, dx + wobble + 5, size * 0.52, dx + wobble + 10, size * 0.58)
    gfx.stroke({ width: 1.8, color: pastaColors[d % 4], alpha: 0.7 })
  }

  // ── Water droplets splashing up ──
  for (let d = 0; d < 3; d++) {
    const phase = (animTick * 0.025 + d * 0.33) % 1
    if (phase < 0.5) {
      const dx = cx + (d - 1) * 20
      const dy = size * 0.35 - phase * 15
      gfx.circle(dx, dy, 1.5)
      gfx.fill({ color: 0xaaddff, alpha: 0.6 * (1 - phase * 2) })
    }
  }
}

function drawVoidPortal(gfx: Graphics, size: number, animTick: number): void {
  gfx.clear()
  const cx = size / 2
  const cy = size / 2

  // ── Central star (sun) — pulsing ──
  const sunPulse = 0.85 + Math.sin(animTick * 0.03) * 0.15
  // Outer glow
  gfx.circle(cx, cy, size * 0.18 * sunPulse)
  gfx.fill({ color: 0xffaa33, alpha: 0.15 })
  gfx.circle(cx, cy, size * 0.12 * sunPulse)
  gfx.fill({ color: 0xffcc44, alpha: 0.3 })
  // Core
  gfx.circle(cx, cy, size * 0.07 * sunPulse)
  gfx.fill(0xffdd66)
  gfx.circle(cx - 2, cy - 2, size * 0.03)
  gfx.fill({ color: 0xffffff, alpha: 0.5 })

  // ── Orbiting planets ──
  const planets = [
    { dist: 0.22, speed: 0.008, r: 4, color: 0x8888ff, hasRing: false },
    { dist: 0.32, speed: -0.005, r: 6, color: 0xcc5533, hasRing: false },
    { dist: 0.42, speed: 0.003, r: 5, color: 0x44bb88, hasRing: true },
  ]

  for (const planet of planets) {
    const angle = animTick * planet.speed
    const px = cx + Math.cos(angle) * size * planet.dist
    const py = cy + Math.sin(angle) * size * planet.dist * 0.5 // flatten to perspective

    // Orbit trail
    for (let t = 0; t < 8; t++) {
      const trailAngle = angle - t * 0.15 * Math.sign(planet.speed)
      const tx = cx + Math.cos(trailAngle) * size * planet.dist
      const ty = cy + Math.sin(trailAngle) * size * planet.dist * 0.5
      gfx.circle(tx, ty, 1)
      gfx.fill({ color: planet.color, alpha: 0.15 - t * 0.015 })
    }

    // Planet
    gfx.circle(px, py, planet.r)
    gfx.fill(planet.color)
    gfx.circle(px - 1, py - 1, planet.r * 0.35)
    gfx.fill({ color: 0xffffff, alpha: 0.3 })

    // Ring for Saturn-like planet
    if (planet.hasRing) {
      gfx.moveTo(px - planet.r * 2, py)
      gfx.lineTo(px + planet.r * 2, py)
      gfx.stroke({ width: 1.5, color: planet.color, alpha: 0.5 })
    }
  }

  // ── Incoming comet / collision object ──
  const cometPhase = (animTick * 0.003) % 1
  const cometAngle = cometPhase * Math.PI * 2 - Math.PI
  const cometDist = size * 0.5 * (1 - cometPhase * 0.6) // spiraling inward
  const cometX = cx + Math.cos(cometAngle) * cometDist
  const cometY = cy + Math.sin(cometAngle) * cometDist * 0.4

  // Comet tail
  for (let t = 0; t < 12; t++) {
    const tailAngle = cometAngle - t * 0.12
    const tailDist = cometDist + t * 4
    const tx = cx + Math.cos(tailAngle) * tailDist
    const ty = cy + Math.sin(tailAngle) * tailDist * 0.4
    const tailR = 2.5 - t * 0.18
    if (tailR > 0) {
      gfx.circle(tx, ty, tailR)
      gfx.fill({ color: 0xff6644, alpha: 0.5 - t * 0.04 })
    }
  }

  // Comet head
  gfx.circle(cometX, cometY, 3.5)
  gfx.fill(0xff8844)
  gfx.circle(cometX - 1, cometY - 1, 1.5)
  gfx.fill({ color: 0xffffff, alpha: 0.6 })

  // ── Collision shockwave — when comet is near center ──
  if (cometPhase > 0.85) {
    const shockProgress = (cometPhase - 0.85) / 0.15
    const shockR = shockProgress * size * 0.45
    gfx.circle(cx, cy, shockR)
    gfx.stroke({ width: 2, color: 0xffaa44, alpha: 0.6 * (1 - shockProgress) })
    // Debris particles
    for (let d = 0; d < 6; d++) {
      const da = (d / 6) * Math.PI * 2
      const dd = shockR * 0.8
      gfx.circle(cx + Math.cos(da) * dd, cy + Math.sin(da) * dd * 0.5, 2)
      gfx.fill({ color: 0xffcc44, alpha: 0.4 * (1 - shockProgress) })
    }
  }

  // ── Distant stars twinkling ──
  for (let s = 0; s < 8; s++) {
    const sx = (Math.sin(s * 3.7) * 0.5 + 0.5) * size
    const sy = (Math.cos(s * 2.3) * 0.5 + 0.5) * size
    const twinkle = 0.3 + Math.sin(animTick * 0.05 + s * 1.5) * 0.3
    gfx.circle(sx, sy, 1)
    gfx.fill({ color: 0xffffff, alpha: twinkle })
  }
}

// ── Overlap prevention ──────────────────────────────────────────────────────

/** All placed items across all layers — used for cross-layer overlap checks. */
let globalPlacedItems: { x: number; y: number; size: number }[] = []

function findSpot(size: number): { x: number; y: number } {
  const WRAP_HEIGHT = GAME_HEIGHT * 2
  let spacing = MIN_SPACING
  for (let attempt = 0; ; attempt++) {
    const x = Math.random() * (GAME_WIDTH - size)
    const y = Math.random() * GAME_HEIGHT * 3 - GAME_HEIGHT

    // Check overlap in both base position AND wrapped positions
    // (items wrap every WRAP_HEIGHT, so check all possible visual positions)
    const clear = globalPlacedItems.every((item) => {
      if (Math.abs(item.x - x) > spacing) return true
      // Check base Y and wrapped variants
      const dy1 = Math.abs(item.y - y)
      const dy2 = Math.abs((item.y % WRAP_HEIGHT) - (y % WRAP_HEIGHT))
      const dyMin = Math.min(dy1, dy2, WRAP_HEIGHT - dy2)
      return dyMin > spacing
    })
    if (clear) {
      globalPlacedItems.push({ x, y, size })
      return { x, y }
    }
    if (attempt > 0 && attempt % 15 === 0) spacing = Math.max(20, spacing - 10)
  }
}

// ── Main class ──────────────────────────────────────────────────────────────

export class ParallaxBackground {
  readonly container = new Container()
  private bgGfx = new Graphics()
  private contentContainer = new Container() // holds all layers + features, for fading
  private layers: ParallaxLayer[] = []
  private features: { gfx: Graphics; baseY: number; x: number; speed: number }[] = []
  private fadingOutFeatures: { gfx: Graphics; baseY: number; x: number; speed: number; alpha: number }[] = []
  private featureZone = -1
  private currentBgColor = -1
  private currentZone = -1
  private animTick = 0
  private fadeProgress = 1
  private featureFadeIn = 1 // separate fade for features

  constructor() {
    this.bgGfx.rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    this.bgGfx.fill(0xfff8e7)
    this.container.addChild(this.bgGfx)
    this.container.addChild(this.contentContainer)
    this.buildLayers(0)
  }

  private buildLayers(zone: number): void {
    // Clean up old
    for (const layer of this.layers) {
      this.contentContainer.removeChild(layer.container)
      layer.container.destroy({ children: true })
    }
    this.layers = []
    // Move old features to fading-out list (don't destroy yet)
    for (const f of this.features) {
      this.fadingOutFeatures.push({ ...f, alpha: f.gfx.alpha })
    }
    this.features = []
    globalPlacedItems = []

    const config = ZONE_CONFIGS[Math.min(zone, 2)]

    // ── Back layer: features evenly distributed, alternating sides ──
    const featureCount = 5
    const totalSpan = GAME_HEIGHT * 3
    for (let i = 0; i < featureCount; i++) {
      // Evenly space vertically across the wrapping range
      const y = -GAME_HEIGHT + (i / featureCount) * totalSpan
      // Alternate left/right sides so they don't line up
      const x = i % 2 === 0
        ? 5 + Math.random() * (GAME_WIDTH * 0.35)
        : GAME_WIDTH * 0.5 + Math.random() * (GAME_WIDTH * 0.35)

      const gfx = new Graphics()
      gfx.x = x
      gfx.alpha = 0.25
      this.contentContainer.addChild(gfx)
      const speed = 0.012 + i * 0.004
      this.features.push({ gfx, baseY: y, x, speed })

      globalPlacedItems.push({ x, y, size: 120 })
    }

    // ── Mid layer: decorative items (floating smaller shapes) ──
    const mid: ParallaxLayer = { container: new Container(), speed: MID_SPEED, items: [] }
    mid.container.alpha = 0.4
    this.contentContainer.addChild(mid.container)
    for (let i = 0; i < 6; i++) {
      const size = 30 + Math.random() * 45
      const shape = config.shapes[i % config.shapes.length]
      const { x, y } = findSpot(size)
      const gfx = new Graphics()
      drawShape(gfx, shape, size)
      gfx.x = x
      gfx.y = y
      mid.container.addChild(gfx)
      mid.items.push({ baseY: y, x, gfx, shape, size, animOffset: Math.random() * Math.PI * 2 })
    }
    this.layers.push(mid)

    // ── Front layer: smaller floating items ──
    const front: ParallaxLayer = { container: new Container(), speed: 0.2, items: [] }
    front.container.alpha = 0.25
    this.contentContainer.addChild(front.container)
    for (let i = 0; i < 4; i++) {
      const size = 20 + Math.random() * 30
      const shape = config.shapes[(i + 2) % config.shapes.length]
      const { x, y } = findSpot(size)
      const gfx = new Graphics()
      drawShape(gfx, shape, size)
      gfx.x = x
      gfx.y = y
      front.container.addChild(gfx)
      front.items.push({ baseY: y, x, gfx, shape, size, animOffset: Math.random() * Math.PI * 2 })
    }
    this.layers.push(front)

    // Decorative layers fade in
    this.contentContainer.alpha = 0
    this.fadeProgress = 0
    // Features fade in separately (old ones fade out in parallel)
    this.featureFadeIn = 0
  }

  update(cameraY: number): void {
    this.animTick++

    // ── Fade transition ──
    if (this.fadeProgress < 1) {
      this.fadeProgress = Math.min(1, this.fadeProgress + 0.015)
      this.contentContainer.alpha = this.fadeProgress
    }

    // ── Decorative layers ──
    for (const layer of this.layers) {
      for (const item of layer.items) {
        let screenY = item.baseY - cameraY * layer.speed
        screenY = ((screenY % (GAME_HEIGHT * 2)) + GAME_HEIGHT * 2) % (GAME_HEIGHT * 2) - GAME_HEIGHT * 0.5
        const bob = Math.sin(this.animTick * 0.012 + item.animOffset) * 4
        item.gfx.y = screenY + bob
      }
    }

    // ── Feature fade in/out ──
    if (this.featureFadeIn < 1) {
      this.featureFadeIn = Math.min(1, this.featureFadeIn + 0.012)
    }

    // Fade out old features from previous zone
    const prevDrawFns = [drawPlateWithPasta, drawBoilingPot, drawVoidPortal]
    for (let i = this.fadingOutFeatures.length - 1; i >= 0; i--) {
      const f = this.fadingOutFeatures[i]
      f.alpha -= 0.012
      if (f.alpha <= 0) {
        this.contentContainer.removeChild(f.gfx)
        f.gfx.destroy()
        this.fadingOutFeatures.splice(i, 1)
      } else {
        f.gfx.alpha = f.alpha
        const screenY = f.baseY - cameraY * f.speed
        const wrappedY = ((screenY % (GAME_HEIGHT * 2)) + GAME_HEIGHT * 2) % (GAME_HEIGHT * 2) - GAME_HEIGHT * 0.3
        f.gfx.y = wrappedY
        // Keep drawing with the PREVIOUS zone's feature type
        // (we don't track which zone they were from, so just let them fade with last drawn state)
      }
    }

    // Draw current features with fade-in
    const drawFeature = [drawPlateWithPasta, drawBoilingPot, drawVoidPortal][Math.min(this.featureZone, 2)]
    if (drawFeature) {
      const sizes = [110, 95, 100, 90, 105]
      for (let i = 0; i < this.features.length; i++) {
        const f = this.features[i]
        f.gfx.alpha = 0.25 * this.featureFadeIn
        const screenY = f.baseY - cameraY * f.speed
        const wrappedY = ((screenY % (GAME_HEIGHT * 2)) + GAME_HEIGHT * 2) % (GAME_HEIGHT * 2) - GAME_HEIGHT * 0.3
        f.gfx.y = wrappedY
        drawFeature(f.gfx, sizes[i % sizes.length], this.animTick + i * 180)
      }
    }
  }

  applyTheme(theme: ZoneTheme, zone: number): void {
    const bgHex = '#' + theme.background.toString(16).padStart(6, '0')
    document.body.style.backgroundColor = bgHex
    document.documentElement.style.backgroundColor = bgHex
    const gameDiv = document.getElementById('game')
    if (gameDiv) gameDiv.style.backgroundColor = bgHex

    if (zone !== this.currentZone) {
      this.currentZone = zone
      this.featureZone = zone
      this.buildLayers(zone) // triggers fade-in from 0
    }

    if (this.currentBgColor === theme.background) return
    this.currentBgColor = theme.background

    this.bgGfx.clear()
    this.bgGfx.rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    this.bgGfx.fill(theme.background)
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
