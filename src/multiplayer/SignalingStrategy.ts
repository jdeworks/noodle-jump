/**
 * Abstract signaling strategy for WebRTC connection setup.
 * Two implementations: NostrSignaling (Quick Connect) and ManualSignaling (Private Connect).
 * Only the SDP exchange differs — everything after RTCPeerConnection is shared.
 */

export interface SignalingCallbacks {
  onConnection: (conn: RTCPeerConnection, channel: RTCDataChannel) => void;
  onError: (error: string) => void;
  onStateChange: (state: SignalingState) => void;
}

export type SignalingState =
  | "idle"
  | "waiting" // host created room, waiting for guest
  | "connecting" // SDP exchange in progress
  | "connected" // P2P established
  | "failed"
  | "closed";

export interface SignalingStrategy {
  /** Create a room/offer. Returns a code the other player needs. */
  createRoom(): Promise<string>;

  /** Join a room/accept offer using the host's code. Returns a response code (manual) or void (auto). */
  joinRoom(code: string): Promise<string | void>;

  /** For manual mode: host accepts the guest's response code to complete the handshake. */
  acceptResponse?(code: string): Promise<void>;

  /** Register callbacks for connection events. Must be called before createRoom/joinRoom. */
  on(callbacks: SignalingCallbacks): void;

  /** Clean up resources. */
  destroy(): void;
}
