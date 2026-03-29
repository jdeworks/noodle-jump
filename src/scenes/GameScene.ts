/** Gameplay scene — wires pure logic to PixiJS rendering. */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { createPlayer, updatePlayer, type PlayerState } from '../entities/Player'
import {
  createGroundPlatform,
  generatePlatforms,
  updatePlatforms,
  pruneBelow,
  type PlatformState,
} from '../entities/Platform'
import {
  spawnMeatballs,
  collectMeatballs,
  pruneMeatballs,
  updateMeatballPositions,
  type CollectibleState,
} from '../entities/Collectible'
import {
  spawnPowerUps,
  collectPowerUps,
  applyPowerUp,
  tickEffect,
  updatePowerUpPositions,
  prunePowerUps,
  type PowerUpState,
  type ActiveEffect,
} from '../entities/PowerUp'
import { checkPlatformCollisions } from '../systems/Physics'
import { createCamera, updateCamera, isPlayerDead, worldToScreen, type CameraState } from '../systems/Camera'
import {
  createScoreState,
  updateHeightScore,
  addMeatballScore,
  addPowerUpScore,
  loadHighScore,
  saveHighScore,
  type ScoreState,
} from '../systems/Score'
import { createZoneState, updateZone, getInterpolatedTheme, type ZoneState } from '../systems/Zone'
import { ParallaxBackground } from '../systems/Parallax'
import { InputManager } from '../systems/Input'
import { drawChef, drawChefOnRocket, drawPlatform, drawMeatball, drawPowerUp, type PlatformStyle } from '../rendering/sprites'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLATFORM_COUNT_BUFFER,
  COLORS,
} from '../config/constants'

export class GameScene {
  readonly container = new Container()
  readonly input = new InputManager()

  private player: PlayerState
  private platforms: PlatformState[] = []
  private meatballs: CollectibleState[] = []
  private powerUps: PowerUpState[] = []
  private camera: CameraState
  private scoreState: ScoreState
  private zoneState: ZoneState

  // Active power-up effect
  private activeEffect: ActiveEffect | null = null

  // Animation tick for spinning items
  private animTick = 0

  // Rendering
  private parallax: ParallaxBackground
  private gameContainer = new Container() // holds game objects (scrolls with camera)
  private playerGfx = new Graphics()
  private platformGfxMap = new Map<number, Graphics>()
  private meatballGfxMap = new Map<number, Graphics>()
  private powerUpGfxMap = new Map<number, Graphics>()
  private effectLabel: Text | null = null
  private tornadoParticles: Graphics[] = []
  private tornadoContainer = new Container()
  private rocketParticles: Graphics[] = []
  private rocketContainer = new Container()
  private lasagnaParticles: Graphics[] = []
  private lasagnaContainer = new Container()
  private springParticles: Graphics[] = []
  private springContainer = new Container()
  private springFlashTicks = 0
  private sneezeParticles: Graphics[] = []
  private sneezeContainer = new Container()

  // State
  private highestPlatformY: number
  private platformCount = 0 // total generated (for generation logic)
  private platformsPassed = 0 // platforms the player has climbed past (for zones)
  private highestPlayerY = Infinity // track the player's highest point
  private gameOver = false
  private highScoreBeatShown = false
  private startTime = Date.now()
  private elapsedMs = 0
  private highScore: number

