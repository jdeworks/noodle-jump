/** Gameplay scene — wires pure logic to PixiJS rendering. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import {
  createPlayer,
  updatePlayer,
  type PlayerState,
} from "../entities/Player";
import {
  createGroundPlatform,
  createPlatform,
  generatePlatforms,
  updatePlatforms,
  pruneBelow,
  type PlatformState,
} from "../entities/Platform";
import {
  spawnMeatballs,
  collectMeatballs,
  pruneMeatballs,
  updateMeatballPositions,
  attractMeatballs,
  type CollectibleState,
} from "../entities/Collectible";
import {
  spawnPowerUps,
  collectPowerUps,
  applyPowerUp,
  tickEffect,
  updatePowerUpPositions,
  prunePowerUps,
  isNegativePowerUp,
  type PowerUpState,
  type ActiveEffect,
} from "../entities/PowerUp";
import { checkPlatformCollisions } from "../systems/Physics";
import {
  createCamera,
  updateCamera,
  isPlayerDead,
  worldToScreen,
  type CameraState,
} from "../systems/Camera";
import {
  createScoreState,
  updateHeightScore,
  addMeatballScore,
  addPowerUpScore,
  addCloseCallBonus,
  addLandingStreak,
  tickCombo,
  loadHighScore,
  saveHighScore,
  type ScoreState,
} from "../systems/Score";
import { getDifficulty } from "../systems/Difficulty";
import {
  createShake,
  tickShake,
  type ShakeState,
} from "../systems/ScreenShake";
import {
  playSfxJump,
  playSfxMeatball,
  playSfxCombo,
  playSfxPositivePowerUp,
  playSfxNegativePowerUp,
  playSfxDeath,
  playSfxPlatformCrumble,
  playSfxCloseCall,
  playSfxLandingStreak,
  crossfadeToZone,
} from "../systems/Audio";
import {
  createZoneState,
  updateZone,
  getInterpolatedTheme,
  type ZoneState,
} from "../systems/Zone";
import { ParallaxBackground } from "../systems/Parallax";
import { InputManager } from "../systems/Input";
import {
  drawChef,
  drawChefOnRocket,
  drawPlatform,
  drawMeatball,
  drawPowerUp,
  type PlatformStyle,
} from "../rendering/sprites";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLATFORM_COUNT_BUFFER,
  COLORS,
  DEATH_ANIMATION_TICKS,
} from "../config/constants";

export class GameScene {
  readonly container = new Container();
  readonly input = new InputManager();

  private player: PlayerState;
  private platforms: PlatformState[] = [];
  private meatballs: CollectibleState[] = [];
  private powerUps: PowerUpState[] = [];
  private camera: CameraState;
  private scoreState: ScoreState;
  private zoneState: ZoneState;

  // Active power-up effect
  private activeEffect: ActiveEffect | null = null;

  // Animation tick for spinning items
  private animTick = 0;

  // Rendering
  private parallax: ParallaxBackground;
  private gameContainer = new Container(); // holds game objects (scrolls with camera)
  private playerGfx = new Graphics();
  private platformGfxMap = new Map<number, Graphics>();
  private meatballGfxMap = new Map<number, Graphics>();
  private powerUpGfxMap = new Map<number, Graphics>();
  private effectLabel: Text | null = null;
  private tornadoParticles: Graphics[] = [];
  private tornadoContainer = new Container();
  private rocketParticles: Graphics[] = [];
  private rocketContainer = new Container();
  private lasagnaParticles: Graphics[] = [];
  private lasagnaContainer = new Container();
  private springParticles: Graphics[] = [];
  private springContainer = new Container();
  private springFlashTicks = 0;
  private sneezeParticles: Graphics[] = [];
  private sneezeContainer = new Container();
  private effectOverlay = new Graphics(); // screen tint for negative effects
  private shakeState: ShakeState | null = null;
  private isDying = false;
  private dyingTicks = 0;
  private crumbleParticles: {
    gfx: Graphics;
    vx: number;
    vy: number;
    life: number;
  }[] = [];
  private crumbleContainer = new Container();
  private floatingTexts: { text: Text; life: number; maxLife: number }[] = [];

  // Dust particles
  private dustParticles: {
    gfx: Graphics;
    vx: number;
    vy: number;
    life: number;
  }[] = [];
  private dustContainer = new Container();

  // Squash/stretch
  private squashTicks = 0; // >0 = squash (landing), <0 = stretch (launch)
  private lastFacing = 1; // 1 = right, -1 = left

  // Power-up pickup flash
  private pickupFlashTicks = 0;
  private pickupFlashColor = 0xffffff;

  // Pause
  private paused = false;

  // Countdown
  private countdownTicks = -1; // -1 = no countdown

  // State
  private highestPlatformY: number;
  private platformCount = 0;
  private platformsPassed = 0;
  private highestPlayerY = Infinity;
  private gameOver = false;
  private stagnantTicks = 0;
  private highScoreBeatShown = false;
  private startTime = Date.now();
  private elapsedMs = 0;
  private highScore: number;

  constructor() {
    this.scoreState = createScoreState();
    this.zoneState = createZoneState();
    this.highScore = loadHighScore();

    // Parallax background (behind everything)
    this.parallax = new ParallaxBackground();
    this.container.addChild(this.parallax.container);

    // Game container (scrolls with camera)
    this.container.addChild(this.gameContainer);
    this.gameContainer.addChild(this.crumbleContainer);
    this.gameContainer.addChild(this.dustContainer);

    // Ground floor
    const ground = createGroundPlatform(GAME_HEIGHT);
    this.platforms.push(ground);
    this.highestPlatformY = ground.y;

    // Generate initial platforms
    const generated = generatePlatforms(
      this.highestPlatformY,
      PLATFORM_COUNT_BUFFER,
    );
    this.platforms.push(...generated);
    this.highestPlatformY = generated[generated.length - 1].y;
    this.platformCount = generated.length;

    // Spawn power-ups first, then meatballs (excluding power-up platforms)
    this.powerUps = spawnPowerUps(generated);
    const puPlatformIds = new Set(this.powerUps.map((pu) => pu.platformId));
    this.meatballs = spawnMeatballs(generated, puPlatformIds);

    // Player
    this.player = createPlayer(GAME_WIDTH / 2 - 16, ground.y - 40);

    // Camera
    this.camera = createCamera();
    this.camera = { ...this.camera, y: ground.y - GAME_HEIGHT + 100 };

    // Add player graphic + effect containers
    this.gameContainer.addChild(this.sneezeContainer);
    this.gameContainer.addChild(this.springContainer);
    this.gameContainer.addChild(this.lasagnaContainer);
    this.gameContainer.addChild(this.rocketContainer);
    this.gameContainer.addChild(this.tornadoContainer);
    this.gameContainer.addChild(this.playerGfx);

    // Effect overlay (on top of game objects, below HUD)
    this.container.addChild(this.effectOverlay);

    // Initial render setup
    this.syncPlatformGraphics();
    this.syncMeatballGraphics();
    this.syncPowerUpGraphics();

    // Apply initial theme
    const theme = getInterpolatedTheme(0);
    this.parallax.applyTheme(theme, this.zoneState.currentZone);
  }

  initInput(canvas: HTMLCanvasElement): void {
    this.input.init(canvas);
  }

  isGameOver(): boolean {
    return this.gameOver;
  }
  getScore(): number {
    return this.scoreState.points;
  }
  getHeight(): number {
    return this.scoreState.height;
  }
  getHighScore(): number {
    return this.highScore;
  }
  getElapsedSeconds(): number {
    return Math.floor(this.elapsedMs / 1000);
  }
  getActiveEffectName(): string | null {
    return this.activeEffect?.type ?? null;
  }
  getMeatballsCollected(): number {
    return this.scoreState.meatballsCollected;
  }
  getPowerUpsCollected(): number {
    return this.scoreState.powerUpsCollected;
  }
  getBestCombo(): number {
    return this.scoreState.comboMultiplier;
  }
  getBestStreak(): number {
    return this.scoreState.landingStreak;
  }
  getPlatformsPassed(): number {
    return this.platformsPassed;
  }
  isPaused(): boolean {
    return this.paused;
  }
  getCountdownSeconds(): number | undefined {
    if (this.countdownTicks < 0) return undefined;
    return Math.ceil(this.countdownTicks / 60);
  }
  togglePause(): void {
    this.paused = !this.paused;
  }
  getZone(): number {
    return this.zoneState.currentZone;
  }
  getZoneProgress(): number {
    // Progress toward next zone (0-1)
    const thresholds = [0, 80, 280]; // production thresholds
    const zone = this.zoneState.currentZone;
    if (zone >= thresholds.length - 1) return 1;
    const current = this.platformsPassed;
    const start = thresholds[zone];
    const end = thresholds[zone + 1];
    return Math.min(1, (current - start) / (end - start));
  }

  /** Returns true exactly once — when the player first beats the high score during gameplay. */
  checkNewHighScore(): boolean {
    if (this.highScoreBeatShown) return false;
    if (this.highScore > 0 && this.scoreState.points > this.highScore) {
      this.highScoreBeatShown = true;
      return true;
    }
    return false;
  }

  getActiveEffectProgress(): number {
    if (!this.activeEffect) return 0;
    const maxDuration = this.getMaxDuration(this.activeEffect.type);
    return this.activeEffect.ticksRemaining / maxDuration;
  }

  private getMaxDuration(type: string): number {
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
      case "chili_pepper":
      case "soggy_noodle":
      case "garlic_breath":
      case "burnt_toast":
        return 300;
      default:
        return 1;
    }
  }

  getComboMultiplier(): number {
    return this.scoreState.comboMultiplier;
  }
  getLandingStreak(): number {
    return this.scoreState.landingStreak;
  }

  startCountdown(): void {
    this.countdownTicks = 180; // 3 seconds
  }

  update(): void {
    if (this.gameOver) return;
    if (this.paused) return;

    // Countdown before game starts — render the world but don't move
    if (this.countdownTicks > 0) {
      this.countdownTicks--;
      this.animTick++;
      const theme = getInterpolatedTheme(this.platformsPassed);
      this.parallax.update(this.camera.y);
      this.render(theme);
      return;
    }

    // Death animation — spin and fall off screen
    if (this.isDying) {
      this.dyingTicks++;
      this.player = {
        ...this.player,
        vy: this.player.vy + 0.45,
        y: this.player.y + this.player.vy,
      };
      const t = this.dyingTicks / DEATH_ANIMATION_TICKS;
      this.playerGfx.rotation += 0.15;
      this.playerGfx.scale.set(1 - t * 0.8);
      this.playerGfx.y = worldToScreen(this.player.y, this.camera.y);
      this.updateFloatingTexts();
      this.updateCrumbleParticles();
      if (this.dyingTicks >= DEATH_ANIMATION_TICKS) {
        this.gameOver = true;
        const isNew = saveHighScore(this.scoreState.points);
        if (isNew) this.highScore = this.scoreState.points;
      }
      return;
    }

    this.elapsedMs = Date.now() - this.startTime;
    const previousY = this.player.y;

    // Input
    this.input.update();

    // Active power-up effect
    if (this.activeEffect) {
      const effectResult = tickEffect(this.player, this.activeEffect);
      this.player = effectResult.player;
      this.activeEffect = effectResult.effect;
      if (!this.activeEffect) this.clearEffectLabel();
      if (effectResult.spawnPlatform) this.spawnLasagnaPlatform();
    }

    // Update moving platforms
    const difficulty = getDifficulty(this.platformsPassed);
    this.platforms = updatePlatforms(
      this.platforms,
      difficulty.movingSpeedMultiplier,
    );
    this.meatballs = updateMeatballPositions(this.meatballs, this.platforms);
    this.powerUps = updatePowerUpPositions(this.powerUps, this.platforms);

    // Update player — chili pepper inverts controls
    const inputX =
      this.activeEffect?.type === "chili_pepper"
        ? -this.input.inputX
        : this.input.inputX;
    this.player = updatePlayer(this.player, inputX);

    // Platform collisions (skip during flight effects)
    const isFlying =
      this.activeEffect?.type === "fusilli_tornado" ||
      this.activeEffect?.type === "ravioli_rocket" ||
      this.activeEffect?.type === "pepper_sneeze";
    if (!isFlying) {
      const allBreaking = this.activeEffect?.type === "soggy_noodle";
      // Burnt toast shrinks collision hitboxes
      let collisionPlatforms = this.platforms;
      if (this.activeEffect?.type === "burnt_toast") {
        collisionPlatforms = this.platforms.map((p) => ({
          ...p,
          x: p.x + p.width * 0.25,
          width: p.width * 0.5,
        }));
      }
      const collision = checkPlatformCollisions(
        this.player,
        collisionPlatforms,
        previousY,
        allBreaking,
      );
      this.player = collision.player;
      // If burnt toast, map platform updates back to original array
      if (this.activeEffect?.type === "burnt_toast") {
        const brokenIds = new Set(
          collision.platforms.filter((p) => p.broken).map((p) => p.id),
        );
        this.platforms = this.platforms.map((p) =>
          brokenIds.has(p.id) && !p.broken ? { ...p, broken: true } : p,
        );
      } else {
        this.platforms = collision.platforms;
      }

      // Landing events: SFX, dust, squash, combos, close call, streak
      if (collision.landed) {
        playSfxJump();
        this.squashTicks = 8; // squash on land
        this.spawnDustPuff(
          this.player.x + this.player.width / 2,
          this.player.y + this.player.height,
        );
        this.scoreState = addLandingStreak(this.scoreState);
        if (this.scoreState.landingStreak % 5 === 0) playSfxLandingStreak();
        if (collision.edgeLanding && this.stagnantTicks < 300) {
          this.scoreState = addCloseCallBonus(this.scoreState);
          playSfxCloseCall();
          this.spawnFloatingText("CLOSE CALL!", 0xffdd44);
        }
      }
      if (collision.platformBroke) {
        playSfxPlatformCrumble();
        // Find the broken platform and spawn crumble particles
        for (const p of collision.platforms) {
          if (p.broken) this.spawnCrumbleParticles(p);
        }
      }
    }

    // Meatball magnet attraction
    if (this.activeEffect?.type === "meatball_magnet") {
      this.meatballs = attractMeatballs(
        this.player.x,
        this.player.y,
        this.player.width,
        this.meatballs,
      );
    }

    // Collect meatballs
    const meatballResult = collectMeatballs(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height,
      this.meatballs,
    );
    this.meatballs = meatballResult.meatballs;
    if (meatballResult.collected > 0) {
      this.scoreState = addMeatballScore(
        this.scoreState,
        meatballResult.collected,
      );
      playSfxMeatball();
      if (this.scoreState.comboMultiplier > 1) {
        playSfxCombo(this.scoreState.comboMultiplier);
        this.spawnFloatingText(
          `${this.scoreState.comboMultiplier}x COMBO!`,
          0xff8800,
        );
      }
    }

    // Tick combo timer
    this.scoreState = tickCombo(this.scoreState);

    // Collect power-ups
    const puResult = collectPowerUps(this.player, this.powerUps);
    this.powerUps = puResult.powerUps;
    if (puResult.collected) {
      this.scoreState = addPowerUpScore(this.scoreState);
      const applied = applyPowerUp(this.player, puResult.collected);
      this.player = applied.player;
      this.activeEffect = applied.effect;
      if (applied.effect) this.showEffectLabel(puResult.collected);
      if (puResult.collected === "spaghetti_spring") {
        this.springFlashTicks = 30;
        this.showEffectLabel("spaghetti_spring");
      }
      // Audio + screen shake for power-ups
      if (isNegativePowerUp(puResult.collected)) {
        playSfxNegativePowerUp();
        this.shakeState = createShake(8, 20);
        this.pickupFlashTicks = 15;
        this.pickupFlashColor = 0xff0000;
      } else {
        playSfxPositivePowerUp();
        this.pickupFlashTicks = 12;
        this.pickupFlashColor = 0xffffff;
      }
    }

    // Height score
    this.scoreState = updateHeightScore(this.scoreState, this.player.y);

    // Track platforms passed — count new platforms the player climbs above
    if (this.player.y < this.highestPlayerY) {
      const newlyPassed = this.platforms.filter(
        (p) => p.y > this.player.y && p.y <= this.highestPlayerY,
      ).length;
      this.platformsPassed += newlyPassed;
      this.highestPlayerY = this.player.y;
      this.stagnantTicks = 0;
    } else {
      this.stagnantTicks++;
      // Warning shake at 3 seconds — "time's running out"
      if (this.stagnantTicks === 180) {
        this.shakeState = createShake(3, 30);
        this.spawnFloatingText("KEEP CLIMBING!", 0xff4444, 28, 120, true);
      }
      // Stronger warning at 4.5 seconds
      if (this.stagnantTicks === 270) {
        this.shakeState = createShake(5, 20);
      }
      // After 5 seconds, start crumbling from the LOWEST platform upward
      if (this.stagnantTicks > 300 && this.stagnantTicks % 40 === 0) {
        const intact = this.platforms
          .filter((p) => !p.broken && p.type !== "lasagna")
          .sort((a, b) => b.y - a.y); // highest y = lowest on screen
        if (intact.length > 0) {
          const victim = intact[0]; // crumble the lowest first
          victim.broken = true;
          this.spawnCrumbleParticles(victim);
          playSfxPlatformCrumble();
          this.shakeState = createShake(4, 10);
        }
      }
    }

    // Zone transitions — based on platforms actually passed, not generated
    const prevZone = this.zoneState.currentZone;
    const zoneResult = updateZone(this.zoneState, this.platformsPassed);
    this.zoneState = zoneResult.state;
    const theme = getInterpolatedTheme(this.platformsPassed);
    this.parallax.applyTheme(theme, this.zoneState.currentZone);
    if (this.zoneState.currentZone !== prevZone) {
      crossfadeToZone(this.zoneState.currentZone);
    }

    // Camera
    this.camera = updateCamera(this.camera, this.player.y);

    // Screen shake
    if (this.shakeState) {
      const shakeResult = tickShake(this.shakeState);
      this.shakeState = shakeResult.state;
      this.gameContainer.x = shakeResult.offsetX;
      this.gameContainer.y = shakeResult.offsetY;
    } else {
      this.gameContainer.x = 0;
      this.gameContainer.y = 0;
    }

    // Death check — start dying animation
    if (isPlayerDead(this.camera, this.player.y)) {
      this.isDying = true;
      playSfxDeath();
      return;
    }

    // Generate + prune
    this.maybeGeneratePlatforms();
    this.prune();

    // Render
    this.animTick++;
    this.parallax.update(this.camera.y);
    this.render(theme);
  }

  private maybeGeneratePlatforms(): void {
    const cameraTop = this.camera.y;
    if (this.highestPlatformY > cameraTop - GAME_HEIGHT) {
      const difficulty = getDifficulty(this.platformsPassed);
      const generated = generatePlatforms(
        this.highestPlatformY,
        PLATFORM_COUNT_BUFFER,
        difficulty,
      );
      this.platforms.push(...generated);
      this.highestPlatformY = generated[generated.length - 1].y;
      this.platformCount += generated.length;

      const hasUncollected = this.powerUps.some((pu) => !pu.collected);
      if (!hasUncollected) {
        const newPowerUps = spawnPowerUps(
          generated,
          difficulty.negativeSpawnChance,
        );
        this.powerUps.push(...newPowerUps);
      }

      const allPuPlatformIds = new Set(
        this.powerUps.map((pu) => pu.platformId),
      );
      this.meatballs.push(...spawnMeatballs(generated, allPuPlatformIds));

      this.syncPlatformGraphics();
      this.syncMeatballGraphics();
      this.syncPowerUpGraphics();
    }
  }

  private spawnLasagnaPlatform(): void {
    // Spawn a lasagna-type platform just below the player for safe landing
    const x = Math.max(
      20,
      Math.min(
        GAME_WIDTH - 120,
        this.player.x - 40 + (Math.random() - 0.5) * 60,
      ),
    );
    const y = this.player.y + 80 + Math.random() * 40;
    const platform = createPlatform(x, y, "lasagna");
    this.platforms.push(platform);
    this.syncPlatformGraphics();
  }

  private prune(): void {
    const threshold = this.camera.y + GAME_HEIGHT + 400;
    const beforePlatforms = this.platforms.length;
    this.platforms = pruneBelow(this.platforms, threshold);

    const activeIds = new Set(this.platforms.map((p) => p.id));
    const beforeMeatballs = this.meatballs.length;
    this.meatballs = pruneMeatballs(this.meatballs, activeIds);
    const beforePowerUps = this.powerUps.length;
    this.powerUps = prunePowerUps(this.powerUps, activeIds);

    if (beforePlatforms !== this.platforms.length)
      this.cleanupGraphics(
        this.platformGfxMap,
        this.platforms.map((p) => p.id),
      );
    if (beforeMeatballs !== this.meatballs.length)
      this.cleanupGraphics(
        this.meatballGfxMap,
        this.meatballs.map((m) => m.id),
      );
    if (beforePowerUps !== this.powerUps.length)
      this.cleanupGraphics(
        this.powerUpGfxMap,
        this.powerUps.map((pu) => pu.id),
      );
  }

  private render(theme: ReturnType<typeof getInterpolatedTheme>): void {
    const camY = this.camera.y;

    // Player — different rendering per active effect
    const activeType = this.activeEffect?.type;
    if (activeType === "ravioli_rocket") {
      // Rocket mode — draw chef on rocket with animated fire
      drawChefOnRocket(
        this.playerGfx,
        this.player.width,
        this.player.height,
        this.animTick,
      );
      this.playerGfx.pivot.set(0, 0);
      this.playerGfx.rotation = 0;
      this.playerGfx.x = this.player.x;
      this.playerGfx.y = worldToScreen(this.player.y, camY);

      // Fire trail particles
      this.updateRocketParticles(camY);
      this.clearTornadoParticles();
    } else if (activeType === "fusilli_tornado") {
      // Tornado mode — spin + dust
      const effectColor = COLORS.powerups[activeType];
      drawChef(
        this.playerGfx,
        this.player.width,
        this.player.height,
        effectColor,
      );
      this.playerGfx.pivot.set(this.player.width / 2, this.player.height / 2);
      this.playerGfx.x = this.player.x + this.player.width / 2;
      this.playerGfx.y =
        worldToScreen(this.player.y, camY) + this.player.height / 2;
      this.playerGfx.rotation = this.animTick * 0.15;
      this.updateTornadoParticles(camY);
      this.clearRocketParticles();
    } else if (activeType === "pepper_sneeze") {
      // Sneeze mode — screen shake + spice cloud
      drawChef(
        this.playerGfx,
        this.player.width,
        this.player.height,
        COLORS.powerups["pepper_sneeze"],
      );
      this.playerGfx.pivot.set(0, 0);
      this.playerGfx.rotation = 0;
      // Screen shake
      const shakeX = (Math.random() - 0.5) * 6;
      const shakeY = (Math.random() - 0.5) * 4;
      this.playerGfx.x = this.player.x + shakeX;
      this.playerGfx.y = worldToScreen(this.player.y, camY) + shakeY;
      this.updateSneezeParticles(camY);
      this.clearTornadoParticles();
      this.clearRocketParticles();
      this.clearLasagnaParticles();
      this.clearSneezeParticles();
    } else if (activeType === "lasagna_layers") {
      // Float mode — gentle bob + golden glow + floating cheese
      drawChef(
        this.playerGfx,
        this.player.width,
        this.player.height,
        COLORS.powerups["lasagna_layers"],
      );
      this.playerGfx.pivot.set(this.player.width / 2, this.player.height / 2);
      this.playerGfx.x = this.player.x + this.player.width / 2;
      this.playerGfx.y =
        worldToScreen(this.player.y, camY) + this.player.height / 2;
      // Gentle wobble rotation
      this.playerGfx.rotation = Math.sin(this.animTick * 0.06) * 0.15;
      // Pulsing glow scale
      const floatPulse = 1.0 + Math.sin(this.animTick * 0.08) * 0.08;
      this.playerGfx.scale.set(floatPulse);
      this.updateLasagnaParticles(camY);
      this.clearTornadoParticles();
      this.clearRocketParticles();
    } else if (activeType === "chili_pepper") {
      // Chili — red pulsing, angry wobble
      const chiliPulse = Math.sin(this.animTick * 0.2) * 0.1;
      drawChef(this.playerGfx, this.player.width, this.player.height, 0xff2200);
      this.playerGfx.pivot.set(this.player.width / 2, this.player.height / 2);
      this.playerGfx.x =
        this.player.x +
        this.player.width / 2 +
        Math.sin(this.animTick * 0.4) * 2;
      this.playerGfx.y =
        worldToScreen(this.player.y, camY) + this.player.height / 2;
      this.playerGfx.rotation = Math.sin(this.animTick * 0.3) * 0.1;
      this.playerGfx.scale.set(1 + chiliPulse);
      this.clearAllPowerUpParticles();
    } else if (activeType === "soggy_noodle") {
      // Soggy — blue tint, droopy/wobbly
      drawChef(this.playerGfx, this.player.width, this.player.height, 0x5588cc);
      this.playerGfx.pivot.set(this.player.width / 2, this.player.height / 2);
      this.playerGfx.x = this.player.x + this.player.width / 2;
      this.playerGfx.y =
        worldToScreen(this.player.y, camY) + this.player.height / 2;
      // Wobbly noodle squish
      const squishX = 1.0 + Math.sin(this.animTick * 0.12) * 0.15;
      const squishY = 1.0 - Math.sin(this.animTick * 0.12) * 0.1;
      this.playerGfx.scale.set(squishX, squishY);
      this.playerGfx.rotation = Math.sin(this.animTick * 0.08) * 0.08;
      this.clearAllPowerUpParticles();
    } else if (activeType === "garlic_breath") {
      // Garlic — green tint, swaying, stink cloud
      drawChef(this.playerGfx, this.player.width, this.player.height, 0x88bb44);
      this.playerGfx.pivot.set(0, 0);
      this.playerGfx.rotation = 0;
      this.playerGfx.x = this.player.x + Math.sin(this.animTick * 0.06) * 3;
      this.playerGfx.y = worldToScreen(this.player.y, camY);
      this.playerGfx.scale.set(1);
      this.clearAllPowerUpParticles();
    } else if (activeType === "burnt_toast") {
      // Burnt toast — dark char tint, shrinking/flickering
      const flicker = 0.85 + Math.random() * 0.15;
      drawChef(this.playerGfx, this.player.width, this.player.height, 0x3d2b1f);
      this.playerGfx.pivot.set(0, 0);
      this.playerGfx.rotation = 0;
      this.playerGfx.x = this.player.x;
      this.playerGfx.y = worldToScreen(this.player.y, camY);
      this.playerGfx.scale.set(flicker);
      this.clearAllPowerUpParticles();
    } else if (activeType === "meatball_magnet") {
      // Magnet — pink glow + pulsing aura
      drawChef(this.playerGfx, this.player.width, this.player.height, 0xcc6699);
      this.playerGfx.pivot.set(0, 0);
      this.playerGfx.rotation = 0;
      this.playerGfx.x = this.player.x;
      this.playerGfx.y = worldToScreen(this.player.y, camY);
      const magnetPulse = 1.0 + Math.sin(this.animTick * 0.1) * 0.06;
      this.playerGfx.scale.set(magnetPulse);
      this.clearAllPowerUpParticles();
    } else {
      // Normal or spaghetti spring flash
      drawChef(this.playerGfx, this.player.width, this.player.height);
      this.playerGfx.pivot.set(0, 0);
      this.playerGfx.rotation = 0;
      this.playerGfx.x = this.player.x;
      this.playerGfx.y = worldToScreen(this.player.y, camY);
      this.playerGfx.scale.set(1);

      // Spaghetti spring: brief stretch + trail
      if (this.springFlashTicks > 0) {
        this.springFlashTicks--;
        const stretch = 1 + (this.springFlashTicks / 30) * 0.5;
        this.playerGfx.scale.set(1, stretch);
        this.playerGfx.tint = 0xf0c050;
        this.updateSpringParticles(camY);
        if (this.springFlashTicks === 0) {
          this.playerGfx.scale.set(1, 1);
          this.playerGfx.tint = 0xffffff;
          this.clearEffectLabel();
        }
      } else {
        this.clearSpringParticles();
      }

      this.clearTornadoParticles();
      this.clearRocketParticles();
      this.clearLasagnaParticles();
      this.clearSneezeParticles();
    }

    // Chef faces movement direction
    if (this.input.inputX > 0.1) this.lastFacing = 1;
    else if (this.input.inputX < -0.1) this.lastFacing = -1;
    // Only flip when no special pivot is set (normal/negative effects)
    const activeT = this.activeEffect?.type;
    if (
      !activeT ||
      activeT === "chili_pepper" ||
      activeT === "soggy_noodle" ||
      activeT === "garlic_breath" ||
      activeT === "burnt_toast" ||
      activeT === "meatball_magnet"
    ) {
      this.playerGfx.scale.x =
        this.lastFacing * Math.abs(this.playerGfx.scale.x);
    }

    // Squash/stretch on landing/launch
    if (this.squashTicks > 0) {
      const t = this.squashTicks / 8;
      this.playerGfx.scale.y = 1 - t * 0.25; // squash: shorter
      this.playerGfx.scale.x = this.lastFacing * (1 + t * 0.15); // wider
      this.squashTicks--;
    } else if (this.squashTicks < 0) {
      const t = -this.squashTicks / 6;
      this.playerGfx.scale.y = 1 + t * 0.2; // stretch: taller
      this.playerGfx.scale.x = this.lastFacing * (1 - t * 0.1); // narrower
      this.squashTicks++;
    }

    // Pickup flash overlay
    if (this.pickupFlashTicks > 0) {
      this.pickupFlashTicks--;
      const flashAlpha = (this.pickupFlashTicks / 12) * 0.3;
      this.effectOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.effectOverlay.fill({
        color: this.pickupFlashColor,
        alpha: flashAlpha,
      });
    }

    // Dust particles
    this.updateDustParticles();

    // Platforms — redraw with zone-appropriate colors
    for (const platform of this.platforms) {
      const gfx = this.platformGfxMap.get(platform.id);
      if (!gfx) continue;
      if (platform.broken) {
        // Brief shrink + fade instead of instant hide
        if (gfx.alpha > 0.05) {
          gfx.alpha *= 0.85;
          gfx.scale.y *= 0.88;
          gfx.y = worldToScreen(platform.y, camY);
        } else {
          gfx.visible = false;
        }
        continue;
      }
      // Reset alpha/scale for non-broken platforms (in case soggy noodle wore off)
      if (gfx.alpha < 1) gfx.alpha = 1;
      if (gfx.scale.y < 1) gfx.scale.y = 1;

      let color = theme.platform;
      let style: PlatformStyle = "normal";
      if (platform.type === "breaking") {
        color = theme.platformBreaking;
        style = "breaking";
      }
      if (platform.type === "brittle") {
        color = theme.platformBrittle;
        style = "brittle";
      }
      if (platform.type === "moving") {
        color = theme.platformMoving;
        style = "moving";
      }
      if (platform.type === "lasagna") {
        color = theme.platformLasagna;
        style = "lasagna";
      }

      // Burnt toast shrinks platforms visually
      const isBurnt = this.activeEffect?.type === "burnt_toast";
      const shrink = isBurnt ? 0.5 : 1;
      drawPlatform(gfx, platform.width * shrink, platform.height, color, style);
      // Center the shrunk platform
      gfx.x = platform.x + (platform.width * (1 - shrink)) / 2;
      gfx.y = worldToScreen(platform.y, camY);
      gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20;
    }

    // Meatballs — gentle 3D wobble + bob
    const meatballWobble = Math.cos(this.animTick * 0.04);
    const meatballBob = Math.sin(this.animTick * 0.05) * 2;
    for (const meatball of this.meatballs) {
      const gfx = this.meatballGfxMap.get(meatball.id);
      if (!gfx) continue;
      if (meatball.collected) {
        gfx.visible = false;
        continue;
      }
      gfx.x = meatball.x + meatball.size / 2;
      gfx.y = worldToScreen(meatball.y, camY) + meatballBob;
      gfx.pivot.x = meatball.size / 2;
      gfx.scale.x = 0.75 + Math.abs(meatballWobble) * 0.25; // gentle squish between 0.75 and 1.0
      gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20;
    }

    // Power-ups — faster spin + gentle bob, negative ones pulse
    const puSpin = Math.cos(this.animTick * 0.08);
    const puBob = Math.sin(this.animTick * 0.04) * 3;
    for (const pu of this.powerUps) {
      const gfx = this.powerUpGfxMap.get(pu.id);
      if (!gfx) continue;
      if (pu.collected) {
        gfx.visible = false;
        continue;
      }
      gfx.x = pu.x + pu.size / 2;
      gfx.y = worldToScreen(pu.y, camY) + puBob;
      gfx.pivot.x = pu.size / 2;
      if (isNegativePowerUp(pu.type)) {
        // Negative: pulse scale for warning
        const pulse = 0.8 + Math.sin(this.animTick * 0.15) * 0.2;
        gfx.scale.set(pulse);
      } else {
        gfx.scale.x = 0.4 + Math.abs(puSpin) * 0.6;
      }
      gfx.visible = gfx.y > -20 && gfx.y < GAME_HEIGHT + 20;
    }

    // Update particles and floating text
    this.updateCrumbleParticles();
    this.updateFloatingTexts();

    // Negative effect screen overlays
    this.renderEffectOverlay();
  }

  private renderEffectOverlay(): void {
    this.effectOverlay.clear();
    if (!this.activeEffect) return;

    const type = this.activeEffect.type;
    const progress =
      this.activeEffect.ticksRemaining / this.getMaxDuration(type);
    const flashAlpha = 0.1 + Math.sin(this.animTick * 0.08) * 0.05; // subtle pulse

    if (type === "chili_pepper") {
      // Red screen tint
      this.effectOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.effectOverlay.fill({
        color: 0xff0000,
        alpha: flashAlpha * progress,
      });
    } else if (type === "soggy_noodle") {
      // Blue/wet tint
      this.effectOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.effectOverlay.fill({
        color: 0x3366aa,
        alpha: flashAlpha * progress,
      });
    } else if (type === "garlic_breath") {
      // Fog — green haze that obscures the middle of the screen
      const fogAlpha = (0.3 + Math.sin(this.animTick * 0.04) * 0.1) * progress;
      this.effectOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.effectOverlay.fill({ color: 0x88bb44, alpha: fogAlpha * 0.4 });
      // Thicker fog bands
      for (let i = 0; i < 5; i++) {
        const bandY = GAME_HEIGHT * 0.15 + (i / 5) * GAME_HEIGHT * 0.7;
        const wobble = Math.sin(this.animTick * 0.02 + i * 1.5) * 30;
        this.effectOverlay.ellipse(
          GAME_WIDTH / 2 + wobble,
          bandY,
          GAME_WIDTH * 0.6,
          60 + i * 10,
        );
        this.effectOverlay.fill({ color: 0x99cc55, alpha: fogAlpha * 0.3 });
      }
    } else if (type === "burnt_toast") {
      // Dark char tint
      this.effectOverlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.effectOverlay.fill({
        color: 0x1a0a00,
        alpha: flashAlpha * 0.6 * progress,
      });
    }
  }

  private clearAllPowerUpParticles(): void {
    this.clearTornadoParticles();
    this.clearRocketParticles();
    this.clearLasagnaParticles();
    this.clearSpringParticles();
    this.clearSneezeParticles();
  }

  // ── Dust puff particles ──────────────────────────────────────────────────

  private spawnDustPuff(worldX: number, worldY: number): void {
    const camY = this.camera.y;
    for (let i = 0; i < 5; i++) {
      const gfx = new Graphics();
      const size = 2 + Math.random() * 3;
      gfx.circle(0, 0, size);
      gfx.fill({ color: 0xccbbaa, alpha: 0.6 });
      gfx.x = worldX + (Math.random() - 0.5) * 20;
      gfx.y = worldToScreen(worldY, camY);
      this.dustContainer.addChild(gfx);
      this.dustParticles.push({
        gfx,
        vx: (Math.random() - 0.5) * 2,
        vy: -0.5 - Math.random() * 1.5,
        life: 15 + Math.floor(Math.random() * 10),
      });
    }
  }

  private updateDustParticles(): void {
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.gfx.x += p.vx;
      p.gfx.y += p.vy;
      p.life--;
      p.gfx.alpha = Math.max(0, p.life / 20);
      p.gfx.scale.set(p.gfx.scale.x * 1.03); // grow slightly
      if (p.life <= 0) {
        this.dustContainer.removeChild(p.gfx);
        p.gfx.destroy();
        this.dustParticles.splice(i, 1);
      }
    }
  }

  // ── Crumble particles ────────────────────────────────────────────────────

  private spawnCrumbleParticles(platform: PlatformState): void {
    const camY = this.camera.y;
    for (let i = 0; i < 7; i++) {
      const gfx = new Graphics();
      const size = 3 + Math.random() * 5;
      gfx.rect(0, 0, size, size * 0.6);
      gfx.fill(0xd4a574);
      gfx.x = platform.x + Math.random() * platform.width;
      gfx.y = worldToScreen(platform.y, camY);
      this.crumbleContainer.addChild(gfx);
      this.crumbleParticles.push({
        gfx,
        vx: (Math.random() - 0.5) * 3,
        vy: -1 - Math.random() * 2,
        life: 40 + Math.floor(Math.random() * 20),
      });
    }
  }

  private updateCrumbleParticles(): void {
    for (let i = this.crumbleParticles.length - 1; i >= 0; i--) {
      const p = this.crumbleParticles[i];
      p.vy += 0.15; // gravity
      p.gfx.x += p.vx;
      p.gfx.y += p.vy;
      p.life--;
      p.gfx.alpha = Math.max(0, p.life / 40);
      p.gfx.rotation += 0.05;
      if (p.life <= 0) {
        this.crumbleContainer.removeChild(p.gfx);
        p.gfx.destroy();
        this.crumbleParticles.splice(i, 1);
      }
    }
  }

  // ── Floating text ───────────────────────────────────────────────────────

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
      text.x = this.player.x + this.player.width / 2;
      text.y = worldToScreen(this.player.y - 20, this.camera.y);
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

  // ── Tornado particles ────────────────────────────────────────────────────

  private updateTornadoParticles(camY: number): void {
    // Spawn new particles
    if (this.animTick % 2 === 0) {
      const particle = new Graphics();
      const size = 3 + Math.random() * 5;
      particle.circle(0, 0, size);
      particle.fill({ color: 0xd4a017, alpha: 0.4 + Math.random() * 0.3 });
      this.tornadoContainer.addChild(particle);
      this.tornadoParticles.push(particle);

      // Start near player center
      const cx = this.player.x + this.player.width / 2;
      const cy = this.player.y + this.player.height / 2;
      particle.x = cx + (Math.random() - 0.5) * 20;
      particle.y = worldToScreen(cy, camY) + (Math.random() - 0.5) * 20;
    }

    // Update existing particles — spiral outward and fade
    for (let i = this.tornadoParticles.length - 1; i >= 0; i--) {
      const p = this.tornadoParticles[i];
      const cx = this.player.x + this.player.width / 2;
      const screenCy = worldToScreen(
        this.player.y + this.player.height / 2,
        camY,
      );

      // Spiral motion
      const angle = this.animTick * 0.12 + i * 0.8;
      const radius = 10 + (this.tornadoParticles.length - i) * 2;
      p.x = cx + Math.cos(angle) * radius;
      p.y =
        screenCy +
        Math.sin(angle) * radius * 0.5 +
        (this.tornadoParticles.length - i) * 1.5;

      p.alpha -= 0.015;
      p.scale.set(p.scale.x * 0.995);

      if (p.alpha <= 0) {
        this.tornadoContainer.removeChild(p);
        p.destroy();
        this.tornadoParticles.splice(i, 1);
      }
    }
  }

  private clearTornadoParticles(): void {
    for (const p of this.tornadoParticles) {
      this.tornadoContainer.removeChild(p);
      p.destroy();
    }
    this.tornadoParticles = [];
  }

  // ── Rocket particles ─────────────────────────────────────────────────────

  private updateRocketParticles(camY: number): void {
    // Spawn fire particles every frame
    const cx = this.player.x + this.player.width / 2;
    const bottomY = this.player.y + this.player.height;

    for (let s = 0; s < 2; s++) {
      const particle = new Graphics();
      const size = 2 + Math.random() * 4;
      // Random fire color
      const colors = [0xff4500, 0xff8c00, 0xffdd00, 0xff6600];
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.circle(0, 0, size);
      particle.fill({ color, alpha: 0.7 + Math.random() * 0.3 });
      this.rocketContainer.addChild(particle);
      this.rocketParticles.push(particle);

      particle.x = cx + (Math.random() - 0.5) * 14;
      particle.y = worldToScreen(bottomY + 10, camY);
    }

    // Update — particles fall down and fade
    for (let i = this.rocketParticles.length - 1; i >= 0; i--) {
      const p = this.rocketParticles[i];
      p.y += 2 + Math.random() * 3; // drift downward (fire trail)
      p.x += (Math.random() - 0.5) * 2; // slight horizontal wobble
      p.alpha -= 0.03;
      p.scale.set(p.scale.x * 0.97);

      if (p.alpha <= 0) {
        this.rocketContainer.removeChild(p);
        p.destroy();
        this.rocketParticles.splice(i, 1);
      }
    }
  }

  private clearRocketParticles(): void {
    for (const p of this.rocketParticles) {
      this.rocketContainer.removeChild(p);
      p.destroy();
    }
    this.rocketParticles = [];
  }

  // ── Sneeze particles (spice cloud bursting outward) ──────────────────────

  private updateSneezeParticles(camY: number): void {
    // Burst of red/brown spice particles
    for (let s = 0; s < 3; s++) {
      const particle = new Graphics();
      const size = 2 + Math.random() * 4;
      const colors = [0x8b0000, 0xcc4400, 0xff6633, 0xaa2200, 0xdd5500];
      particle.circle(0, 0, size);
      particle.fill(colors[Math.floor(Math.random() * colors.length)]);
      this.sneezeContainer.addChild(particle);
      this.sneezeParticles.push(particle);

      const cx = this.player.x + this.player.width / 2;
      const cy = this.player.y + this.player.height * 0.3;
      particle.x = cx + (Math.random() - 0.5) * 10;
      particle.y = worldToScreen(cy, camY);
    }

    for (let i = this.sneezeParticles.length - 1; i >= 0; i--) {
      const p = this.sneezeParticles[i];
      // Explode outward in all directions
      const angle = Math.random() * Math.PI * 2;
      p.x += Math.cos(angle) * 2.5;
      p.y += Math.sin(angle) * 2 + 1.5; // drift down slightly
      p.alpha -= 0.04;

      if (p.alpha <= 0) {
        this.sneezeContainer.removeChild(p);
        p.destroy();
        this.sneezeParticles.splice(i, 1);
      }
    }
  }

  private clearSneezeParticles(): void {
    for (const p of this.sneezeParticles) {
      this.sneezeContainer.removeChild(p);
      p.destroy();
    }
    this.sneezeParticles = [];
  }

  // ── Spring particles (upward golden spaghetti trail) ─────────────────────

  private updateSpringParticles(camY: number): void {
    // Spawn coiled spaghetti strand particles shooting downward
    if (this.animTick % 2 === 0) {
      const particle = new Graphics();
      // Draw a tiny spring/zigzag
      const pH = 10 + Math.random() * 6;
      particle.moveTo(0, 0);
      particle.lineTo(4, pH * 0.25);
      particle.lineTo(-4, pH * 0.5);
      particle.lineTo(4, pH * 0.75);
      particle.lineTo(0, pH);
      particle.stroke({ width: 2, color: 0xf0c050, alpha: 0.8 });
      this.springContainer.addChild(particle);
      this.springParticles.push(particle);

      const cx = this.player.x + this.player.width / 2;
      particle.x = cx + (Math.random() - 0.5) * 20;
      particle.y = worldToScreen(this.player.y + this.player.height, camY);
    }

    for (let i = this.springParticles.length - 1; i >= 0; i--) {
      const p = this.springParticles[i];
      p.y += 3; // trail downward
      p.x += (Math.random() - 0.5) * 1.5;
      p.alpha -= 0.03;

      if (p.alpha <= 0) {
        this.springContainer.removeChild(p);
        p.destroy();
        this.springParticles.splice(i, 1);
      }
    }
  }

  private clearSpringParticles(): void {
    for (const p of this.springParticles) {
      this.springContainer.removeChild(p);
      p.destroy();
    }
    this.springParticles = [];
  }

  // ── Lasagna particles (golden shimmer floating upward) ───────────────────

  private updateLasagnaParticles(camY: number): void {
    if (this.animTick % 3 === 0) {
      const particle = new Graphics();
      const size = 2 + Math.random() * 3;
      const colors = [0xffcc00, 0xff8c00, 0xffee66];
      particle.rect(-size / 2, -size / 2, size, size);
      particle.fill(colors[Math.floor(Math.random() * colors.length)]);
      this.lasagnaContainer.addChild(particle);
      this.lasagnaParticles.push(particle);

      const cx = this.player.x + this.player.width / 2;
      particle.x = cx + (Math.random() - 0.5) * 40;
      particle.y = worldToScreen(this.player.y + this.player.height, camY);
      particle.rotation = Math.random() * Math.PI;
    }

    for (let i = this.lasagnaParticles.length - 1; i >= 0; i--) {
      const p = this.lasagnaParticles[i];
      p.y += 1; // drift down slowly (player is floating up)
      p.x += Math.sin(this.animTick * 0.05 + i) * 0.5; // sway
      p.rotation += 0.03;
      p.alpha -= 0.012;

      if (p.alpha <= 0) {
        this.lasagnaContainer.removeChild(p);
        p.destroy();
        this.lasagnaParticles.splice(i, 1);
      }
    }
  }

  private clearLasagnaParticles(): void {
    for (const p of this.lasagnaParticles) {
      this.lasagnaContainer.removeChild(p);
      p.destroy();
    }
    this.lasagnaParticles = [];
  }

  // ── Effect label ───────────────────────────────────────────────────────────

  private showEffectLabel(type: string): void {
    this.clearEffectLabel();
    const label = type.replace("_", " ").toUpperCase();
    this.effectLabel = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 16,
        fill: "#fff",
        fontWeight: "bold",
        stroke: { color: "#000", width: 3 },
      }),
    });
    this.effectLabel.x = GAME_WIDTH / 2;
    this.effectLabel.y = GAME_HEIGHT - 30;
    this.effectLabel.anchor.set(0.5, 0.5);
    this.container.addChild(this.effectLabel);
  }

  private clearEffectLabel(): void {
    if (this.effectLabel) {
      this.container.removeChild(this.effectLabel);
      this.effectLabel.destroy();
      this.effectLabel = null;
    }
  }

  // ── Graphics sync ──────────────────────────────────────────────────────────

  private syncPlatformGraphics(): void {
    for (const platform of this.platforms) {
      if (this.platformGfxMap.has(platform.id)) continue;
      const gfx = new Graphics();
      drawPlatform(gfx, platform.width, platform.height, COLORS.platform[0]);
      this.gameContainer.addChild(gfx);
      this.platformGfxMap.set(platform.id, gfx);
    }
  }

  private syncMeatballGraphics(): void {
    for (const meatball of this.meatballs) {
      if (this.meatballGfxMap.has(meatball.id)) continue;
      const gfx = new Graphics();
      drawMeatball(gfx, meatball.size);
      this.gameContainer.addChild(gfx);
      this.meatballGfxMap.set(meatball.id, gfx);
    }
  }

  private syncPowerUpGraphics(): void {
    for (const pu of this.powerUps) {
      if (this.powerUpGfxMap.has(pu.id)) continue;
      const gfx = new Graphics();
      const color = COLORS.powerups[pu.type] ?? 0xffffff;
      drawPowerUp(gfx, pu.size, color, pu.type);
      this.gameContainer.addChild(gfx);
      this.powerUpGfxMap.set(pu.id, gfx);
    }
  }

  private cleanupGraphics(
    map: Map<number, Graphics>,
    activeIds: number[],
  ): void {
    const idSet = new Set(activeIds);
    for (const [id, gfx] of map) {
      if (!idSet.has(id)) {
        gfx.parent?.removeChild(gfx);
        gfx.destroy();
        map.delete(id);
      }
    }
  }

  destroy(): void {
    this.input.destroy();
    this.clearEffectLabel();
    this.clearTornadoParticles();
    this.clearRocketParticles();
    this.clearLasagnaParticles();
    this.clearSpringParticles();
    this.clearSneezeParticles();
    this.parallax.destroy();
    this.container.destroy({ children: true });
    this.platformGfxMap.clear();
    this.meatballGfxMap.clear();
    this.powerUpGfxMap.clear();
  }
}
