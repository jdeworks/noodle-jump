/**
 * Game state synchronization over WebRTC DataChannels.
 * Handles binary position encoding (20Hz) and reliable game events.
 * Works with both manual DataChannel and Trystero Room.
 * Supports multiple peers — callbacks include peerId for routing.
 */

import type { Room } from "@trystero-p2p/nostr";

/** Player state sent at 20Hz. Binary encoded for efficiency. */
export interface PlayerSyncState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0 = alive, 1 = dead, 2 = ghost */
  state: number;
  seq: number;
}

/** Game events sent reliably on occurrence. */
export interface GameSyncEvent {
  type: "death" | "score" | "powerup" | "zone" | "ready" | "start" | "seed";
  payload: Record<string, unknown>;
}

/** Lobby state for pre-game coordination. */
export interface LobbyState {
  hostReady: boolean;
  guestReady: boolean;
  mode: string;
  seed: number;
}

export interface GameSyncCallbacks {
  onRemotePosition: (state: PlayerSyncState, peerId: string) => void;
  onRemoteEvent: (event: GameSyncEvent, peerId: string) => void;
}

/** Binary format: 4 floats (x, y, vx, vy) + 1 uint8 (state) + 1 uint16 (seq) = 19 bytes */
const POSITION_BUFFER_SIZE = 19;

/** Convert any binary-like data to ArrayBuffer (handles Uint8Array, ArrayBuffer, Blob-free). */
function toArrayBuffer(data: unknown): ArrayBuffer | null {
  if (data instanceof ArrayBuffer) return data;
  if (ArrayBuffer.isView(data)) {
    const copy = new ArrayBuffer(data.byteLength);
    new Uint8Array(copy).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    return copy;
  }
  return null;
}

const SEND_INTERVAL_MS = 50; // 20Hz

export function encodePosition(state: PlayerSyncState): ArrayBuffer {
  const buf = new ArrayBuffer(POSITION_BUFFER_SIZE);
  const floats = new Float32Array(buf, 0, 4);
  floats[0] = state.x;
  floats[1] = state.y;
  floats[2] = state.vx;
  floats[3] = state.vy;
  const view = new DataView(buf);
  view.setUint8(16, state.state);
  view.setUint16(17, state.seq, true);
  return buf;
}

export function decodePosition(buf: ArrayBuffer): PlayerSyncState {
  const floats = new Float32Array(buf, 0, 4);
  const view = new DataView(buf);
  return {
    x: floats[0],
    y: floats[1],
    vx: floats[2],
    vy: floats[3],
    state: view.getUint8(16),
    seq: view.getUint16(17, true),
  };
}

/** Fallback peerId for manual (single DataChannel) mode. */
const MANUAL_PEER = "__manual__";

export class GameSync {
  private callbacks: GameSyncCallbacks | null = null;
  private sendTimer: ReturnType<typeof setInterval> | null = null;
  private localState: PlayerSyncState | null = null;
  private lastRemoteSeq = new Map<string, number>();
  private seq = 0;

  // Manual mode (raw DataChannel)
  private channel: RTCDataChannel | null = null;

  // Nostr mode (Trystero actions)
  private sendPos: ((data: ArrayBuffer) => Promise<void[]>) | null = null;
  private sendEventAction: ((data: string) => Promise<void[]>) | null = null;

  on(callbacks: GameSyncCallbacks): void {
    this.callbacks = callbacks;
  }

  /** Initialize with a raw DataChannel (manual mode). */
  initWithChannel(channel: RTCDataChannel): void {
    this.channel = channel;

    channel.binaryType = "arraybuffer";
    channel.onmessage = (event) => {
      const data = event.data;
      if (typeof data === "string") {
        this.handleRemoteEvent(data, MANUAL_PEER);
      } else {
        const buf = toArrayBuffer(data);
        if (buf && buf.byteLength === POSITION_BUFFER_SIZE)
          this.handleRemotePosition(buf, MANUAL_PEER);
      }
    };
  }

  /** Initialize with a Trystero Room (Nostr mode). */
  initWithRoom(room: Room): void {
    const [sendPos, onPos] = room.makeAction<ArrayBuffer>("pos");
    const [sendEvent, onEvent] = room.makeAction<string>("evt");

    this.sendPos = sendPos;
    this.sendEventAction = sendEvent;

    onPos((data: ArrayBuffer, peerId: string) => {
      const buf = toArrayBuffer(data);
      if (buf && buf.byteLength === POSITION_BUFFER_SIZE) this.handleRemotePosition(buf, peerId);
    });

    onEvent((data: string, peerId: string) => {
      if (typeof data === "string") {
        this.handleRemoteEvent(data, peerId);
      }
    });
  }

  /** Start sending local position at 20Hz. */
  startSending(): void {
    this.stopSending();
    this.sendTimer = setInterval(() => {
      if (this.localState) {
        this.localState.seq = this.seq++;
        this.sendPosition(this.localState);
      }
    }, SEND_INTERVAL_MS);
  }

  /** Stop the position send loop. */
  stopSending(): void {
    if (this.sendTimer) {
      clearInterval(this.sendTimer);
      this.sendTimer = null;
    }
  }

  /** Update local player state (called by game loop). */
  updateLocalState(x: number, y: number, vx: number, vy: number, playerState: number): void {
    if (!this.localState) {
      this.localState = { x, y, vx, vy, state: playerState, seq: 0 };
    } else {
      this.localState.x = x;
      this.localState.y = y;
      this.localState.vx = vx;
      this.localState.vy = vy;
      this.localState.state = playerState;
    }
  }

  /** Send a game event (death, score, etc.) reliably. */
  sendGameEvent(event: GameSyncEvent): void {
    const json = JSON.stringify(event);
    if (this.sendEventAction) {
      this.sendEventAction(json).catch(() => {}); // ignore disconnected peer errors
    } else if (this.channel?.readyState === "open") {
      this.channel.send(json);
    }
  }

  destroy(): void {
    this.stopSending();
    this.channel = null;
    this.sendPos = null;
    this.sendEventAction = null;
    this.callbacks = null;
    this.localState = null;
    this.lastRemoteSeq.clear();
    this.seq = 0;
  }

  private sendPosition(state: PlayerSyncState): void {
    const buf = encodePosition(state);
    if (this.sendPos) {
      this.sendPos(buf).catch(() => {}); // ignore disconnected peer errors
    } else if (this.channel?.readyState === "open") {
      this.channel.send(buf);
    }
  }

  private handleRemotePosition(buf: ArrayBuffer, peerId: string): void {
    const state = decodePosition(buf);
    const lastSeq = this.lastRemoteSeq.get(peerId) ?? -1;
    if (state.seq <= lastSeq && lastSeq - state.seq < 1000) return;
    this.lastRemoteSeq.set(peerId, state.seq);
    this.callbacks?.onRemotePosition(state, peerId);
  }

  private handleRemoteEvent(data: string, peerId: string): void {
    try {
      const event = JSON.parse(data) as GameSyncEvent;
      this.callbacks?.onRemoteEvent(event, peerId);
    } catch {
      // Ignore malformed events
    }
  }
}
