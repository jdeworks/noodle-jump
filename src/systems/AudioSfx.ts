/** All SFX functions — procedural Web Audio synthesis. */

import { ensureContext, playTone, playNoise, isSfxEnabled } from "./Audio";

export function playSfxJump(): void {
  playTone(200, 0.08, "square", 0.06, 400);
}
export function playSfxMeatball(): void {
  playTone(880, 0.1, "sine", 0.08);
}
export function playSfxCombo(multiplier: number): void {
  const f = 600 + multiplier * 200;
  playTone(f, 0.12, "sine", 0.1, f + 200);
}
export function playSfxPositivePowerUp(): void {
  if (!ensureContext() || !isSfxEnabled()) return;
  [523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 0.1, "triangle", 0.1), i * 60));
}
export function playSfxNegativePowerUp(): void {
  if (!ensureContext() || !isSfxEnabled()) return;
  playTone(311, 0.15, "sawtooth", 0.1);
  setTimeout(() => playTone(233, 0.2, "sawtooth", 0.1), 150);
}
export function playSfxDeath(): void {
  playTone(300, 0.5, "triangle", 0.12, 50);
}
export function playSfxHighScore(): void {
  if (!ensureContext() || !isSfxEnabled()) return;
  [523, 587, 659, 698, 784, 880].forEach((f, i) =>
    setTimeout(() => playTone(f, 0.12, "triangle", 0.08), i * 80),
  );
}
export function playSfxPlatformCrumble(): void {
  playNoise(0.12, 0.06);
}
export function playSfxCloseCall(): void {
  playTone(1200, 0.06, "sine", 0.06, 1600);
}
export function playSfxLandingStreak(): void {
  if (!ensureContext() || !isSfxEnabled()) return;
  playTone(700, 0.08, "square", 0.08, 1000);
  setTimeout(() => playTone(900, 0.1, "square", 0.08, 1200), 80);
}

export function playSfxPowerUp(type: string): void {
  if (!ensureContext() || !isSfxEnabled()) return;
  switch (type) {
    case "spaghetti_spring":
      playTone(300, 0.08, "square", 0.08, 800);
      break;
    case "fusilli_tornado":
      playTone(200, 0.2, "sawtooth", 0.06, 500);
      break;
    case "ravioli_rocket":
      playNoise(0.15, 0.08);
      setTimeout(() => playTone(150, 0.3, "sawtooth", 0.06, 400), 50);
      break;
    case "lasagna_layers":
      [659, 784, 988].forEach((f, i) => setTimeout(() => playTone(f, 0.08, "sine", 0.06), i * 40));
      break;
    case "pepper_sneeze":
      playNoise(0.08, 0.1);
      setTimeout(() => playTone(800, 0.06, "square", 0.08, 200), 60);
      break;
    case "meatball_magnet":
      playTone(120, 0.2, "sine", 0.06, 180);
      break;
    case "pasta_shield":
      [523, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.1, "sine", 0.07), i * 50));
      break;

    case "gnocchi_bounce":
      playTone(400, 0.06, "sine", 0.08, 600);
      setTimeout(() => playTone(500, 0.06, "sine", 0.06, 700), 60);
      break;
    case "minestrone_soup":
      [200, 250, 220, 280].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.04, "sine", 0.05), i * 30),
      );
      break;
    case "chili_pepper":
      playTone(311, 0.15, "sawtooth", 0.1);
      setTimeout(() => playTone(200, 0.2, "sawtooth", 0.08), 120);
      break;
    case "soggy_noodle":
      playTone(250, 0.2, "triangle", 0.08, 150);
      break;
    case "garlic_breath":
      playTone(180, 0.2, "sawtooth", 0.06, 120);
      break;
    case "burnt_toast":
      playNoise(0.15, 0.08);
      playTone(100, 0.15, "square", 0.04);
      break;
    default:
      playSfxPositivePowerUp();
      break;
  }
}

export function playSfxLanding(platformType?: string): void {
  switch (platformType) {
    case "spring":
      playTone(300, 0.1, "square", 0.07, 900);
      break;
    case "ice":
      playTone(1000, 0.06, "sine", 0.04, 1400);
      break;
    case "conveyor":
      playTone(180, 0.08, "square", 0.05, 250);
      break;
    case "teleport":
      playTone(600, 0.15, "sine", 0.06, 1200);
      break;
    case "crumbling":
      playTone(150, 0.1, "square", 0.05, 100);
      break;
    case "weighted":
      playTone(120, 0.1, "triangle", 0.06, 200);
      break;
    case "brittle":
      playTone(250, 0.06, "square", 0.05, 180);
      break;
    case "breaking":
      playTone(220, 0.06, "square", 0.04, 150);
      break;
    case "moving":
      playTone(230, 0.08, "square", 0.06, 350);
      break;
    default:
      playTone(200, 0.08, "square", 0.06, 400);
      break;
  }
}

export function playSfxComboEscalation(mult: number): void {
  const f = 400 + mult * 150;
  playTone(f, 0.08, "sine", 0.08, f + mult * 100);
}
export function playSfxWhoosh(): void {
  playNoise(0.08, 0.04);
  playTone(300, 0.1, "sawtooth", 0.03, 500);
}
export function playSfxCrumbleWarning(): void {
  playTone(150, 0.06, "square", 0.05, 100);
}
export function playSfxEnemyKill(): void {
  playTone(600, 0.08, "square", 0.08, 900);
  setTimeout(() => playTone(800, 0.06, "sine", 0.06), 60);
}
export function playSfxShieldAbsorb(): void {
  playTone(500, 0.12, "sine", 0.08, 800);
  playTone(700, 0.08, "triangle", 0.06);
}
export function playSfxThrow(): void {
  playTone(400, 0.06, "sawtooth", 0.05, 600);
}
export function playSfxWindGust(): void {
  playNoise(0.3, 0.04);
}
