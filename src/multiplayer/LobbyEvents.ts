/**
 * Event handling logic for the multiplayer lobby.
 * Processes incoming GameSync events (ready, start, kick, countdown).
 * Extracted from LobbyScreen to keep files under 400 LOC.
 */

import type { Graphics, Text } from "pixi.js";
import { GAME_WIDTH } from "../config/constants";
import type { GameSyncEvent } from "./GameSync";
import { createDefaultRunConfig, type RunConfig } from "../systems/CustomRunConfig";
import { setDebugConfig, createDebugConfig, type DebugConfig } from "../config/debug";
import type { RemoteCosmetics } from "./RemotePlayerRenderer";
import { selfId } from "./NostrSignaling";
import type { LobbyCountdown, LobbyPlayer, StartCallback } from "./LobbyCountdown";

function deserializeFromSync(d: Record<string, unknown>): RunConfig {
  return {
    ...createDefaultRunConfig(),
    ...d,
    enabledPowerUps: new Set((d.enabledPowerUps as string[]) ?? []),
  };
}

export interface LobbyEventState {
  role: string;
  mode: string;
  selectedTheme: string;
  touchControls: boolean;
  useCustomRun: boolean;
  localReady: boolean;
  sharedRunConfig: RunConfig | null;
  kickedIds: Set<string>;
  remotePlayers: Map<string, LobbyPlayer>;
  nextColorIndex: number;
  countdown: LobbyCountdown;
  guestLaunched: boolean;
  guestPendingSeed: number;
  prepareHostId: string;
  prepareHostChar: string;
  prepareHostName: string;
  prepareHostTint: string;
  prepareHostTrail: string;
}

export interface LobbyEventUI {
  countdownText: Text;
  readyText: Text;
  readyBg: Graphics;
}

export interface LobbyEventCallbacks {
  broadcastLocal: () => void;
  drawReadyBtn: (cx: number, y: number, ready: boolean) => void;
  renderPlayerList: () => void;
  updateSettingsDisplay: () => void;
  onKicked?: () => void;
  onStart: StartCallback;
  sendEvent: (type: GameSyncEvent["type"], payload: Record<string, unknown>) => void;
}

/** Process a single incoming GameSync event from a remote peer. */
export function handleLobbyEvent(
  event: GameSyncEvent,
  peerId: string,
  state: LobbyEventState,
  ui: LobbyEventUI,
  cb: LobbyEventCallbacks,
): void {
  if (state.kickedIds.has(peerId)) return;

  if (!state.remotePlayers.has(peerId)) {
    state.remotePlayers.set(peerId, {
      peerId,
      character: "chef",
      cosmetics: {},
      ready: false,
      colorIndex: state.nextColorIndex++,
      name: "",
      announced: false,
      lastHeartbeat: performance.now(),
    });
    if (state.role === "host" && state.localReady && state.countdown.countdownEndTime > 0) {
      state.localReady = false;
      ui.readyText.text = "Ready";
      cb.drawReadyBtn(GAME_WIDTH / 2, ui.readyText.y, false);
      state.countdown.setCountdown(0);
      cb.broadcastLocal();
    }
  }
  const peer = state.remotePlayers.get(peerId)!;
  peer.lastHeartbeat = performance.now();
  if (!peer.announced && event.type === "ready") {
    peer.announced = true;
    cb.broadcastLocal();
  }
  if (event.type === "ready" && event.payload.role === "host" && state.role !== "host") {
    // Track who is host from heartbeats — caller must set hostPeerId
  }

  if (event.type === "zone" && event.payload.kick) {
    handleKickEvent(event, state, ui, cb);
    return;
  }
  if (event.type === "zone" && event.payload.countdown !== undefined) {
    handleCountdownEvent(event, state, ui);
    return;
  }
  if (event.type === "ready") {
    handleReadyEvent(event, peerId, state, cb);
  }
  if (event.type === "start" && state.role === "guest") {
    handleStartEvent(event, peerId, state, ui, cb);
  }
  if (event.type === "score" && event.payload.prepared && state.role === "host") {
    state.countdown.onPrepared(peerId, (event.payload.guestTime as number) ?? Date.now());
  }
}

function handleKickEvent(
  event: GameSyncEvent,
  state: LobbyEventState,
  ui: LobbyEventUI,
  cb: LobbyEventCallbacks,
): void {
  const kid = event.payload.kick as string;
  if (kid === selfId) {
    state.countdown.starting = true;
    state.guestLaunched = true;
    ui.countdownText.text = "Kicked by host";
    setTimeout(() => cb.onKicked?.(), 1500);
    return;
  }
  state.kickedIds.add(kid);
  state.remotePlayers.delete(kid);
  cb.renderPlayerList();
}

