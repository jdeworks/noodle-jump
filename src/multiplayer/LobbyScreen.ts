/**
 * Multiplayer lobby — supports 2-24 players.
 * Shows player list, ready-up with countdown timer, mode/theme/custom run controls.
 * Host clicks Ready → 15s countdown. All ready → 3s (or less if timer already past).
 */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import type { GameSync, GameSyncEvent } from "./GameSync";
import { CHARACTERS, drawCharacter } from "../rendering/PlayerCharacters";
import { getSelectedCharacter, setSelectedCharacter } from "../systems/CharacterSettings";
import { loadCosmetics, COSMETICS } from "../systems/Cosmetics";
import { getUITheme } from "../ui/ThemeUI";
import { loadRunConfigFromStorage, loadDebugConfigFromStorage } from "../ui/CustomRunStorage";
import { setDebugConfig, createDebugConfig, type DebugConfig } from "../config/debug";
import { createDefaultRunConfig, type RunConfig } from "../systems/CustomRunConfig";
import type { RemoteCosmetics } from "./RemotePlayerRenderer";
import { getPeerColor } from "./OnlineResults";

function serializeForSync(cfg: RunConfig): Record<string, unknown> { return { ...cfg, enabledPowerUps: [...cfg.enabledPowerUps] }; }
function deserializeFromSync(d: Record<string, unknown>): RunConfig { return { ...createDefaultRunConfig(), ...d, enabledPowerUps: new Set(d.enabledPowerUps as string[] ?? []) }; }

export type LobbyRole = "host" | "guest";

export interface LobbyCallbacks {
  onStart: (
    seed: number, mode: string, touchControls: boolean,
    remotePeers: Map<string, { character: string; cosmetics?: RemoteCosmetics }>,
    sharedRunConfig?: RunConfig,
  ) => void;
}

interface LobbyPlayer {
  peerId: string;
  character: string;
  cosmetics: RemoteCosmetics;
  ready: boolean;
  colorIndex: number;
}

const HEADER = new TextStyle({ fontFamily: "monospace", fontSize: 22, fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 3 } });
const LABEL = new TextStyle({ fontFamily: "monospace", fontSize: 14, fill: "#ffffff", stroke: { color: "#000000", width: 2 } });
const STATUS = new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#aaaaaa", stroke: { color: "#000000", width: 2 } });
const SMALL = new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#aaaaaa", stroke: { color: "#000000", width: 2 } });

const COUNTDOWN_LONG = 15_000; // ms after host readies up
const COUNTDOWN_SHORT = 3_000; // ms when all ready

export class LobbyScreen {
  readonly container = new Container();
  private role: LobbyRole;
  private sync: GameSync;
  private callbacks: LobbyCallbacks;

  private localChar = getSelectedCharacter();
  private mode = (() => { try { return localStorage.getItem("nj-lobby-mode") ?? "best-height"; } catch { return "best-height"; } })();
  private touchControls = false;
  private selectedTheme = "theme_default";
  private useCustomRun = false;
  private sharedRunConfig: RunConfig | null = null;

  private remotePlayers = new Map<string, LobbyPlayer>();
  private localReady = false;
  private countdownStartTime = -1; // -1 = not counting
  private countdownDuration = 0;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private starting = false;
  private nextColorIndex = 1; // 0 reserved for local

  // UI elements
  private playerListContainer = new Container();
  private countdownText: Text;
  private readyText: Text;
  private readyBg: Graphics;
  private playerCountText: Text;

  constructor(role: LobbyRole, sync: GameSync, callbacks: LobbyCallbacks) {
    this.role = role; this.sync = sync; this.callbacks = callbacks;
    const uiT = getUITheme(); const cx = GAME_WIDTH / 2;

    const bg = new Graphics(); bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT); bg.fill({ color: uiT.bg, alpha: 0.95 }); this.container.addChild(bg);
    const title = new Text({ text: "LOBBY", style: HEADER });
    title.x = cx; title.y = 35; title.anchor.set(0.5, 0.5); this.container.addChild(title);

    this.playerCountText = new Text({ text: "Players: 1", style: STATUS });
    this.playerCountText.x = cx; this.playerCountText.y = 55; this.playerCountText.anchor.set(0.5, 0.5); this.container.addChild(this.playerCountText);

