/** Custom run storage, styles, row builders, and shared types for the CustomRunScreen. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import {
  createDefaultRunConfig,
  ALL_POWER_UP_TYPES,
  type RunConfig,
} from "../systems/CustomRunConfig";
import {
  type DebugConfig,
  createDebugConfig,
  applyPreset,
  bossTestPreset,
  enemyTestPreset,
  perfTestPreset,
} from "../config/debug";

// ── localStorage keys ───────────────────────────────────────────────────
export const STORAGE_RUN_CONFIG = "noodle_custom_run";
export const STORAGE_DEBUG_CONFIG = "noodle_debug_config";

export function saveRunConfigToStorage(cfg: RunConfig): void {
  try {
    localStorage.setItem(STORAGE_RUN_CONFIG, JSON.stringify({
      seed: cfg.seed,
      enemiesEnabled: cfg.enemiesEnabled,
      enabledPowerUps: [...cfg.enabledPowerUps],
      startingZone: cfg.startingZone,
      difficultyMultiplier: cfg.difficultyMultiplier,
      practiceMode: cfg.practiceMode,
    }));
  } catch { /* quota exceeded */ }
}

export function loadRunConfigFromStorage(): RunConfig {
  try {
    const raw = localStorage.getItem(STORAGE_RUN_CONFIG);
    if (!raw) return createDefaultRunConfig();
    const d = JSON.parse(raw);
    return {
      seed: d.seed ?? 0,
      enemiesEnabled: d.enemiesEnabled ?? false,
      enabledPowerUps: new Set(d.enabledPowerUps ?? ALL_POWER_UP_TYPES),
      startingZone: d.startingZone ?? 0,
      difficultyMultiplier: d.difficultyMultiplier ?? 1.0,
      practiceMode: d.practiceMode ?? false,
      isDailyChallenge: false,
    };
  } catch { return createDefaultRunConfig(); }
}

export function saveDebugConfigToStorage(cfg: DebugConfig): void {
  try {
    localStorage.setItem(STORAGE_DEBUG_CONFIG, JSON.stringify(cfg));
  } catch { /* quota exceeded */ }
}

export function loadDebugConfigFromStorage(): DebugConfig {
  try {
    const raw = localStorage.getItem(STORAGE_DEBUG_CONFIG);
    if (!raw) return createDebugConfig();
    return { ...createDebugConfig(), ...JSON.parse(raw) };
  } catch { return createDebugConfig(); }
}

// ── Styles ──────────────────────────────────────────────────────────────
export const LABEL_FONT = 14;
export const BTN_FONT = 14;
export const PU_FONT = 12;
export const ROW_H = 28;
export const SECTION_GAP = 10;
export const TAP_THRESHOLD = 8; // px — less movement than this counts as a tap

import { getUITheme } from "./ThemeUI";
export const labelStyle = new TextStyle({
  fontFamily: "monospace", fontSize: LABEL_FONT,
  fill: "#ffffff", fontWeight: "bold",
});
export const sectionStyle = (color: string) => new TextStyle({
  fontFamily: "monospace", fontSize: 13,
  fill: color, fontWeight: "bold",
});
export const valStyle = (on: boolean) => {
  const t = getUITheme();
  return new TextStyle({ fontFamily: "monospace", fontSize: BTN_FONT,
    fill: on ? "#44ff44" : t.textDim, fontWeight: "bold" });
};
export const btnTextStyle = new TextStyle({
  fontFamily: "monospace", fontSize: BTN_FONT,
  fill: "#88aaff", fontWeight: "bold",
});

// ── Tap region: a rectangle + callback ──────────────────────────────────
export interface TapRegion {
  x: number; y: number; w: number; h: number;
  action: () => void;
}

// ── Row builder helpers ─────────────────────────────────────────────────

