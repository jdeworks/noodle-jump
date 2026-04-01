/**
 * Manages the WebRTC peer connection lifecycle.
 * Sits between signaling (how we connect) and game sync (what we send).
 * Handles connection state, auto-reconnect, and clean shutdown.
 */

import type { SignalingStrategy, SignalingCallbacks } from "./SignalingStrategy";
import { NostrSignaling } from "./NostrSignaling";
import type { Room } from "@trystero-p2p/nostr";

export type ConnectionMode = "manual" | "nostr";
export type ConnectionRole = "host" | "guest";

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export interface ConnectionCallbacks {
  onStateChange: (state: ConnectionState) => void;
  onError: (error: string) => void;
  /** For manual signaling: raw DataChannel ready. */
  onDataChannel: (channel: RTCDataChannel) => void;
  /** For Nostr signaling: Trystero room ready. */
  onRoom: (room: Room) => void;
}

const RECONNECT_TIMEOUT_MS = 5_000;

export class ConnectionManager {
  private strategy: SignalingStrategy | null = null;
  private callbacks: ConnectionCallbacks | null = null;
  private state: ConnectionState = "disconnected";
  private pc: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private mode: ConnectionMode | null = null;
  private role: ConnectionRole | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private visibilityHandler: (() => void) | null = null;

  on(callbacks: ConnectionCallbacks): void {
    this.callbacks = callbacks;
  }

  getState(): ConnectionState {
    return this.state;
  }

  getMode(): ConnectionMode | null {
    return this.mode;
  }

  getRole(): ConnectionRole | null {
    return this.role;
  }

  /**
   * Create a game room as host.
   * Returns a code the guest needs to join.
   */
  async createRoom(
    strategy: SignalingStrategy,
    mode: ConnectionMode,
  ): Promise<string> {
    this.strategy = strategy;
    this.mode = mode;
    this.role = "host";
    this.setState("connecting");

    const signalingCallbacks: SignalingCallbacks = {
      onConnection: (pc, channel) => this.handleConnection(pc, channel),
      onError: (err) => this.handleError(err),
      onStateChange: () => {
        // Signaling state changes are internal — we manage our own state
      },
    };

    strategy.on(signalingCallbacks);
    const code = await strategy.createRoom();
    this.setupVisibilityHandler();
    return code;
  }

  /**
   * Join a game room as guest.
   * For manual mode, returns a response code to send back to the host.
   */
  async joinRoom(
    strategy: SignalingStrategy,
    mode: ConnectionMode,
    code: string,
  ): Promise<string | void> {
    this.strategy = strategy;
    this.mode = mode;
    this.role = "guest";
    this.setState("connecting");

    const signalingCallbacks: SignalingCallbacks = {
      onConnection: (pc, channel) => this.handleConnection(pc, channel),
      onError: (err) => this.handleError(err),
      onStateChange: () => {},
    };

    strategy.on(signalingCallbacks);
    const response = await strategy.joinRoom(code);
    this.setupVisibilityHandler();
    return response;
  }

  /**
   * For manual mode: host accepts the guest's response code.
   */
  async acceptResponse(code: string): Promise<void> {
    if (!this.strategy?.acceptResponse) {
      throw new Error("acceptResponse only available for manual signaling");
    }
    await this.strategy.acceptResponse(code);
  }

  /**
   * Send data over the DataChannel (manual mode) or via Trystero action.
   * For Nostr mode, use the Room's makeAction instead.
   */
  sendRaw(data: ArrayBuffer | string): void {
    if (!this.channel) return;
    if (this.channel.readyState !== "open") return;
    this.channel.send(data as ArrayBuffer);
  }

  /** Get the raw DataChannel for manual mode. */
  getChannel(): RTCDataChannel | null {
    return this.channel;
  }

  /** Get the Trystero room for Nostr mode. */
  getRoom(): Room | null {
    if (this.strategy instanceof NostrSignaling) {
      return this.strategy.getRoom();
    }
    return null;
  }

  disconnect(): void {
    this.clearReconnectTimer();
    this.removeVisibilityHandler();
    this.channel?.close();
    this.pc?.close();
    this.strategy?.destroy();
    this.channel = null;
    this.pc = null;
    this.strategy = null;
    this.mode = null;
    this.role = null;
    this.setState("disconnected");
  }

  private handleConnection(
    pc: RTCPeerConnection,
    channel: RTCDataChannel,
  ): void {
    this.pc = pc;

    if (this.mode === "manual" && channel) {
      this.channel = channel;
      this.callbacks?.onDataChannel(channel);
    }

    if (this.mode === "nostr") {
      const room = this.getRoom();
      if (room) {
        this.callbacks?.onRoom(room);
      }
    }

    this.setState("connected");
    this.monitorConnection(pc);
  }

  private monitorConnection(pc: RTCPeerConnection): void {
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "disconnected") {
        this.setState("reconnecting");
        this.startReconnectTimer();
      } else if (state === "failed") {
        this.clearReconnectTimer();
        this.setState("failed");
        this.callbacks?.onError(
          "Connection lost. Could not reconnect.",
        );
      } else if (state === "connected" && this.state === "reconnecting") {
        this.clearReconnectTimer();
        this.setState("connected");
      }
    };
  }

  private startReconnectTimer(): void {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      if (this.state === "reconnecting") {
        this.setState("failed");
        this.callbacks?.onError(
          "Connection lost. Could not reconnect within 5 seconds.",
        );
      }
    }, RECONNECT_TIMEOUT_MS);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /** Handle tab visibility changes — WebRTC can drop when backgrounded on mobile. */
  private setupVisibilityHandler(): void {
    this.removeVisibilityHandler();
    this.visibilityHandler = () => {
      if (
        document.visibilityState === "visible" &&
        this.pc &&
        this.pc.connectionState === "disconnected"
      ) {
        this.setState("reconnecting");
        this.startReconnectTimer();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  private removeVisibilityHandler(): void {
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  private handleError(error: string): void {
    this.callbacks?.onError(error);
    if (this.state !== "connected") {
      this.setState("failed");
    }
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    this.callbacks?.onStateChange(state);
  }
}