    // Player list area (scrollable region) — positioned lower so settings don't need scrolling
    this.playerListContainer.y = 340;
    this.container.addChild(this.playerListContainer);

    // Settings section — directly accessible without scrolling
    let y = 75;

    // Character picker
    const charLabel = new Text({
      text: `Character: ${CHARACTERS.find(c => c.id === this.localChar)?.name ?? "Chef"} (tap)`,
      style: new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#ffcc44", stroke: { color: "#000000", width: 2 } }),
    });
    charLabel.x = cx; charLabel.y = y; charLabel.anchor.set(0.5, 0.5);
    charLabel.eventMode = "static"; charLabel.cursor = "pointer";
    charLabel.on("pointertap", () => {
      const idx = CHARACTERS.findIndex(c => c.id === this.localChar);
      this.localChar = CHARACTERS[(idx + 1) % CHARACTERS.length].id;
      setSelectedCharacter(this.localChar);
      charLabel.text = `Character: ${CHARACTERS.find(c => c.id === this.localChar)?.name ?? "Chef"} (tap)`;
      this.broadcastLocal();
    });
    this.container.addChild(charLabel);
    y += 22;

    // Mode selection
    const MODES = ["best-height", "first-to-die", "timed-2min"] as const;
    const MODE_LABELS: Record<string, string> = { "best-height": "Best Height", "first-to-die": "First to Die", "timed-2min": "Timed (2 min)" };
    const modeLabel = new Text({ text: `Mode: ${MODE_LABELS[this.mode]}`, style: LABEL });
    modeLabel.x = cx; modeLabel.y = y; modeLabel.anchor.set(0.5, 0.5); this.container.addChild(modeLabel);
    if (role === "host") {
      modeLabel.eventMode = "static"; modeLabel.cursor = "pointer";
      modeLabel.text = `Mode: ${MODE_LABELS[this.mode]} (tap)`;
      modeLabel.on("pointertap", () => {
        const idx = MODES.indexOf(this.mode as typeof MODES[number]);
        this.mode = MODES[(idx + 1) % MODES.length];
        try { localStorage.setItem("nj-lobby-mode", this.mode); } catch { /* */ }
        modeLabel.text = `Mode: ${MODE_LABELS[this.mode]} (tap)`;
        this.sync.sendGameEvent({ type: "ready", payload: { mode: this.mode } });
      });
    }
    y += 20;

    // Touch controls toggle
    const touchLabel = new Text({ text: "Touch Controls: OFF (tap)", style: SMALL });
    touchLabel.x = cx; touchLabel.y = y; touchLabel.anchor.set(0.5, 0.5);
    touchLabel.eventMode = "static"; touchLabel.cursor = "pointer";
    touchLabel.on("pointertap", () => {
      this.touchControls = !this.touchControls;
      touchLabel.text = `Touch Controls: ${this.touchControls ? "ON" : "OFF"} (tap)`;
      touchLabel.style.fill = this.touchControls ? "#44ff44" : "#aaaaaa";
      this.sync.sendGameEvent({ type: "ready", payload: { touchControls: this.touchControls } });
    });
    this.container.addChild(touchLabel);
    y += 20;

    // Theme picker (host only)
    const THEMES = COSMETICS.filter(c => c.type === "theme");
    const themeLabel = new Text({
      text: `Theme: ${THEMES.find(t => t.id === this.selectedTheme)?.name ?? "Classic"}`,
      style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#ccaaff", stroke: { color: "#000000", width: 2 } }),
    });
    themeLabel.x = cx; themeLabel.y = y; themeLabel.anchor.set(0.5, 0.5); this.container.addChild(themeLabel);
    if (role === "host") {
      themeLabel.eventMode = "static"; themeLabel.cursor = "pointer";
      themeLabel.text += " (tap)";
      themeLabel.on("pointertap", () => {
        const idx = THEMES.findIndex(t => t.id === this.selectedTheme);
        this.selectedTheme = THEMES[(idx + 1) % THEMES.length].id;
        themeLabel.text = `Theme: ${THEMES.find(t => t.id === this.selectedTheme)?.name ?? "Classic"} (tap)`;
        this.sync.sendGameEvent({ type: "ready", payload: { theme: this.selectedTheme } });
      });
    }
    y += 20;

