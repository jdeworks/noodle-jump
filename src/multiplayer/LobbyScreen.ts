/**
 * Multiplayer lobby — supports 2-24 players.
 * Host is single source of truth for countdown. Guests display host state.
 * When host disconnects, deterministic election auto-promotes a guest.
 */

import { Container } from "pixi.js";
import { GAME_WIDTH } from "../config/constants";
import type { GameSync, GameSyncEvent } from "./GameSync";
import { getSelectedCharacter, setSelectedCharacter } from "../systems/CharacterSettings";
import { loadCosmetics } from "../systems/Cosmetics";
import type { RunConfig } from "../systems/CustomRunConfig";
import { showHtmlToast } from "./HtmlOverlay";
import { selfId } from "./NostrSignaling";
import { LobbyCountdown, type StartCallback } from "./LobbyCountdown";
import { electHost } from "./HostElection";
import {
  buildLobbyUI,
  drawReadyBtn,
  enableModeControl,
  enableThemeControl,
  enableCustomControl,
  updateSettingsDisplay,
  type LobbyUIElements,
} from "./LobbyUI";
import { renderPlayerList } from "./LobbyPlayerList";
import { handleLobbyEvent, kickPlayer, type LobbyEventState } from "./LobbyEvents";

export function getPlayerName(): string {
  try {
    return localStorage.getItem("nj-player-name") ?? "";
  } catch {
    return "";
  }
}
export function setPlayerName(name: string): void {
  try {
    localStorage.setItem("nj-player-name", name);
  } catch {
    /* */
  }
}

export type LobbyRole = "host" | "guest";

export interface LobbyCallbacks {
  onStart: StartCallback;
  onKicked?: () => void;
  onPeerLeave?: (peerId: string) => void;
}

export class LobbyScreen {
  readonly container = new Container();
  private role: LobbyRole;
  private sync: GameSync;
  private callbacks: LobbyCallbacks;
  private localName = getPlayerName();
  private localChar = getSelectedCharacter();
  private mode = (() => {
    try {
      return localStorage.getItem("nj-lobby-mode") ?? "best-height";
    } catch {
      return "best-height";
    }
  })();
  private touchControls = false;
  private selectedTheme = "theme_default";
  private useCustomRun = false;
  private sharedRunConfig: RunConfig | null = null;
  private remotePlayers = new Map<string, import("./LobbyCountdown").LobbyPlayer>();
  private localReady = false;
  private nextColorIndex = 1;
  private roomCode: string;
  private hostPeerId: string;
  private migrating = false;
  private hostCheckInterval: ReturnType<typeof setInterval> | null = null;
  private guestLaunched = false;
  private guestPendingSeed = 0;
  private prepareHostId = "";
  private prepareHostChar = "chef";
  private prepareHostName = "";
  private prepareHostTint = "";
  private prepareHostTrail = "";
  private kickedIds = new Set<string>();
  private countdown: LobbyCountdown;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private ui!: LobbyUIElements;

  constructor(role: LobbyRole, sync: GameSync, callbacks: LobbyCallbacks, roomCode?: string) {
    this.role = role;
    this.sync = sync;
    this.callbacks = callbacks;
    this.roomCode = roomCode ?? "";
    this.hostPeerId = role === "host" ? selfId : "";
    this.countdown = new LobbyCountdown({
      sync,
      getRemotePlayers: () => this.remotePlayers,
      getLocalReady: () => this.localReady,
      getLocalState: () => ({
        mode: this.mode,
        localChar: this.localChar,
        localName: this.localName,
        selectedTheme: this.selectedTheme,
        touchControls: this.touchControls,
        useCustomRun: this.useCustomRun,
      }),
      setCountdownText: (t) => {
        this.ui.countdownText.text = t;
      },
      onStart: callbacks.onStart,
    });

    this.ui = buildLobbyUI(this.container, {
      getRoomCode: () => this.roomCode,
      getLocalName: () => this.localName,
      setLocalName: (n) => {
        this.localName = n;
        setPlayerName(n);
      },
      getLocalChar: () => this.localChar,
      setLocalChar: (id) => {
        this.localChar = id;
        setSelectedCharacter(id);
      },
      getMode: () => this.mode,
      setMode: (m) => {
        this.mode = m;
      },
      getTouchControls: () => this.touchControls,
      setTouchControls: (v) => {
        this.touchControls = v;
      },
      getSelectedTheme: () => this.selectedTheme,
      setSelectedTheme: (id) => {
        this.selectedTheme = id;
      },
      getUseCustomRun: () => this.useCustomRun,
      setUseCustomRun: (v) => {
        this.useCustomRun = v;
      },
      getRole: () => this.role,
      broadcastLocal: () => this.broadcastLocal(),
      sendEvent: (type, payload) => this.sync.sendGameEvent({ type, payload }),
      toggleReady: () => this.toggleReady(),
      isCountdownStarting: () => this.countdown.starting,
    });

    this.sync.on({
      onRemotePosition: () => {},
      onRemoteEvent: (ev: GameSyncEvent, pid: string) => this.onEvent(ev, pid),
    });
    this.doRenderPlayerList();
    setTimeout(() => this.broadcastLocal(), 200);
    setTimeout(() => this.broadcastLocal(), 1000);
    this.heartbeatInterval = setInterval(() => {
      if (!this.countdown.starting) this.broadcastLocal();
    }, 3000);
    this.hostCheckInterval = setInterval(() => this.checkHostAlive(), 1000);
  }

