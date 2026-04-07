/** Shadow playback — replays a recording as InterpolatedState. Pure logic. */

import type { InterpolatedState } from "../multiplayer/InterpolationBuffer";
import { type ShadowRecording, getSampleCount, getFrame } from "./ShadowRecorder";

export interface ShadowPlayback {
  /** Advance one game tick. Returns interpolated state, or null if finished. */
  tick(): InterpolatedState | null;
  /** Whether the playback has reached the end. */
  isFinished(): boolean;
  /** Reset to the beginning. */
  reset(): void;
  /** Get the recording's score. */
  getScore(): number;
}

/** Create a shadow playback from a recording. */
export function createShadowPlayback(recording: ShadowRecording): ShadowPlayback {
  const totalSamples = getSampleCount(recording);
  const interval = recording.sampleInterval || 3;
  let tickCount = 0;

  return {
    tick(): InterpolatedState | null {
      tickCount++;
      const sampleF = tickCount / interval;
      const sampleIdx = Math.floor(sampleF);
      const frac = sampleF - sampleIdx;

      if (sampleIdx >= totalSamples) return null;

      const a = getFrame(recording, sampleIdx);
      if (!a) return null;

      // Interpolate with next frame if available
      const b = getFrame(recording, sampleIdx + 1);
      if (b && frac > 0) {
        return {
          x: a.x + (b.x - a.x) * frac,
          y: a.y + (b.y - a.y) * frac,
          vx: (b.x - a.x) / interval,
          vy: a.vy + (b.vy - a.vy) * frac,
          playerState: a.playerState,
        };
      }

      return {
        x: a.x,
        y: a.y,
        vx: 0,
        vy: a.vy,
        playerState: a.playerState,
      };
    },

    isFinished(): boolean {
      return Math.floor(tickCount / interval) >= totalSamples;
    },

    reset(): void {
      tickCount = 0;
    },

    getScore(): number {
      return recording.score;
    },
  };
}