  constructor() {
    this.scoreState = createScoreState()
    this.zoneState = createZoneState()
    this.highScore = loadHighScore()

    // Parallax background (behind everything)
    this.parallax = new ParallaxBackground()
    this.container.addChild(this.parallax.container)

    // Game container (scrolls with camera)
    this.container.addChild(this.gameContainer)

    // Ground floor
    const ground = createGroundPlatform(GAME_HEIGHT)
    this.platforms.push(ground)
    this.highestPlatformY = ground.y

    // Generate initial platforms
    const generated = generatePlatforms(this.highestPlatformY, PLATFORM_COUNT_BUFFER)
    this.platforms.push(...generated)
    this.highestPlatformY = generated[generated.length - 1].y
    this.platformCount = generated.length

    // Spawn power-ups first, then meatballs (excluding power-up platforms)
    this.powerUps = spawnPowerUps(generated)
    const puPlatformIds = new Set(this.powerUps.map((pu) => pu.platformId))
    this.meatballs = spawnMeatballs(generated, puPlatformIds)

    // Player
    this.player = createPlayer(GAME_WIDTH / 2 - 16, ground.y - 40)

    // Camera
    this.camera = createCamera()
    this.camera = { ...this.camera, y: ground.y - GAME_HEIGHT + 100 }

    // Add player graphic + effect containers
    this.gameContainer.addChild(this.sneezeContainer)
    this.gameContainer.addChild(this.springContainer)
    this.gameContainer.addChild(this.lasagnaContainer)
    this.gameContainer.addChild(this.rocketContainer)
    this.gameContainer.addChild(this.tornadoContainer)
    this.gameContainer.addChild(this.playerGfx)

    // Initial render setup
    this.syncPlatformGraphics()
    this.syncMeatballGraphics()
    this.syncPowerUpGraphics()

    // Apply initial theme
    const theme = getInterpolatedTheme(0)
    this.parallax.applyTheme(theme, this.zoneState.currentZone)
  }

  initInput(canvas: HTMLCanvasElement): void {
    this.input.init(canvas)
  }

  isGameOver(): boolean { return this.gameOver }
  getScore(): number { return this.scoreState.points }
  getHeight(): number { return this.scoreState.height }
  getHighScore(): number { return this.highScore }
  getElapsedSeconds(): number { return Math.floor(this.elapsedMs / 1000) }
  getActiveEffectName(): string | null { return this.activeEffect?.type ?? null }

  /** Returns true exactly once — when the player first beats the high score during gameplay. */
  checkNewHighScore(): boolean {
    if (this.highScoreBeatShown) return false
    if (this.highScore > 0 && this.scoreState.points > this.highScore) {
      this.highScoreBeatShown = true
      return true
    }
    return false
  }

  getActiveEffectProgress(): number {
    if (!this.activeEffect) return 0
    const maxDuration = this.getMaxDuration(this.activeEffect.type)
    return this.activeEffect.ticksRemaining / maxDuration
  }

  private getMaxDuration(type: string): number {
    switch (type) {
      case 'fusilli_tornado': return 300
      case 'ravioli_rocket': return 180
      case 'lasagna_layers': return 360
      case 'pepper_sneeze': return 30
      default: return 1
    }
  }

