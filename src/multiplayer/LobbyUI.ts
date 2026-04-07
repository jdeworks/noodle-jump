/**
 * UI construction and rendering helpers for the multiplayer lobby.
 * Extracted from LobbyScreen to keep files under 400 LOC.
 */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { CHARACTERS } from "../rendering/PlayerCharacters";
import { COSMETICS } from "../systems/Cosmetics";
import { getUITheme } from "../ui/ThemeUI";
import { copyToClipboard, showHtmlToast } from "./HtmlOverlay";
import type { GameSyncEvent } from "./GameSync";

export const HEADER = new TextStyle({
  fontFamily: "monospace",
  fontSize: 22,
  fill: "#ffffff",
  fontWeight: "bold",
  stroke: { color: "#000000", width: 3 },
});
export const LABEL = new TextStyle({
  fontFamily: "monospace",
  fontSize: 14,
  fill: "#ffffff",
  stroke: { color: "#000000", width: 2 },
});
export const SMALL = new TextStyle({
  fontFamily: "monospace",
  fontSize: 11,
  fill: "#aaaaaa",
  stroke: { color: "#000000", width: 2 },
});
export const STATUS = new TextStyle({
  fontFamily: "monospace",
  fontSize: 12,
  fill: "#aaaaaa",
  stroke: { color: "#000000", width: 2 },
});

const MODES = ["best-height", "first-to-die", "timed-2min"] as const;
const MODE_LABELS: Record<string, string> = {
  "best-height": "Best Height",
  "first-to-die": "First to Die",
  "timed-2min": "Timed (2 min)",
};

export interface LobbyUIElements {
  playerListContainer: Container;
  countdownText: Text;
  readyText: Text;
  readyBg: Graphics;
  playerCountText: Text;
  nameLabel: Text;
  modeLabel: Text;
  themeLabel: Text;
  customLabel: Text;
}

export interface LobbyUICallbacks {
  getRoomCode: () => string;
  getLocalName: () => string;
  setLocalName: (name: string) => void;
  getLocalChar: () => string;
  setLocalChar: (id: string) => void;
  getMode: () => string;
  setMode: (m: string) => void;
  getTouchControls: () => boolean;
  setTouchControls: (v: boolean) => void;
  getSelectedTheme: () => string;
  setSelectedTheme: (id: string) => void;
  getUseCustomRun: () => boolean;
  setUseCustomRun: (v: boolean) => void;
  getRole: () => string;
  broadcastLocal: () => void;
  sendEvent: (type: GameSyncEvent["type"], payload: Record<string, unknown>) => void;
  toggleReady: () => void;
  isCountdownStarting: () => boolean;
}

