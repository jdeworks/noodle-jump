/** Gameplay scene — thin orchestrator wiring pure logic to PixiJS rendering. */
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { getInterpolatedTheme } from "../systems/Zone";
import { ParallaxBackground } from "../systems/Parallax";
import { InputManager } from "../systems/Input";
import { tickShake } from "../systems/ScreenShake";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { createInitialState, type GameWorldState } from "./GameState";
import type { RunConfig } from "../systems/CustomRunConfig";
import { tickGameWorld, startCountdown, togglePause, throwProjectile } from "./GameLoop";
import { spawnPendingBoss } from "./GameLoopBoss";
import { isEnemiesEnabled } from "../systems/EnemySettings";
import { ZoneTransition } from "./ZoneTransition";
import { ParticleManager } from "./ParticleManager";
import { EffectRenderer } from "./EffectRenderer";
import { GraphicsSync } from "./GraphicsSync";
import { handleEvents } from "./GameSceneEvents";
import { getMaxDuration } from "./effectDuration";
import { TrailRenderer } from "../rendering/TrailRenderer";
import { loadCosmetics, TINT_COLORS } from "../systems/Cosmetics";
import { getSelectedCharacter } from "../systems/CharacterSettings";
import { FloatingTextManager } from "./FloatingText";
import { clearCharCache } from "./EffectPlayerRender";
import { renderDeathAnimation, renderGameWorld, type RenderContext } from "./GameSceneUpdate";

export class GameScene {
  readonly container = new Container();
  readonly input = new InputManager();
  private destroyed = false;

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
  private windGfx = new Graphics();
  private bossGfx = new Graphics();
  private bossArcGfx = new Graphics();
  private bossHealthGfx = new Graphics();
  private bossAttackGfx: Graphics[] = [];
  private knifeAmmoText: Text;
  private knifeAmmoIcons = new Container();
  private trail: TrailRenderer;
  private cosmeticTrail: string | null;
  private cosmeticTint: number;
  private cosmeticTheme: string;
  private comboGlowGfx = new Graphics();
  private hitboxGfx = new Graphics();
  private tentacleGfx = new Graphics();
  private floatingTextMgr = new FloatingTextManager();
  /** Game speed accumulator — fractional ticks carried between frames. */
  private speedAccumulator = 0;