  private broadcastLocal(): void {
    const c = loadCosmetics();
    this.sync.sendGameEvent({
      type: "ready",
      payload: {
        character: this.localChar,
        name: this.localName,
        tint: c.equipped.tint ?? "tint_none",
        trail: c.equipped.trail ?? "trail_none",
        ready: this.localReady,
        role: this.role,
      },
    });
  }

  private toggleReady(): void {
    this.localReady = !this.localReady;
    this.ui.readyText.text = this.localReady ? "Not Ready" : "Ready";
    drawReadyBtn(this.ui.readyBg, GAME_WIDTH / 2, this.ui.readyText.y, this.localReady);
    this.broadcastLocal();
    if (this.role === "host") this.countdown.evaluate();
  }

  /** Fast path: called by external onPeerLeave signal. */
  handlePeerLeave(peerId: string): void {
    if (peerId === this.hostPeerId && this.hostPeerId !== selfId) this.handleHostLoss(peerId);
    else {
      this.remotePlayers.delete(peerId);
      this.doRenderPlayerList();
      if (this.role === "host") this.countdown.evaluate();
    }
  }

  private checkHostAlive(): void {
    if (this.hostPeerId === selfId || this.hostPeerId === "") return;
    const host = this.remotePlayers.get(this.hostPeerId);
    if (host && performance.now() - host.lastHeartbeat > 6000) this.handleHostLoss(this.hostPeerId);
  }

  private handleHostLoss(departedId: string): void {
    if (this.migrating || this.hostPeerId === selfId) return;
    this.migrating = true;
    const hostName = this.remotePlayers.get(departedId)?.name || departedId.slice(0, 6);
    this.remotePlayers.delete(departedId);
    const candidates = [selfId, ...this.remotePlayers.keys()];
    const newHostId = electHost(candidates);
    if (newHostId === selfId) this.promoteToHost(hostName);
    else {
      this.hostPeerId = newHostId;
      showHtmlToast(`${hostName} left`);
    }
    this.doRenderPlayerList();
    this.migrating = false;
  }

  private promoteToHost(departedName: string): void {
    this.role = "host";
    this.hostPeerId = selfId;
    this.countdown.abort();
    this.guestLaunched = false;
    this.sharedRunConfig = null;
    this.broadcastLocal();
    enableModeControl(this.ui.modeLabel, this.uiCallbacks());
    enableThemeControl(this.ui.themeLabel, this.uiCallbacks());
    enableCustomControl(this.ui.customLabel, this.uiCallbacks());
    showHtmlToast(`${departedName} left — you are now host`);
    this.countdown.evaluate();
  }

  private uiCallbacks(): import("./LobbyUI").LobbyUICallbacks {
    return {
      getRoomCode: () => this.roomCode,
      getLocalName: () => this.localName,
      setLocalName: (n: string) => {
        this.localName = n;
        setPlayerName(n);
      },
      getLocalChar: () => this.localChar,
      setLocalChar: (id: string) => {
        this.localChar = id;
        setSelectedCharacter(id);
      },
      getMode: () => this.mode,
      setMode: (m: string) => {
        this.mode = m;
      },
      getTouchControls: () => this.touchControls,
      setTouchControls: (v: boolean) => {
        this.touchControls = v;
      },
      getSelectedTheme: () => this.selectedTheme,
      setSelectedTheme: (id: string) => {
        this.selectedTheme = id;
      },
      getUseCustomRun: () => this.useCustomRun,
      setUseCustomRun: (v: boolean) => {
        this.useCustomRun = v;
      },
      getRole: () => this.role,
      broadcastLocal: () => this.broadcastLocal(),
      sendEvent: (type, payload) => this.sync.sendGameEvent({ type, payload }),
      toggleReady: () => this.toggleReady(),
      isCountdownStarting: () => this.countdown.starting,
    };
  }

