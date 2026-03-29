/** Pixel art sprite generation using PixiJS Graphics. Swappable with real assets later. */

import { Graphics } from 'pixi.js'

/** Draw chef riding a ravioli rocket. */
export function drawChefOnRocket(gfx: Graphics, width: number, height: number, animTick: number): void {
  gfx.clear()
  const w = width
  const h = height
  const rocketW = w * 1.2
  const rocketH = h * 1.4
  const ox = (w - rocketW) / 2 // center offset

  // ── Rocket body (ravioli shaped — rounded pillow) ──
  gfx.roundRect(ox + rocketW * 0.15, rocketH * 0.05, rocketW * 0.7, rocketH * 0.55, 10)
  gfx.fill(0xc0392b) // tomato red
  // Highlight
  gfx.roundRect(ox + rocketW * 0.25, rocketH * 0.08, rocketW * 0.3, rocketH * 0.15, 6)
  gfx.fill({ color: 0xffffff, alpha: 0.25 })

  // Ravioli crimp edges
  for (let cx = 0.2; cx <= 0.8; cx += 0.12) {
    gfx.circle(ox + rocketW * cx, rocketH * 0.05, 3)
    gfx.fill(0xd45a4a)
    gfx.circle(ox + rocketW * cx, rocketH * 0.58, 3)
    gfx.fill(0xd45a4a)
  }

  // ── Nose cone ──
  gfx.moveTo(ox + rocketW * 0.3, rocketH * 0.05)
  gfx.quadraticCurveTo(ox + rocketW * 0.5, -rocketH * 0.1, ox + rocketW * 0.7, rocketH * 0.05)
  gfx.fill(0xe74c3c)

  // Window (porthole)
  gfx.circle(ox + rocketW * 0.5, rocketH * 0.2, rocketW * 0.1)
  gfx.fill(0x85c1e9)
  gfx.circle(ox + rocketW * 0.5, rocketH * 0.2, rocketW * 0.1)
  gfx.stroke({ width: 1, color: 0x333333, alpha: 0.5 })
  // Window highlight
  gfx.circle(ox + rocketW * 0.47, rocketH * 0.17, rocketW * 0.04)
  gfx.fill({ color: 0xffffff, alpha: 0.5 })

  // ── Fins ──
  // Left fin
  gfx.moveTo(ox + rocketW * 0.15, rocketH * 0.45)
  gfx.lineTo(ox, rocketH * 0.65)
  gfx.lineTo(ox + rocketW * 0.2, rocketH * 0.55)
  gfx.closePath()
  gfx.fill(0xe74c3c)
  // Right fin
  gfx.moveTo(ox + rocketW * 0.85, rocketH * 0.45)
  gfx.lineTo(ox + rocketW, rocketH * 0.65)
  gfx.lineTo(ox + rocketW * 0.8, rocketH * 0.55)
  gfx.closePath()
  gfx.fill(0xe74c3c)

  // ── Fire exhaust (animated) ──
  const fireFlicker = Math.sin(animTick * 0.3) * 0.15 + 0.85
  const fireFlicker2 = Math.cos(animTick * 0.5) * 0.2 + 0.8

  // Outer flame (yellow-orange)
  const flameH = rocketH * 0.4 * fireFlicker
  gfx.moveTo(ox + rocketW * 0.3, rocketH * 0.58)
  gfx.quadraticCurveTo(ox + rocketW * 0.5, rocketH * 0.58 + flameH, ox + rocketW * 0.7, rocketH * 0.58)
  gfx.fill(0xff8c00)

  // Inner flame (bright yellow)
  const innerFlameH = rocketH * 0.25 * fireFlicker2
  gfx.moveTo(ox + rocketW * 0.35, rocketH * 0.58)
  gfx.quadraticCurveTo(ox + rocketW * 0.5, rocketH * 0.58 + innerFlameH, ox + rocketW * 0.65, rocketH * 0.58)
  gfx.fill(0xffdd00)

  // Core flame (white-hot)
  const coreFlameH = rocketH * 0.12 * fireFlicker
  gfx.moveTo(ox + rocketW * 0.4, rocketH * 0.58)
  gfx.quadraticCurveTo(ox + rocketW * 0.5, rocketH * 0.58 + coreFlameH, ox + rocketW * 0.6, rocketH * 0.58)
  gfx.fill({ color: 0xffffff, alpha: 0.8 })
}

