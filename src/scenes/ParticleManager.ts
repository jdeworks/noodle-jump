/** Particle systems — PixiJS Graphics lifecycle for visual effects. */

import { Container, Graphics } from "pixi.js";
import type { PlatformState } from "../entities/Platform";
import {
  createEmitter,
  tickEmitter,
  moveEmitter,
  type EmitterState,
} from "../systems/ParticleEmitter";
import { ParticleRenderer } from "../rendering/ParticleRenderer";
import { GraphicsPool } from "../rendering/GraphicsPool";
import {
  CHILI_PARTICLES,
  SOGGY_PARTICLES,
  GARLIC_PARTICLES,
  BURNT_PARTICLES,
  MAGNET_PARTICLES,
  SHIELD_PARTICLES,
  GNOCCHI_PARTICLES,
  MINESTRONE_PARTICLES,
} from "../config/particles";
import {
  type Particle,
  spawnDustPuff as legacySpawnDustPuff,
  updateDustParticles as legacyUpdateDust,
  spawnCrumbleParticles as legacySpawnCrumble,
  updateCrumbleParticles as legacyUpdateCrumble,
  updateTornadoParticles as legacyUpdateTornado,
  clearGraphicsArray,
  updateRocketParticles as legacyUpdateRocket,
  updateSneezeParticles as legacyUpdateSneeze,
  updateSpringParticles as legacyUpdateSpring,
  updateLasagnaParticles as legacyUpdateLasagna,
} from "./ParticlesLegacy";

export class ParticleManager {
  // Containers (added to game container by GameScene)
  readonly dustContainer = new Container();
  readonly crumbleContainer = new Container();
  readonly tornadoContainer = new Container();
  readonly rocketContainer = new Container();
  readonly sneezeContainer = new Container();
  readonly springContainer = new Container();
  readonly lasagnaContainer = new Container();

  private dustParticles: Particle[] = [];
  private crumbleParticles: Particle[] = [];
  private tornadoParticles: Graphics[] = [];
  private rocketParticles: Graphics[] = [];
  private sneezeParticles: Graphics[] = [];
  private springParticles: Graphics[] = [];
  private lasagnaParticles: Graphics[] = [];

  // Config-driven emitters (new particle system)
  private pool = new GraphicsPool();
  private effectEmitter: EmitterState | null = null;
  private effectRenderer: ParticleRenderer | null = null;
  readonly effectParticleContainer = new Container();

  /**
   * Start a config-driven effect emitter for power-ups that
   * previously had no particles (chili, soggy, garlic, burnt, magnet).
   */
  startEffectEmitter(
    type: string,
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
  ): void {
    const configMap: Record<string, typeof CHILI_PARTICLES> = {
      chili_pepper: CHILI_PARTICLES,
      soggy_noodle: SOGGY_PARTICLES,
      garlic_breath: GARLIC_PARTICLES,
      burnt_toast: BURNT_PARTICLES,
      meatball_magnet: MAGNET_PARTICLES,
      pasta_shield: SHIELD_PARTICLES,
      gnocchi_bounce: GNOCCHI_PARTICLES,
      minestrone_soup: MINESTRONE_PARTICLES,
    };
    const config = configMap[type];
    if (!config) return;

    this.clearEffectEmitter();
    const cx = playerX + playerW / 2;
    const cy = playerY + playerH / 2;
    this.effectEmitter = createEmitter(config, cx, cy);
    this.effectRenderer = new ParticleRenderer(this.pool);
    this.effectParticleContainer.addChild(this.effectRenderer.container);
  }

  /** Update the config-driven effect emitter following the player. */
  updateEffectEmitter(
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
    camY: number,
  ): void {
    if (!this.effectEmitter || !this.effectRenderer) return;
    const cx = playerX + playerW / 2;
    const cy = playerY + playerH / 2;
    this.effectEmitter = moveEmitter(this.effectEmitter, cx, cy);
    this.effectEmitter = tickEmitter(this.effectEmitter);
    this.effectRenderer.update(this.effectEmitter, camY);
  }

  /** Clear the config-driven effect emitter. */
  clearEffectEmitter(): void {
    if (this.effectRenderer) {
      this.effectParticleContainer.removeChild(this.effectRenderer.container);
      this.effectRenderer.destroy();
      this.effectRenderer = null;
    }
    this.effectEmitter = null;
  }

