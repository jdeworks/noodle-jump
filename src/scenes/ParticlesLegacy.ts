/** Bespoke particle update/clear functions for legacy particle systems. */

import { Container, Graphics } from "pixi.js";
import { worldToScreen } from "../systems/Camera";

export interface Particle {
  gfx: Graphics;
  vx: number;
  vy: number;
  life: number;
}

/** Remove dead particle at index using swap-and-pop (O(1) instead of O(n) splice). */
function removeFast<T>(arr: T[], i: number): void {
  arr[i] = arr[arr.length - 1];
  arr.pop();
}

// ── Dust puff ──────────────────────────────────────────────────────────

export function spawnDustPuff(
  worldX: number,
  worldY: number,
  camY: number,
  dustContainer: Container,
  dustParticles: Particle[],
): void {
  for (let i = 0; i < 5; i++) {
    const gfx = new Graphics();
    const size = 2 + Math.random() * 3;
    gfx.circle(0, 0, size);
    gfx.fill({ color: 0xccbbaa, alpha: 0.6 });
    gfx.x = worldX + (Math.random() - 0.5) * 20;
    gfx.y = worldToScreen(worldY, camY);
    dustContainer.addChild(gfx);
    dustParticles.push({
      gfx,
      vx: (Math.random() - 0.5) * 2,
      vy: -0.5 - Math.random() * 1.5,
      life: 15 + Math.floor(Math.random() * 10),
    });
  }
}

export function updateDustParticles(dustContainer: Container, dustParticles: Particle[]): void {
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    const p = dustParticles[i];
    p.gfx.x += p.vx;
    p.gfx.y += p.vy;
    p.life--;
    p.gfx.alpha = Math.max(0, p.life / 20);
    p.gfx.scale.set(p.gfx.scale.x * 1.03);
    if (p.life <= 0) {
      dustContainer.removeChild(p.gfx);
      p.gfx.destroy();
      removeFast(dustParticles, i);
    }
  }
}

// ── Crumble ────────────────────────────────────────────────────────────

export function spawnCrumbleParticles(
  platformX: number,
  platformY: number,
  platformWidth: number,
  camY: number,
  crumbleContainer: Container,
  crumbleParticles: Particle[],
): void {
  for (let i = 0; i < 7; i++) {
    const gfx = new Graphics();
    const size = 3 + Math.random() * 5;
    gfx.rect(0, 0, size, size * 0.6);
    gfx.fill(0xd4a574);
    gfx.x = platformX + Math.random() * platformWidth;
    gfx.y = worldToScreen(platformY, camY);
    crumbleContainer.addChild(gfx);
    crumbleParticles.push({
      gfx,
      vx: (Math.random() - 0.5) * 3,
      vy: -1 - Math.random() * 2,
      life: 40 + Math.floor(Math.random() * 20),
    });
  }
}

export function updateCrumbleParticles(
  crumbleContainer: Container,
  crumbleParticles: Particle[],
): void {
  for (let i = crumbleParticles.length - 1; i >= 0; i--) {
    const p = crumbleParticles[i];
    p.vy += 0.15;
    p.gfx.x += p.vx;
    p.gfx.y += p.vy;
    p.life--;
    p.gfx.alpha = Math.max(0, p.life / 40);
    p.gfx.rotation += 0.05;
    if (p.life <= 0) {
      crumbleContainer.removeChild(p.gfx);
      p.gfx.destroy();
      removeFast(crumbleParticles, i);
    }
  }
}

// ── Tornado ────────────────────────────────────────────────────────────

export function updateTornadoParticles(
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number,
  camY: number,
  animTick: number,
  tornadoContainer: Container,
  tornadoParticles: Graphics[],
): void {
  if (animTick % 2 === 0) {
    const particle = new Graphics();
    const size = 3 + Math.random() * 5;
    particle.circle(0, 0, size);
    particle.fill({ color: 0xd4a017, alpha: 0.4 + Math.random() * 0.3 });
    tornadoContainer.addChild(particle);
    tornadoParticles.push(particle);

    const cx = playerX + playerW / 2;
    const cy = playerY + playerH / 2;
    particle.x = cx + (Math.random() - 0.5) * 20;
    particle.y = worldToScreen(cy, camY) + (Math.random() - 0.5) * 20;
  }

  const cx = playerX + playerW / 2;
  const screenCy = worldToScreen(playerY + playerH / 2, camY);

  for (let i = tornadoParticles.length - 1; i >= 0; i--) {
    const p = tornadoParticles[i];
    const angle = animTick * 0.12 + i * 0.8;
    const radius = 10 + (tornadoParticles.length - i) * 2;
    p.x = cx + Math.cos(angle) * radius;
    p.y = screenCy + Math.sin(angle) * radius * 0.5 + (tornadoParticles.length - i) * 1.5;
    p.alpha -= 0.015;
    p.scale.set(p.scale.x * 0.995);

    if (p.alpha <= 0) {
      tornadoContainer.removeChild(p);
      p.destroy();
      removeFast(tornadoParticles, i);
    }
  }
}