/** Draw a simple pixel-art chef character. */
export function drawChef(gfx: Graphics, width: number, height: number, tint?: number): void {
  gfx.clear()
  const w = width
  const h = height

  // Body (white chef outfit)
  gfx.roundRect(w * 0.15, h * 0.4, w * 0.7, h * 0.5, 3)
  gfx.fill(0xffffff)

  // Head
  gfx.roundRect(w * 0.2, h * 0.2, w * 0.6, h * 0.25, 4)
  gfx.fill(0xf5cba7)

  // Chef hat
  gfx.roundRect(w * 0.15, h * 0.0, w * 0.7, h * 0.25, 4)
  gfx.fill(0xffffff)
  gfx.roundRect(w * 0.25, h * 0.0, w * 0.5, h * 0.08, 2)
  gfx.fill(0xf0f0f0)

  // Eyes
  gfx.circle(w * 0.35, h * 0.33, 2)
  gfx.fill(0x222222)
  gfx.circle(w * 0.65, h * 0.33, 2)
  gfx.fill(0x222222)

  // Smile
  gfx.moveTo(w * 0.35, h * 0.38)
  gfx.quadraticCurveTo(w * 0.5, h * 0.45, w * 0.65, h * 0.38)
  gfx.stroke({ width: 1, color: 0x333333 })

  // Apron
  gfx.roundRect(w * 0.25, h * 0.5, w * 0.5, h * 0.3, 2)
  gfx.fill(0xe8e8e8)

  // Feet
  gfx.roundRect(w * 0.15, h * 0.88, w * 0.25, h * 0.12, 3)
  gfx.fill(0x333333)
  gfx.roundRect(w * 0.6, h * 0.88, w * 0.25, h * 0.12, 3)
  gfx.fill(0x333333)

  // Power-up tint overlay
  if (tint != null) {
    gfx.roundRect(0, 0, w, h, 4)
    gfx.fill({ color: tint, alpha: 0.3 })
  }
}

export type PlatformStyle = 'normal' | 'breaking' | 'brittle' | 'moving' | 'lasagna'

/** Draw a platform with depth, texture, and type-specific visual markers. */
export function drawPlatform(
  gfx: Graphics,
  width: number,
  height: number,
  color: number,
  style: PlatformStyle = 'normal',
): void {
  gfx.clear()

  // Shadow underneath
  gfx.roundRect(1, 2, width - 2, height, 4)
  gfx.fill({ color: 0x000000, alpha: 0.12 })

  // Main body
  gfx.roundRect(0, 0, width, height, 4)
  gfx.fill(color)

  switch (style) {
    case 'breaking':
      // Crack lines across the surface
      gfx.moveTo(width * 0.2, 2)
      gfx.lineTo(width * 0.35, height - 2)
      gfx.stroke({ width: 1.5, color: 0x000000, alpha: 0.35 })
      gfx.moveTo(width * 0.6, 1)
      gfx.lineTo(width * 0.5, height / 2)
      gfx.lineTo(width * 0.7, height - 1)
      gfx.stroke({ width: 1, color: 0x000000, alpha: 0.3 })
      // Slightly rough edges
      gfx.roundRect(0, 0, width, height, 4)
      gfx.stroke({ width: 1, color: 0x000000, alpha: 0.15 })
      break

    case 'brittle':
      // Dotted/crumbly pattern — clearly different from breaking
      for (let dx = 6; dx < width - 6; dx += 8) {
        for (let dy = 3; dy < height - 2; dy += 5) {
          gfx.circle(dx + Math.random() * 3, dy, 1.5)
          gfx.fill({ color: 0x000000, alpha: 0.2 })
        }
      }
      // Dashed border
      for (let dx = 4; dx < width - 4; dx += 8) {
        gfx.rect(dx, 0, 4, 1.5)
        gfx.fill({ color: 0x000000, alpha: 0.2 })
        gfx.rect(dx, height - 1.5, 4, 1.5)
        gfx.fill({ color: 0x000000, alpha: 0.2 })
      }
      break

    case 'moving':
      // Arrow indicators on sides showing it moves
      // Left arrow
      gfx.moveTo(4, height / 2)
      gfx.lineTo(8, height / 2 - 3)
      gfx.lineTo(8, height / 2 + 3)
      gfx.closePath()
      gfx.fill({ color: 0xffffff, alpha: 0.4 })
      // Right arrow
      gfx.moveTo(width - 4, height / 2)
      gfx.lineTo(width - 8, height / 2 - 3)
      gfx.lineTo(width - 8, height / 2 + 3)
      gfx.closePath()
      gfx.fill({ color: 0xffffff, alpha: 0.4 })
      // Top highlight
      gfx.roundRect(3, 1, width - 6, 3, 2)
      gfx.fill({ color: 0xffffff, alpha: 0.2 })
      break

    case 'lasagna':
      // Stacked layers
      const stripeH = 3
      for (let sy = 2; sy < height - 2; sy += stripeH + 1) {
        const stripeColor = sy % 2 === 0 ? 0xffcc00 : 0xff6600
        gfx.roundRect(3, sy, width - 6, stripeH, 1)
        gfx.fill({ color: stripeColor, alpha: 0.5 })
      }
      // Cheese dots
      for (let cx = 10; cx < width - 10; cx += 16) {
        gfx.circle(cx, 4, 2)
        gfx.fill({ color: 0xffee88, alpha: 0.6 })
      }
      // Glowing border
      gfx.roundRect(0, 0, width, height, 4)
      gfx.stroke({ width: 1.5, color: 0xffaa00, alpha: 0.6 })
      break

    default:
      // Normal platform
      gfx.roundRect(3, 1, width - 6, 3, 2)
      gfx.fill({ color: 0xffffff, alpha: 0.25 })
      for (let x = 8; x < width - 8; x += 12) {
        gfx.rect(x, 4, 6, 1)
        gfx.fill({ color: 0x000000, alpha: 0.06 })
      }
      break
  }
}

