/**
 * Quick Connect — signaling via public Nostr relays.
 * Convenient (6-char room code) but relays see IP addresses.
 * Uses Google STUN for ICE candidate discovery.
 * Supports multiple peers in a single room.
 */

import { joinRoom, selfId } from "@trystero-p2p/nostr";
import type { Room } from "@trystero-p2p/nostr";
import type { SignalingCallbacks, SignalingStrategy } from "./SignalingStrategy";

const APP_ID = "noodle-jump-mp";

// Suppress Trystero's internal "peer error" console.error for closed connections.
// This fires when the library tries to send to a peer that has disconnected — expected behavior.
const _origError = console.error;
let _suppressed = false;
function suppressTrysteroPeerErrors(): void {
  if (_suppressed) return; _suppressed = true;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Trystero peer error")) return;
    _origError.apply(console, args);
  };
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

/** Known-reliable Nostr relays — use fewer to avoid rate limiting. */
const RELAY_URLS = ["wss://nos.lol", "wss://relay.primal.net"];

/** Generate a random 6-character room code. */
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export { selfId };

export class NostrSignaling implements SignalingStrategy {
  private room: Room | null = null;
  private callbacks: SignalingCallbacks | null = null;
  private peerIds = new Set<string>();

  /** Callback for multi-peer tracking. */
  onPeerJoin: ((id: string) => void) | null = null;
  onPeerLeave: ((id: string) => void) | null = null;

  on(callbacks: SignalingCallbacks): void {
    this.callbacks = callbacks;
  }

  async createRoom(): Promise<string> {
    suppressTrysteroPeerErrors();
    const code = generateRoomCode();
    this.callbacks?.onStateChange("waiting");

    this.room = joinRoom(
      { appId: APP_ID, rtcConfig: RTC_CONFIG, relayUrls: RELAY_URLS },
      code,
    );

    this.setupRoomHandlers();
    return code;
  }

  async joinRoom(code: string): Promise<void> {
    suppressTrysteroPeerErrors();
    this.callbacks?.onStateChange("connecting");

    this.room = joinRoom(
      { appId: APP_ID, rtcConfig: RTC_CONFIG, relayUrls: RELAY_URLS },
      code.toUpperCase().trim(),
    );

    this.setupRoomHandlers();
  }

  /** Not needed for Nostr — Trystero handles SDP exchange automatically. */
  async acceptResponse(): Promise<void> {
    // No-op: Trystero handles this
  }

  async destroy(): Promise<void> {
    if (this.room) {
      await this.room.leave();
      this.room = null;
    }
    this.peerIds.clear();
    this.callbacks?.onStateChange("closed");
    this.callbacks = null;
  }

  /** Number of currently connected peers. */
  get peerCount(): number {
    return this.peerIds.size;
  }

  /** All connected peer IDs. */
  get connectedPeers(): ReadonlySet<string> {
    return this.peerIds;
  }

  private setupRoomHandlers(): void {
    if (!this.room) return;

    this.room.onPeerJoin((id) => {
      this.peerIds.add(id);
      this.onPeerJoin?.(id);

      const peers = this.room?.getPeers();
      if (peers && peers[id]) {
        const pc = peers[id];
        this.callbacks?.onConnection(pc, null as unknown as RTCDataChannel);
        if (this.peerIds.size === 1) {
          this.callbacks?.onStateChange("connected");
        }
      }
    });

    this.room.onPeerLeave((id) => {
      this.peerIds.delete(id);
      this.onPeerLeave?.(id);
      if (this.peerIds.size === 0) {
        this.callbacks?.onStateChange("failed");
        this.callbacks?.onError("All peers disconnected");
      }
    });
  }

  /** Get the Trystero room for creating actions (makeAction). */
  getRoom(): Room | null {
    return this.room;
  }
}