/** Build the full lobby UI and return references to key elements. */
export function buildLobbyUI(container: Container, cb: LobbyUICallbacks): LobbyUIElements {
  const uiT = getUITheme();
  const cx = GAME_WIDTH / 2;
  const bg = new Graphics();
  bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  bg.fill({ color: uiT.bg, alpha: 0.95 });
  container.addChild(bg);
  const title = new Text({ text: "LOBBY", style: HEADER });
  title.x = cx;
  title.y = 30;
  title.anchor.set(0.5, 0.5);
  container.addChild(title);

  const roomCode = cb.getRoomCode();
  if (roomCode) {
    const ct = new Text({
      text: `Code: ${roomCode}`,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 16,
        fill: "#ffdd44",
        fontWeight: "bold",
        letterSpacing: 2,
        stroke: { color: "#000000", width: 2 },
      }),
    });
    ct.x = cx;
    ct.y = 52;
    ct.anchor.set(0.5, 0.5);
    ct.eventMode = "static";
    ct.cursor = "pointer";
    ct.on("pointertap", async () => {
      if (await copyToClipboard(roomCode)) showHtmlToast("Code copied!");
    });
    container.addChild(ct);
  }

  const playerCountText = new Text({ text: "Players: 1", style: STATUS });
  playerCountText.x = cx;
  playerCountText.y = 68;
  playerCountText.anchor.set(0.5, 0.5);
  container.addChild(playerCountText);

  const playerListContainer = new Container();
  playerListContainer.y = 420;
  container.addChild(playerListContainer);

  let y = 88;
  const nameLabel = new Text({
    text: cb.getLocalName() ? `Name: ${cb.getLocalName()} (tap)` : "Set Name (tap)",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 12,
      fill: "#66ccff",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  nameLabel.x = cx;
  nameLabel.y = y;
  nameLabel.anchor.set(0.5, 0.5);
  nameLabel.eventMode = "static";
  nameLabel.cursor = "pointer";
  nameLabel.on("pointertap", () => {
    const input = prompt("Enter your name (max 12 chars):", cb.getLocalName());
    if (input === null) return;
    const name = input.trim().slice(0, 12);
    cb.setLocalName(name);
    nameLabel.text = name ? `Name: ${name} (tap)` : "Set Name (tap)";
    cb.broadcastLocal();
  });
  container.addChild(nameLabel);
  y += 32;

  const charLabel = new Text({
    text: `Character: ${CHARACTERS.find((c) => c.id === cb.getLocalChar())?.name ?? "Chef"} (tap)`,
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 13,
      fill: "#ffcc44",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  charLabel.x = cx;
  charLabel.y = y;
  charLabel.anchor.set(0.5, 0.5);
  charLabel.eventMode = "static";
  charLabel.cursor = "pointer";
  charLabel.on("pointertap", () => {
    const idx = CHARACTERS.findIndex((c) => c.id === cb.getLocalChar());
    const next = CHARACTERS[(idx + 1) % CHARACTERS.length].id;
    cb.setLocalChar(next);
    charLabel.text = `Character: ${CHARACTERS.find((c) => c.id === next)?.name ?? "Chef"} (tap)`;
    cb.broadcastLocal();
  });
  container.addChild(charLabel);
  y += 34;

  const { modeLabel, themeLabel, customLabel } = buildSettingsLabels(container, cx, y, cb);
  y += 34 + 32 + 32 + 40;

  const readyBg = new Graphics();
  drawReadyBtn(readyBg, cx, y, false);
  readyBg.eventMode = "static";
  readyBg.cursor = "pointer";
  container.addChild(readyBg);

  const readyText = new Text({
    text: "Ready",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 18,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  readyText.x = cx;
  readyText.y = y;
  readyText.anchor.set(0.5, 0.5);
  readyText.eventMode = "static";
  readyText.cursor = "pointer";
  container.addChild(readyText);

  const toggle = () => {
    if (!cb.isCountdownStarting()) cb.toggleReady();
  };
  readyBg.on("pointertap", toggle);
  readyText.on("pointertap", toggle);
  y += 40;

  const countdownText = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 22,
      fill: "#ffdd44",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 3 },
    }),
  });
  countdownText.x = cx;
  countdownText.y = y;
  countdownText.anchor.set(0.5, 0.5);
  container.addChild(countdownText);

  return {
    playerListContainer,
    countdownText,
    readyText,
    readyBg,
    playerCountText,
    nameLabel,
    modeLabel,
    themeLabel,
    customLabel,
  };
}

