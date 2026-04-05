/** Helper functions extracted from GameScene to keep it under LOC budget. */

import type { Container, Graphics, Text } from "pixi.js";
import type { GameWorldState } from "./GameState";
import type { RenderContext } from "./GameSceneUpdate";
import type { EventHandlerDeps } from "./GameSceneEvents";
import type { ParallaxBackground } from "../systems/Parallax";
import type { ParticleManager } from "./ParticleManager";
import type { EffectRenderer } from "./EffectRenderer";
import type { GraphicsSync } from "./GraphicsSync";
import type { TrailRenderer } from "../rendering/TrailRenderer";
import type { FloatingTextManager } from "./FloatingText";
import type { ZoneTransition } from "./ZoneTransition";
import { handleEvents } from "./GameSceneEvents";
import { spawnPendingBoss } from "./GameLoopBoss";

export interface SceneComponents {
  state: GameWorldState;
  parallax: ParallaxBackground;
  particles: ParticleManager;
  effectRenderer: EffectRenderer;
  gfxSync: GraphicsSync;
  trail: TrailRenderer;
  floatingTextMgr: FloatingTextManager;
  gameContainer: Container;
  playerGfx: Graphics;
  weatherContainer: Container;
  weatherGfx: Graphics[];
  windGfx: Graphics;
  bossGfx: Graphics;
  bossArcGfx: Graphics;
  bossHealthGfx: Graphics;
  bossAttackGfx: Graphics[];
  knifeAmmoText: Text;
  knifeAmmoIcons: Container;
  hitboxGfx: Graphics;
  tentacleGfx: Graphics;
  comboGlowGfx: Graphics;
  cosmeticTrail: string | null;
  cosmeticTint: number;
  cosmeticTheme: string;
  inputX: number;
  container: Container;
  zoneTransition: ZoneTransition;
}

export function buildRenderContext(c: SceneComponents): RenderContext {
  return {
    state: c.state, camY: c.state.camera.y,
    interpPlayerX: c.state.player.x, interpPlayerY: c.state.player.y,
    parallax: c.parallax, particles: c.particles,
    effectRenderer: c.effectRenderer, gfxSync: c.gfxSync,
    trail: c.trail, floatingTextMgr: c.floatingTextMgr,
    gameContainer: c.gameContainer, playerGfx: c.playerGfx,
    weatherContainer: c.weatherContainer, weatherGfx: c.weatherGfx,
    windGfx: c.windGfx, bossGfx: c.bossGfx,
    bossArcGfx: c.bossArcGfx, bossHealthGfx: c.bossHealthGfx,
    bossAttackGfx: c.bossAttackGfx, knifeAmmoText: c.knifeAmmoText,
    knifeAmmoIcons: c.knifeAmmoIcons, hitboxGfx: c.hitboxGfx,
    tentacleGfx: c.tentacleGfx, comboGlowGfx: c.comboGlowGfx,
    cosmeticTrail: c.cosmeticTrail, cosmeticTint: c.cosmeticTint,
    cosmeticTheme: c.cosmeticTheme, inputX: c.inputX,
  };
}

export function buildEventDeps(c: SceneComponents): EventHandlerDeps {
  return {
    state: c.state, particles: c.particles,
    effectRenderer: c.effectRenderer, zoneTransition: c.zoneTransition,
    gfxSync: c.gfxSync, container: c.container, gameContainer: c.gameContainer,
    spawnFloatingText: (msg, color, size?, duration?, centered?) => {
      c.floatingTextMgr.spawn(
        c.container, msg, color, c.state.player.x, c.state.player.y,
        c.state.player.width, c.state.camera.y, size, duration, centered,
      );
    },
  };
}

export function tickBossTransition(c: SceneComponents): GameWorldState {
  const wasActive = c.zoneTransition.isActive();
  if (!wasActive && c.state.pendingBossZone !== null) {
    c.zoneTransition.playBoss();
  }
  c.zoneTransition.update();
  if (wasActive && !c.zoneTransition.isActive() && c.state.pendingBossZone !== null) {
    const ev: import("./GameLoopTypes").GameEvent[] = [];
    const newState = spawnPendingBoss(c.state, ev);
    handleEvents(ev, buildEventDeps({ ...c, state: newState }));
    return newState;
  }
  return c.state;
}

/** Auto-aim throw — targets nearest boss or enemy. */
export function autoAimTarget(state: GameWorldState): { tx: number; ty: number } | null {
  if (!state.enemiesEnabled && !state.inBossFight) return null;
  const px = state.player.x + state.player.width / 2;
  const py = state.player.y + state.player.height / 2;
  let tx = px, ty = py - 200;
  const b = state.activeBoss;
  if (b) { tx = b.x + b.width / 2; ty = b.y + b.height / 2; }
  else if (state.enemies.length > 0) {
    let best = Infinity;
    for (const e of state.enemies) {
      const d = (e.x - px) ** 2 + (e.y - py) ** 2;
      if (d < best) { best = d; tx = e.x; ty = e.y; }
    }
  }
  return { tx, ty };
}