  update(): void {
    if (this.gameOver) return

    this.elapsedMs = Date.now() - this.startTime
    const previousY = this.player.y

    // Input
    this.input.update()

    // Active power-up effect
    if (this.activeEffect) {
      const effectResult = tickEffect(this.player, this.activeEffect)
      this.player = effectResult.player
      this.activeEffect = effectResult.effect
      if (!this.activeEffect) this.clearEffectLabel()

    }

    // Update moving platforms
    this.platforms = updatePlatforms(this.platforms)
    this.meatballs = updateMeatballPositions(this.meatballs, this.platforms)
    this.powerUps = updatePowerUpPositions(this.powerUps, this.platforms)

    // Update player
    this.player = updatePlayer(this.player, this.input.inputX)

    // Platform collisions (skip during flight effects)
    const isFlying = this.activeEffect?.type === 'fusilli_tornado' || this.activeEffect?.type === 'ravioli_rocket' || this.activeEffect?.type === 'pepper_sneeze'
    if (!isFlying) {
      const collision = checkPlatformCollisions(this.player, this.platforms, previousY)
      this.player = collision.player
      this.platforms = collision.platforms
    }

    // Collect meatballs
    const meatballResult = collectMeatballs(
      this.player.x, this.player.y,
      this.player.width, this.player.height,
      this.meatballs,
    )
    this.meatballs = meatballResult.meatballs
    if (meatballResult.collected > 0) {
      this.scoreState = addMeatballScore(this.scoreState, meatballResult.collected)
    }

    // Collect power-ups
    const puResult = collectPowerUps(this.player, this.powerUps)
    this.powerUps = puResult.powerUps
    if (puResult.collected) {
      this.scoreState = addPowerUpScore(this.scoreState)
      const applied = applyPowerUp(this.player, puResult.collected)
      this.player = applied.player
      this.activeEffect = applied.effect
      if (applied.effect) this.showEffectLabel(puResult.collected)
      // Spaghetti spring: trigger brief visual flash
      if (puResult.collected === 'spaghetti_spring') {
        this.springFlashTicks = 30
        this.showEffectLabel('spaghetti_spring')
      }
    }

    // Height score
    this.scoreState = updateHeightScore(this.scoreState, this.player.y)

    // Track platforms passed — count new platforms the player climbs above
    if (this.player.y < this.highestPlayerY) {
      const newlyPassed = this.platforms.filter(
        (p) => p.y > this.player.y && p.y <= this.highestPlayerY,
      ).length
      this.platformsPassed += newlyPassed
      this.highestPlayerY = this.player.y
    }

    // Zone transitions — based on platforms actually passed, not generated
    const zoneResult = updateZone(this.zoneState, this.platformsPassed)
    this.zoneState = zoneResult.state
    const theme = getInterpolatedTheme(this.platformsPassed)
    this.parallax.applyTheme(theme, this.zoneState.currentZone)

    // Camera
    this.camera = updateCamera(this.camera, this.player.y)

    // Death check
    if (isPlayerDead(this.camera, this.player.y)) {
      this.gameOver = true
      const isNew = saveHighScore(this.scoreState.points)
      if (isNew) this.highScore = this.scoreState.points
      return
    }

    // Generate + prune
    this.maybeGeneratePlatforms()
    this.prune()

    // Render
    this.animTick++
    this.parallax.update(this.camera.y)
    this.render(theme)
  }

  private maybeGeneratePlatforms(): void {
    const cameraTop = this.camera.y
    if (this.highestPlatformY > cameraTop - GAME_HEIGHT) {
      const generated = generatePlatforms(this.highestPlatformY, PLATFORM_COUNT_BUFFER)
      this.platforms.push(...generated)
      this.highestPlatformY = generated[generated.length - 1].y
      this.platformCount += generated.length

      const hasUncollected = this.powerUps.some((pu) => !pu.collected)
      if (!hasUncollected) {
        const newPowerUps = spawnPowerUps(generated)
        this.powerUps.push(...newPowerUps)
      }

      const allPuPlatformIds = new Set(this.powerUps.map((pu) => pu.platformId))
      this.meatballs.push(...spawnMeatballs(generated, allPuPlatformIds))

      this.syncPlatformGraphics()
      this.syncMeatballGraphics()
      this.syncPowerUpGraphics()
    }
  }

  private prune(): void {
    const threshold = this.camera.y + GAME_HEIGHT + 400
    const beforePlatforms = this.platforms.length
    this.platforms = pruneBelow(this.platforms, threshold)

    const activeIds = new Set(this.platforms.map((p) => p.id))
    const beforeMeatballs = this.meatballs.length
    this.meatballs = pruneMeatballs(this.meatballs, activeIds)
    const beforePowerUps = this.powerUps.length
    this.powerUps = prunePowerUps(this.powerUps, activeIds)

    if (beforePlatforms !== this.platforms.length) this.cleanupGraphics(this.platformGfxMap, this.platforms.map((p) => p.id))
    if (beforeMeatballs !== this.meatballs.length) this.cleanupGraphics(this.meatballGfxMap, this.meatballs.map((m) => m.id))
    if (beforePowerUps !== this.powerUps.length) this.cleanupGraphics(this.powerUpGfxMap, this.powerUps.map((pu) => pu.id))
  }