/** Add a centered section header and return the new Y position. */
export function addSectionHeader(
  scrollContent: Container, gameWidth: number,
  text: string, color: string, y: number,
): number {
  const header = new Text({ text, style: sectionStyle(color) });
  header.x = gameWidth / 2;
  header.y = y;
  header.anchor.set(0.5, 0);
  scrollContent.addChild(header);
  return y + 18 + SECTION_GAP;
}

/** Add a label + action button row and return the new Y position. */
export function addRow(
  scrollContent: Container, tapRegions: TapRegion[], gameWidth: number,
  label: string, action: string, y: number, onClick: () => void,
): number {
  const lbl = new Text({ text: label, style: labelStyle });
  lbl.x = 20;
  lbl.y = y;
  scrollContent.addChild(lbl);

  const btn = new Text({ text: action, style: btnTextStyle });
  btn.x = gameWidth - 20;
  btn.y = y;
  btn.anchor.set(1, 0);
  scrollContent.addChild(btn);

  tapRegions.push({ x: 0, y, w: gameWidth, h: ROW_H, action: onClick });
  return y + ROW_H;
}

/** Add a label + ON/OFF toggle row and return the new Y position. */
export function addToggleRow(
  scrollContent: Container, tapRegions: TapRegion[], gameWidth: number,
  label: string, value: boolean, y: number, onClick: () => void,
): number {
  const lbl = new Text({ text: `${label}:`, style: labelStyle });
  lbl.x = 20;
  lbl.y = y;
  scrollContent.addChild(lbl);

  const val = new Text({ text: value ? "ON" : "OFF", style: valStyle(value) });
  val.x = gameWidth - 20;
  val.y = y;
  val.anchor.set(1, 0);
  scrollContent.addChild(val);

  tapRegions.push({ x: 0, y, w: gameWidth, h: ROW_H, action: onClick });
  return y + ROW_H;
}

/** Render a row of preset buttons and return the new Y position. */
export function addPresetRow(
  scrollContent: Container, tapRegions: TapRegion[], gameWidth: number,
  presets: { label: string; apply: () => void }[],
  y: number, onRender: () => void,
): number {
  const totalW = gameWidth - 40;
  const btnW = Math.floor(totalW / presets.length) - 4;
  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    const bx = 20 + i * (btnW + 4);

    const pbg = new Graphics();
    pbg.roundRect(bx, y, btnW, 24, 5);
    const t = getUITheme();
    pbg.fill({ color: t.buttonBg, alpha: 0.8 });
    pbg.stroke({ width: 1, color: t.buttonBorder, alpha: 0.5 });
    scrollContent.addChild(pbg);

    const ptxt = new Text({
      text: preset.label,
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 11,
        fill: getUITheme().accent, fontWeight: "bold",
      }),
    });
    ptxt.x = bx + btnW / 2;
    ptxt.y = y + 12;
    ptxt.anchor.set(0.5, 0.5);
    scrollContent.addChild(ptxt);

    tapRegions.push({
      x: bx, y, w: btnW, h: 24,
      action: () => { preset.apply(); onRender(); },
    });
  }
  return y + 32;
}

/** Build the list of debug preset definitions. */
export function buildPresets(
  setConfig: (cfg: RunConfig) => void,
  setDebug: (cfg: DebugConfig) => void,
): { label: string; apply: () => void }[] {
  return [
    {
      label: "Boss",
      apply: () => {
        const cfg = createDefaultRunConfig();
        cfg.enemiesEnabled = true;
        setConfig(cfg);
        setDebug(applyPreset(createDebugConfig(), bossTestPreset()));
      },
    },
    {
      label: "Enemy",
      apply: () => {
        const cfg = createDefaultRunConfig();
        cfg.enemiesEnabled = true;
        setConfig(cfg);
        setDebug(applyPreset(createDebugConfig(), enemyTestPreset()));
      },
    },
    {
      label: "PowerUp",
      apply: () => {
        const cfg = createDefaultRunConfig();
        cfg.practiceMode = true;
        cfg.enabledPowerUps = new Set(ALL_POWER_UP_TYPES);
        setConfig(cfg);
        setDebug(applyPreset(createDebugConfig(), {
          invincible: true,
          quickZoneTransitions: 25,
        }));
      },
    },
    {
      label: "Full",
      apply: () => {
        const cfg = createDefaultRunConfig();
        cfg.practiceMode = true;
        setConfig(cfg);
        setDebug(applyPreset(createDebugConfig(), {
          showFPS: true,
          showHitboxes: true,
          quickZoneTransitions: 15,
          infiniteKnives: true,
        }));
      },
    },
    {
      label: "Perf",
      apply: () => {
        const cfg = createDefaultRunConfig();
        setConfig(cfg);
        setDebug(applyPreset(createDebugConfig(), perfTestPreset()));
      },
    },
  ];
}

