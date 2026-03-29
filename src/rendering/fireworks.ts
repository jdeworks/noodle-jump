/** Firework particle system — reusable for high score celebrations. */

import { Container, Graphics } from 'pixi.js'
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants'

const FIREWORK_COLORS = [
  0xff4444, 0x44ff44, 0x4444ff, 0xffff44,
  0xff44ff, 0x44ffff, 0xff8800, 0xf0c050,
  0xff6688, 0x88ff66, 0x6688ff, 0xffaa44,
]

interface Particle {
  gfx: Graphics
  vx: number
  vy: number
  gravity: number
  rot: number
  life: number
  maxLife: number
}

interface Burst {
  particles: Particle[]
  delay: number
}

export class FireworkDisplay {
  readonly container = new Container()
  private bursts: Burst[] = []
  private tick = 0
  private active = true

  constructor(burstCount: number) {
    for (let i = 0; i < burstCount; i++) {
      // Stagger bursts more — longer show
      const delay = i * 20 + Math.floor(Math.random() * 15)
      const cx = GAME_WIDTH * (0.1 + Math.random() * 0.8)
      const cy = GAME_HEIGHT * (0.1 + Math.random() * 0.6)
      const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]
      const particleCount = 45 + Math.floor(Math.random() * 25)

      const particles: Particle[] = []
      for (let p = 0; p < particleCount; p++) {
        const gfx = new Graphics()
        const size = 4 + Math.random() * 5
        if (Math.random() > 0.5) {
          gfx.rect(-size / 2, -size / 2, size, size * 0.6)
        } else {
          gfx.circle(0, 0, size * 0.5)
        }
        // Slight color variation
        const r = ((color >> 16) & 0xff) + Math.floor((Math.random() - 0.5) * 50)
        const g = ((color >> 8) & 0xff) + Math.floor((Math.random() - 0.5) * 50)
        const b = (color & 0xff) + Math.floor((Math.random() - 0.5) * 50)
        const variedColor = (Math.max(0, Math.min(255, r)) << 16) |
          (Math.max(0, Math.min(255, g)) << 8) |
          Math.max(0, Math.min(255, b))
        gfx.fill(variedColor)
        gfx.x = cx
        gfx.y = cy
        gfx.visible = false
        this.container.addChild(gfx)

        const angle = (p / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
        // Faster initial burst
        const speed = 5 + Math.random() * 9
        const life = 80 + Math.floor(Math.random() * 60)

        particles.push({
          gfx,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 0.06 + Math.random() * 0.04,
          rot: (Math.random() - 0.5) * 0.3,
          life,
          maxLife: life,
        })
      }

      this.bursts.push({ particles, delay })
    }
  }

  update(): boolean {
    if (!this.active) return false

    this.tick++
    let anyAlive = false

    for (const burst of this.bursts) {
      if (this.tick < burst.delay) {
        anyAlive = true
        continue
      }

      for (const p of burst.particles) {
        if (p.life <= 0) continue
        anyAlive = true

        if (!p.gfx.visible) p.gfx.visible = true

        p.gfx.x += p.vx
        p.gfx.y += p.vy
        p.vy += p.gravity
        p.vx *= 0.985
        p.gfx.rotation += p.rot
        p.life--

        const lifeRatio = p.life / p.maxLife
        if (lifeRatio < 0.35) {
          p.gfx.alpha = lifeRatio / 0.35
        }

        // Initial flash — big bright pop
        if (p.life >= p.maxLife - 2) {
          p.gfx.scale.set(2.5)
          p.gfx.alpha = 1
        } else {
          p.gfx.scale.set(0.8 + lifeRatio * 0.8)
        }
      }
    }

    if (!anyAlive) this.active = false
    return anyAlive
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
