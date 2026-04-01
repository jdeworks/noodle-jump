/**
 * Quick Connect — signaling via public Nostr relays.
 * Convenient (6-char room code) but relays see IP addresses.
 * Uses Google STUN for ICE candidate discovery.
 */

import { joinRoom, selfId } from "@trystero-p2p/nostr";
import type { Room } from "@trystero-p2p/nostr";
import type {
  SignalingCallbacks,
  SignalingStrategy,
} from "./SignalingStrategy";

const APP_ID = "noodle-jump-mp";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

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
  private peerId: string | null = null;

  on(callbacks: SignalingCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Host creates a room. Returns a 6-char code for the guest.
   */
  async createRoom(): Promise<string> {
    const code = generateRoomCode();
    this.callbacks?.onStateChange("waiting");

    this.room = joinRoom(
      { appId: APP_ID, rtcConfig: RTC_CONFIG },
      code,
    );

    this.setupRoomHandlers();
    return code;
  }

  /**
   * Guest joins a room using the host's code.
   * Connection happens automatically via Trystero.
   */
  async joinRoom(code: string): Promise<void> {
    this.callbacks?.onStateChange("connecting");

    this.room = joinRoom(
      { appId: APP_ID, rtcConfig: RTC_CONFIG },
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
    this.peerId = null;
    this.callbacks?.onStateChange("closed");
    this.callbacks = null;
  }

  private setupRoomHandlers(): void {
    if (!this.room) return;

    this.room.onPeerJoin((id) => {
      this.peerId = id;
      this.callbacks?.onStateChange("connecting");

      // Get the peer's RTCPeerConnection and its DataChannel via getPeers
      const peers = this.room?.getPeers();
      if (peers && peers[id]) {
        const pc = peers[id];

        // Trystero manages its own DataChannels via makeAction.
        // We expose the RTCPeerConnection for ConnectionManager,
        // but actual data flows through Trystero's makeAction.
        this.callbacks?.onConnection(pc, null as unknown as RTCDataChannel);
        this.callbacks?.onStateChange("connected");
      }
    });

    this.room.onPeerLeave((id) => {
      if (id === this.peerId) {
        this.callbacks?.onStateChange("failed");
        this.callbacks?.onError("Peer disconnected");
      }
    });
  }

  /** Get the Trystero room for creating actions (makeAction). */
  getRoom(): Room | null {
    return this.room;
  }
}