function handleCountdownEvent(
  event: GameSyncEvent,
  state: LobbyEventState,
  ui: LobbyEventUI,
): void {
  const secs = event.payload.countdown as number;
  state.countdown.cancelTimer();
  if (secs <= 0) {
    state.countdown.countdownEndTime = -1;
    ui.countdownText.text = "";
  } else {
    state.countdown.countdownEndTime = performance.now() + secs * 1000;
    const iv = setInterval(() => {
      const r = Math.max(0, state.countdown.countdownEndTime - performance.now()),
        s = Math.ceil(r / 1000);
      ui.countdownText.text = s > 0 ? `Starting in ${s}...` : "Waiting for host...";
      if (r <= 0) clearInterval(iv);
    }, 100);
  }
}

function handleReadyEvent(
  event: GameSyncEvent,
  _peerId: string,
  state: LobbyEventState,
  cb: LobbyEventCallbacks,
): void {
  const pl = event.payload;
  const peer = state.remotePlayers.get(_peerId)!;
  if (state.role === "guest") {
    if (pl.mode) {
      state.mode = pl.mode as string;
      cb.updateSettingsDisplay();
    }
    if (pl.theme) {
      state.selectedTheme = pl.theme as string;
      cb.updateSettingsDisplay();
    }
    if (pl.customRun !== undefined) {
      state.useCustomRun = pl.customRun as boolean;
      cb.updateSettingsDisplay();
    }
  }
  if (pl.touchControls !== undefined) state.touchControls = pl.touchControls as boolean;
  if (pl.character) {
    peer.character = pl.character as string;
    if (pl.tint) peer.cosmetics.tint = pl.tint as string;
    if (pl.trail) peer.cosmetics.trail = pl.trail as string;
  }
  if (pl.name !== undefined) peer.name = (pl.name as string).slice(0, 12);
  if (pl.ready !== undefined) {
    peer.ready = pl.ready as boolean;
    if (state.role === "host") state.countdown.evaluate();
  }
  cb.renderPlayerList();
}

function handleStartEvent(
  event: GameSyncEvent,
  peerId: string,
  state: LobbyEventState,
  ui: LobbyEventUI,
  cb: LobbyEventCallbacks,
): void {
  const phase = (event.payload.phase as string) ?? "go";
  if (phase === "prepare") {
    state.countdown.starting = true;
    state.countdown.cancelTimer();
    ui.countdownText.text = "Syncing...";
    state.countdown.countdownEndTime = -1;
    const pendingSeed = event.payload.seed as number;
    state.mode = (event.payload.mode as string) || "best-height";
    state.touchControls = (event.payload.touchControls as boolean) ?? state.touchControls;
    if (event.payload.theme) state.selectedTheme = event.payload.theme as string;
    if (event.payload.dbgCfg)
      setDebugConfig({
        ...createDebugConfig(),
        ...(event.payload.dbgCfg as Partial<DebugConfig>),
      });
    if (event.payload.runCfg)
      state.sharedRunConfig = {
        ...deserializeFromSync(event.payload.runCfg as Record<string, unknown>),
        seed: pendingSeed,
      };
    state.prepareHostId = peerId;
    state.prepareHostChar = (event.payload.character as string) ?? "chef";
    state.prepareHostName = (event.payload.name as string) ?? "";
    state.prepareHostTint = (event.payload.tint as string) ?? "";
    state.prepareHostTrail = (event.payload.trail as string) ?? "";
    state.guestPendingSeed = pendingSeed;
    cb.sendEvent("score", { prepared: true, guestTime: Date.now() });
  } else if (phase === "go" && !state.guestLaunched) {
    const peerStartAt = (event.payload.peerStartAt as Record<string, number>) ?? {};
    const myStart = peerStartAt[selfId] ?? (event.payload.startAt as number) ?? Date.now();
    guestLaunchAt(myStart, state, ui, cb);
  }
}

/** Guest-side: schedule game launch at the offset-adjusted time. */
export function guestLaunchAt(
  t: number,
  state: LobbyEventState,
  ui: LobbyEventUI,
  cb: LobbyEventCallbacks,
): void {
  if (state.guestLaunched) return;
  state.guestLaunched = true;
  ui.countdownText.text = "GO!";
  const rp = new Map<string, { character: string; cosmetics?: RemoteCosmetics; name?: string }>();
  rp.set(state.prepareHostId, {
    character: state.prepareHostChar,
    cosmetics: {
      theme: state.selectedTheme,
      tint: state.prepareHostTint,
      trail: state.prepareHostTrail,
    },
    name: state.prepareHostName,
  });
  for (const [id, p] of state.remotePlayers) {
    if (id !== state.prepareHostId)
      rp.set(id, {
        character: p.character,
        cosmetics: { ...p.cosmetics, theme: state.selectedTheme },
        name: p.name,
      });
  }
  setTimeout(
    () =>
      cb.onStart(
        state.guestPendingSeed,
        state.mode,
        state.touchControls,
        rp,
        state.sharedRunConfig ?? undefined,
      ),
    Math.max(0, t - Date.now()),
  );
}

/** Send a kick event and remove the player. */
export function kickPlayer(id: string, state: LobbyEventState, cb: LobbyEventCallbacks): void {
  state.kickedIds.add(id);
  state.remotePlayers.delete(id);
  cb.sendEvent("zone", { kick: id });
  cb.renderPlayerList();
  state.countdown.evaluate();
}
