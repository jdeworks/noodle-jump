/** Content row builders for CustomRunScreen — extracted to stay under LOC limit. */

import type { Container } from "pixi.js";
import { GAME_WIDTH } from "../config/constants";
import { ALL_POWER_UP_TYPES, type RunConfig } from "../systems/CustomRunConfig";
import type { DebugConfig } from "../config/debug";
import { seedToCode } from "../systems/DailyChallenge";
import {
  type TapRegion,
  addSectionHeader,
  addRow,
  addToggleRow,
  addPresetRow,
  buildPresets,
  addPowerUpGrid,
} from "./CustomRunStorage";
import { addAdvancedDebugRows } from "./CustomRunAdvanced";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function buildContentRows(
  scrollContent: Container,
  tapRegions: TapRegion[],
  config: RunConfig,
  debugCfg: DebugConfig,
  setConfig: (cfg: RunConfig) => void,
  setDebug: (cfg: DebugConfig) => void,
  rerender: () => void,
  startY: number,
): number {
  let y = startY;

  y = addSectionHeader(scrollContent, GAME_WIDTH, "GAME SETTINGS", "#ccbbaa", y);

  const seedLabel = config.seed === 0 ? "RANDOM" : seedToCode(config.seed);
  y = addRow(scrollContent, tapRegions, GAME_WIDTH, `Seed: ${seedLabel}`, "[Change]", y, () => {
    if (config.seed === 0) {
      config.seed = Math.floor(Math.random() * 0xffffffff);
    } else {
      const input = prompt(
        "Enter seed (number or word), or leave empty for random:",
        seedToCode(config.seed),
      );
      if (input === null) return;
      if (input.trim() === "") config.seed = 0;
      else {
        const num = parseInt(input, 10);
        config.seed = isNaN(num) ? hashString(input.trim()) : Math.abs(num);
      }
    }
    rerender();
  });

  y = addToggleRow(
    scrollContent,
    tapRegions,
    GAME_WIDTH,
    "Enemies",
    config.enemiesEnabled,
    y,
    () => {
      config.enemiesEnabled = !config.enemiesEnabled;
      rerender();
    },
  );

  y = addRow(
    scrollContent,
    tapRegions,
    GAME_WIDTH,
    `Difficulty: ${config.difficultyMultiplier.toFixed(1)}x`,
    "[Cycle]",
    y,
    () => {
      const levels = [0.5, 0.75, 1.0, 1.5, 2.0];
      const idx = levels.indexOf(config.difficultyMultiplier);
      config.difficultyMultiplier = levels[(idx + 1) % levels.length];
      rerender();
    },
  );

  const zoneNames = [
    "Kitchen",
    "Boiling Pot",
    "Space",
    "Freezer",
    "Volcano",
    "Candy",
    "Final Kitchen",
  ];
  y = addRow(
    scrollContent,
    tapRegions,
    GAME_WIDTH,
    `Start Zone: ${zoneNames[config.startingZone]}`,
    "[Next]",
    y,
    () => {
      config.startingZone = (config.startingZone + 1) % 7;
      rerender();
    },
  );

  y = addToggleRow(
    scrollContent,
    tapRegions,
    GAME_WIDTH,
    "Practice (no death)",
    config.practiceMode,
    y,
    () => {
      config.practiceMode = !config.practiceMode;
      rerender();
    },
  );

  y += 6;
  y = addSectionHeader(scrollContent, GAME_WIDTH, "POWER-UPS (tap to toggle)", "#ccbbaa", y);
  y = addPowerUpGrid(
    scrollContent,
    tapRegions,
    GAME_WIDTH,
    config.enabledPowerUps,
    ALL_POWER_UP_TYPES,
    y,
    rerender,
  );

  y += 4;
  y = addSectionHeader(scrollContent, GAME_WIDTH, "ADVANCED OPTIONS", "#ff8844", y);
  y = addPresetRow(
    scrollContent,
    tapRegions,
    GAME_WIDTH,
    buildPresets(setConfig, setDebug),
    y,
    rerender,
  );

  y = addToggleRow(
    scrollContent,
    tapRegions,
    GAME_WIDTH,
    "Infinite Knives",
    debugCfg.infiniteKnives,
    y,
    () => {
      debugCfg.infiniteKnives = !debugCfg.infiniteKnives;
      rerender();
    },
  );

  y = addToggleRow(
    scrollContent,
    tapRegions,
    GAME_WIDTH,
    "Show Hitboxes",
    debugCfg.showHitboxes,
    y,
    () => {
      debugCfg.showHitboxes = !debugCfg.showHitboxes;
      rerender();
    },
  );

  y = addToggleRow(scrollContent, tapRegions, GAME_WIDTH, "Show FPS", debugCfg.showFPS, y, () => {
    debugCfg.showFPS = !debugCfg.showFPS;
    rerender();
  });

  y = addRow(
    scrollContent,
    tapRegions,
    GAME_WIDTH,
    `Game Speed: ${debugCfg.gameSpeed.toFixed(1)}x`,
    "[Cycle]",
    y,
    () => {
      const speeds = [0.25, 0.5, 1.0, 1.5, 2.0, 3.0];
      const idx = speeds.findIndex((s) => Math.abs(s - debugCfg.gameSpeed) < 0.01);
      debugCfg.gameSpeed = speeds[(idx + 1) % speeds.length];
      rerender();
    },
  );

  y = addRow(
    scrollContent,
    tapRegions,
    GAME_WIDTH,
    `Quick Zones: ${debugCfg.quickZoneTransitions === 0 ? "OFF" : `every ${debugCfg.quickZoneTransitions} plat`}`,
    "[Cycle]",
    y,
    () => {
      const opts = [0, 10, 15, 25, 50];
      const idx = opts.indexOf(debugCfg.quickZoneTransitions);
      debugCfg.quickZoneTransitions = opts[(idx + 1) % opts.length];
      rerender();
    },
  );

  y = addAdvancedDebugRows(scrollContent, tapRegions, GAME_WIDTH, debugCfg, y, rerender);
  return y + 10;
}