  /** Check if there's an active config-driven emitter. */
  hasEffectEmitter(): boolean {
    return this.effectEmitter !== null;
  }

  // ── Dust puff ──────────────────────────────────────────────────────────

  spawnDustPuff(worldX: number, worldY: number, camY: number): void {
    legacySpawnDustPuff(worldX, worldY, camY, this.dustContainer, this.dustParticles);
  }

  updateDustParticles(): void {
    legacyUpdateDust(this.dustContainer, this.dustParticles);
  }

  // ── Crumble ────────────────────────────────────────────────────────────

  spawnCrumbleParticles(platform: PlatformState, camY: number): void {
    legacySpawnCrumble(
      platform.x,
      platform.y,
      platform.width,
      camY,
      this.crumbleContainer,
      this.crumbleParticles,
    );
  }

  updateCrumbleParticles(): void {
    legacyUpdateCrumble(this.crumbleContainer, this.crumbleParticles);
  }

  // ── Tornado ────────────────────────────────────────────────────────────

  updateTornadoParticles(
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
    camY: number,
    animTick: number,
  ): void {
    legacyUpdateTornado(
      playerX,
      playerY,
      playerW,
      playerH,
      camY,
      animTick,
      this.tornadoContainer,
      this.tornadoParticles,
    );
  }

  clearTornadoParticles(): void {
    clearGraphicsArray(this.tornadoContainer, this.tornadoParticles);
  }

  // ── Rocket ─────────────────────────────────────────────────────────────

  updateRocketParticles(
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
    camY: number,
  ): void {
    legacyUpdateRocket(
      playerX,
      playerY,
      playerW,
      playerH,
      camY,
      this.rocketContainer,
      this.rocketParticles,
    );
  }

  clearRocketParticles(): void {
    clearGraphicsArray(this.rocketContainer, this.rocketParticles);
  }

  // ── Sneeze ─────────────────────────────────────────────────────────────

  updateSneezeParticles(
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
    camY: number,
  ): void {
    legacyUpdateSneeze(
      playerX,
      playerY,
      playerW,
      playerH,
      camY,
      this.sneezeContainer,
      this.sneezeParticles,
    );
  }

  clearSneezeParticles(): void {
    clearGraphicsArray(this.sneezeContainer, this.sneezeParticles);
  }

  // ── Spring ─────────────────────────────────────────────────────────────

  updateSpringParticles(
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
    camY: number,
    animTick: number,
  ): void {
    legacyUpdateSpring(
      playerX,
      playerY,
      playerW,
      playerH,
      camY,
      animTick,
      this.springContainer,
      this.springParticles,
    );
  }

  clearSpringParticles(): void {
    clearGraphicsArray(this.springContainer, this.springParticles);
  }

  // ── Lasagna ────────────────────────────────────────────────────────────

  updateLasagnaParticles(
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
    camY: number,
    animTick: number,
  ): void {
    legacyUpdateLasagna(
      playerX,
      playerY,
      playerW,
      playerH,
      camY,
      animTick,
      this.lasagnaContainer,
      this.lasagnaParticles,
    );
  }

  clearLasagnaParticles(): void {
    clearGraphicsArray(this.lasagnaContainer, this.lasagnaParticles);
  }

  // ── Bulk operations ────────────────────────────────────────────────────

  clearAllPowerUpParticles(): void {
    this.clearTornadoParticles();
    this.clearRocketParticles();
    this.clearLasagnaParticles();
    this.clearSpringParticles();
    this.clearSneezeParticles();
    this.clearEffectEmitter();
  }

  destroy(): void {
    this.clearAllPowerUpParticles();
    this.clearEffectEmitter();
    this.pool.destroy();
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      this.dustContainer.removeChild(this.dustParticles[i].gfx);
      this.dustParticles[i].gfx.destroy();
    }
    this.dustParticles = [];
    for (let i = this.crumbleParticles.length - 1; i >= 0; i--) {
      this.crumbleContainer.removeChild(this.crumbleParticles[i].gfx);
      this.crumbleParticles[i].gfx.destroy();
    }
    this.crumbleParticles = [];
  }
}