  private render(theme: ReturnType<typeof getInterpolatedTheme>): void {
    const camY = this.camera.y

    // Player — different rendering per active effect
    const activeType = this.activeEffect?.type
    if (activeType === 'ravioli_rocket') {
      // Rocket mode — draw chef on rocket with animated fire
      drawChefOnRocket(this.playerGfx, this.player.width, this.player.height, this.animTick)
      this.playerGfx.pivot.set(0, 0)
      this.playerGfx.rotation = 0
      this.playerGfx.x = this.player.x
      this.playerGfx.y = worldToScreen(this.player.y, camY)

      // Fire trail particles
      this.updateRocketParticles(camY)
      this.clearTornadoParticles()
    } else if (activeType === 'fusilli_tornado') {
      // Tornado mode — spin + dust
      const effectColor = COLORS.powerups[activeType]
      drawChef(this.playerGfx, this.player.width, this.player.height, effectColor)
      this.playerGfx.pivot.set(this.player.width / 2, this.player.height / 2)
      this.playerGfx.x = this.player.x + this.player.width / 2
      this.playerGfx.y = worldToScreen(this.player.y, camY) + this.player.height / 2
      this.playerGfx.rotation = this.animTick * 0.15
      this.updateTornadoParticles(camY)
      this.clearRocketParticles()
    } else if (activeType === 'pepper_sneeze') {
      // Sneeze mode — screen shake + spice cloud
      drawChef(this.playerGfx, this.player.width, this.player.height, COLORS.powerups['pepper_sneeze'])
      this.playerGfx.pivot.set(0, 0)
      this.playerGfx.rotation = 0
      // Screen shake
      const shakeX = (Math.random() - 0.5) * 6
      const shakeY = (Math.random() - 0.5) * 4
      this.playerGfx.x = this.player.x + shakeX
      this.playerGfx.y = worldToScreen(this.player.y, camY) + shakeY
      this.updateSneezeParticles(camY)
      this.clearTornadoParticles()
      this.clearRocketParticles()
      this.clearLasagnaParticles()
      this.clearSneezeParticles()
    } else if (activeType === 'lasagna_layers') {
      // Slow fall mode — golden glow + floating cheese particles
      drawChef(this.playerGfx, this.player.width, this.player.height, COLORS.powerups['lasagna_layers'])
      this.playerGfx.pivot.set(0, 0)
      this.playerGfx.rotation = 0
      this.playerGfx.x = this.player.x
      this.playerGfx.y = worldToScreen(this.player.y, camY)
      this.updateLasagnaParticles(camY)
      this.clearTornadoParticles()
      this.clearRocketParticles()
    } else {
      // Normal or spaghetti spring flash
      drawChef(this.playerGfx, this.player.width, this.player.height)
      this.playerGfx.pivot.set(0, 0)
      this.playerGfx.rotation = 0
      this.playerGfx.x = this.player.x
      this.playerGfx.y = worldToScreen(this.player.y, camY)

      // Spaghetti spring: brief stretch + trail
      if (this.springFlashTicks > 0) {
        this.springFlashTicks--
        const stretch = 1 + (this.springFlashTicks / 30) * 0.5 // stretch up to 1.5x tall
        this.playerGfx.scale.set(1, stretch)
        this.playerGfx.tint = 0xf0c050 // golden tint
        this.updateSpringParticles(camY)
        if (this.springFlashTicks === 0) {
          this.playerGfx.scale.set(1, 1)
          this.playerGfx.tint = 0xffffff
          this.clearEffectLabel()
        }
      } else {
        this.clearSpringParticles()
      }

      this.clearTornadoParticles()
      this.clearRocketParticles()
      this.clearLasagnaParticles()
      this.clearSneezeParticles()
    }

    // Platforms — redraw with zone-appropriate colors
    for (const platform of this.platforms) {
      const gfx = this.platformGfxMap.get(platform.id)
      if (!gfx) continue
      if (platform.broken) { gfx.visible = false; continue }

      let color = theme.platform
      let style: PlatformStyle = 'normal'
      if (platform.type === 'breaking') { color = theme.platformBreaking; style = 'breaking' }
      if (platform.type === 'brittle') { color = theme.platformBrittle; style = 'brittle' }
      if (platform.type === 'moving') { color = theme.platformMoving; style = 'moving' }
      if (platform.type === 'lasagna') { color = theme.platformLasagna; style = 'lasagna' }

      drawPlatform(gfx, platform.width, platform.height, color, style)
      gfx.x = platform.x
      gfx.y = worldToScreen(platform.y, camY)
      gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20
    }

    // Meatballs — gentle 3D wobble + bob
    const meatballWobble = Math.cos(this.animTick * 0.04)
    const meatballBob = Math.sin(this.animTick * 0.05) * 2
    for (const meatball of this.meatballs) {
      const gfx = this.meatballGfxMap.get(meatball.id)
      if (!gfx) continue
      if (meatball.collected) { gfx.visible = false; continue }
      gfx.x = meatball.x + meatball.size / 2
      gfx.y = worldToScreen(meatball.y, camY) + meatballBob
      gfx.pivot.x = meatball.size / 2
      gfx.scale.x = 0.75 + Math.abs(meatballWobble) * 0.25 // gentle squish between 0.75 and 1.0
      gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20
    }

    // Power-ups — faster spin + gentle bob
    const puSpin = Math.cos(this.animTick * 0.08)
    const puBob = Math.sin(this.animTick * 0.04) * 3
    for (const pu of this.powerUps) {
      const gfx = this.powerUpGfxMap.get(pu.id)
      if (!gfx) continue
      if (pu.collected) { gfx.visible = false; continue }
      gfx.x = pu.x + pu.size / 2
      gfx.y = worldToScreen(pu.y, camY) + puBob
      gfx.pivot.x = pu.size / 2
      gfx.scale.x = 0.4 + Math.abs(puSpin) * 0.6 // squish between 0.4 and 1.0
      gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20
    }
  }

