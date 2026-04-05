/**
 * Multiplayer lobby — shows both players, ready-up, mode selection.
 * Host controls mode and triggers game start.
 * Communicates ready/start/seed via GameSync events.
 */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import type { GameSync, GameSyncEvent } from "./GameSync";
import { CHARACTERS, drawCharacter } from "../rendering/PlayerCharacters";
import { getSelectedCharacter, setSelectedCharacter } from "../systems/CharacterSettings";
import { loadCosmetics, COSMETICS } from "../systems/Cosmetics";
import { getUITheme } from "../ui/ThemeUI";
import { loadRunConfigFromStorage, loadDebugConfigFromStorage } from "../ui/CustomRunStorage";
import { setDebugConfig } from "../config/debug";

export type LobbyRole = "host" | "guest";

export interface LobbyCallbacks {
  onStart: (seed: number, mode: string, touchControls: boolean, remoteChar?: string, remoteCosmetics?: { tint?: string; trail?: string; theme?: string }) => void;
}

const HEADER_STYLE = new TextStyle({ fontFamily: "monospace", fontSize: 24,
  fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 3 } });
const LABEL_STYLE = new TextStyle({ fontFamily: "monospace", fontSize: 16,
  fill: "#ffffff", stroke: { color: "#000000", width: 2 } });
const STATUS_STYLE = new TextStyle({ fontFamily: "monospace", fontSize: 14,
  fill: "#aaaaaa", stroke: { color: "#000000", width: 2 } });

export class LobbyScreen {
  readonly container = new Container();
  private role: LobbyRole;
  private sync: GameSync;
  private callbacks: LobbyCallbacks;

  private hostReady = false;
  private guestReady = false;
  private mode = (() => { try { return localStorage.getItem("nj-lobby-mode") ?? "best-height"; } catch { return "best-height"; } })();
  private touchControls = false;
  private localChar = getSelectedCharacter();
  private remoteChar = "chef";
  private remoteCosmetics: { tint?: string; trail?: string; theme?: string } = {};
  private selectedTheme = "theme_default";
  private useCustomRun = false;

  private p1StatusText: Text;
  private p2StatusText: Text;
  private startBtn: Graphics;
  private startText: Text;
  private waitingText: Text;
  private onTouchControlsChanged: (() => void) | null = null;
  private onCharacterChanged: (() => void) | null = null;