export function clearGraphicsArray(container: Container, particles: Graphics[]): void {
  for (const p of particles) {
    container.removeChild(p);
    p.destroy();
  }
  particles.length = 0;
}

// ── Rocket ─────────────────────────────────────────────────────────────

export function updateRocketParticles(
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number,
  camY: number,
  rocketContainer: Container,
  rocketParticles: Graphics[],
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
    rocketContainer.addChild(particle);
    rocketParticles.push(particle);

    particle.x = cx + (Math.random() - 0.5) * 14;
    particle.y = worldToScreen(bottomY + 10, camY);
  }

  for (let i = rocketParticles.length - 1; i >= 0; i--) {
    const p = rocketParticles[i];
    p.y += 2 + Math.random() * 3;
    p.x += (Math.random() - 0.5) * 2;
    p.alpha -= 0.03;
    p.scale.set(p.scale.x * 0.97);

    if (p.alpha <= 0) {
      rocketContainer.removeChild(p);
      p.destroy();
      removeFast(rocketParticles, i);
    }
  }
}

// ── Sneeze ─────────────────────────────────────────────────────────────

export function updateSneezeParticles(
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number,
  camY: number,
  sneezeContainer: Container,
  sneezeParticles: Graphics[],
): void {
  for (let s = 0; s < 3; s++) {
    const particle = new Graphics();
    const size = 2 + Math.random() * 4;
    const colors = [0x8b0000, 0xcc4400, 0xff6633, 0xaa2200, 0xdd5500];
    particle.circle(0, 0, size);
    particle.fill(colors[Math.floor(Math.random() * colors.length)]);
    sneezeContainer.addChild(particle);
    sneezeParticles.push(particle);

    const cx = playerX + playerW / 2;
    const cy = playerY + playerH * 0.3;
    particle.x = cx + (Math.random() - 0.5) * 10;
    particle.y = worldToScreen(cy, camY);
  }

  for (let i = sneezeParticles.length - 1; i >= 0; i--) {
    const p = sneezeParticles[i];
    const angle = Math.random() * Math.PI * 2;
    p.x += Math.cos(angle) * 2.5;
    p.y += Math.sin(angle) * 2 + 1.5;
    p.alpha -= 0.04;

    if (p.alpha <= 0) {
      sneezeContainer.removeChild(p);
      p.destroy();
      removeFast(sneezeParticles, i);
    }
  }
}

// ── Spring ─────────────────────────────────────────────────────────────

export function updateSpringParticles(
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number,
  camY: number,
  animTick: number,
  springContainer: Container,
  springParticles: Graphics[],
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
    springContainer.addChild(particle);
    springParticles.push(particle);

    const cx = playerX + playerW / 2;
    particle.x = cx + (Math.random() - 0.5) * 20;
    particle.y = worldToScreen(playerY + playerH, camY);
  }

  for (let i = springParticles.length - 1; i >= 0; i--) {
    const p = springParticles[i];
    p.y += 3;
    p.x += (Math.random() - 0.5) * 1.5;
    p.alpha -= 0.03;

    if (p.alpha <= 0) {
      springContainer.removeChild(p);
      p.destroy();
      removeFast(springParticles, i);
    }
  }
}

// ── Lasagna ────────────────────────────────────────────────────────────

export function updateLasagnaParticles(
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number,
  camY: number,
  animTick: number,
  lasagnaContainer: Container,
  lasagnaParticles: Graphics[],
): void {
  if (animTick % 3 === 0) {
    const particle = new Graphics();
    const size = 2 + Math.random() * 3;
    const colors = [0xffcc00, 0xff8c00, 0xffee66];
    particle.rect(-size / 2, -size / 2, size, size);
    particle.fill(colors[Math.floor(Math.random() * colors.length)]);
    lasagnaContainer.addChild(particle);
    lasagnaParticles.push(particle);

    const cx = playerX + playerW / 2;
    particle.x = cx + (Math.random() - 0.5) * 40;
    particle.y = worldToScreen(playerY + playerH, camY);
    particle.rotation = Math.random() * Math.PI;
  }

  for (let i = lasagnaParticles.length - 1; i >= 0; i--) {
    const p = lasagnaParticles[i];
    p.y += 1;
    p.x += Math.sin(animTick * 0.05 + i) * 0.5;
    p.rotation += 0.03;
    p.alpha -= 0.012;

    if (p.alpha <= 0) {
      lasagnaContainer.removeChild(p);
      p.destroy();
      removeFast(lasagnaParticles, i);
    }
  }
}
