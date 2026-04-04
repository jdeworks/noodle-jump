/** Gameplay scene — thin orchestrator wiring pure logic to PixiJS rendering. */
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { worldToScreen } from "../systems/Camera";
import { getInterpolatedTheme } from "../systems/Zone";
import { ParallaxBackground } from "../systems/Parallax";
import { InputManager } from "../systems/Input";
import { tickShake } from "../systems/ScreenShake";
import { GAME_WIDTH, GAME_HEIGHT, DEATH_ANIMATION_TICKS } from "../config/constants";
import { createInitialState, type GameWorldState } from "./GameState";
import type { RunConfig } from "../systems/CustomRunConfig";
import {
  tickGameWorld,
  startCountdown,
  togglePause,
  throwProjectile,
} from "./GameLoop";
import { spawnPendingBoss } from "./GameLoopBoss";
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
import { renderBoss, renderBossArc, renderWeather, renderWindOverlay } from "./GameSceneRender";
import { getMaxDuration } from "./effectDuration";
import { TrailRenderer } from "../rendering/TrailRenderer";
import { loadCosmetics, TINT_COLORS } from "../systems/Cosmetics";
import { getSelectedCharacter } from "../systems/CharacterSettings";
import { getProjectileVisual, projectileSpins } from "../rendering/sprites";
import { FloatingTextManager } from "./FloatingText";
import { clearCharCache } from "./EffectPlayerRender";
import { renderTentacles, renderKnifeAmmo, renderDebugHitboxes } from "./BossArenaRenderer";

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
  _lastPerfTime = 0;

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
    const result = tickGameWorld(this.state, externalInputX ?? this.input.inputX);
    this.state = result.state;

    // Dispatch events to audio/visual side effects
    handleEvents(result.events, this.eventDeps());

    if (this.state.animTick % 60 === 0) {
      const now = performance.now(); const fps = this._lastPerfTime ? Math.round(60000 / (now - this._lastPerfTime)) : 0; this._lastPerfTime = now;
      console.log(`[perf] fps=${fps} p=${this.state.platforms.length} gc=${this.gameContainer.children.length} dust=${this.particles.dustContainer.children.length} crumble=${this.particles.crumbleContainer.children.length} eff=${this.particles.effectParticleContainer.children.length}`);
    }
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

    // Death animation
    if (this.state.isDying) {
      const t = this.state.dyingTicks / DEATH_ANIMATION_TICKS;
      this.playerGfx.rotation += 0.1 + t * 0.3;
      this.playerGfx.scale.x = (1 - t * 0.6) * (1 + Math.sin(t * 20) * 0.15);
      this.playerGfx.scale.y = 1 - t * 0.8;
      this.playerGfx.alpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      this.playerGfx.y = worldToScreen(this.state.player.y, this.state.camera.y);
      this.floatingTextMgr.update();
      this.particles.updateCrumbleParticles();
      return;
    }

    const theme = getInterpolatedTheme(this.state.platformsPassed);
    if (this.cosmeticTheme !== "theme_default") {
      const overrides: Record<string, number> = {
        theme_neon: 0x080818, theme_pixel: 0x222222,
        theme_candy: 0xffeef4, theme_dark: 0x0a0a14,
      };
      theme.background = overrides[this.cosmeticTheme] ?? theme.background;
    }
    this.parallax.applyTheme(theme, this.state.zoneState.currentZone);
    this.parallax.update(this.state.camera.y);
    const camY = this.state.camera.y;

    this.effectRenderer.renderPlayer(this.state, this.playerGfx, camY, this.particles, this.input.inputX, this.cosmeticTint);
    renderPlatforms(this.state, this.gfxSync, theme, camY, this.cosmeticTheme);
    renderMeatballs(this.state, this.gfxSync, camY);
    renderPowerUps(this.state, this.gfxSync, camY);
    if (this.state.enemiesEnabled) renderEnemies(this.state, this.gfxSync, camY);
    if (this.state.enemiesEnabled || this.state.inBossFight) {
      const charVisual = getProjectileVisual(getSelectedCharacter());
      renderProjectiles(this.state, this.gfxSync, camY, projectileSpins(charVisual));
    }
    renderDebugHitboxes(this.hitboxGfx, this.state, camY);

    // Particles and floating text
    this.particles.updateDustParticles();
    this.particles.updateCrumbleParticles();
    this.floatingTextMgr.update();

    // Boss + tentacles + ammo
    this.bossAttackGfx = renderBoss(this.state, this.bossGfx, this.bossHealthGfx, this.bossAttackGfx, this.gameContainer, camY, this.cosmeticTheme);
    renderBossArc(this.bossArcGfx, this.state, camY);
    renderTentacles(this.tentacleGfx, this.state, camY);
    renderKnifeAmmo(this.knifeAmmoIcons, this.knifeAmmoText, this.state, GAME_WIDTH);

    this.weatherGfx = renderWeather(this.state, this.weatherGfx, this.weatherContainer);
    if (this.state.inBossFight) { this.windGfx.clear(); this.windGfx.visible = false; }
    else renderWindOverlay(this.windGfx, this.state, camY);
    const speedEffect = this.state.activeEffect?.type;
    if (speedEffect === "ravioli_rocket") {
      this.trail.setTrailType("speed_rocket");
    } else if (speedEffect === "fusilli_tornado") {
      this.trail.setTrailType("speed_tornado");
    } else if (speedEffect === "pepper_sneeze") {
      this.trail.setTrailType("speed_sneeze");
    } else {
      this.trail.setTrailType(this.cosmeticTrail);
    }
    this.trail.addPoint(
      this.state.player.x + this.state.player.width / 2,
      this.state.player.y + this.state.player.height + 6,
    );
    this.trail.update(camY);
    this.tickBossTransition();
    this.effectRenderer.renderEffectOverlay(this.state);

    // Combo border glow
    this.comboGlowGfx.clear();
    const combo = this.state.scoreState.comboMultiplier;
    if (combo >= 2) {
      const a = Math.min(combo / 5, 1) * (0.3 + Math.sin(this.state.animTick * 0.1) * 0.2);
      const gw = 4 + combo;
      this.comboGlowGfx.rect(0, 0, GAME_WIDTH, gw); this.comboGlowGfx.rect(0, GAME_HEIGHT - gw, GAME_WIDTH, gw);
      this.comboGlowGfx.rect(0, 0, gw, GAME_HEIGHT); this.comboGlowGfx.rect(GAME_WIDTH - gw, 0, gw, GAME_HEIGHT);
      this.comboGlowGfx.fill({ color: 0xff8800, alpha: a });
    }
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