function buildSettingsLabels(
  container: Container,
  cx: number,
  y: number,
  cb: LobbyUICallbacks,
): { modeLabel: Text; themeLabel: Text; customLabel: Text } {
  const modeLabel = new Text({ text: `Mode: ${MODE_LABELS[cb.getMode()]}`, style: LABEL });
  modeLabel.x = cx;
  modeLabel.y = y;
  modeLabel.anchor.set(0.5, 0.5);
  container.addChild(modeLabel);
  if (cb.getRole() === "host") enableModeControl(modeLabel, cb);
  y += 34;

  const touchLabel = new Text({ text: "Touch Controls: OFF (tap)", style: SMALL });
  touchLabel.x = cx;
  touchLabel.y = y;
  touchLabel.anchor.set(0.5, 0.5);
  touchLabel.eventMode = "static";
  touchLabel.cursor = "pointer";
  touchLabel.on("pointertap", () => {
    const v = !cb.getTouchControls();
    cb.setTouchControls(v);
    touchLabel.text = `Touch Controls: ${v ? "ON" : "OFF"} (tap)`;
    touchLabel.style.fill = v ? "#44ff44" : "#aaaaaa";
    cb.sendEvent("ready", { touchControls: v });
  });
  container.addChild(touchLabel);
  y += 32;

  const THEMES = COSMETICS.filter((c) => c.type === "theme");
  const themeLabel = new Text({
    text: `Theme: ${THEMES.find((t) => t.id === cb.getSelectedTheme())?.name ?? "Classic"}`,
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 12,
      fill: "#ccaaff",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  themeLabel.x = cx;
  themeLabel.y = y;
  themeLabel.anchor.set(0.5, 0.5);
  container.addChild(themeLabel);
  if (cb.getRole() === "host") enableThemeControl(themeLabel, cb, THEMES);
  y += 32;

  const customLabel = new Text({ text: "Custom Run: OFF", style: SMALL });
  customLabel.x = cx;
  customLabel.y = y;
  customLabel.anchor.set(0.5, 0.5);
  container.addChild(customLabel);
  if (cb.getRole() === "host") enableCustomControl(customLabel, cb);

  return { modeLabel, themeLabel, customLabel };
}

export function drawReadyBtn(bg: Graphics, cx: number, y: number, isReady: boolean): void {
  bg.clear();
  bg.roundRect(cx - 100, y - 18, 200, 36, 10);
  bg.fill({ color: isReady ? 0x993333 : 0x2a6e3f, alpha: 0.9 });
  bg.roundRect(cx - 100, y - 18, 200, 36, 10);
  bg.stroke({ width: 1.5, color: isReady ? 0xbb4444 : 0x44bb66, alpha: 0.5 });
}

export function enableModeControl(modeLabel: Text, cb: LobbyUICallbacks): void {
  modeLabel.eventMode = "static";
  modeLabel.cursor = "pointer";
  modeLabel.text = `Mode: ${MODE_LABELS[cb.getMode()]} (tap)`;
  modeLabel.removeAllListeners();
  modeLabel.on("pointertap", () => {
    const i = MODES.indexOf(cb.getMode() as (typeof MODES)[number]);
    const next = MODES[(i + 1) % MODES.length];
    cb.setMode(next);
    try {
      localStorage.setItem("nj-lobby-mode", next);
    } catch {
      /* */
    }
    modeLabel.text = `Mode: ${MODE_LABELS[next]} (tap)`;
    cb.sendEvent("ready", { mode: next });
  });
}

export function enableThemeControl(
  themeLabel: Text,
  cb: LobbyUICallbacks,
  themes?: Array<{ id: string; name: string }>,
): void {
  const THEMES = themes ?? COSMETICS.filter((c) => c.type === "theme");
  themeLabel.eventMode = "static";
  themeLabel.cursor = "pointer";
  themeLabel.text = `Theme: ${THEMES.find((t) => t.id === cb.getSelectedTheme())?.name ?? "Classic"} (tap)`;
  themeLabel.removeAllListeners();
  themeLabel.on("pointertap", () => {
    const i = THEMES.findIndex((t) => t.id === cb.getSelectedTheme());
    const next = THEMES[(i + 1) % THEMES.length].id;
    cb.setSelectedTheme(next);
    themeLabel.text = `Theme: ${THEMES.find((t) => t.id === next)?.name ?? "Classic"} (tap)`;
    cb.sendEvent("ready", { theme: next });
  });
}

export function enableCustomControl(customLabel: Text, cb: LobbyUICallbacks): void {
  customLabel.eventMode = "static";
  customLabel.cursor = "pointer";
  customLabel.text = cb.getUseCustomRun() ? "Custom Run: ON" : "Custom Run: OFF (tap)";
  customLabel.removeAllListeners();
  customLabel.on("pointertap", () => {
    const v = !cb.getUseCustomRun();
    cb.setUseCustomRun(v);
    customLabel.text = v ? "Custom Run: ON" : "Custom Run: OFF (tap)";
    customLabel.style.fill = v ? "#44ff44" : "#aaaaaa";
    cb.sendEvent("ready", { customRun: v });
  });
}

export function updateSettingsDisplay(
  modeLabel: Text,
  themeLabel: Text,
  customLabel: Text,
  role: string,
  mode: string,
  selectedTheme: string,
  useCustomRun: boolean,
): void {
  const THEMES = COSMETICS.filter((c) => c.type === "theme");
  const tn = THEMES.find((t) => t.id === selectedTheme)?.name ?? "Classic";
  themeLabel.text = role === "host" ? `Theme: ${tn} (tap)` : `Theme: ${tn}`;
  modeLabel.text =
    role === "host" ? `Mode: ${MODE_LABELS[mode]} (tap)` : `Mode: ${MODE_LABELS[mode]}`;
  customLabel.text = useCustomRun ? "Custom Run: ON" : "Custom Run: OFF";
  customLabel.style.fill = useCustomRun ? "#44ff44" : "#aaaaaa";
}
