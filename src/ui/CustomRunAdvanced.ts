/** Advanced debug option rows and bottom bar for CustomRunScreen. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { DebugConfig } from "../config/debug";
import { ALL_POWER_UP_TYPES } from "../systems/CustomRunConfig";
import { addRow, addToggleRow, type TapRegion } from "./CustomRunStorage";
import { getUITheme } from "./ThemeUI";

/** Render advanced debug option rows. Returns updated Y. */
export function addAdvancedDebugRows(
  scrollContent: Container, tapRegions: TapRegion[], gameWidth: number,
  debugCfg: DebugConfig, y: number, onRender: () => void,
): number {
  const allTypes = ["(none)", ...ALL_POWER_UP_TYPES];
  const currentForce = debugCfg.forcePowerUpType ?? "(none)";
  y = addRow(scrollContent, tapRegions, gameWidth, `Force PowerUp: ${currentForce.replace(/_/g, " ")}`, "[Next]", y, () => {
    const idx = allTypes.indexOf(currentForce);
    debugCfg.forcePowerUpType = allTypes[(idx + 1) % allTypes.length] === "(none)" ? null : allTypes[(idx + 1) % allTypes.length];
    onRender();
  });

  const platTypes = ["(none)", "static", "breaking", "brittle", "moving", "conveyor", "spring", "ice", "crumbling", "teleport", "weighted"];
  const curPlat = debugCfg.forcePlatformType ?? "(none)";
  y = addRow(scrollContent, tapRegions, gameWidth, `Force Platform: ${curPlat.replace(/_/g, " ")}`, "[Next]", y, () => {
    const idx = platTypes.indexOf(curPlat);
    const next = platTypes[(idx + 1) % platTypes.length];
    debugCfg.forcePlatformType = next === "(none)" ? null : next;
    onRender();
  });

  const bossTypes = ["(none)", "chef_rival", "kraken", "ufo"];
  const curBoss = debugCfg.forceBossType ?? "(none)";
  y = addRow(scrollContent, tapRegions, gameWidth, `Force Boss: ${curBoss.replace(/_/g, " ")}`, "[Next]", y, () => {
    const idx = bossTypes.indexOf(curBoss);
    debugCfg.forceBossType = bossTypes[(idx + 1) % bossTypes.length] === "(none)" ? null : bossTypes[(idx + 1) % bossTypes.length];
    onRender();
  });

  y = addRow(scrollContent, tapRegions, gameWidth,
    `Boss At Plat: ${debugCfg.forceBossAtPlatforms === 0 ? "OFF" : debugCfg.forceBossAtPlatforms}`, "[Cycle]", y, () => {
      const opts = [0, 10, 25, 50, 100, 200];
      debugCfg.forceBossAtPlatforms = opts[(opts.indexOf(debugCfg.forceBossAtPlatforms) + 1) % opts.length];
      onRender();
    });

  y = addRow(scrollContent, tapRegions, gameWidth,
    `Enemy Spawn: ${debugCfg.enemySpawnMultiplier.toFixed(1)}x`, "[Cycle]", y, () => {
      const opts = [1.0, 2.0, 3.0, 5.0, 10.0, 0.5];
      const idx = opts.findIndex(o => Math.abs(o - debugCfg.enemySpawnMultiplier) < 0.01);
      debugCfg.enemySpawnMultiplier = opts[(idx + 1) % opts.length];
      onRender();
    });

  y = addRow(scrollContent, tapRegions, gameWidth,
    `Boss Attack: ${debugCfg.bossAttackMultiplier.toFixed(1)}x`, "[Cycle]", y, () => {
      const opts = [1.0, 2.0, 3.0, 5.0, 0.5];
      const idx = opts.findIndex(o => Math.abs(o - debugCfg.bossAttackMultiplier) < 0.01);
      debugCfg.bossAttackMultiplier = opts[(idx + 1) % opts.length];
      onRender();
    });

  y = addToggleRow(scrollContent, tapRegions, gameWidth, "Disable Weather", debugCfg.disableWeather, y, () => {
    debugCfg.disableWeather = !debugCfg.disableWeather; onRender();
  });
  y = addToggleRow(scrollContent, tapRegions, gameWidth, "Disable Parallax", debugCfg.disableParallax, y, () => {
    debugCfg.disableParallax = !debugCfg.disableParallax; onRender();
  });
  y = addToggleRow(scrollContent, tapRegions, gameWidth, "Disable Particles", debugCfg.disableEffectParticles, y, () => {
    debugCfg.disableEffectParticles = !debugCfg.disableEffectParticles; onRender();
  });
  return y;
}

/** Create the fixed bottom bar with Start, Reset, and Back buttons. */
export function createBottomBar(
  container: Container,
  gameWidth: number, gameHeight: number, bottomH: number,
  callbacks: { onStart: () => void; onReset: () => void; onBack: () => void },
): void {
  const bottomBg = new Graphics();
  bottomBg.rect(0, gameHeight - bottomH, gameWidth, bottomH);
  bottomBg.fill({ color: getUITheme().bg, alpha: 0.95 });
  bottomBg.eventMode = "static";
  container.addChild(bottomBg);

  const startBtn = new Text({
    text: "[ START RUN ]",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 20, fill: "#44ff44", fontWeight: "bold" }),
  });
  startBtn.x = gameWidth / 2; startBtn.y = gameHeight - bottomH + 16;
  startBtn.anchor.set(0.5, 0.5); startBtn.eventMode = "static"; startBtn.cursor = "pointer";
  startBtn.on("pointertap", callbacks.onStart);
  container.addChild(startBtn);

  const resetBtn = new Text({
    text: "[Reset All]",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#ff8866" }),
  });
  resetBtn.x = gameWidth / 2 - 60; resetBtn.y = gameHeight - 20;
  resetBtn.anchor.set(0.5, 0.5); resetBtn.eventMode = "static"; resetBtn.cursor = "pointer";
  resetBtn.on("pointertap", (e: Event) => { e.stopPropagation(); callbacks.onReset(); });
  container.addChild(resetBtn);

  const backBtn = new Text({
    text: "[Back]",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#ccbbaa" }),
  });
  backBtn.x = gameWidth / 2 + 60; backBtn.y = gameHeight - 20;
  backBtn.anchor.set(0.5, 0.5); backBtn.eventMode = "static"; backBtn.cursor = "pointer";
  backBtn.on("pointertap", callbacks.onBack);
  container.addChild(backBtn);
}
