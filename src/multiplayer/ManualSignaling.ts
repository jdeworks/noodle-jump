/**
 * Private Connect — manual SDP exchange with no external servers.
 * Players copy-paste compressed SDP codes via their own channel (Telegram, etc.).
 * DSGVO-safe: zero third-party data processing.
 */

import { compressDescription, decompressDescription } from "./SDPCompressor";
import type { SignalingCallbacks, SignalingStrategy } from "./SignalingStrategy";

export class ManualSignaling implements SignalingStrategy {
  private pc: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private callbacks: SignalingCallbacks | null = null;
  private iceCandidatesComplete = false;
  private pendingResolve: ((code: string) => void) | null = null;

  on(callbacks: SignalingCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Host creates an offer. Returns a compressed code to send to the guest.
   * Waits for ICE gathering to complete so the code includes all candidates.
   */
  async createRoom(): Promise<string> {
    this.callbacks?.onStateChange("connecting");

    // No ICE servers — pure P2P, no STUN/TURN
    this.pc = new RTCPeerConnection({ iceServers: [] });
    this.setupConnectionHandlers();

    this.channel = this.pc.createDataChannel("game", {
      ordered: true,
    });
    this.setupChannelHandlers(this.channel);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    return this.waitForICEComplete();
  }

  /**
   * Guest receives the host's code, creates an answer.
   * Returns a compressed response code to send back.
   */
  async joinRoom(hostCode: string): Promise<string> {
    this.callbacks?.onStateChange("connecting");

    this.pc = new RTCPeerConnection({ iceServers: [] });
    this.setupConnectionHandlers();

    this.pc.ondatachannel = (event) => {
      this.channel = event.channel;
      this.setupChannelHandlers(this.channel);
    };

    const offer = decompressDescription(hostCode);
    await this.pc.setRemoteDescription(offer);

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    return this.waitForICEComplete();
  }

  /**
   * Host accepts the guest's response code to complete the handshake.
   */
  async acceptResponse(guestCode: string): Promise<void> {
    if (!this.pc) throw new Error("No peer connection — call createRoom first");
    const answer = decompressDescription(guestCode);
    await this.pc.setRemoteDescription(answer);
  }

  destroy(): void {
    this.channel?.close();
    this.pc?.close();
    this.channel = null;
    this.pc = null;
    this.callbacks?.onStateChange("closed");
    this.callbacks = null;
  }

  private setupConnectionHandlers(): void {
    if (!this.pc) return;

    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      if (state === "connected") {
        this.callbacks?.onStateChange("connected");
      } else if (state === "failed" || state === "disconnected") {
        this.callbacks?.onStateChange("failed");
        this.callbacks?.onError(
          "Could not connect directly. Try a different network or ask your friend to create the game instead.",
        );
      }
    };
  }

  private setupChannelHandlers(channel: RTCDataChannel): void {
    channel.onopen = () => {
      if (this.pc && this.channel) {
        this.callbacks?.onConnection(this.pc, this.channel);
        this.callbacks?.onStateChange("connected");
      }
    };

    channel.onerror = (event) => {
      this.callbacks?.onError(
        `DataChannel error: ${(event as RTCErrorEvent).error?.message ?? "unknown"}`,
      );
    };
  }

  /** Wait for ICE gathering to complete, then return compressed local description. */
  private waitForICEComplete(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.pc) return reject(new Error("No peer connection"));

      if (this.pc.iceGatheringState === "complete") {
        resolve(compressDescription(this.pc.localDescription as RTCSessionDescription));
        return;
      }

      this.pendingResolve = resolve;

      this.pc.onicegatheringstatechange = () => {
        if (this.pc?.iceGatheringState === "complete" && this.pendingResolve) {
          this.pendingResolve(
            compressDescription(this.pc.localDescription as RTCSessionDescription),
          );
          this.pendingResolve = null;
        }
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingResolve && this.pc?.localDescription) {
          // Use what we have even if gathering isn't fully complete
          this.pendingResolve(
            compressDescription(this.pc.localDescription as RTCSessionDescription),
          );
          this.pendingResolve = null;
        } else if (this.pendingResolve) {
          this.pendingResolve = null;
          reject(new Error("ICE gathering timed out"));
        }
      }, 10_000);
    });
  }
}