/**
 * Draw a meatball with faux-3D shading.
 * Use scaleX oscillation on the container to simulate spinning.
 */
export function drawMeatball(gfx: Graphics, size: number): void {
  gfx.clear()
  const r = size / 2

  // Shadow
  gfx.ellipse(r, r + 2, r * 0.8, r * 0.3)
  gfx.fill({ color: 0x000000, alpha: 0.15 })

  // Main ball
  gfx.circle(r, r, r)
  gfx.fill(0x8b4513)

  // Dark rim (3D depth)
  gfx.circle(r, r, r)
  gfx.stroke({ width: 1.5, color: 0x5a2d0c, alpha: 0.4 })

  // Specular highlight
  gfx.circle(r - r * 0.25, r - r * 0.25, r * 0.35)
  gfx.fill({ color: 0xffffff, alpha: 0.3 })

  // Small secondary highlight
  gfx.circle(r + r * 0.2, r - r * 0.15, r * 0.15)
  gfx.fill({ color: 0xffffff, alpha: 0.15 })
}

/** Draw a power-up diamond with type-specific inner icon and glow. */
export function drawPowerUp(gfx: Graphics, size: number, color: number, type: string): void {
  gfx.clear()
  const s = size / 2

  // Outer glow
  gfx.moveTo(s, -3)
  gfx.lineTo(size + 3, s)
  gfx.lineTo(s, size + 3)
  gfx.lineTo(-3, s)
  gfx.closePath()
  gfx.fill({ color, alpha: 0.2 })

  // Diamond body
  gfx.moveTo(s, 0)
  gfx.lineTo(size, s)
  gfx.lineTo(s, size)
  gfx.lineTo(0, s)
  gfx.closePath()
  gfx.fill(color)

  // Highlight (left face)
  gfx.moveTo(s, 0)
  gfx.lineTo(0, s)
  gfx.lineTo(s, s)
  gfx.closePath()
  gfx.fill({ color: 0xffffff, alpha: 0.25 })

  // Outline
  gfx.moveTo(s, 0)
  gfx.lineTo(size, s)
  gfx.lineTo(s, size)
  gfx.lineTo(0, s)
  gfx.closePath()
  gfx.stroke({ width: 1.5, color: 0x333333 })

  // Inner icon
  drawPowerUpIcon(gfx, s, type)
}

function drawPowerUpIcon(gfx: Graphics, s: number, type: string): void {
  switch (type) {
    case 'spaghetti_spring':
      // Spring zigzag
      gfx.moveTo(s - 4, s - 4)
      gfx.lineTo(s + 3, s - 1)
      gfx.lineTo(s - 4, s + 2)
      gfx.lineTo(s + 3, s + 5)
      gfx.stroke({ width: 1.5, color: 0x333333 })
      break
    case 'fusilli_tornado':
      // Spiral
      gfx.circle(s, s, 3)
      gfx.stroke({ width: 1.5, color: 0x333333 })
      gfx.moveTo(s, s - 3)
      gfx.lineTo(s, s - 6)
      gfx.stroke({ width: 1, color: 0x333333 })
      break
    case 'ravioli_rocket':
      // Arrow up
      gfx.moveTo(s, s - 5)
      gfx.lineTo(s + 4, s + 1)
      gfx.lineTo(s + 1, s + 1)
      gfx.lineTo(s + 1, s + 5)
      gfx.lineTo(s - 1, s + 5)
      gfx.lineTo(s - 1, s + 1)
      gfx.lineTo(s - 4, s + 1)
      gfx.closePath()
      gfx.fill(0x333333)
      break
    case 'lasagna_layers':
      // Three stacked lines
      for (let i = -3; i <= 3; i += 3) {
        gfx.roundRect(s - 5, s + i, 10, 2, 1)
        gfx.fill(0x333333)
      }
      break
    case 'pepper_sneeze':
      // Pepper shaker with dots
      gfx.roundRect(s - 3, s - 4, 6, 8, 2)
      gfx.fill(0x333333)
      // Dots coming out (sneeze)
      gfx.circle(s - 3, s - 5, 1)
      gfx.circle(s + 1, s - 6, 1)
      gfx.circle(s + 3, s - 4, 1)
      gfx.fill(0x333333)
      break
  }
}
