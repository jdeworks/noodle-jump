/** Particle systems — PixiJS Graphics lifecycle for visual effects. */

import { Container, Graphics } from "pixi.js";
import { worldToScreen } from "../systems/Camera";
import type { PlatformState } from "../entities/Platform";
import {
  createEmitter,
  tickEmitter,
  moveEmitter,
  burstEmitter,
  stopEmitter,
  isEmitterDone,
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
  DRILL_PARTICLES,
  CANNON_PARTICLES,
  GNOCCHI_PARTICLES,
  MINESTRONE_PARTICLES,
  DUST_PARTICLES,
  CRUMBLE_PARTICLES,
} from "../config/particles";

interface Particle {
  gfx: Graphics;
  vx: number;
  vy: number;
  life: number;
}

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
      rigatoni_drill: DRILL_PARTICLES,
      penne_cannon: CANNON_PARTICLES,
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

  updateDustParticles(): void {
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.gfx.x += p.vx;
      p.gfx.y += p.vy;
      p.life--;
      p.gfx.alpha = Math.max(0, p.life / 20);
      p.gfx.scale.set(p.gfx.scale.x * 1.03);
      if (p.life <= 0) {
        this.dustContainer.removeChild(p.gfx);
        p.gfx.destroy();
        this.dustParticles.splice(i, 1);
      }
    }
  }

  // ── Crumble ────────────────────────────────────────────────────────────

  spawnCrumbleParticles(platform: PlatformState, camY: number): void {
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

  updateCrumbleParticles(): void {
    for (let i = this.crumbleParticles.length - 1; i >= 0; i--) {
      const p = this.crumbleParticles[i];
      p.vy += 0.15;
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

  // ── Tornado ────────────────────────────────────────────────────────────

  updateTornadoParticles(
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
    camY: number,
    animTick: number,
  ): void {
    if (animTick % 2 === 0) {
      const particle = new Graphics();
      const size = 3 + Math.random() * 5;
      particle.circle(0, 0, size);
      particle.fill({ color: 0xd4a017, alpha: 0.4 + Math.random() * 0.3 });
      this.tornadoContainer.addChild(particle);
      this.tornadoParticles.push(particle);

      const cx = playerX + playerW / 2;
      const cy = playerY + playerH / 2;
      particle.x = cx + (Math.random() - 0.5) * 20;
      particle.y = worldToScreen(cy, camY) + (Math.random() - 0.5) * 20;
    }

    const cx = playerX + playerW / 2;
    const screenCy = worldToScreen(playerY + playerH / 2, camY);

    for (let i = this.tornadoParticles.length - 1; i >= 0; i--) {
      const p = this.tornadoParticles[i];
      const angle = animTick * 0.12 + i * 0.8;
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

  clearTornadoParticles(): void {
    for (const p of this.tornadoParticles) {
      this.tornadoContainer.removeChild(p);
      p.destroy();
    }
    this.tornadoParticles = [];
  }

  // ── Rocket ─────────────────────────────────────────────────────────────

  updateRocketParticles(
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
    camY: number,
  ): void {
    const cx = playerX + playerW / 2;
    const bottomY = playerY + playerH;

    for (let s = 0; s < 2; s++) {
      const particle = new Graphics();
      const size = 2 + Math.random() * 4;
      const colors = [0xff4500, 0xff8c00, 0xffdd00, 0xff6600];
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.circle(0, 0, size);
      particle.fill({ color, alpha: 0.7 + Math.random() * 0.3 });
      this.rocketContainer.addChild(particle);
      this.rocketParticles.push(particle);

      particle.x = cx + (Math.random() - 0.5) * 14;
      particle.y = worldToScreen(bottomY + 10, camY);
    }

    for (let i = this.rocketParticles.length - 1; i >= 0; i--) {
      const p = this.rocketParticles[i];
      p.y += 2 + Math.random() * 3;
      p.x += (Math.random() - 0.5) * 2;
      p.alpha -= 0.03;
      p.scale.set(p.scale.x * 0.97);

      if (p.alpha <= 0) {
        this.rocketContainer.removeChild(p);
        p.destroy();
        this.rocketParticles.splice(i, 1);
      }
    }
  }

  clearRocketParticles(): void {
    for (const p of this.rocketParticles) {
      this.rocketContainer.removeChild(p);
      p.destroy();
    }
    this.rocketParticles = [];
  }

  // ── Sneeze ─────────────────────────────────────────────────────────────

  updateSneezeParticles(
    playerX: number,
    playerY: number,
    playerW: number,
    playerH: number,
    camY: number,
  ): void {
    for (let s = 0; s < 3; s++) {
      const particle = new Graphics();
      const size = 2 + Math.random() * 4;
      const colors = [0x8b0000, 0xcc4400, 0xff6633, 0xaa2200, 0xdd5500];
      particle.circle(0, 0, size);
      particle.fill(colors[Math.floor(Math.random() * colors.length)]);
      this.sneezeContainer.addChild(particle);
      this.sneezeParticles.push(particle);

      const cx = playerX + playerW / 2;
      const cy = playerY + playerH * 0.3;
      particle.x = cx + (Math.random() - 0.5) * 10;
      particle.y = worldToScreen(cy, camY);
    }

    for (let i = this.sneezeParticles.length - 1; i >= 0; i--) {
      const p = this.sneezeParticles[i];
      const angle = Math.random() * Math.PI * 2;
      p.x += Math.cos(angle) * 2.5;
      p.y += Math.sin(angle) * 2 + 1.5;
      p.alpha -= 0.04;

      if (p.alpha <= 0) {
        this.sneezeContainer.removeChild(p);
        p.destroy();
        this.sneezeParticles.splice(i, 1);
      }
    }
  }

  clearSneezeParticles(): void {
    for (const p of this.sneezeParticles) {
      this.sneezeContainer.removeChild(p);
      p.destroy();
    }
    this.sneezeParticles = [];
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
    if (animTick % 2 === 0) {
      const particle = new Graphics();
      const pH = 10 + Math.random() * 6;
      particle.moveTo(0, 0);
      particle.lineTo(4, pH * 0.25);
      particle.lineTo(-4, pH * 0.5);
      particle.lineTo(4, pH * 0.75);
      particle.lineTo(0, pH);
      particle.stroke({ width: 2, color: 0xf0c050, alpha: 0.8 });
      this.springContainer.addChild(particle);
      this.springParticles.push(particle);

      const cx = playerX + playerW / 2;
      particle.x = cx + (Math.random() - 0.5) * 20;
      particle.y = worldToScreen(playerY + playerH, camY);
    }

    for (let i = this.springParticles.length - 1; i >= 0; i--) {
      const p = this.springParticles[i];
      p.y += 3;
      p.x += (Math.random() - 0.5) * 1.5;
      p.alpha -= 0.03;

      if (p.alpha <= 0) {
        this.springContainer.removeChild(p);
        p.destroy();
        this.springParticles.splice(i, 1);
      }
    }
  }

  clearSpringParticles(): void {
    for (const p of this.springParticles) {
      this.springContainer.removeChild(p);
      p.destroy();
    }
    this.springParticles = [];
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
    if (animTick % 3 === 0) {
      const particle = new Graphics();
      const size = 2 + Math.random() * 3;
      const colors = [0xffcc00, 0xff8c00, 0xffee66];
      particle.rect(-size / 2, -size / 2, size, size);
      particle.fill(colors[Math.floor(Math.random() * colors.length)]);
      this.lasagnaContainer.addChild(particle);
      this.lasagnaParticles.push(particle);

      const cx = playerX + playerW / 2;
      particle.x = cx + (Math.random() - 0.5) * 40;
      particle.y = worldToScreen(playerY + playerH, camY);
      particle.rotation = Math.random() * Math.PI;
    }

    for (let i = this.lasagnaParticles.length - 1; i >= 0; i--) {
      const p = this.lasagnaParticles[i];
      p.y += 1;
      p.x += Math.sin(animTick * 0.05 + i) * 0.5;
      p.rotation += 0.03;
      p.alpha -= 0.012;

      if (p.alpha <= 0) {
        this.lasagnaContainer.removeChild(p);
        p.destroy();
        this.lasagnaParticles.splice(i, 1);
      }
    }
  }

  clearLasagnaParticles(): void {
    for (const p of this.lasagnaParticles) {
      this.lasagnaContainer.removeChild(p);
      p.destroy();
    }
    this.lasagnaParticles = [];
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
