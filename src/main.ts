import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import { GameScene } from './scenes/GameScene'
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DEBUG_MODE } from './config/constants'
import { FireworkDisplay } from './rendering/fireworks'

// Lock to portrait via Screen Orientation API (Android Chrome; Safari ignores this)
// Lock to portrait via Screen Orientation API (Android Chrome; Safari ignores this)
const orient = screen.orientation as { lock?: (o: string) => Promise<void> } | undefined
orient?.lock?.('portrait').catch(() => {
  // Silently fail — CSS fallback handles it
})

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

async function main() {
  const app = new Application()
  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    background: '#fff8e7',
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })

  const container = document.getElementById('game')
  if (!container) throw new Error('Missing #game element')
  container.appendChild(app.canvas)

  const scene = new GameScene()
  scene.initInput(app.canvas)
  app.stage.addChild(scene.container)

  // ── HUD ──────────────────────────────────────────────────────────────────
  const hudContainer = new Container()
  app.stage.addChild(hudContainer)

  // Semi-transparent background bar
  const hudBg = new Graphics()
  hudBg.rect(0, 0, GAME_WIDTH, DEBUG_MODE ? 80 : 36)
  hudBg.fill({ color: 0x000000, alpha: DEBUG_MODE ? 0.5 : 0.3 })
  hudContainer.addChild(hudBg)

  const hudStyle = new TextStyle({
    fontFamily: 'monospace',
    fontSize: 14,
    fill: '#ffffff',
    fontWeight: 'bold',
  })

  const timerText = new Text({ text: '0:00', style: hudStyle })
  timerText.x = 10
  timerText.y = 9

  const heightText = new Text({ text: 'H: 0', style: hudStyle })
  heightText.x = GAME_WIDTH / 2
  heightText.anchor.set(0.5, 0)
  heightText.y = 9

  const scoreText = new Text({ text: '0', style: hudStyle })
  scoreText.x = GAME_WIDTH - 10
  scoreText.anchor.set(1, 0)
  scoreText.y = 9

  // Debug: sensor readout (only in debug mode)
  const debugText = new Text({ text: '', style: new TextStyle({
    fontFamily: 'monospace',
    fontSize: 13,
    fill: '#ffff00',
    lineHeight: 18,
  }) })
  debugText.x = 10
  debugText.y = 30
  debugText.visible = DEBUG_MODE

  const debugBar = new Graphics()
  debugBar.visible = DEBUG_MODE
  hudContainer.addChild(timerText, heightText, scoreText, debugText, debugBar)

  // ── Fullscreen on first tap (hides browser URL bar) ───────────────────────
  // Note: iOS Safari does NOT support Fullscreen API — only works when
  // added to home screen via apple-mobile-web-app-capable meta tag.
  // Android Chrome: works via user gesture.
  const requestFullscreen = () => {
    const doc = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>
      msRequestFullscreen?: () => Promise<void>
    }
    ;(doc.requestFullscreen?.() ??
      doc.webkitRequestFullscreen?.() ??
      doc.msRequestFullscreen?.() ??
      Promise.resolve()
    ).catch(() => {})
  }
  app.canvas.addEventListener('touchstart', requestFullscreen, { once: true })
  app.canvas.addEventListener('click', requestFullscreen, { once: true })

  // ── Tilt permission prompt ───────────────────────────────────────────────
  if (scene.input.needsTiltPermission) {
    const promptStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fill: '#666',
      align: 'center',
    })
    const promptText = new Text({
      text: 'Tap to enable tilt controls!',
      style: promptStyle,
    })
    promptText.x = GAME_WIDTH / 2
    promptText.y = 50
    promptText.anchor.set(0.5, 0)
    app.stage.addChild(promptText)

    const requestTilt = async () => {
      await scene.input.requestTiltPermission()
      app.canvas.removeEventListener('touchstart', requestTilt)
      app.stage.removeChild(promptText)
      promptText.destroy()
    }
    app.canvas.addEventListener('touchstart', requestTilt, { once: true })
  }

  // ── Orientation pause ─────────────────────────────────────────────────────
  const orientationQuery = window.matchMedia('(orientation: landscape) and (max-height: 500px)')
  let pausedByOrientation = false

  const checkOrientation = () => {
    if (orientationQuery.matches && !pausedByOrientation) {
      pausedByOrientation = true
      app.ticker.stop()
    } else if (!orientationQuery.matches && pausedByOrientation) {
      pausedByOrientation = false
      if (!scene.isGameOver()) app.ticker.start()
    }
  }
  orientationQuery.addEventListener('change', checkOrientation)
  checkOrientation()

  // ── Effect timer bar (bottom of screen) ──────────────────────────────────
  const effectTimerBar = new Graphics()
  const effectTimerLabel = new Text({
    text: '',
    style: new TextStyle({
      fontFamily: 'monospace',
      fontSize: 13,
      fill: '#ffffff',
      fontWeight: 'bold',
    }),
  })
  effectTimerLabel.anchor.set(0.5, 1)
  effectTimerLabel.x = GAME_WIDTH / 2
  effectTimerLabel.y = GAME_HEIGHT - 8
  app.stage.addChild(effectTimerBar, effectTimerLabel)

  // ── In-game fireworks for beating high score ─────────────────────────────
  let inGameFireworks: FireworkDisplay | null = null
  let inGameHighScoreLabel: Text | null = null

  // ── Game loop ────────────────────────────────────────────────────────────
  app.ticker.add(() => {
    scene.update()

    timerText.text = formatTime(scene.getElapsedSeconds())
    heightText.text = `H: ${scene.getHeight()}`
    scoreText.text = `${scene.getScore()}`

    // Check for new high score during gameplay
    if (scene.checkNewHighScore() && !inGameFireworks) {
      inGameFireworks = new FireworkDisplay(10)
      app.stage.addChild(inGameFireworks.container)

      inGameHighScoreLabel = new Text({
        text: 'NEW HIGH SCORE!',
        style: new TextStyle({
          fontFamily: 'monospace',
          fontSize: 18,
          fill: '#ffdd44',
          fontWeight: 'bold',
          stroke: { color: '#000000', width: 3 },
          align: 'center',
        }),
      })
      inGameHighScoreLabel.x = GAME_WIDTH / 2
      inGameHighScoreLabel.y = GAME_HEIGHT * 0.15
      inGameHighScoreLabel.anchor.set(0.5, 0.5)
      app.stage.addChild(inGameHighScoreLabel)
    }

    // Animate in-game fireworks
    if (inGameFireworks) {
      if (!inGameFireworks.update()) {
        inGameFireworks.destroy()
        inGameFireworks = null
        if (inGameHighScoreLabel) {
          app.stage.removeChild(inGameHighScoreLabel)
          inGameHighScoreLabel.destroy()
          inGameHighScoreLabel = null
        }
      } else if (inGameHighScoreLabel) {
        // Pulse the label
        const pulse = 0.9 + Math.sin(Date.now() * 0.008) * 0.1
        inGameHighScoreLabel.scale.set(pulse)
      }
    }

    // Debug sensor readout
    if (DEBUG_MODE) {
      const ix = scene.input.inputX
      const cal = scene.input.tiltCalibrationOffset
      const ax = scene.input.accelX
      const rawTilt = scene.input.rawTilt
      debugText.text = [
        `accel.x: ${ax.toFixed(2)}  adjusted: ${rawTilt.toFixed(2)}`,
        `cal: ${cal.toFixed(1)}  input: ${ix >= 0 ? '+' : ''}${ix.toFixed(2)}`,
      ].join('\n')

      debugBar.clear()
      const barY = 73
      const barCenter = GAME_WIDTH / 2
      const maxBarW = GAME_WIDTH / 2 - 20
      debugBar.rect(barCenter - 1, barY, 2, 4)
      debugBar.fill(0x888888)
      const barWidth = Math.abs(ix) * maxBarW
      const barX = ix >= 0 ? barCenter : barCenter - barWidth
      debugBar.rect(barX, barY, barWidth, 4)
      debugBar.fill(0xffff00)
    }

    // Effect timer bar
    effectTimerBar.clear()
    const effectName = scene.getActiveEffectName()
    const effectProgress = scene.getActiveEffectProgress()
    if (effectName && effectProgress > 0) {
      const barW = (GAME_WIDTH - 40) * effectProgress
      const color = COLORS.powerups[effectName] ?? 0xffffff
      effectTimerBar.rect(20, GAME_HEIGHT - 6, GAME_WIDTH - 40, 4)
      effectTimerBar.fill({ color: 0x333333, alpha: 0.5 })
      effectTimerBar.rect(20, GAME_HEIGHT - 6, barW, 4)
      effectTimerBar.fill(color)
      effectTimerLabel.text = effectName.replace('_', ' ').toUpperCase()
      effectTimerLabel.visible = true
    } else {
      effectTimerLabel.visible = false
    }

    if (scene.isGameOver()) {
      app.ticker.stop()
      showGameOver(app, scene.getScore(), scene.getHeight(), scene.getElapsedSeconds(), scene.getHighScore())
    }
  })
}

