/** Gameplay scene — thin orchestrator wiring pure logic to PixiJS rendering. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { worldToScreen } from "../systems/Camera";
import { getInterpolatedTheme } from "../systems/Zone";
import { ParallaxBackground } from "../systems/Parallax";
import { InputManager } from "../systems/Input";
import { tickShake } from "../systems/ScreenShake";
import { GAME_WIDTH, GAME_HEIGHT, DEATH_ANIMATION_TICKS } from "../config/constants";
import { createInitialState, type GameWorldState } from "./GameState";
import {
  tickGameWorld,
  startCountdown,
  togglePause,
  throwProjectile,
} from "./GameLoop";
import { isEnemiesEnabled } from "../systems/EnemySettings";
import { ZoneTransition } from "./ZoneTransition";
import { ParticleManager } from "./ParticleManager";
import { EffectRenderer } from "./EffectRenderer";
import { GraphicsSync } from "./GraphicsSync";
import {
  renderPlatforms,
  renderMeatballs,
  renderPowerUps,
  renderEnemies,
  renderProjectiles,
} from "./EntityRenderer";
import { handleEvents } from "./GameSceneEvents";
import { renderBoss, renderWeather } from "./GameSceneRender";
import { getMaxDuration } from "./effectDuration";

export class GameScene {
  readonly container = new Container();
  readonly input = new InputManager();

  private state: GameWorldState;
  private parallax: ParallaxBackground;
  private gameContainer = new Container();
  private playerGfx = new Graphics();
  private particles: ParticleManager;
  private effectRenderer: EffectRenderer;
  private gfxSync: GraphicsSync;
  private zoneTransition: ZoneTransition;
  private weatherContainer = new Container();
  private weatherGfx: Graphics[] = [];
  private bossGfx = new Graphics();
  private bossHealthGfx = new Graphics();
  private bossAttackGfx: Graphics[] = [];
  private knifeAmmoText: Text;
  private floatingTexts: { text: Text; life: number; maxLife: number }[] = [];

  constructor() {
    this.state = createInitialState();
    this.state = { ...this.state, enemiesEnabled: isEnemiesEnabled() };
    this.particles = new ParticleManager();
    this.effectRenderer = new EffectRenderer();
    this.gfxSync = new GraphicsSync();

    // Parallax background
    this.parallax = new ParallaxBackground();
    this.container.addChild(this.parallax.container);

    // Game container (scrolls with camera)
    this.container.addChild(this.gameContainer);
    this.gameContainer.addChild(this.particles.crumbleContainer);
    this.gameContainer.addChild(this.particles.dustContainer);

    // Effect particle containers
    this.gameContainer.addChild(this.particles.sneezeContainer);
    this.gameContainer.addChild(this.particles.springContainer);
    this.gameContainer.addChild(this.particles.lasagnaContainer);
    this.gameContainer.addChild(this.particles.rocketContainer);
    this.gameContainer.addChild(this.particles.tornadoContainer);
    this.gameContainer.addChild(this.particles.effectParticleContainer);
    this.gameContainer.addChild(this.playerGfx);

    // Weather container (behind game objects)
    this.container.addChild(this.weatherContainer);

    // Effect overlay (on top of game objects, below HUD)
    this.container.addChild(this.effectRenderer.overlay);

    // Boss rendering
    this.bossGfx.visible = false;
    this.gameContainer.addChild(this.bossGfx);
    this.bossHealthGfx.visible = false;
    this.container.addChild(this.bossHealthGfx);

    // Knife ammo display
    this.knifeAmmoText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 12,
        fill: "#cccccc",
        fontWeight: "bold",
      }),
    });
    this.knifeAmmoText.x = 10;
    this.knifeAmmoText.y = GAME_HEIGHT - 20;
    this.knifeAmmoText.visible = false;
    this.container.addChild(this.knifeAmmoText);

    // Zone transition overlay (on top of everything)
    this.zoneTransition = new ZoneTransition();
    this.container.addChild(this.zoneTransition.container);

    // Initial graphics sync
    this.gfxSync.syncAll(
      this.state.platforms,
      this.state.meatballs,
      this.state.powerUps,
      this.gameContainer,
    );

    // Apply initial theme
    const theme = getInterpolatedTheme(0);
    this.parallax.applyTheme(theme, this.state.zoneState.currentZone);
  }

  initInput(canvas: HTMLCanvasElement): void {
    this.input.init(canvas);
  }

  // ── State accessors ────────────────────────────────────────────────────

  isGameOver(): boolean { return this.state.gameOver; }
  getScore(): number { return this.state.scoreState.points; }
  getHeight(): number { return this.state.scoreState.height; }
  getHighScore(): number { return this.state.highScore; }
  getElapsedSeconds(): number { return Math.floor(this.state.elapsedMs / 1000); }
  getActiveEffectName(): string | null { return this.state.activeEffect?.type ?? null; }
  getMeatballsCollected(): number { return this.state.scoreState.meatballsCollected; }
  getPowerUpsCollected(): number { return this.state.scoreState.powerUpsCollected; }
  getBestCombo(): number { return this.state.scoreState.comboMultiplier; }
  getBestStreak(): number { return this.state.scoreState.landingStreak; }
  getPlatformsPassed(): number { return this.state.platformsPassed; }
  isPaused(): boolean { return this.state.paused; }
  getZone(): number { return this.state.zoneState.currentZone; }
  getComboMultiplier(): number { return this.state.scoreState.comboMultiplier; }
  getLandingStreak(): number { return this.state.scoreState.landingStreak; }
  getKnifeAmmo(): number { return this.state.knifeAmmo; }
  getKnifeAmmoMax(): number { return this.state.knifeAmmoMax; }
  isInBossFight(): boolean { return this.state.inBossFight; }
  togglePause(): void { this.state = togglePause(this.state); }
  startCountdown(): void { this.state = startCountdown(this.state); }

  getActiveEffectProgress(): number {
    if (!this.state.activeEffect) return 0;
    return this.state.activeEffect.ticksRemaining / getMaxDuration(this.state.activeEffect.type);
  }
  getCountdownSeconds(): number | undefined {
    if (this.state.countdownTicks < 0) return undefined;
    return Math.ceil(this.state.countdownTicks / 60);
  }
  getZoneProgress(): number {
    const thresholds = [0, 80, 280, 500, 750, 1000, 1300];
    const zone = this.state.zoneState.currentZone;
    if (zone >= thresholds.length - 1) return 1;
    const current = this.state.platformsPassed;
    return Math.min(1, (current - thresholds[zone]) / (thresholds[zone + 1] - thresholds[zone]));
  }
  checkNewHighScore(): boolean {
    if (this.state.highScoreBeatShown) return false;
    return this.state.highScore > 0 && this.state.scoreState.points > this.state.highScore;
  }
  handleThrow(screenX: number, screenY: number): void {
    if (!this.state.enemiesEnabled && !this.state.inBossFight) return;
    this.state = throwProjectile(this.state, screenX, screenY + this.state.camera.y);
  }

  // ── Main update ────────────────────────────────────────────────────────

  update(): void {
    if (this.state.gameOver) return;
    if (this.state.paused) return;

    this.input.update();

    const inputX = this.input.inputX;
    const prevPlatformCount = this.state.platforms.length;
    const prevMeatballCount = this.state.meatballs.length;
    const prevPowerUpCount = this.state.powerUps.length;

    const result = tickGameWorld(this.state, inputX);
    this.state = result.state;

    // Dispatch events to audio/visual side effects
    handleEvents(result.events, {
      state: this.state,
      particles: this.particles,
      effectRenderer: this.effectRenderer,
      zoneTransition: this.zoneTransition,
      gfxSync: this.gfxSync,
      container: this.container,
      gameContainer: this.gameContainer,
      spawnFloatingText: this.spawnFloatingText.bind(this),
    });

    // Sync graphics if entity counts changed
    if (
      this.state.platforms.length !== prevPlatformCount ||
      this.state.meatballs.length !== prevMeatballCount ||
      this.state.powerUps.length !== prevPowerUpCount
    ) {
      this.gfxSync.syncAll(
        this.state.platforms,
        this.state.meatballs,
        this.state.powerUps,
        this.gameContainer,
        this.state.enemies,
        this.state.projectiles,
      );
      this.gfxSync.cleanup(
        this.state.platforms,
        this.state.meatballs,
        this.state.powerUps,
        this.state.enemies,
        this.state.projectiles,
      );
    }

    // Screen shake
    if (this.state.shakeState) {
      const shakeResult = tickShake(this.state.shakeState);
      this.gameContainer.x = shakeResult.offsetX;
      this.gameContainer.y = shakeResult.offsetY;
    } else {
      this.gameContainer.x = 0;
      this.gameContainer.y = 0;
    }

    // Death animation rendering
    if (this.state.isDying) {
      const t = this.state.dyingTicks / DEATH_ANIMATION_TICKS;
      this.playerGfx.rotation += 0.15;
      this.playerGfx.scale.set(1 - t * 0.8);
      this.playerGfx.y = worldToScreen(
        this.state.player.y,
        this.state.camera.y,
      );
      this.updateFloatingTexts();
      this.particles.updateCrumbleParticles();
      return;
    }

    // Render
    const theme = getInterpolatedTheme(this.state.platformsPassed);
    this.parallax.applyTheme(theme, this.state.zoneState.currentZone);
    this.parallax.update(this.state.camera.y);

    const camY = this.state.camera.y;

    // Player + effects
    this.effectRenderer.renderPlayer(
      this.state,
      this.playerGfx,
      camY,
      this.particles,
      inputX,
    );

    // Entities
    renderPlatforms(this.state, this.gfxSync, theme, camY);
    renderMeatballs(this.state, this.gfxSync, camY);
    renderPowerUps(this.state, this.gfxSync, camY);
    if (this.state.enemiesEnabled) {
      renderEnemies(this.state, this.gfxSync, camY);
      renderProjectiles(this.state, this.gfxSync, camY);
    }

    // Particles and floating text
    this.particles.updateDustParticles();
    this.particles.updateCrumbleParticles();
    this.updateFloatingTexts();

    // Boss rendering
    this.bossAttackGfx = renderBoss(
      this.state,
      this.bossGfx,
      this.bossHealthGfx,
      this.bossAttackGfx,
      this.gameContainer,
      camY,
    );

    // Knife ammo display
    if (this.state.enemiesEnabled || this.state.inBossFight) {
      this.knifeAmmoText.text = "\u{1F52A}".repeat(this.state.knifeAmmo);
      this.knifeAmmoText.visible = true;
    } else {
      this.knifeAmmoText.visible = false;
    }

    // Weather particles
    this.weatherGfx = renderWeather(
      this.state,
      this.weatherGfx,
      this.weatherContainer,
    );

    // Zone transition
    this.zoneTransition.update();

    // Effect overlays
    this.effectRenderer.renderEffectOverlay(this.state);
  }

  // ── Floating text ──────────────────────────────────────────────────────

  private spawnFloatingText(
    msg: string,
    color: number,
    size = 14,
    duration = 40,
    centered = false,
  ): void {
    const text = new Text({
      text: msg,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: size,
        fill: "#" + color.toString(16).padStart(6, "0"),
        fontWeight: "bold",
        stroke: { color: "#000000", width: Math.max(2, size / 6) },
      }),
    });
    if (centered) {
      text.x = GAME_WIDTH / 2;
      text.y = GAME_HEIGHT * 0.35;
    } else {
      text.x = this.state.player.x + this.state.player.width / 2;
      text.y = worldToScreen(
        this.state.player.y - 20,
        this.state.camera.y,
      );
    }
    text.anchor.set(0.5, 0.5);
    this.container.addChild(text);
    this.floatingTexts.push({ text, life: duration, maxLife: duration });
  }

  private updateFloatingTexts(): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.text.y -= 1;
      ft.life--;
      ft.text.alpha = Math.max(0, ft.life / ft.maxLife);
      if (ft.life <= 0) {
        this.container.removeChild(ft.text);
        ft.text.destroy();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────

  destroy(): void {
    this.input.destroy();
    this.effectRenderer.destroy(this.container);
    this.particles.destroy();
    this.gfxSync.destroy();
    this.parallax.destroy();
    this.zoneTransition.destroy();
    for (const gfx of this.weatherGfx) {
      this.weatherContainer.removeChild(gfx);
      gfx.destroy();
    }
    this.weatherGfx = [];
    for (const ft of this.floatingTexts) {
      this.container.removeChild(ft.text);
      ft.text.destroy();
    }
    this.floatingTexts = [];
    this.container.destroy({ children: true });
  }
}

