/** PixiJS renderer for config-driven particle emitters. */

import { Container, Graphics } from "pixi.js";
import { GraphicsPool } from "./GraphicsPool";
import type { EmitterState, Particle, ParticleShape } from "../systems/ParticleEmitter";

interface RenderedParticle {
  gfx: Graphics;
  /** ID for tracking — index in source particle array at creation time. */
  particleIndex: number;
}

export class ParticleRenderer {
  readonly container = new Container();
  private pool: GraphicsPool;
  private rendered: RenderedParticle[] = [];

  constructor(pool?: GraphicsPool) {
    this.pool = pool ?? new GraphicsPool();
  }

  /**
   * Sync rendered Graphics objects with the emitter's particle state.
   * Call each frame after tickEmitter.
   *
   * @param emitter Current emitter state
   * @param camY Camera Y for world-to-screen conversion (0 if already in screen coords)
   */
  update(emitter: EmitterState, camY = 0): void {
    const { particles } = emitter;

    // Remove excess rendered particles
    while (this.rendered.length > particles.length) {
      const r = this.rendered.pop()!;
      this.container.removeChild(r.gfx);
      this.pool.release(r.gfx);
    }

    // Add new rendered particles
    while (this.rendered.length < particles.length) {
      const gfx = this.pool.acquire();
      this.container.addChild(gfx);
      this.rendered.push({ gfx, particleIndex: this.rendered.length });
    }

    // Update each rendered particle to match emitter state
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const r = this.rendered[i];
      drawParticleShape(r.gfx, p);
      r.gfx.x = p.x;
      r.gfx.y = p.y - camY;
      r.gfx.alpha = p.alpha;
      r.gfx.scale.set(p.scale);
      r.gfx.rotation = p.rotation;
    }
  }

  /** Clear all rendered particles and return Graphics to pool. */
  clear(): void {
    for (const r of this.rendered) {
      this.container.removeChild(r.gfx);
      this.pool.release(r.gfx);
    }
    this.rendered = [];
  }

  /** Destroy the renderer. */
  destroy(): void {
    this.clear();
    this.container.destroy({ children: true });
  }
}

function drawParticleShape(gfx: Graphics, p: Particle): void {
  gfx.clear();
  const halfSize = p.size / 2;

  switch (p.shape) {
    case "circle":
      gfx.circle(0, 0, halfSize);
      gfx.fill({ color: p.color, alpha: 1 });
      break;

    case "rect":
      gfx.rect(-halfSize, -halfSize, p.size, p.size * 0.6);
      gfx.fill({ color: p.color, alpha: 1 });
      break;

    case "zigzag": {
      const h = p.size;
      gfx.moveTo(0, 0);
      gfx.lineTo(4, h * 0.25);
      gfx.lineTo(-4, h * 0.5);
      gfx.lineTo(4, h * 0.75);
      gfx.lineTo(0, h);
      gfx.stroke({ width: 2, color: p.color, alpha: 1 });
      break;
    }
  }
}
