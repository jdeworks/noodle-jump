/** Event dispatch for GameScene — maps game events to audio/visual side effects. */

import type { Container } from "pixi.js";
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
import type { GameWorldState } from "./GameState";
import type { GameEvent } from "./GameLoop";
import type { ParticleManager } from "./ParticleManager";
import type { EffectRenderer } from "./EffectRenderer";
import type { ZoneTransition } from "./ZoneTransition";
import type { GraphicsSync } from "./GraphicsSync";

export interface EventHandlerDeps {
  state: GameWorldState;
  particles: ParticleManager;
  effectRenderer: EffectRenderer;
  zoneTransition: ZoneTransition;
  gfxSync: GraphicsSync;
  container: Container;
  gameContainer: Container;
  spawnFloatingText: (
    msg: string,
    color: number,
    size?: number,
    duration?: number,
    centered?: boolean,
  ) => void;
}

export function handleEvents(events: GameEvent[], deps: EventHandlerDeps): void {
  const { state, particles, effectRenderer, zoneTransition, gfxSync, container, gameContainer } = deps;

  for (const event of events) {
    switch (event.type) {
      case "landed":
        playSfxLanding();
        particles.spawnDustPuff(
          event.x,
          event.y,
          state.camera.y,
        );
        if (event.edgeLanding) {
          playSfxCloseCall();
          deps.spawnFloatingText("CLOSE CALL!", 0xffdd44);
        }
        break;

      case "landingStreak":
        playSfxLandingStreak();
        break;

      case "meatballCollected":
        playSfxMeatball();
        break;

      case "comboActive":
        playSfxComboEscalation(event.multiplier);
        deps.spawnFloatingText(
          `${event.multiplier}x COMBO!`,
          0xff8800,
        );
        break;

      case "powerUpCollected":
        playSfxPowerUp(event.powerUpType);
        effectRenderer.showEffectLabel(
          event.powerUpType,
          container,
        );
        break;

      case "effectEnded":
        effectRenderer.clearEffectLabel(container);
        break;

      case "died":
        playSfxDeath();
        break;

      case "zoneChanged":
        crossfadeToZone(event.to);
        setAmbientZone(event.to);
        zoneTransition.play(event.to);
        break;

      case "enemyKilled":
        playSfxEnemyKill();
        deps.spawnFloatingText("+MEATBALL!", 0xff8800);
        break;

      case "enemyHitPlayer":
        playSfxShieldAbsorb();
        break;

      case "projectileThrown":
        playSfxThrow();
        break;

      case "windGust":
        playSfxWindGust();
        deps.spawnFloatingText(
          event.direction > 0 ? "WIND >>>" : "<<< WIND",
          0xaaddff,
          16,
          60,
          true,
        );
        break;

      case "bossSpawned":
        playBossMusic();
        deps.spawnFloatingText("BOSS!", 0xff4444, 32, 90, true);
        break;

      case "bossDamaged":
        deps.spawnFloatingText("HIT!", 0xffdd44);
        break;

      case "bossKilled":
        stopBossMusic();
        deps.spawnFloatingText("BOSS DEFEATED!", 0x44ff44, 24, 120, true);
        break;

      case "bossAttack":
      case "tentacleGrab":
        break;

      case "springBounce":
      case "teleported":
        break;

      case "platformCrumbled":
        playSfxPlatformCrumble();
        particles.spawnCrumbleParticles(
          event.platform,
          state.camera.y,
        );
        break;

      case "stagnantWarning":
        if (event.level === 1) {
          deps.spawnFloatingText(
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
        gfxSync.syncPlatforms(
          state.platforms,
          gameContainer,
        );
        break;

      case "gameOver":
        break;
    }
  }
}