  constructor(runConfig?: RunConfig) {
    clearCharCache();
    this.state = createInitialState(runConfig);
    // For custom runs, use the config's enemiesEnabled; for normal play, use global setting
    this.state = { ...this.state, enemiesEnabled: runConfig ? runConfig.enemiesEnabled : isEnemiesEnabled() };
    this.particles = new ParticleManager();
    this.effectRenderer = new EffectRenderer();
    this.gfxSync = new GraphicsSync();
    this.trail = new TrailRenderer();
    const cosmetics = loadCosmetics();
    this.cosmeticTrail = getSelectedCharacter() === "nyan_cat" ? "trail_rainbow" : cosmetics.equipped.trail;
    this.trail.setTrailType(this.cosmeticTrail);
    this.cosmeticTint = TINT_COLORS[cosmetics.equipped.tint ?? "tint_none"] ?? 0xffffff;
    this.cosmeticTheme = cosmetics.equipped.theme ?? "theme_default";
    this.gfxSync.setTheme(this.cosmeticTheme);

    this.parallax = new ParallaxBackground();
    this.parallax.setCosmeticTheme(this.cosmeticTheme);
    this.container.addChild(this.parallax.container);
    this.container.addChild(this.gameContainer);
    // Neon glow is handled by multi-layer alpha in ThemeSprites — no BlurFilter
    // needed (BlurFilter on full scene kills FPS on mobile)
    this.gameContainer.addChild(this.particles.crumbleContainer);
    this.gameContainer.addChild(this.particles.dustContainer);
    this.gameContainer.addChild(this.particles.sneezeContainer);
    this.gameContainer.addChild(this.particles.springContainer);
    this.gameContainer.addChild(this.particles.lasagnaContainer);
    this.gameContainer.addChild(this.particles.rocketContainer);
    this.gameContainer.addChild(this.particles.tornadoContainer); this.gameContainer.addChild(this.particles.effectParticleContainer);
    this.gameContainer.addChild(this.trail.container);
    this.gameContainer.addChild(this.playerGfx);

    // Weather container (behind game objects)
    this.container.addChild(this.weatherContainer);

    // Effect overlay (on top of game objects, below HUD)
    this.container.addChild(this.effectRenderer.overlay);

    // Wind overlay — on top of effects so arrows are clearly visible
    this.windGfx.visible = false;
    this.container.addChild(this.windGfx);

    // Boss rendering
    this.bossGfx.visible = false;
    this.bossArcGfx.visible = false;
    this.gameContainer.addChild(this.bossArcGfx);
    this.gameContainer.addChild(this.bossGfx);
    this.bossHealthGfx.visible = false;
    this.container.addChild(this.bossHealthGfx);
    // Tentacle overlay renders above everything in the main container (not gameContainer)
    this.container.addChild(this.tentacleGfx);

    // Knife ammo display (text label + small knife icons)
    this.knifeAmmoText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 11,
        fill: "#ffffff",
        stroke: { color: "#000000", width: 2 },
        fontWeight: "bold",
      }),
    });
    this.knifeAmmoText.x = GAME_WIDTH - 10;
    this.knifeAmmoText.y = GAME_HEIGHT - 18;
    this.knifeAmmoText.anchor.set(1, 0);
    this.knifeAmmoText.visible = false;
    this.container.addChild(this.knifeAmmoText);
    this.knifeAmmoIcons.y = GAME_HEIGHT - 35;
    this.knifeAmmoIcons.visible = false;
    this.container.addChild(this.knifeAmmoIcons);

    // Debug hitbox overlay
    this.container.addChild(this.hitboxGfx);

    // Combo border glow (on top of effects, below zone transition)
    this.container.addChild(this.comboGlowGfx);

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

    this.parallax.applyTheme(getInterpolatedTheme(0), this.state.zoneState.currentZone);
  }
  initInput(canvas: HTMLCanvasElement): void { this.input.init(canvas); }
  getState(): GameWorldState { return this.state; }
  isGameOver(): boolean { return this.state.gameOver; }
  getScore(): number { return this.state.scoreState.points; }
  getHeight(): number { return this.state.scoreState.height; }
  getMaxHeight(): number { return this.state.scoreState.highestHeight; }
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
  isCustomRun(): boolean { return this.state.runConfig.seed !== 0 || this.state.practiceMode; }
  getEnemiesKilled(): number { return this.state.enemiesKilled; }
  getBossesDefeated(): number { return this.state.bossesDefeated; }
  getBossStomps(): number { return this.state.bossStomps; }
  togglePause(): void { this.state = togglePause(this.state); }
  startCountdown(): void { this.state = startCountdown(this.state); }
  enableGhostMode(): void { this.state = { ...this.state, isGhost: true }; }
  enableTimedRespawn(): void { this.state = { ...this.state, practiceMode: true, deathPenaltyEnabled: true }; }
  forceStop(): void { this.state = { ...this.state, gameOver: true, isDying: false }; }

  getActiveEffectProgress(): number {
    return this.state.activeEffect ? this.state.activeEffect.ticksRemaining / getMaxDuration(this.state.activeEffect.type) : 0;
  }
  getCountdownSeconds(): number | undefined {
    return this.state.countdownTicks < 0 ? undefined : Math.ceil(this.state.countdownTicks / 60);
  }
  getZoneProgress(): number {
    const th = [0, 80, 280, 500, 750, 1000, 1300], z = this.state.zoneState.currentZone;
    return z >= th.length - 1 ? 1 : Math.min(1, (this.state.platformsPassed - th[z]) / (th[z + 1] - th[z]));
  }
  checkNewHighScore(): boolean {
    return !this.state.highScoreBeatShown && this.state.highScore > 0 && this.state.scoreState.points > this.state.highScore;
  }
  handleThrow(screenX: number, screenY: number): void {
    if (!this.state.enemiesEnabled && !this.state.inBossFight) return;
    if (this.state.countdownTicks > 0) return; // don't throw during countdown
    this.state = throwProjectile(this.state, screenX, screenY + this.state.camera.y);
  }

  /** Auto-aim throw — targets nearest boss or enemy. For local co-op. */
  autoAimThrow(): void {
    if (!this.state.enemiesEnabled && !this.state.inBossFight) return;
    const px = this.state.player.x + this.state.player.width / 2;
    const py = this.state.player.y + this.state.player.height / 2;
    let tx = px, ty = py - 200;
    const b = this.state.activeBoss;
    if (b) { tx = b.x + b.width / 2; ty = b.y + b.height / 2; }
    else if (this.state.enemies.length > 0) {
      let best = Infinity;
      for (const e of this.state.enemies) { const d = (e.x-px)**2+(e.y-py)**2; if (d<best) { best=d; tx=e.x; ty=e.y; } }
    }
    this.state = throwProjectile(this.state, tx, ty);
  }

  // ── Main update ────────────────────────────────────────────────────────

  /** Update game. Pass inputX to override keyboard (for multiplayer). */
  updateWithInput(inputX: number): void { this.update(inputX); }

  update(externalInputX?: number): void {
    if (this.destroyed || this.state.gameOver || this.state.paused) return;
    if (externalInputX === undefined) this.input.update();

    // Game speed: accumulate fractional ticks, run multiple or skip ticks
    const speed = this.state.debugConfig.gameSpeed;
    this.speedAccumulator += speed;
    const ticksThisFrame = Math.floor(this.speedAccumulator);
    this.speedAccumulator -= ticksThisFrame;

    const inputX = externalInputX ?? this.input.inputX;
    for (let t = 0; t < ticksThisFrame; t++) {
      const result = tickGameWorld(this.state, inputX);
      this.state = result.state;
      handleEvents(result.events, this.eventDeps());
      if (this.state.gameOver) break;
    }
    if (ticksThisFrame === 0) return; // skip rendering when accumulator hasn't reached 1

    this.gfxSync.syncAll(
      this.state.platforms,
      this.state.meatballs,
      this.state.powerUps,
      this.gameContainer,
      this.state.enemies,
      this.state.projectiles,
      getSelectedCharacter(),
    );
    this.gfxSync.cleanup(
      this.state.platforms,
      this.state.meatballs,
      this.state.powerUps,
      this.state.enemies,
      this.state.projectiles,
    );

    // Screen shake
    if (!this.gameContainer.parent) return;
    if (this.state.shakeState) {
      const sr = tickShake(this.state.shakeState);
      this.gameContainer.x = sr.offsetX; this.gameContainer.y = sr.offsetY;
    } else { this.gameContainer.x = 0; this.gameContainer.y = 0; }

    const ctx = this.buildRenderContext();
    if (renderDeathAnimation(ctx)) return;
    this.weatherGfx = renderGameWorld(ctx);
    this.bossAttackGfx = ctx.bossAttackGfx;
    this.tickBossTransition();
  }

  private buildRenderContext(): RenderContext {
    return {
      state: this.state, parallax: this.parallax, particles: this.particles,
      effectRenderer: this.effectRenderer, gfxSync: this.gfxSync, trail: this.trail,
      floatingTextMgr: this.floatingTextMgr, gameContainer: this.gameContainer,
      playerGfx: this.playerGfx, weatherContainer: this.weatherContainer,
      weatherGfx: this.weatherGfx, windGfx: this.windGfx, bossGfx: this.bossGfx,
      bossArcGfx: this.bossArcGfx, bossHealthGfx: this.bossHealthGfx,
      bossAttackGfx: this.bossAttackGfx, knifeAmmoText: this.knifeAmmoText,
      knifeAmmoIcons: this.knifeAmmoIcons, hitboxGfx: this.hitboxGfx,
      tentacleGfx: this.tentacleGfx, comboGlowGfx: this.comboGlowGfx,
      cosmeticTrail: this.cosmeticTrail, cosmeticTint: this.cosmeticTint,
      cosmeticTheme: this.cosmeticTheme, inputX: this.input.inputX,
    };
  }

  private eventDeps(): import("./GameSceneEvents").EventHandlerDeps {
    return {
      state: this.state, particles: this.particles,
      effectRenderer: this.effectRenderer, zoneTransition: this.zoneTransition,
      gfxSync: this.gfxSync, container: this.container, gameContainer: this.gameContainer,
      spawnFloatingText: (msg, color, size?, duration?, centered?) => {
        this.floatingTextMgr.spawn(this.container, msg, color,
          this.state.player.x, this.state.player.y, this.state.player.width,
          this.state.camera.y, size, duration, centered);
      },
    };
  }

  private tickBossTransition(): void {
    const wasActive = this.zoneTransition.isActive();
    if (!wasActive && this.state.pendingBossZone !== null) {
      this.zoneTransition.playBoss();
    }
    this.zoneTransition.update();
    if (wasActive && !this.zoneTransition.isActive() && this.state.pendingBossZone !== null) {
      const ev: import("./GameLoopTypes").GameEvent[] = [];
      this.state = spawnPendingBoss(this.state, ev);
      handleEvents(ev, this.eventDeps());
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.input.destroy();
    this.effectRenderer.destroy(this.container);
    this.particles.destroy();
    this.gfxSync.destroy();
    this.trail.destroy();
    this.parallax.destroy();
    this.zoneTransition.destroy();
    for (const gfx of this.weatherGfx) {
      this.weatherContainer.removeChild(gfx);
      gfx.destroy();
    }
    this.weatherGfx = [];
    this.floatingTextMgr.destroy();
    this.container.destroy({ children: true });
  }
}