  constructor(role: LobbyRole, sync: GameSync, callbacks: LobbyCallbacks) {
    this.role = role;
    this.sync = sync;
    this.callbacks = callbacks;
    const uiT = getUITheme();

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: uiT.bg, alpha: 0.95 });
    this.container.addChild(bg);

    // Title
    const title = new Text({ text: "LOBBY", style: HEADER_STYLE });
    title.x = GAME_WIDTH / 2;
    title.y = 60;
    title.anchor.set(0.5, 0.5);
    this.container.addChild(title);

    // Role label
    const roleText = new Text({
      text: role === "host" ? "You are the Host" : "You are the Guest",
      style: STATUS_STYLE,
    });
    roleText.x = GAME_WIDTH / 2;
    roleText.y = 90;
    roleText.anchor.set(0.5, 0.5);
    this.container.addChild(roleText);

    // Player 1 (Host) — sprite + status side by side
    const p1Gfx = new Graphics(); p1Gfx.x = GAME_WIDTH / 2 - 60; p1Gfx.y = 130;
    drawCharacter(p1Gfx, 24, 30, role === "host" ? this.localChar : this.remoteChar);
    this.container.addChild(p1Gfx);
    const p1Label = new Text({ text: "P1 (Host)", style: LABEL_STYLE });
    p1Label.x = GAME_WIDTH / 2 + 10; p1Label.y = 138; p1Label.anchor.set(0.5, 0.5);
    this.container.addChild(p1Label);
    this.p1StatusText = new Text({ text: "Not Ready", style: STATUS_STYLE });
    this.p1StatusText.x = GAME_WIDTH / 2 + 10; this.p1StatusText.y = 158; this.p1StatusText.anchor.set(0.5, 0.5);
    this.container.addChild(this.p1StatusText);

    // Player 2 (Guest) — sprite + status
    const p2Gfx = new Graphics(); p2Gfx.x = GAME_WIDTH / 2 - 60; p2Gfx.y = 185;
    drawCharacter(p2Gfx, 24, 30, role === "guest" ? this.localChar : this.remoteChar);
    this.container.addChild(p2Gfx);
    const p2Label = new Text({ text: "P2 (Guest)", style: LABEL_STYLE });
    p2Label.x = GAME_WIDTH / 2 + 10; p2Label.y = 193; p2Label.anchor.set(0.5, 0.5);
    this.container.addChild(p2Label);
    this.p2StatusText = new Text({ text: "Not Ready", style: STATUS_STYLE });
    this.p2StatusText.x = GAME_WIDTH / 2 + 10; this.p2StatusText.y = 213; this.p2StatusText.anchor.set(0.5, 0.5);
    this.container.addChild(this.p2StatusText);

    // Character picker — tap to cycle through characters
    const charPickLabel = new Text({
      text: `Your Character: ${CHARACTERS.find(c => c.id === this.localChar)?.name ?? "Chef"} (tap)`,
      style: new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#ffcc44", stroke: { color: "#000000", width: 2 } }),
    });
    charPickLabel.x = GAME_WIDTH / 2; charPickLabel.y = 250; charPickLabel.anchor.set(0.5, 0.5);
    charPickLabel.eventMode = "static"; charPickLabel.cursor = "pointer";
    this.container.addChild(charPickLabel);
    const updateCharPreviews = () => {
      const hostChar = role === "host" ? this.localChar : this.remoteChar;
      const guestChar = role === "guest" ? this.localChar : this.remoteChar;
      p1Gfx.clear(); drawCharacter(p1Gfx, 24, 30, hostChar);
      p2Gfx.clear(); drawCharacter(p2Gfx, 24, 30, guestChar);
      charPickLabel.text = `Your Character: ${CHARACTERS.find(c => c.id === this.localChar)?.name ?? "Chef"} (tap)`;
    };
    charPickLabel.on("pointertap", () => {
      const idx = CHARACTERS.findIndex(c => c.id === this.localChar);
      this.localChar = CHARACTERS[(idx + 1) % CHARACTERS.length].id;
      setSelectedCharacter(this.localChar);
      updateCharPreviews();
      this.sync.sendGameEvent({ type: "ready", payload: { character: this.localChar, ...this.localCosmeticPayload() } });
    });
    this.onCharacterChanged = () => updateCharPreviews();

    // Mode selection (host can cycle, guest sees current)
    const MODES = ["best-height", "first-to-die", "timed-2min"] as const;
    const MODE_LABELS: Record<string, string> = {
      "best-height": "Best Height", "first-to-die": "First to Die", "timed-2min": "Timed (2 min)",
    };
    const modeLabel = new Text({ text: `Mode: ${MODE_LABELS[this.mode]}`, style: LABEL_STYLE });
    modeLabel.x = GAME_WIDTH / 2; modeLabel.y = 300; modeLabel.anchor.set(0.5, 0.5);
    this.container.addChild(modeLabel);
    if (role === "host") {
      modeLabel.eventMode = "static"; modeLabel.cursor = "pointer";
      modeLabel.on("pointertap", () => {
        const idx = MODES.indexOf(this.mode as typeof MODES[number]);
        this.mode = MODES[(idx + 1) % MODES.length];
        try { localStorage.setItem("nj-lobby-mode", this.mode); } catch { /* */ }
        modeLabel.text = `Mode: ${MODE_LABELS[this.mode]} (tap to change)`;
        this.sync.sendGameEvent({ type: "ready", payload: { mode: this.mode } });
      });
      modeLabel.text = `Mode: ${MODE_LABELS[this.mode]} (tap to change)`;
    }

    // Touch controls toggle (either player can toggle, synced for fairness)
    const touchLabel = new Text({
      text: "Touch Controls: OFF",
      style: new TextStyle({ fontFamily: "monospace", fontSize: 14,
        fill: "#aaaaaa", stroke: { color: "#000000", width: 2 } }),
    });
    touchLabel.x = GAME_WIDTH / 2; touchLabel.y = 335; touchLabel.anchor.set(0.5, 0.5);
    touchLabel.eventMode = "static"; touchLabel.cursor = "pointer";
    this.container.addChild(touchLabel);
    const updateTouchLabel = () => {
      touchLabel.text = `Touch Controls: ${this.touchControls ? "ON" : "OFF"} (tap to toggle)`;
      touchLabel.style.fill = this.touchControls ? "#44ff44" : "#aaaaaa";
    };
    updateTouchLabel();
    touchLabel.on("pointertap", () => {
      this.touchControls = !this.touchControls;
      updateTouchLabel();
      this.sync.sendGameEvent({ type: "ready", payload: { touchControls: this.touchControls } });
    });
    this.onTouchControlsChanged = () => updateTouchLabel();

    // Theme picker (host can cycle, guest sees host's choice)
    const THEMES = COSMETICS.filter(c => c.type === "theme");
    const themeLabel = new Text({
      text: `Theme: ${THEMES.find(t => t.id === this.selectedTheme)?.name ?? "Classic"}`,
      style: new TextStyle({ fontFamily: "monospace", fontSize: 13,
        fill: "#ccaaff", stroke: { color: "#000000", width: 2 } }),
    });
    themeLabel.x = GAME_WIDTH / 2; themeLabel.y = 360; themeLabel.anchor.set(0.5, 0.5);
    this.container.addChild(themeLabel);
    if (role === "host") {
      themeLabel.eventMode = "static"; themeLabel.cursor = "pointer";
      themeLabel.text = `Theme: ${THEMES.find(t => t.id === this.selectedTheme)?.name ?? "Classic"} (tap)`;
      themeLabel.on("pointertap", () => {
        const idx = THEMES.findIndex(t => t.id === this.selectedTheme);
        this.selectedTheme = THEMES[(idx + 1) % THEMES.length].id;
        themeLabel.text = `Theme: ${THEMES.find(t => t.id === this.selectedTheme)?.name ?? "Classic"} (tap)`;
        this.sync.sendGameEvent({ type: "ready", payload: { theme: this.selectedTheme } });
      });
    }

    // Custom run toggle (host only — uses saved custom run settings)
    const customLabel = new Text({
      text: "Custom Run: OFF",
      style: new TextStyle({ fontFamily: "monospace", fontSize: 13,
        fill: "#888888", stroke: { color: "#000000", width: 2 } }),
    });
    customLabel.x = GAME_WIDTH / 2; customLabel.y = 385; customLabel.anchor.set(0.5, 0.5);
    this.container.addChild(customLabel);
    if (role === "host") {
      customLabel.eventMode = "static"; customLabel.cursor = "pointer";
      customLabel.text = "Custom Run: OFF (tap)";
      customLabel.on("pointertap", () => {
        this.useCustomRun = !this.useCustomRun;
        customLabel.text = this.useCustomRun ? "Custom Run: ON (saved settings)" : "Custom Run: OFF (tap)";
        customLabel.style.fill = this.useCustomRun ? "#44ff44" : "#888888";
      });
    }

    // Ready button
    const readyBtnY = 420;
    const readyBg = new Graphics();
    readyBg.roundRect(GAME_WIDTH / 2 - 100, readyBtnY - 20, 200, 40, 10);
    readyBg.fill({ color: 0x2a6e3f, alpha: 0.9 });
    readyBg.roundRect(GAME_WIDTH / 2 - 100, readyBtnY - 20, 200, 40, 10);
    readyBg.stroke({ width: 1.5, color: 0x44bb66, alpha: 0.5 });
    readyBg.eventMode = "static";
    readyBg.cursor = "pointer";
    this.container.addChild(readyBg);

    const readyText = new Text({
      text: "Ready",
      style: new TextStyle({ fontFamily: "monospace", fontSize: 18,
        fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 2 } }),
    });
    readyText.x = GAME_WIDTH / 2;
    readyText.y = readyBtnY;
    readyText.anchor.set(0.5, 0.5);
    readyText.eventMode = "static";
    readyText.cursor = "pointer";
    this.container.addChild(readyText);

    const toggleReady = () => {
      if (this.role === "host") {
        this.hostReady = !this.hostReady;
      } else {
        this.guestReady = !this.guestReady;
      }
      readyText.text = this.isLocalReady() ? "Not Ready" : "Ready";
      readyBg.clear();
      readyBg.roundRect(GAME_WIDTH / 2 - 100, readyBtnY - 20, 200, 40, 10);
      readyBg.fill({ color: this.isLocalReady() ? 0x993333 : 0x2a6e3f, alpha: 0.9 });
      readyBg.roundRect(GAME_WIDTH / 2 - 100, readyBtnY - 20, 200, 40, 10);
      readyBg.stroke({ width: 1.5, color: this.isLocalReady() ? 0xbb4444 : 0x44bb66, alpha: 0.5 });

      this.sync.sendGameEvent({
        type: "ready",
        payload: { ready: this.isLocalReady(), role: this.role, character: this.localChar },
      });
      this.updateUI();
    };
    readyBg.on("pointertap", toggleReady);
    readyText.on("pointertap", toggleReady);

    // Start button (host only)
    const startBtnY = 490;
    this.startBtn = new Graphics();
    this.startText = new Text({
      text: "Start Game",
      style: new TextStyle({ fontFamily: "monospace", fontSize: 20,
        fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 2 } }),
    });
    this.startText.x = GAME_WIDTH / 2;
    this.startText.y = startBtnY;
    this.startText.anchor.set(0.5, 0.5);

    if (role === "host") {
      this.renderStartButton(startBtnY, false);
      this.container.addChild(this.startBtn);
      this.startText.eventMode = "static";
      this.startText.cursor = "pointer";
      this.container.addChild(this.startText);

      const startGame = () => {
        if (!this.hostReady || !this.guestReady) return;
        // Apply custom run settings if enabled
        if (this.useCustomRun) setDebugConfig(loadDebugConfigFromStorage());
        const seed = Math.floor(Math.random() * 0xffffffff);
        this.sync.sendGameEvent({
          type: "start",
          payload: { seed, mode: this.mode, touchControls: this.touchControls, character: this.localChar, theme: this.selectedTheme, customRun: this.useCustomRun },
        });
        this.remoteCosmetics.theme = this.selectedTheme;
        this.callbacks.onStart(seed, this.mode, this.touchControls, this.remoteChar, this.remoteCosmetics);
      };
      this.startBtn.on("pointertap", startGame);
      this.startText.on("pointertap", startGame);
    }

    // Waiting text (guest only)
    this.waitingText = new Text({
      text: "Waiting for host to start...",
      style: STATUS_STYLE,
    });
    this.waitingText.x = GAME_WIDTH / 2;
    this.waitingText.y = startBtnY;
    this.waitingText.anchor.set(0.5, 0.5);
    this.waitingText.visible = role === "guest";
    this.container.addChild(this.waitingText);

    // Listen for remote events
    this.sync.on({
      onRemotePosition: () => {},
      onRemoteEvent: (event) => this.handleRemoteEvent(event),
    });

    this.updateUI();
    // Announce our character to the remote player
    this.sync.sendGameEvent({ type: "ready", payload: { character: this.localChar, ...this.localCosmeticPayload() } });
  }

  private isLocalReady(): boolean {
    return this.role === "host" ? this.hostReady : this.guestReady;
  }

  private remoteConnected = false;

  private handleRemoteEvent(event: GameSyncEvent): void {
    // Re-announce our character on first remote event (initial send may have been lost)
    if (!this.remoteConnected) {
      this.remoteConnected = true;
      this.sync.sendGameEvent({ type: "ready", payload: { character: this.localChar, ...this.localCosmeticPayload() } });
    }
    if (event.type === "ready") {
      if (event.payload.mode) {
        this.mode = event.payload.mode as string;
      }
      if (event.payload.touchControls !== undefined) {
        this.touchControls = event.payload.touchControls as boolean;
        this.onTouchControlsChanged?.();
      }
      if (event.payload.theme) {
        this.selectedTheme = event.payload.theme as string;
        this.remoteCosmetics.theme = this.selectedTheme;
      }
      if (event.payload.character) {
        this.remoteChar = event.payload.character as string;
        if (event.payload.tint) this.remoteCosmetics.tint = event.payload.tint as string;
        if (event.payload.trail) this.remoteCosmetics.trail = event.payload.trail as string;
        this.onCharacterChanged?.();
      }
      if (event.payload.role) {
        const isHost = event.payload.role === "host";
        if (isHost) this.hostReady = event.payload.ready as boolean;
        else this.guestReady = event.payload.ready as boolean;
      }
      this.updateUI();
    }

    if (event.type === "start" && this.role === "guest") {
      const seed = event.payload.seed as number;
      const mode = (event.payload.mode as string) || "best-height";
      const tc = (event.payload.touchControls as boolean) ?? this.touchControls;
      const rc = (event.payload.character as string) ?? this.remoteChar;
      if (event.payload.theme) this.remoteCosmetics.theme = event.payload.theme as string;
      this.callbacks.onStart(seed, mode, tc, rc, this.remoteCosmetics);
    }
  }

  private localCosmeticPayload(): Record<string, string> {
    const c = loadCosmetics();
    return { tint: c.equipped.tint ?? "tint_none", trail: c.equipped.trail ?? "trail_none", theme: this.selectedTheme };
  }

  /** Get remote player's cosmetics for the renderer. */
  getRemoteCosmetics(): { tint?: string; trail?: string } { return this.remoteCosmetics; }

  private updateUI(): void {
    this.p1StatusText.text = this.hostReady ? "Ready!" : "Not Ready";
    this.p1StatusText.style.fill = this.hostReady ? "#44ff44" : "#aaaaaa";

    this.p2StatusText.text = this.guestReady ? "Ready!" : "Not Ready";
    this.p2StatusText.style.fill = this.guestReady ? "#44ff44" : "#aaaaaa";

    if (this.role === "host") {
      const canStart = this.hostReady && this.guestReady;
      this.renderStartButton(490, canStart);
      this.startText.alpha = canStart ? 1 : 0.4;
    }
  }

  private renderStartButton(y: number, enabled: boolean): void {
    this.startBtn.clear();
    this.startBtn.roundRect(GAME_WIDTH / 2 - 110, y - 22, 220, 44, 10);
    const uiT = getUITheme();
    this.startBtn.fill({ color: enabled ? uiT.buttonBg : 0x333333, alpha: 0.9 });
    this.startBtn.roundRect(GAME_WIDTH / 2 - 110, y - 22, 220, 44, 10);
    this.startBtn.stroke({ width: 1.5, color: enabled ? uiT.buttonBorder : 0x555555, alpha: 0.5 });
    this.startBtn.eventMode = enabled ? "static" : "none";
    this.startBtn.cursor = enabled ? "pointer" : "default";
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