  // ── Tornado particles ────────────────────────────────────────────────────

  private updateTornadoParticles(camY: number): void {
    // Spawn new particles
    if (this.animTick % 2 === 0) {
      const particle = new Graphics()
      const size = 3 + Math.random() * 5
      particle.circle(0, 0, size)
      particle.fill({ color: 0xd4a017, alpha: 0.4 + Math.random() * 0.3 })
      this.tornadoContainer.addChild(particle)
      this.tornadoParticles.push(particle)

      // Start near player center
      const cx = this.player.x + this.player.width / 2
      const cy = this.player.y + this.player.height / 2
      particle.x = cx + (Math.random() - 0.5) * 20
      particle.y = worldToScreen(cy, camY) + (Math.random() - 0.5) * 20
    }

    // Update existing particles — spiral outward and fade
    for (let i = this.tornadoParticles.length - 1; i >= 0; i--) {
      const p = this.tornadoParticles[i]
      const cx = this.player.x + this.player.width / 2
      const screenCy = worldToScreen(this.player.y + this.player.height / 2, camY)

      // Spiral motion
      const angle = this.animTick * 0.12 + i * 0.8
      const radius = 10 + (this.tornadoParticles.length - i) * 2
      p.x = cx + Math.cos(angle) * radius
      p.y = screenCy + Math.sin(angle) * radius * 0.5 + (this.tornadoParticles.length - i) * 1.5

      p.alpha -= 0.015
      p.scale.set(p.scale.x * 0.995)

      if (p.alpha <= 0) {
        this.tornadoContainer.removeChild(p)
        p.destroy()
        this.tornadoParticles.splice(i, 1)
      }
    }
  }

  private clearTornadoParticles(): void {
    for (const p of this.tornadoParticles) {
      this.tornadoContainer.removeChild(p)
      p.destroy()
    }
    this.tornadoParticles = []
  }

  // ── Rocket particles ─────────────────────────────────────────────────────

  private updateRocketParticles(camY: number): void {
    // Spawn fire particles every frame
    const cx = this.player.x + this.player.width / 2
    const bottomY = this.player.y + this.player.height

    for (let s = 0; s < 2; s++) {
      const particle = new Graphics()
      const size = 2 + Math.random() * 4
      // Random fire color
      const colors = [0xff4500, 0xff8c00, 0xffdd00, 0xff6600]
      const color = colors[Math.floor(Math.random() * colors.length)]
      particle.circle(0, 0, size)
      particle.fill({ color, alpha: 0.7 + Math.random() * 0.3 })
      this.rocketContainer.addChild(particle)
      this.rocketParticles.push(particle)

      particle.x = cx + (Math.random() - 0.5) * 14
      particle.y = worldToScreen(bottomY + 10, camY)
    }

    // Update — particles fall down and fade
    for (let i = this.rocketParticles.length - 1; i >= 0; i--) {
      const p = this.rocketParticles[i]
      p.y += 2 + Math.random() * 3 // drift downward (fire trail)
      p.x += (Math.random() - 0.5) * 2 // slight horizontal wobble
      p.alpha -= 0.03
      p.scale.set(p.scale.x * 0.97)

      if (p.alpha <= 0) {
        this.rocketContainer.removeChild(p)
        p.destroy()
        this.rocketParticles.splice(i, 1)
      }
    }
  }