  private getEventState(): LobbyEventState {
    return {
      role: this.role,
      mode: this.mode,
      selectedTheme: this.selectedTheme,
      touchControls: this.touchControls,
      useCustomRun: this.useCustomRun,
      localReady: this.localReady,
      sharedRunConfig: this.sharedRunConfig,
      kickedIds: this.kickedIds,
      remotePlayers: this.remotePlayers,
      nextColorIndex: this.nextColorIndex,
      countdown: this.countdown,
      guestLaunched: this.guestLaunched,
      guestPendingSeed: this.guestPendingSeed,
      prepareHostId: this.prepareHostId,
      prepareHostChar: this.prepareHostChar,
      prepareHostName: this.prepareHostName,
      prepareHostTint: this.prepareHostTint,
      prepareHostTrail: this.prepareHostTrail,
    };
  }

  private syncEventState(s: LobbyEventState): void {
    this.mode = s.mode;
    this.selectedTheme = s.selectedTheme;
    this.touchControls = s.touchControls;
    this.useCustomRun = s.useCustomRun;
    this.localReady = s.localReady;
    this.sharedRunConfig = s.sharedRunConfig;
    this.nextColorIndex = s.nextColorIndex;
    this.guestLaunched = s.guestLaunched;
    this.guestPendingSeed = s.guestPendingSeed;
    this.prepareHostId = s.prepareHostId;
    this.prepareHostChar = s.prepareHostChar;
    this.prepareHostName = s.prepareHostName;
    this.prepareHostTint = s.prepareHostTint;
    this.prepareHostTrail = s.prepareHostTrail;
  }

  private onEvent(event: GameSyncEvent, peerId: string): void {
    if (this.kickedIds.has(peerId)) return;
    // Track host from heartbeats
    if (event.type === "ready" && event.payload.role === "host" && this.role !== "host")
      this.hostPeerId = peerId;

    const state = this.getEventState();
    handleLobbyEvent(event, peerId, state, this.ui, {
      broadcastLocal: () => this.broadcastLocal(),
      drawReadyBtn: (cx, y, r) => drawReadyBtn(this.ui.readyBg, cx, y, r),
      renderPlayerList: () => this.doRenderPlayerList(),
      updateSettingsDisplay: () =>
        updateSettingsDisplay(
          this.ui.modeLabel,
          this.ui.themeLabel,
          this.ui.customLabel,
          this.role,
          state.mode,
          state.selectedTheme,
          state.useCustomRun,
        ),
      onKicked: this.callbacks.onKicked,
      onStart: this.callbacks.onStart,
      sendEvent: (type, payload) => this.sync.sendGameEvent({ type, payload }),
    });
    this.syncEventState(state);
    // Re-wire sync listener after kick-self clears it
    if (state.guestLaunched && event.type === "zone" && event.payload.kick === selfId) {
      this.sync.on({ onRemotePosition: () => {}, onRemoteEvent: () => {} });
    }
  }

  private doRenderPlayerList(): void {
    renderPlayerList(
      this.ui.playerListContainer,
      this.ui.playerCountText,
      this.localName,
      this.localChar,
      this.localReady,
      this.remotePlayers,
      this.role,
      (id) =>
        kickPlayer(id, this.getEventState(), {
          broadcastLocal: () => this.broadcastLocal(),
          drawReadyBtn: () => {},
          renderPlayerList: () => this.doRenderPlayerList(),
          updateSettingsDisplay: () => {},
          onStart: this.callbacks.onStart,
          sendEvent: (type, payload) => this.sync.sendGameEvent({ type, payload }),
        }),
    );
  }

  destroy(): void {
    this.countdown.destroy();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.hostCheckInterval) clearInterval(this.hostCheckInterval);
    this.callbacks.onPeerLeave = undefined;
    this.container.destroy({ children: true });
  }
}
