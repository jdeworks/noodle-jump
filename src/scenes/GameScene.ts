/** Gameplay scene — thin orchestrator wiring pure logic to PixiJS rendering. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { worldToScreen } from "../systems/Camera";
import {
  playSfxMeatball,
  playSfxDeath,
  playSfxPlatformCrumble,
  playSfxCloseCall,
  playSfxLandingStreak,
  playSfxPowerUp,
  playSfxLanding,
  playSfxComboEscalation,
  playSfxEnemyKill,
  playSfxShieldAbsorb,
  playSfxThrow,
  playSfxWindGust,
  crossfadeToZone,
  playBossMusic,
  stopBossMusic,
} from "../systems/Audio";
import { setAmbientZone } from "../systems/AmbientAudio";
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
  type GameEvent,
} from "./GameLoop";
import { isEnemiesEnabled } from "../systems/EnemySettings";
import {
  vibrateImpact,
  vibratePowerUp,
  vibrateNegative,
  vibrateDeath,
  vibrateMeatball,
  vibrateEnemyKill,
} from "../systems/Haptics";
import { markPowerUpCollected } from "../ui/PowerUpDescriptions";
import { ZoneTransition } from "./ZoneTransition";
import { drawBoss, drawBossHealthBar } from "../rendering/sprites";
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

  isGameOver(): boolean {
    return this.state.gameOver;
  }
  getScore(): number {
    return this.state.scoreState.points;
  }
  getHeight(): number {
    return this.state.scoreState.height;
  }
  getHighScore(): number {
    return this.state.highScore;
  }
  getElapsedSeconds(): number {
    return Math.floor(this.state.elapsedMs / 1000);
  }
  getActiveEffectProgress(): number {
    if (!this.state.activeEffect) return 0;
    const maxDuration = getMaxDuration(this.state.activeEffect.type);
    return this.state.activeEffect.ticksRemaining / maxDuration;
  }
  getActiveEffectName(): string | null {
    return this.state.activeEffect?.type ?? null;
  }
  getMeatballsCollected(): number {
    return this.state.scoreState.meatballsCollected;
  }
  getPowerUpsCollected(): number {
    return this.state.scoreState.powerUpsCollected;
  }
  getBestCombo(): number {
    return this.state.scoreState.comboMultiplier;
  }
  getBestStreak(): number {
    return this.state.scoreState.landingStreak;
  }
  getPlatformsPassed(): number {
    return this.state.platformsPassed;
  }
  isPaused(): boolean {
    return this.state.paused;
  }
  getCountdownSeconds(): number | undefined {
    if (this.state.countdownTicks < 0) return undefined;
    return Math.ceil(this.state.countdownTicks / 60);
  }
  getZone(): number {
    return this.state.zoneState.currentZone;
  }
  getZoneProgress(): number {
    const thresholds = [0, 80, 280, 500, 750, 1000, 1300];
    const zone = this.state.zoneState.currentZone;
    if (zone >= thresholds.length - 1) return 1;
    const current = this.state.platformsPassed;
    const start = thresholds[zone];
    const end = thresholds[zone + 1];
    return Math.min(1, (current - start) / (end - start));
  }
  getComboMultiplier(): number {
    return this.state.scoreState.comboMultiplier;
  }
  getLandingStreak(): number {
    return this.state.scoreState.landingStreak;
  }

  /** Returns true exactly once — when the player first beats the high score. */
  checkNewHighScore(): boolean {
    // Handled via events now, but keep for main.ts compatibility
    if (this.state.highScoreBeatShown) return false;
    if (
      this.state.highScore > 0 &&
      this.state.scoreState.points > this.state.highScore
    ) {
      return true; // The event will set highScoreBeatShown
    }
    return false;
  }

  togglePause(): void {
    this.state = togglePause(this.state);
  }

  startCountdown(): void {
    this.state = startCountdown(this.state);
  }

  /** Get current knife ammo (for HUD). */
  getKnifeAmmo(): number {
    return this.state.knifeAmmo;
  }
  getKnifeAmmoMax(): number {
    return this.state.knifeAmmoMax;
  }
  isInBossFight(): boolean {
    return this.state.inBossFight;
  }

  /** Throw a projectile toward a world position (from click/tap). */
  handleThrow(screenX: number, screenY: number): void {
    if (!this.state.enemiesEnabled && !this.state.inBossFight) return;
    // Convert screen coords to world coords
    const worldX = screenX;
    const worldY = screenY + this.state.camera.y;
    this.state = throwProjectile(this.state, worldX, worldY);
  }

  // ── Main update ────────────────────────────────────────────────────────

  update(): void {
    if (this.state.gameOver) return;
    if (this.state.paused) return;

    // Update input
    this.input.update();

    const inputX = this.input.inputX;
    const prevPlatformCount = this.state.platforms.length;
    const prevMeatballCount = this.state.meatballs.length;
    const prevPowerUpCount = this.state.powerUps.length;

    // Tick pure game logic
    const result = tickGameWorld(this.state, inputX);
    this.state = result.state;

    // Dispatch events to audio/visual side effects
    this.handleEvents(result.events);

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
    this.renderBoss(camY);

    // Knife ammo display
    if (this.state.enemiesEnabled || this.state.inBossFight) {
      this.knifeAmmoText.text = "\u{1F52A}".repeat(this.state.knifeAmmo);
      this.knifeAmmoText.visible = true;
    } else {
      this.knifeAmmoText.visible = false;
    }

    // Weather particles
    this.renderWeather();

    // Zone transition
    this.zoneTransition.update();

    // Effect overlays
    this.effectRenderer.renderEffectOverlay(this.state);
  }

  // ── Event handling ─────────────────────────────────────────────────────

  private handleEvents(events: GameEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case "landed":
          playSfxLanding();
          vibrateImpact();
          this.particles.spawnDustPuff(
            event.x,
            event.y,
            this.state.camera.y,
          );
          if (event.edgeLanding) {
            playSfxCloseCall();
            this.spawnFloatingText("CLOSE CALL!", 0xffdd44);
          }
          break;

        case "landingStreak":
          playSfxLandingStreak();
          break;

        case "meatballCollected":
          playSfxMeatball();
          vibrateMeatball();
          break;

        case "comboActive":
          playSfxComboEscalation(event.multiplier);
          this.spawnFloatingText(
            `${event.multiplier}x COMBO!`,
            0xff8800,
          );
          break;

        case "powerUpCollected":
          playSfxPowerUp(event.powerUpType);
          markPowerUpCollected(event.powerUpType);
          if (event.isNegative) vibrateNegative();
          else vibratePowerUp();
          this.effectRenderer.showEffectLabel(
            event.powerUpType,
            this.container,
          );
          break;

        case "effectEnded":
          this.effectRenderer.clearEffectLabel(this.container);
          break;

        case "died":
          playSfxDeath();
          vibrateDeath();
          break;

        case "zoneChanged":
          crossfadeToZone(event.to);
          setAmbientZone(event.to);
          this.zoneTransition.play(event.to);
          break;

        case "enemyKilled":
          playSfxEnemyKill();
          vibrateEnemyKill();
          this.spawnFloatingText("+MEATBALL!", 0xff8800);
          break;

        case "enemyHitPlayer":
          playSfxShieldAbsorb();
          break;

        case "projectileThrown":
          playSfxThrow();
          break;

        case "windGust":
          playSfxWindGust();
          this.spawnFloatingText(
            event.direction > 0 ? "WIND >>>" : "<<< WIND",
            0xaaddff,
            16,
            60,
            true,
          );
          break;

        case "bossSpawned":
          playBossMusic();
          this.spawnFloatingText("BOSS!", 0xff4444, 32, 90, true);
          break;

        case "bossDamaged":
          this.spawnFloatingText("HIT!", 0xffdd44);
          break;

        case "bossKilled":
          stopBossMusic();
          this.spawnFloatingText("BOSS DEFEATED!", 0x44ff44, 24, 120, true);
          break;

        case "bossAttack":
        case "tentacleGrab":
          break;

        case "springBounce":
        case "teleported":
          break;

        case "platformCrumbled":
          playSfxPlatformCrumble();
          this.particles.spawnCrumbleParticles(
            event.platform,
            this.state.camera.y,
          );
          break;

        case "stagnantWarning":
          if (event.level === 1) {
            this.spawnFloatingText(
              "KEEP CLIMBING!",
              0xff4444,
              28,
              120,
              true,
            );
          }
          break;

        case "highScoreBeat":
          // Handled by main.ts via checkNewHighScore()
          break;

        case "lasagnaSpawned":
          this.gfxSync.syncPlatforms(
            this.state.platforms,
            this.gameContainer,
          );
          break;

        case "gameOver":
          break;
      }
    }
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

  // ── Boss rendering ──────────────────────────────────────────────────────

  private renderBoss(camY: number): void {
    const boss = this.state.activeBoss;
    if (!boss || !boss.alive) {
      this.bossGfx.visible = false;
      this.bossHealthGfx.visible = false;
      // Clean boss attack gfx
      for (const g of this.bossAttackGfx) {
        this.gameContainer.removeChild(g);
        g.destroy();
      }
      this.bossAttackGfx = [];
      return;
    }

    // Draw boss
    drawBoss(
      this.bossGfx,
      boss.width,
      boss.height,
      boss.type,
      boss.phase,
      this.state.animTick,
    );
    this.bossGfx.x = boss.x;
    this.bossGfx.y = worldToScreen(boss.y, camY);
    this.bossGfx.visible = true;

    // Health bar at top of screen
    drawBossHealthBar(
      this.bossHealthGfx,
      GAME_WIDTH * 0.15,
      45,
      GAME_WIDTH * 0.7,
      boss.health,
      boss.maxHealth,
    );
    this.bossHealthGfx.visible = true;

    // Boss attack projectiles
    // Remove excess
    while (this.bossAttackGfx.length > this.state.bossAttacks.length) {
      const g = this.bossAttackGfx.pop()!;
      this.gameContainer.removeChild(g);
      g.destroy();
    }
    // Add new
    while (this.bossAttackGfx.length < this.state.bossAttacks.length) {
      const g = new Graphics();
      g.circle(0, 0, 4);
      g.fill(0xff4444);
      this.gameContainer.addChild(g);
      this.bossAttackGfx.push(g);
    }
    // Update positions
    for (let i = 0; i < this.state.bossAttacks.length; i++) {
      const atk = this.state.bossAttacks[i];
      const g = this.bossAttackGfx[i];
      g.x = atk.x;
      g.y = worldToScreen(atk.y, camY);
      g.visible = atk.alive;
    }
  }

  // ── Weather rendering ───────────────────────────────────────────────────

  private renderWeather(): void {
    const { particles } = this.state.weather;

    // Remove excess
    while (this.weatherGfx.length > particles.length) {
      const gfx = this.weatherGfx.pop()!;
      this.weatherContainer.removeChild(gfx);
      gfx.destroy();
    }

    // Add new
    while (this.weatherGfx.length < particles.length) {
      const gfx = new Graphics();
      this.weatherContainer.addChild(gfx);
      this.weatherGfx.push(gfx);
    }

    // Update
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const gfx = this.weatherGfx[i];
      gfx.clear();
      gfx.circle(0, 0, p.size);
      gfx.fill({ color: 0xffffff, alpha: p.alpha });
      gfx.x = p.x;
      gfx.y = p.y;
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

function getMaxDuration(type: string): number {
  switch (type) {
    case "fusilli_tornado":
      return 300;
    case "ravioli_rocket":
      return 180;
    case "lasagna_layers":
      return 360;
    case "pepper_sneeze":
      return 30;
    case "meatball_magnet":
      return 300;
    case "pasta_shield":
      return 600;
    case "rigatoni_drill":
      return 180;
    case "penne_cannon":
      return 360;
    case "gnocchi_bounce":
      return 360;
    case "minestrone_soup":
      return 480;
    case "chili_pepper":
    case "soggy_noodle":
    case "garlic_breath":
    case "burnt_toast":
      return 300;
    default:
      return 1;
  }
}