    // Custom run toggle (host only)
    const customLabel = new Text({ text: "Custom Run: OFF", style: SMALL });
    customLabel.x = cx; customLabel.y = y; customLabel.anchor.set(0.5, 0.5); this.container.addChild(customLabel);
    if (role === "host") {
      customLabel.eventMode = "static"; customLabel.cursor = "pointer"; customLabel.text = "Custom Run: OFF (tap)";
      customLabel.on("pointertap", () => {
        this.useCustomRun = !this.useCustomRun;
        customLabel.text = this.useCustomRun ? "Custom Run: ON" : "Custom Run: OFF (tap)";
        customLabel.style.fill = this.useCustomRun ? "#44ff44" : "#aaaaaa";
        this.sync.sendGameEvent({ type: "ready", payload: { customRun: this.useCustomRun } });
      });
    }
    y += 30;

    // Ready button
    this.readyBg = new Graphics();
    this.readyBg.roundRect(cx - 100, y - 18, 200, 36, 10);
    this.readyBg.fill({ color: 0x2a6e3f, alpha: 0.9 });
    this.readyBg.roundRect(cx - 100, y - 18, 200, 36, 10);
    this.readyBg.stroke({ width: 1.5, color: 0x44bb66, alpha: 0.5 });
    this.readyBg.eventMode = "static"; this.readyBg.cursor = "pointer"; this.container.addChild(this.readyBg);
    this.readyText = new Text({ text: "Ready", style: new TextStyle({ fontFamily: "monospace", fontSize: 16, fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 2 } }) });
    this.readyText.x = cx; this.readyText.y = y; this.readyText.anchor.set(0.5, 0.5);
    this.readyText.eventMode = "static"; this.readyText.cursor = "pointer"; this.container.addChild(this.readyText);
    const toggleReady = () => { if (this.starting) return; this.toggleReady(); };
    this.readyBg.on("pointertap", toggleReady); this.readyText.on("pointertap", toggleReady);
    y += 30;

    // Countdown text
    this.countdownText = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace", fontSize: 20, fill: "#ffdd44", fontWeight: "bold", stroke: { color: "#000000", width: 3 } }) });
    this.countdownText.x = cx; this.countdownText.y = y; this.countdownText.anchor.set(0.5, 0.5); this.container.addChild(this.countdownText);

    // Guest settings listener
    const onSettingsChanged = () => {
      const tn = THEMES.find(t => t.id === this.selectedTheme)?.name ?? "Classic";
      themeLabel.text = role === "host" ? `Theme: ${tn} (tap)` : `Theme: ${tn}`;
      modeLabel.text = role === "host" ? `Mode: ${MODE_LABELS[this.mode]} (tap)` : `Mode: ${MODE_LABELS[this.mode]}`;
      customLabel.text = this.useCustomRun ? "Custom Run: ON" : "Custom Run: OFF";
      customLabel.style.fill = this.useCustomRun ? "#44ff44" : "#aaaaaa";
    };

    // Listen for remote events
    this.sync.on({
      onRemotePosition: () => {},
      onRemoteEvent: (event: GameSyncEvent, peerId: string) => {
        this.handleRemoteEvent(event, peerId, onSettingsChanged);
      },
    });

    this.renderPlayerList();
    this.broadcastLocal();
  }

  private broadcastLocal(): void {
    const c = loadCosmetics();
    this.sync.sendGameEvent({ type: "ready", payload: {
      character: this.localChar,
      tint: c.equipped.tint ?? "tint_none", trail: c.equipped.trail ?? "trail_none",
      theme: this.selectedTheme, mode: this.mode, customRun: this.useCustomRun,
    } });
  }

  private toggleReady(): void {
    this.localReady = !this.localReady;
    this.readyText.text = this.localReady ? "Not Ready" : "Ready";
    const cx = GAME_WIDTH / 2;
    this.readyBg.clear();
    this.readyBg.roundRect(cx - 100, this.readyText.y - 18, 200, 36, 10);
    this.readyBg.fill({ color: this.localReady ? 0x993333 : 0x2a6e3f, alpha: 0.9 });
    this.readyBg.roundRect(cx - 100, this.readyText.y - 18, 200, 36, 10);
    this.readyBg.stroke({ width: 1.5, color: this.localReady ? 0xbb4444 : 0x44bb66, alpha: 0.5 });
    this.sync.sendGameEvent({ type: "ready", payload: { ready: this.localReady, role: this.role, character: this.localChar } });
    this.checkCountdown();
  }

  private checkCountdown(): void {
    if (this.starting) return;
    const allReady = this.localReady && [...this.remotePlayers.values()].every(p => p.ready);
    const anyReady = this.localReady || [...this.remotePlayers.values()].some(p => p.ready);

    if (allReady && this.remotePlayers.size > 0) {
      // All ready → start fast (3s or less if already counting)
      if (this.countdownStartTime < 0) {
        this.startCountdown(COUNTDOWN_SHORT);
      } else {
        const elapsed = performance.now() - this.countdownStartTime;
        const remaining = this.countdownDuration - elapsed;
        if (remaining > COUNTDOWN_SHORT) {
          this.startCountdown(COUNTDOWN_SHORT); // shrink to 3s
        }
        // else: already under 3s, let it finish
      }
    } else if (this.role === "host" && this.localReady && this.remotePlayers.size > 0 && this.countdownStartTime < 0) {
      // Host ready → 15s countdown
      this.startCountdown(COUNTDOWN_LONG);
      this.sync.sendGameEvent({ type: "ready", payload: { countdown: COUNTDOWN_LONG } });
    } else if (!anyReady) {
      this.cancelCountdown();
    }
  }

  private startCountdown(durationMs: number): void {
    this.cancelCountdown();
    this.countdownStartTime = performance.now();
    this.countdownDuration = durationMs;
    this.countdownInterval = setInterval(() => this.tickCountdown(), 100);
  }

  private tickCountdown(): void {
    if (this.starting) return;
    const elapsed = performance.now() - this.countdownStartTime;
    const remain = Math.max(0, this.countdownDuration - elapsed);
    const secs = Math.ceil(remain / 1000);
    this.countdownText.text = secs > 0 ? `Starting in ${secs}...` : "";
    if (remain <= 0) this.doStart();
  }

  private cancelCountdown(): void {
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
    this.countdownStartTime = -1; this.countdownDuration = 0;
    this.countdownText.text = "";
  }

  private doStart(): void {
    this.starting = true;
    this.cancelCountdown();
    const seed = Math.floor(Math.random() * 0xffffffff);
    const runCfg = this.useCustomRun ? loadRunConfigFromStorage() : null;
    const dbgCfg = this.useCustomRun ? loadDebugConfigFromStorage() : null;
    if (dbgCfg) setDebugConfig(dbgCfg);
    this.sync.sendGameEvent({
      type: "start",
      payload: { seed, mode: this.mode, touchControls: this.touchControls, character: this.localChar,
        theme: this.selectedTheme, runCfg: runCfg ? serializeForSync(runCfg) : null, dbgCfg },
    });
    const remotePeers = new Map<string, { character: string; cosmetics?: RemoteCosmetics }>();
    for (const [id, p] of this.remotePlayers) {
      remotePeers.set(id, { character: p.character, cosmetics: { ...p.cosmetics, theme: this.selectedTheme } });
    }
    this.callbacks.onStart(seed, this.mode, this.touchControls, remotePeers,
      runCfg ? { ...runCfg, seed } : undefined);
  }

  private handleRemoteEvent(event: GameSyncEvent, peerId: string, onSettingsChanged: () => void): void {
    // Ensure peer exists
    if (!this.remotePlayers.has(peerId)) {
      this.remotePlayers.set(peerId, { peerId, character: "chef", cosmetics: {}, ready: false, colorIndex: this.nextColorIndex++ });
      this.renderPlayerList();
    }
    const peer = this.remotePlayers.get(peerId)!;

    // Re-broadcast our state to new peers
    if (!peer.ready && event.type === "ready") this.broadcastLocal();

    if (event.type === "ready") {
      if (this.role === "guest") {
        if (event.payload.mode) { this.mode = event.payload.mode as string; onSettingsChanged(); }
        if (event.payload.theme) { this.selectedTheme = event.payload.theme as string; onSettingsChanged(); }
        if (event.payload.customRun !== undefined) { this.useCustomRun = event.payload.customRun as boolean; onSettingsChanged(); }
      }
      if (event.payload.touchControls !== undefined) this.touchControls = event.payload.touchControls as boolean;
      if (event.payload.character) {
        peer.character = event.payload.character as string;
        if (event.payload.tint) peer.cosmetics.tint = event.payload.tint as string;
        if (event.payload.trail) peer.cosmetics.trail = event.payload.trail as string;
      }
      if (event.payload.ready !== undefined) { peer.ready = event.payload.ready as boolean; this.checkCountdown(); }
      if (event.payload.countdown && this.role === "guest" && this.countdownStartTime < 0) {
        this.startCountdown(event.payload.countdown as number);
      }
      this.renderPlayerList();
    }

    if (event.type === "start" && this.role === "guest") {
      this.starting = true; this.cancelCountdown();
      const seed = event.payload.seed as number;
      const mode = (event.payload.mode as string) || "best-height";
      const tc = (event.payload.touchControls as boolean) ?? this.touchControls;
      if (event.payload.theme) this.selectedTheme = event.payload.theme as string;
      if (event.payload.dbgCfg) setDebugConfig({ ...createDebugConfig(), ...(event.payload.dbgCfg as Partial<DebugConfig>) });
      if (event.payload.runCfg) this.sharedRunConfig = { ...deserializeFromSync(event.payload.runCfg as Record<string, unknown>), seed };
      const remotePeers = new Map<string, { character: string; cosmetics?: RemoteCosmetics }>();
      // Host is a remote peer too — use the character from the start event
      remotePeers.set(peerId, { character: (event.payload.character as string) ?? "chef", cosmetics: { theme: this.selectedTheme } });
      for (const [id, p] of this.remotePlayers) {
        if (id !== peerId) remotePeers.set(id, { character: p.character, cosmetics: { ...p.cosmetics, theme: this.selectedTheme } });
      }
      this.callbacks.onStart(seed, mode, tc, remotePeers, this.sharedRunConfig ?? undefined);
    }
  }

  private renderPlayerList(): void {
    this.playerListContainer.removeChildren();
    const cx = GAME_WIDTH / 2;
    let y = 0;

    // Header
    const hdr = new Text({ text: "─── Players ───", style: SMALL });
    hdr.x = cx; hdr.y = y; hdr.anchor.set(0.5, 0.5); this.playerListContainer.addChild(hdr);
    y += 16;

    // Local player
    this.renderPlayerRow(this.playerListContainer, cx, y, "You", this.localChar, this.localReady, 0);
    y += 22;

    // Remote players
    for (const p of this.remotePlayers.values()) {
      this.renderPlayerRow(this.playerListContainer, cx, y, p.peerId.slice(0, 6), p.character, p.ready, p.colorIndex);
      y += 22;
    }

    this.playerCountText.text = `Players: ${1 + this.remotePlayers.size}`;
  }

  private renderPlayerRow(parent: Container, cx: number, y: number, label: string, charId: string, ready: boolean, colorIdx: number): void {
    const dot = new Graphics(); dot.circle(cx - 120, y, 4); dot.fill(getPeerColor(colorIdx)); parent.addChild(dot);
    const gfx = new Graphics(); gfx.x = cx - 100; gfx.y = y - 10; drawCharacter(gfx, 16, 20, charId); parent.addChild(gfx);
    const name = new Text({ text: label, style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#ffffff", stroke: { color: "#000000", width: 1 } }) });
    name.x = cx - 75; name.y = y; name.anchor.set(0, 0.5); parent.addChild(name);
    const status = new Text({ text: ready ? "Ready" : "...", style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: ready ? "#44ff44" : "#888888", stroke: { color: "#000000", width: 1 } }) });
    status.x = cx + 80; status.y = y; status.anchor.set(0, 0.5); parent.addChild(status);
  }

  destroy(): void {
    this.cancelCountdown();
    this.container.destroy({ children: true });
  }
}