/** Render the power-up toggle grid and return the new Y position. */
export function addPowerUpGrid(
  scrollContent: Container, tapRegions: TapRegion[], gameWidth: number,
  enabled: Set<string>, allTypes: readonly string[],
  y: number, onRender: () => void,
): number {
  for (let i = 0; i < allTypes.length; i++) {
    const type = allTypes[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const px = col === 0 ? 15 : gameWidth / 2 + 5;
    const py = y + row * 22;
    const colW = gameWidth / 2 - 10;

    const isOn = enabled.has(type);
    const name = type.replace(/_/g, " ");
    const puText = new Text({
      text: `${isOn ? "+" : "-"} ${name}`,
      style: new TextStyle({
        fontFamily: "monospace", fontSize: PU_FONT,
        fill: isOn ? "#eeddcc" : "#666655",
      }),
    });
    puText.x = px;
    puText.y = py;
    scrollContent.addChild(puText);

    tapRegions.push({
      x: px, y: py, w: colW, h: 20,
      action: () => {
        if (enabled.has(type)) enabled.delete(type);
        else enabled.add(type);
        onRender();
      },
    });
  }
  return y + Math.ceil(allTypes.length / 2) * 22 + 8;
}

/** Create the fixed bottom bar with Start, Reset, and Back buttons. */
export function createBottomBar(
  container: Container,
  gameWidth: number, gameHeight: number, bottomH: number,
  callbacks: {
    onStart: () => void;
    onReset: () => void;
    onBack: () => void;
  },
): void {
  const bottomBg = new Graphics();
  bottomBg.rect(0, gameHeight - bottomH, gameWidth, bottomH);
  bottomBg.fill({ color: getUITheme().bg, alpha: 0.95 });
  bottomBg.eventMode = "static";
  container.addChild(bottomBg);

  const startBtn = new Text({
    text: "[ START RUN ]",
    style: new TextStyle({
      fontFamily: "monospace", fontSize: 20,
      fill: "#44ff44", fontWeight: "bold",
    }),
  });
  startBtn.x = gameWidth / 2;
  startBtn.y = gameHeight - bottomH + 16;
  startBtn.anchor.set(0.5, 0.5);
  startBtn.eventMode = "static";
  startBtn.cursor = "pointer";
  startBtn.on("pointertap", callbacks.onStart);
  container.addChild(startBtn);

  const resetBtn = new Text({
    text: "[Reset All]",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#ff8866" }),
  });
  resetBtn.x = gameWidth / 2 - 60;
  resetBtn.y = gameHeight - 20;
  resetBtn.anchor.set(0.5, 0.5);
  resetBtn.eventMode = "static";
  resetBtn.cursor = "pointer";
  resetBtn.on("pointertap", (e: Event) => {
    e.stopPropagation();
    callbacks.onReset();
  });
  container.addChild(resetBtn);

  const backBtn = new Text({
    text: "[Back]",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#ccbbaa" }),
  });
  backBtn.x = gameWidth / 2 + 60;
  backBtn.y = gameHeight - 20;
  backBtn.anchor.set(0.5, 0.5);
  backBtn.eventMode = "static";
  backBtn.cursor = "pointer";
  backBtn.on("pointertap", callbacks.onBack);
  container.addChild(backBtn);
}
