/**
 * Multiplayer lobby — supports 2-24 players.
 * Host is single source of truth for countdown. Guests display host state.
 * Mesh broadcasts ready events peer-to-peer; host relays countdown to all.
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
import { copyToClipboard, showHtmlToast } from "./HtmlOverlay";
import { selfId } from "./NostrSignaling";

function serializeForSync(cfg: RunConfig): Record<string, unknown> { return { ...cfg, enabledPowerUps: [...cfg.enabledPowerUps] }; }
function deserializeFromSync(d: Record<string, unknown>): RunConfig { return { ...createDefaultRunConfig(), ...d, enabledPowerUps: new Set(d.enabledPowerUps as string[] ?? []) }; }

export function getPlayerName(): string { try { return localStorage.getItem("nj-player-name") ?? ""; } catch { return ""; } }
export function setPlayerName(name: string): void { try { localStorage.setItem("nj-player-name", name); } catch { /* */ } }

export type LobbyRole = "host" | "guest";

export interface LobbyCallbacks {
  onStart: (seed: number, mode: string, touchControls: boolean,
    remotePeers: Map<string, { character: string; cosmetics?: RemoteCosmetics; name?: string }>,
    sharedRunConfig?: RunConfig) => void;
  onKicked?: () => void;
}

interface LobbyPlayer {
  peerId: string; character: string; cosmetics: RemoteCosmetics;
  ready: boolean; colorIndex: number; name: string; announced: boolean;
}

const HEADER = new TextStyle({ fontFamily: "monospace", fontSize: 22, fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 3 } });
const LABEL = new TextStyle({ fontFamily: "monospace", fontSize: 14, fill: "#ffffff", stroke: { color: "#000000", width: 2 } });
const SMALL = new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#aaaaaa", stroke: { color: "#000000", width: 2 } });
const STATUS = new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#aaaaaa", stroke: { color: "#000000", width: 2 } });

const COUNTDOWN_LONG = 15_000;
const COUNTDOWN_SHORT = 3_000;

export class LobbyScreen {
  readonly container = new Container();
  private role: LobbyRole;
  private sync: GameSync;
  private callbacks: LobbyCallbacks;
  private localName = getPlayerName();
  private localChar = getSelectedCharacter();
  private mode = (() => { try { return localStorage.getItem("nj-lobby-mode") ?? "best-height"; } catch { return "best-height"; } })();
  private touchControls = false;
  private selectedTheme = "theme_default";
  private useCustomRun = false;
  private sharedRunConfig: RunConfig | null = null;
  private remotePlayers = new Map<string, LobbyPlayer>();
  private localReady = false;
  private countdownEndTime = -1;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private starting = false;
  private nextColorIndex = 1;
  private roomCode: string;
  private playerListContainer = new Container();
  private countdownText: Text;
  private readyText: Text;
  private readyBg: Graphics;
  private playerCountText: Text;
  private nameLabel: Text;

  constructor(role: LobbyRole, sync: GameSync, callbacks: LobbyCallbacks, roomCode?: string) {
    this.role = role; this.sync = sync; this.callbacks = callbacks;
    this.roomCode = roomCode ?? "";
    const uiT = getUITheme(); const cx = GAME_WIDTH / 2;
    const bg = new Graphics(); bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT); bg.fill({ color: uiT.bg, alpha: 0.95 }); this.container.addChild(bg);
    const title = new Text({ text: "LOBBY", style: HEADER });
    title.x = cx; title.y = 30; title.anchor.set(0.5, 0.5); this.container.addChild(title);
    if (this.roomCode) { const ct = new Text({ text: `Code: ${this.roomCode}`, style: new TextStyle({ fontFamily: "monospace", fontSize: 16, fill: "#ffdd44", fontWeight: "bold", letterSpacing: 2, stroke: { color: "#000000", width: 2 } }) });
      ct.x = cx; ct.y = 52; ct.anchor.set(0.5, 0.5); ct.eventMode = "static"; ct.cursor = "pointer";
      ct.on("pointertap", async () => { if (await copyToClipboard(this.roomCode)) showHtmlToast("Code copied!"); }); this.container.addChild(ct); }
    this.playerCountText = new Text({ text: "Players: 1", style: STATUS });
    this.playerCountText.x = cx; this.playerCountText.y = 68; this.playerCountText.anchor.set(0.5, 0.5); this.container.addChild(this.playerCountText);
    this.playerListContainer.y = 420; this.container.addChild(this.playerListContainer); let y = 88;