  private clearRocketParticles(): void {
    for (const p of this.rocketParticles) {
      this.rocketContainer.removeChild(p)
      p.destroy()
    }
    this.rocketParticles = []
  }

  // ── Sneeze particles (spice cloud bursting outward) ──────────────────────

  private updateSneezeParticles(camY: number): void {
    // Burst of red/brown spice particles
    for (let s = 0; s < 3; s++) {
      const particle = new Graphics()
      const size = 2 + Math.random() * 4
      const colors = [0x8b0000, 0xcc4400, 0xff6633, 0xaa2200, 0xdd5500]
      particle.circle(0, 0, size)
      particle.fill(colors[Math.floor(Math.random() * colors.length)])
      this.sneezeContainer.addChild(particle)
      this.sneezeParticles.push(particle)

      const cx = this.player.x + this.player.width / 2
      const cy = this.player.y + this.player.height * 0.3
      particle.x = cx + (Math.random() - 0.5) * 10
      particle.y = worldToScreen(cy, camY)
    }

    for (let i = this.sneezeParticles.length - 1; i >= 0; i--) {
      const p = this.sneezeParticles[i]
      // Explode outward in all directions
      const angle = Math.random() * Math.PI * 2
      p.x += Math.cos(angle) * 2.5
      p.y += Math.sin(angle) * 2 + 1.5 // drift down slightly
      p.alpha -= 0.04

      if (p.alpha <= 0) {
        this.sneezeContainer.removeChild(p)
        p.destroy()
        this.sneezeParticles.splice(i, 1)
      }
    }
  }

  private clearSneezeParticles(): void {
    for (const p of this.sneezeParticles) {
      this.sneezeContainer.removeChild(p)
      p.destroy()
    }
    this.sneezeParticles = []
  }

  // ── Spring particles (upward golden spaghetti trail) ─────────────────────

  private updateSpringParticles(camY: number): void {
    // Spawn coiled spaghetti strand particles shooting downward
    if (this.animTick % 2 === 0) {
      const particle = new Graphics()
      // Draw a tiny spring/zigzag
      const pH = 10 + Math.random() * 6
      particle.moveTo(0, 0)
      particle.lineTo(4, pH * 0.25)
      particle.lineTo(-4, pH * 0.5)
      particle.lineTo(4, pH * 0.75)
      particle.lineTo(0, pH)
      particle.stroke({ width: 2, color: 0xf0c050, alpha: 0.8 })
      this.springContainer.addChild(particle)
      this.springParticles.push(particle)

      const cx = this.player.x + this.player.width / 2
      particle.x = cx + (Math.random() - 0.5) * 20
      particle.y = worldToScreen(this.player.y + this.player.height, camY)
    }

    for (let i = this.springParticles.length - 1; i >= 0; i--) {
      const p = this.springParticles[i]
      p.y += 3 // trail downward
      p.x += (Math.random() - 0.5) * 1.5
      p.alpha -= 0.03

      if (p.alpha <= 0) {
        this.springContainer.removeChild(p)
        p.destroy()
        this.springParticles.splice(i, 1)
      }
    }
  }

  private clearSpringParticles(): void {
    for (const p of this.springParticles) {
      this.springContainer.removeChild(p)
      p.destroy()
    }
    this.springParticles = []
  }

  // ── Lasagna particles (golden shimmer floating upward) ───────────────────