function showGameOver(
  app: Application,
  score: number,
  height: number,
  seconds: number,
  highScore: number,
): void {
  const isNewRecord = score >= highScore && score > 0

  // Dim overlay
  const dim = new Graphics()
  dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  dim.fill({ color: 0x000000, alpha: 0.5 })
  app.stage.addChild(dim)

  // ── Fireworks for new high score ──
  if (isNewRecord) {
    const fireworks = new FireworkDisplay(16) // 16 bursts staggered across the screen
    app.stage.addChild(fireworks.container)

    const fireworkTicker = () => {
      if (!fireworks.update()) {
        app.ticker.remove(fireworkTicker)
        fireworks.destroy()
        app.ticker.stop()
      }
    }
    app.ticker.add(fireworkTicker)
    app.ticker.start()
  }

  // ── Text overlay ──
  const lines = [
    isNewRecord ? 'NEW HIGH SCORE!' : 'Game Over!',
    '',
    `Score: ${score}`,
    `Best: ${highScore}`,
    `Height: ${height}`,
    `Time: ${formatTime(seconds)}`,
    '',
    'Tap to restart',
  ]

  const overlay = new Text({
    text: lines.join('\n'),
    style: new TextStyle({
      fontFamily: 'monospace',
      fontSize: isNewRecord ? 20 : 22,
      fill: isNewRecord ? '#ffdd44' : '#ffffff',
      align: 'center',
      fontWeight: 'bold',
      lineHeight: 28,
    }),
  })
  overlay.x = GAME_WIDTH / 2
  overlay.y = GAME_HEIGHT * 0.4
  overlay.anchor.set(0.5, 0.5)
  app.stage.addChild(overlay)

  // ── Clear data button ──
  const clearText = new Text({
    text: '[Clear saved data]',
    style: new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fill: '#999999',
      align: 'center',
    }),
  })
  clearText.x = GAME_WIDTH / 2
  clearText.y = GAME_HEIGHT * 0.75
  clearText.anchor.set(0.5, 0.5)
  clearText.eventMode = 'static'
  clearText.cursor = 'pointer'
  clearText.on('pointertap', () => {
    localStorage.clear()
    clearText.text = 'Data cleared!'
    clearText.style.fill = '#66cc66'
  })
  app.stage.addChild(clearText)

  // ── Restart handler ──
  const restart = (e: Event) => {
    // Don't restart if they tapped the clear button
    if (e.target === clearText) return
    app.canvas.removeEventListener('click', restart)
    app.canvas.removeEventListener('touchstart', restart)
    window.removeEventListener('keydown', restart)
    window.location.reload()
  }

  // Delay restart listener slightly so confetti can play
  setTimeout(() => {
    app.canvas.addEventListener('click', restart)
    app.canvas.addEventListener('touchstart', restart)
    window.addEventListener('keydown', restart)
  }, isNewRecord ? 1500 : 300)
}

main()