    // Name
    this.nameLabel = new Text({ text: this.localName ? `Name: ${this.localName} (tap)` : "Set Name (tap)",
      style: new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#66ccff", stroke: { color: "#000000", width: 2 } }) });
    this.nameLabel.x = cx; this.nameLabel.y = y; this.nameLabel.anchor.set(0.5, 0.5);
    this.nameLabel.eventMode = "static"; this.nameLabel.cursor = "pointer";
    this.nameLabel.on("pointertap", () => {
      const input = prompt("Enter your name (max 12 chars):", this.localName);
      if (input === null) return;
      this.localName = input.trim().slice(0, 12); setPlayerName(this.localName);
      this.nameLabel.text = this.localName ? `Name: ${this.localName} (tap)` : "Set Name (tap)";
      this.broadcastLocal(); this.renderPlayerList();
    });
    this.container.addChild(this.nameLabel); y += 32;

    // Character
    const charLabel = new Text({ text: `Character: ${CHARACTERS.find(c => c.id === this.localChar)?.name ?? "Chef"} (tap)`,
      style: new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#ffcc44", stroke: { color: "#000000", width: 2 } }) });
    charLabel.x = cx; charLabel.y = y; charLabel.anchor.set(0.5, 0.5);
    charLabel.eventMode = "static"; charLabel.cursor = "pointer";
    charLabel.on("pointertap", () => {
      const idx = CHARACTERS.findIndex(c => c.id === this.localChar);
      this.localChar = CHARACTERS[(idx + 1) % CHARACTERS.length].id; setSelectedCharacter(this.localChar);
      charLabel.text = `Character: ${CHARACTERS.find(c => c.id === this.localChar)?.name ?? "Chef"} (tap)`;
      this.broadcastLocal();
    });
    this.container.addChild(charLabel); y += 34;

    // Mode
    const MODES = ["best-height", "first-to-die", "timed-2min"] as const;
    const ML: Record<string, string> = { "best-height": "Best Height", "first-to-die": "First to Die", "timed-2min": "Timed (2 min)" };
    const modeLabel = new Text({ text: `Mode: ${ML[this.mode]}`, style: LABEL });
    modeLabel.x = cx; modeLabel.y = y; modeLabel.anchor.set(0.5, 0.5); this.container.addChild(modeLabel);
    if (role === "host") { modeLabel.eventMode = "static"; modeLabel.cursor = "pointer"; modeLabel.text += " (tap)";
      modeLabel.on("pointertap", () => { const i = MODES.indexOf(this.mode as typeof MODES[number]); this.mode = MODES[(i + 1) % MODES.length];
        try { localStorage.setItem("nj-lobby-mode", this.mode); } catch { /* */ }
        modeLabel.text = `Mode: ${ML[this.mode]} (tap)`; this.sync.sendGameEvent({ type: "ready", payload: { mode: this.mode } }); });
    } y += 34;

    const touchLabel = new Text({ text: "Touch Controls: OFF (tap)", style: SMALL });
    touchLabel.x = cx; touchLabel.y = y; touchLabel.anchor.set(0.5, 0.5);
    touchLabel.eventMode = "static"; touchLabel.cursor = "pointer";
    touchLabel.on("pointertap", () => { this.touchControls = !this.touchControls;
      touchLabel.text = `Touch Controls: ${this.touchControls ? "ON" : "OFF"} (tap)`;
      touchLabel.style.fill = this.touchControls ? "#44ff44" : "#aaaaaa";
      this.sync.sendGameEvent({ type: "ready", payload: { touchControls: this.touchControls } }); });
    this.container.addChild(touchLabel); y += 32;

    const THEMES = COSMETICS.filter(c => c.type === "theme");
    const themeLabel = new Text({ text: `Theme: ${THEMES.find(t => t.id === this.selectedTheme)?.name ?? "Classic"}`,
      style: new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#ccaaff", stroke: { color: "#000000", width: 2 } }) });
    themeLabel.x = cx; themeLabel.y = y; themeLabel.anchor.set(0.5, 0.5); this.container.addChild(themeLabel);
    if (role === "host") { themeLabel.eventMode = "static"; themeLabel.cursor = "pointer"; themeLabel.text += " (tap)";
      themeLabel.on("pointertap", () => { const i = THEMES.findIndex(t => t.id === this.selectedTheme); this.selectedTheme = THEMES[(i + 1) % THEMES.length].id;
        themeLabel.text = `Theme: ${THEMES.find(t => t.id === this.selectedTheme)?.name ?? "Classic"} (tap)`;
        this.sync.sendGameEvent({ type: "ready", payload: { theme: this.selectedTheme } }); });
    } y += 32;
    const customLabel = new Text({ text: "Custom Run: OFF", style: SMALL });
    customLabel.x = cx; customLabel.y = y; customLabel.anchor.set(0.5, 0.5); this.container.addChild(customLabel);
    if (role === "host") { customLabel.eventMode = "static"; customLabel.cursor = "pointer"; customLabel.text += " (tap)";
      customLabel.on("pointertap", () => { this.useCustomRun = !this.useCustomRun;
        customLabel.text = this.useCustomRun ? "Custom Run: ON" : "Custom Run: OFF (tap)";
        customLabel.style.fill = this.useCustomRun ? "#44ff44" : "#aaaaaa";
        this.sync.sendGameEvent({ type: "ready", payload: { customRun: this.useCustomRun } }); });
    } y += 40;

    // Ready button
    this.readyBg = new Graphics(); this.drawReadyBtn(cx, y, false);
    this.readyBg.eventMode = "static"; this.readyBg.cursor = "pointer"; this.container.addChild(this.readyBg);
    this.readyText = new Text({ text: "Ready", style: new TextStyle({ fontFamily: "monospace", fontSize: 18, fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 2 } }) });
    this.readyText.x = cx; this.readyText.y = y; this.readyText.anchor.set(0.5, 0.5);
    this.readyText.eventMode = "static"; this.readyText.cursor = "pointer"; this.container.addChild(this.readyText);
    const toggle = () => { if (!this.starting) this.toggleReady(); };
    this.readyBg.on("pointertap", toggle); this.readyText.on("pointertap", toggle); y += 40;

    // Countdown text
    this.countdownText = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace", fontSize: 22, fill: "#ffdd44", fontWeight: "bold", stroke: { color: "#000000", width: 3 } }) });
    this.countdownText.x = cx; this.countdownText.y = y; this.countdownText.anchor.set(0.5, 0.5); this.container.addChild(this.countdownText);

    const onSettings = () => { const tn = THEMES.find(t => t.id === this.selectedTheme)?.name ?? "Classic";
      themeLabel.text = role === "host" ? `Theme: ${tn} (tap)` : `Theme: ${tn}`;
      modeLabel.text = role === "host" ? `Mode: ${ML[this.mode]} (tap)` : `Mode: ${ML[this.mode]}`;
      customLabel.text = this.useCustomRun ? "Custom Run: ON" : "Custom Run: OFF";
      customLabel.style.fill = this.useCustomRun ? "#44ff44" : "#aaaaaa"; };

    this.sync.on({
      onRemotePosition: () => {},
      onRemoteEvent: (ev: GameSyncEvent, pid: string) => this.handleEvent(ev, pid, onSettings),
    });
    this.renderPlayerList();
    setTimeout(() => this.broadcastLocal(), 200);
    setTimeout(() => this.broadcastLocal(), 1000);
    // Periodic heartbeat: re-announce every 3s so late-connecting peers discover each other
    this.heartbeatInterval = setInterval(() => { if (!this.starting) this.broadcastLocal(); }, 3000);
  }

  private drawReadyBtn(cx: number, y: number, isReady: boolean): void {
    this.readyBg.clear();
    this.readyBg.roundRect(cx - 100, y - 18, 200, 36, 10);
    this.readyBg.fill({ color: isReady ? 0x993333 : 0x2a6e3f, alpha: 0.9 });
    this.readyBg.roundRect(cx - 100, y - 18, 200, 36, 10);
    this.readyBg.stroke({ width: 1.5, color: isReady ? 0xbb4444 : 0x44bb66, alpha: 0.5 });
  }

  /** Broadcast full local state to all peers. */
  private broadcastLocal(): void {
    const c = loadCosmetics();
    this.sync.sendGameEvent({ type: "ready", payload: {
      character: this.localChar, name: this.localName,
      tint: c.equipped.tint ?? "tint_none", trail: c.equipped.trail ?? "trail_none",
      ready: this.localReady, role: this.role,
    } });
  }

  private toggleReady(): void {
    this.localReady = !this.localReady;
    this.readyText.text = this.localReady ? "Not Ready" : "Ready";
    this.drawReadyBtn(GAME_WIDTH / 2, this.readyText.y, this.localReady);
    this.broadcastLocal();
    if (this.role === "host") this.evaluateCountdown();
  }

  private evaluateCountdown(): void {
    if (this.starting) return;
    const hr = this.remotePlayers.size > 0;
    const all = this.localReady && hr && [...this.remotePlayers.values()].every(p => p.ready);
    if (all) { if (this.countdownEndTime < 0) this.setCountdown(COUNTDOWN_SHORT);
      else if (this.countdownEndTime - performance.now() > COUNTDOWN_SHORT) this.setCountdown(COUNTDOWN_SHORT);
    } else if (this.localReady && hr && this.countdownEndTime < 0) { this.setCountdown(COUNTDOWN_LONG);
    } else if (!this.localReady) { this.setCountdown(0); }
  }

  /** Host: set countdown and broadcast to all. secs=0 → cancel. */
  private setCountdown(durationMs: number): void {
    this.cancelLocalTimer();
    if (durationMs <= 0) {
      this.countdownEndTime = -1; this.countdownText.text = "";
      this.sync.sendGameEvent({ type: "zone", payload: { countdown: 0 } });
      return;
    }
    this.countdownEndTime = performance.now() + durationMs;
    this.countdownInterval = setInterval(() => this.tickCountdown(), 100);
    this.sync.sendGameEvent({ type: "zone", payload: { countdown: Math.ceil(durationMs / 1000) } });
  }

  private cancelLocalTimer(): void {
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
  }

  private tickCountdown(): void {
    if (this.starting) return;
    const remain = Math.max(0, this.countdownEndTime - performance.now());
    const secs = Math.ceil(remain / 1000);
    this.countdownText.text = secs > 0 ? `Starting in ${secs}...` : "";
    if (remain <= 0) this.doStart();
  }

  /**
   * Clock-offset sync: host measures each guest's clock offset, picks a shared start time,
   * and tells each guest when to start in THEIR local clock.
   */
  private doStart(): void {
    this.starting = true; this.cancelLocalTimer(); this.countdownText.text = "Syncing...";
    this.pendingSeed = Math.floor(Math.random() * 0xffffffff);
    this.pendingRunCfg = this.useCustomRun ? loadRunConfigFromStorage() : null;
    const dc = this.useCustomRun ? loadDebugConfigFromStorage() : null; if (dc) setDebugConfig(dc);
    this.preparedPeers = new Set(); this.peerOffsets = new Map();
    this.prepareSentAt = Date.now();
    const cos = loadCosmetics();
    this.sync.sendGameEvent({ type: "start", payload: { phase: "prepare", seed: this.pendingSeed, mode: this.mode,
      touchControls: this.touchControls, character: this.localChar, name: this.localName, theme: this.selectedTheme,
      tint: cos.equipped.tint ?? "tint_none", trail: cos.equipped.trail ?? "trail_none",
      hostTime: this.prepareSentAt, runCfg: this.pendingRunCfg ? serializeForSync(this.pendingRunCfg) : null, dbgCfg: dc } });
    this.barrierTimeout = setTimeout(() => this.sendGoWithOffsets(), 2000);
  }
  private pendingSeed = 0; private pendingRunCfg: RunConfig | null = null;
  private preparedPeers = new Set<string>(); private barrierTimeout: ReturnType<typeof setTimeout> | null = null;
  private prepareHostId = ""; private prepareHostChar = "chef"; private prepareHostName = "";
  private prepareHostTint = ""; private prepareHostTrail = ""; private guestLaunched = false;
  private prepareSentAt = 0; private peerOffsets = new Map<string, number>();

  private onPrepared(peerId: string, guestTime: number): void {
    this.preparedPeers.add(peerId);
    const rtt = Date.now() - this.prepareSentAt;
    this.peerOffsets.set(peerId, guestTime - this.prepareSentAt - rtt / 2);
    if (this.preparedPeers.size >= this.remotePlayers.size) { if (this.barrierTimeout) { clearTimeout(this.barrierTimeout); this.barrierTimeout = null; } this.sendGoWithOffsets(); }
  }
  private sendGoWithOffsets(): void {
    if (this.barrierTimeout) { clearTimeout(this.barrierTimeout); this.barrierTimeout = null; }
    const startAt = Math.ceil((Date.now() + 1000) / 1000) * 1000;
    const ps: Record<string, number> = {}; for (const [id, off] of this.peerOffsets) ps[id] = startAt + off;
    this.sync.sendGameEvent({ type: "start", payload: { phase: "go", startAt, peerStartAt: ps } });
    this.countdownText.text = "GO!"; const rp = new Map<string, { character: string; cosmetics?: RemoteCosmetics; name?: string }>();
    for (const [id, p] of this.remotePlayers) rp.set(id, { character: p.character, cosmetics: { ...p.cosmetics, theme: this.selectedTheme }, name: p.name });
    setTimeout(() => this.callbacks.onStart(this.pendingSeed, this.mode, this.touchControls, rp, this.pendingRunCfg ? { ...this.pendingRunCfg, seed: this.pendingSeed } : undefined), Math.max(0, startAt - Date.now()));
  }

  private guestLaunchAt(t: number): void {
    if (this.guestLaunched) return; this.guestLaunched = true; this.countdownText.text = "GO!";
    const rp = new Map<string, { character: string; cosmetics?: RemoteCosmetics; name?: string }>();
    rp.set(this.prepareHostId, { character: this.prepareHostChar, cosmetics: { theme: this.selectedTheme, tint: this.prepareHostTint, trail: this.prepareHostTrail }, name: this.prepareHostName });
    for (const [id, p] of this.remotePlayers) { if (id !== this.prepareHostId) rp.set(id, { character: p.character, cosmetics: { ...p.cosmetics, theme: this.selectedTheme }, name: p.name }); }
    setTimeout(() => this.callbacks.onStart(this.pendingSeed, this.mode, this.touchControls, rp, this.sharedRunConfig ?? undefined), Math.max(0, t - Date.now()));
  }

  private handleEvent(event: GameSyncEvent, peerId: string, onSettings: () => void): void {
    if (this.kickedIds.has(peerId)) return;
    if (!this.remotePlayers.has(peerId)) {
      this.remotePlayers.set(peerId, { peerId, character: "chef", cosmetics: {}, ready: false, colorIndex: this.nextColorIndex++, name: "", announced: false });
      if (this.role === "host" && this.localReady && this.countdownEndTime > 0) { // new player mid-countdown → unready
        this.localReady = false; this.readyText.text = "Ready";
        this.drawReadyBtn(GAME_WIDTH / 2, this.readyText.y, false); this.setCountdown(0); this.broadcastLocal(); }
    }
    const peer = this.remotePlayers.get(peerId)!;
    if (!peer.announced && event.type === "ready") { peer.announced = true; this.broadcastLocal(); }

    // Kick event from host
    if (event.type === "zone" && event.payload.kick) {
      const kid = event.payload.kick as string;
      if (kid === selfId) { this.starting = true; this.guestLaunched = true;
        this.sync.on({ onRemotePosition: () => {}, onRemoteEvent: () => {} });
        this.countdownText.text = "Kicked by host"; setTimeout(() => this.callbacks.onKicked?.(), 1500); return; }
      this.kickedIds.add(kid); this.remotePlayers.delete(kid); this.renderPlayerList(); return;
    }
    if (event.type === "zone" && event.payload.countdown !== undefined) {
      const secs = event.payload.countdown as number; this.cancelLocalTimer();
      if (secs <= 0) { this.countdownEndTime = -1; this.countdownText.text = ""; } else {
        this.countdownEndTime = performance.now() + secs * 1000;
        this.countdownInterval = setInterval(() => {
          const r = Math.max(0, this.countdownEndTime - performance.now()), s = Math.ceil(r / 1000);
          this.countdownText.text = s > 0 ? `Starting in ${s}...` : "Waiting for host...";
          if (r <= 0) this.cancelLocalTimer();
        }, 100);
      } return;
    }

    if (event.type === "ready") {
      const pl = event.payload;
      if (this.role === "guest") {
        if (pl.mode) { this.mode = pl.mode as string; onSettings(); }
        if (pl.theme) { this.selectedTheme = pl.theme as string; onSettings(); }
        if (pl.customRun !== undefined) { this.useCustomRun = pl.customRun as boolean; onSettings(); }
      }
      if (pl.touchControls !== undefined) this.touchControls = pl.touchControls as boolean;
      if (pl.character) { peer.character = pl.character as string; if (pl.tint) peer.cosmetics.tint = pl.tint as string; if (pl.trail) peer.cosmetics.trail = pl.trail as string; }
      if (pl.name !== undefined) peer.name = (pl.name as string).slice(0, 12);
      if (pl.ready !== undefined) { peer.ready = pl.ready as boolean; if (this.role === "host") this.evaluateCountdown(); }
      this.renderPlayerList();
    }

    if (event.type === "start" && this.role === "guest") {
      const phase = (event.payload.phase as string) ?? "go";
      if (phase === "prepare") {
        this.starting = true; this.cancelLocalTimer(); this.countdownText.text = "Syncing...";
        this.pendingSeed = event.payload.seed as number;
        this.mode = (event.payload.mode as string) || "best-height"; this.touchControls = (event.payload.touchControls as boolean) ?? this.touchControls;
        if (event.payload.theme) this.selectedTheme = event.payload.theme as string;
        if (event.payload.dbgCfg) setDebugConfig({ ...createDebugConfig(), ...(event.payload.dbgCfg as Partial<DebugConfig>) });
        if (event.payload.runCfg) this.sharedRunConfig = { ...deserializeFromSync(event.payload.runCfg as Record<string, unknown>), seed: this.pendingSeed };
        this.prepareHostId = peerId; this.prepareHostChar = (event.payload.character as string) ?? "chef";
        this.prepareHostName = (event.payload.name as string) ?? ""; this.prepareHostTint = (event.payload.tint as string) ?? ""; this.prepareHostTrail = (event.payload.trail as string) ?? "";
        // Respond with our local clock so host can calculate offset
        this.sync.sendGameEvent({ type: "score", payload: { prepared: true, guestTime: Date.now() } });
      } else if (phase === "go" && !this.guestLaunched) {
        // Host sends per-peer start times adjusted for clock offset
        const peerStartAt = (event.payload.peerStartAt as Record<string, number>) ?? {};
        const myStart = peerStartAt[selfId] ?? ((event.payload.startAt as number) ?? Date.now());
        this.guestLaunchAt(myStart);
      }
    }
    if (event.type === "score" && event.payload.prepared && this.role === "host") {
      this.onPrepared(peerId, (event.payload.guestTime as number) ?? Date.now());
    }
  }

  private kickedIds = new Set<string>();
  private kickPlayer(id: string): void { this.kickedIds.add(id); this.remotePlayers.delete(id); this.sync.sendGameEvent({ type: "zone", payload: { kick: id } }); this.renderPlayerList(); this.evaluateCountdown(); }

  private renderPlayerList(): void {
    this.playerListContainer.removeChildren();
    const cx = GAME_WIDTH / 2; let y = 0;
    const hdr = new Text({ text: "─── Players ───", style: SMALL });
    hdr.x = cx; hdr.y = y; hdr.anchor.set(0.5, 0.5); this.playerListContainer.addChild(hdr); y += 16;
    this.renderPlayerRow(this.playerListContainer, cx, y, this.localName || "You", this.localChar, this.localReady, 0); y += 22;
    for (const p of this.remotePlayers.values()) {
      this.renderPlayerRow(this.playerListContainer, cx, y, p.name || p.peerId.slice(0, 6), p.character, p.ready, p.colorIndex, this.role === "host" ? p.peerId : undefined);
      y += 22;
    }
    this.playerCountText.text = `Players: ${1 + this.remotePlayers.size}`;
  }

  private renderPlayerRow(p: Container, cx: number, y: number, label: string, charId: string, ready: boolean, ci: number, kickId?: string): void {
    const d = new Graphics(); d.circle(cx - 120, y, 4); d.fill(getPeerColor(ci)); p.addChild(d);
    const g = new Graphics(); g.x = cx - 100; g.y = y - 10; drawCharacter(g, 16, 20, charId); p.addChild(g);
    const rs = new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#ffffff", stroke: { color: "#000000", width: 1 } });
    const n = new Text({ text: label, style: rs }); n.x = cx - 75; n.y = y; n.anchor.set(0, 0.5); p.addChild(n);
    const s = new Text({ text: ready ? "Ready" : "...", style: new TextStyle({ ...rs, fill: ready ? "#44ff44" : "#888888" }) });
    s.x = cx + 80; s.y = y; s.anchor.set(0, 0.5); p.addChild(s);
    if (kickId) { const k = new Text({ text: "✕", style: new TextStyle({ ...rs, fontSize: 14, fill: "#ff4444" }) });
      k.x = cx + 115; k.y = y; k.anchor.set(0.5, 0.5); k.eventMode = "static"; k.cursor = "pointer";
      k.on("pointertap", () => this.kickPlayer(kickId)); p.addChild(k); }
  }

  destroy(): void {
    this.cancelLocalTimer(); if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.barrierTimeout) clearTimeout(this.barrierTimeout);
    this.container.destroy({ children: true });
  }
}