  private updateLasagnaParticles(camY: number): void {
    if (this.animTick % 3 === 0) {
      const particle = new Graphics()
      const size = 2 + Math.random() * 3
      const colors = [0xffcc00, 0xff8c00, 0xffee66]
      particle.rect(-size / 2, -size / 2, size, size)
      particle.fill(colors[Math.floor(Math.random() * colors.length)])
      this.lasagnaContainer.addChild(particle)
      this.lasagnaParticles.push(particle)

      const cx = this.player.x + this.player.width / 2
      particle.x = cx + (Math.random() - 0.5) * 40
      particle.y = worldToScreen(this.player.y + this.player.height, camY)
      particle.rotation = Math.random() * Math.PI
    }

    for (let i = this.lasagnaParticles.length - 1; i >= 0; i--) {
      const p = this.lasagnaParticles[i]
      p.y += 1 // drift down slowly (player is floating up)
      p.x += Math.sin(this.animTick * 0.05 + i) * 0.5 // sway
      p.rotation += 0.03
      p.alpha -= 0.012

      if (p.alpha <= 0) {
        this.lasagnaContainer.removeChild(p)
        p.destroy()
        this.lasagnaParticles.splice(i, 1)
      }
    }
  }

  private clearLasagnaParticles(): void {
    for (const p of this.lasagnaParticles) {
      this.lasagnaContainer.removeChild(p)
      p.destroy()
    }
    this.lasagnaParticles = []
  }

  // ── Effect label ───────────────────────────────────────────────────────────

  private showEffectLabel(type: string): void {
    this.clearEffectLabel()
    const label = type.replace('_', ' ').toUpperCase()
    this.effectLabel = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 16,
        fill: '#fff',
        fontWeight: 'bold',
        stroke: { color: '#000', width: 3 },
      }),
    })
    this.effectLabel.x = GAME_WIDTH / 2
    this.effectLabel.y = GAME_HEIGHT - 30
    this.effectLabel.anchor.set(0.5, 0.5)
    this.container.addChild(this.effectLabel)
  }

  private clearEffectLabel(): void {
    if (this.effectLabel) {
      this.container.removeChild(this.effectLabel)
      this.effectLabel.destroy()
      this.effectLabel = null
    }
  }

  // ── Graphics sync ──────────────────────────────────────────────────────────

  private syncPlatformGraphics(): void {
    for (const platform of this.platforms) {
      if (this.platformGfxMap.has(platform.id)) continue
      const gfx = new Graphics()
      drawPlatform(gfx, platform.width, platform.height, COLORS.platform[0])
      this.gameContainer.addChild(gfx)
      this.platformGfxMap.set(platform.id, gfx)
    }
  }

  private syncMeatballGraphics(): void {
    for (const meatball of this.meatballs) {
      if (this.meatballGfxMap.has(meatball.id)) continue
      const gfx = new Graphics()
      drawMeatball(gfx, meatball.size)
      this.gameContainer.addChild(gfx)
      this.meatballGfxMap.set(meatball.id, gfx)
    }
  }

  private syncPowerUpGraphics(): void {
    for (const pu of this.powerUps) {
      if (this.powerUpGfxMap.has(pu.id)) continue
      const gfx = new Graphics()
      const color = COLORS.powerups[pu.type] ?? 0xffffff
      drawPowerUp(gfx, pu.size, color, pu.type)
      this.gameContainer.addChild(gfx)
      this.powerUpGfxMap.set(pu.id, gfx)
    }
  }

  private cleanupGraphics(map: Map<number, Graphics>, activeIds: number[]): void {
    const idSet = new Set(activeIds)
    for (const [id, gfx] of map) {
      if (!idSet.has(id)) {
        gfx.parent?.removeChild(gfx)
        gfx.destroy()
        map.delete(id)
      }
    }
  }

  destroy(): void {
    this.input.destroy()
    this.clearEffectLabel()
    this.clearTornadoParticles()
    this.clearRocketParticles()
    this.clearLasagnaParticles()
    this.clearSpringParticles()
    this.clearSneezeParticles()
    this.parallax.destroy()
    this.container.destroy({ children: true })
    this.platformGfxMap.clear()
    this.meatballGfxMap.clear()
    this.powerUpGfxMap.clear()
  }
}
