import { describe, test, expect } from "vitest";
import { createShadowPlayback } from "../src/systems/ShadowPlayback";
import type { ShadowRecording } from "../src/systems/ShadowRecorder";

function makeRecording(frames: number[], interval = 3, score = 1000): ShadowRecording {
  return {
    frames,
    score,
    height: 100,
    sampleInterval: interval,
    timestamp: Date.now(),
  };
}

describe("ShadowPlayback", () => {
  test("interpolates between frames", () => {
    // Two samples: (100, -500, -10, 0) and (120, -520, -8, 0)
    const recording = makeRecording([100, -500, -10, 0, 120, -520, -8, 0], 3);
    const playback = createShadowPlayback(recording);

    // Tick 1 of 3 → fraction 0.33 into first sample
    const s1 = playback.tick();
    expect(s1).not.toBeNull();
    // At tick 1, sampleIdx=0, frac=0.33
    expect(s1!.x).toBeGreaterThanOrEqual(100);
    expect(s1!.x).toBeLessThan(120);

    // Tick 2 → fraction 0.67
    const s2 = playback.tick();
    expect(s2).not.toBeNull();
    expect(s2!.x).toBeGreaterThan(s1!.x);

    // Tick 3 → sampleIdx=1, frac=0 — exactly second sample
    const s3 = playback.tick();
    expect(s3).not.toBeNull();
  });

  test("returns null after recording ends", () => {
    // Two samples with interval=2 → tick 1 returns sample 0, tick 2 returns sample 1, tick 3+ → null
    const recording = makeRecording([50, -200, -8, 0, 60, -220, -6, 0], 2);
    const playback = createShadowPlayback(recording);

    const s1 = playback.tick(); // tick 1: sampleIdx=0
    expect(s1).not.toBeNull();
    const s2 = playback.tick(); // tick 2: sampleIdx=1
    expect(s2).not.toBeNull();
    playback.tick(); // tick 3
    playback.tick(); // tick 4: sampleIdx=2 → past end
    const s4 = playback.tick();
    expect(s4).toBeNull();
  });

  test("isFinished returns correct state", () => {
    const recording = makeRecording([50, -200, -8, 0, 60, -220, -6, 0], 1);
    const playback = createShadowPlayback(recording);

    expect(playback.isFinished()).toBe(false);
    playback.tick(); // sampleIdx=1
    playback.tick(); // sampleIdx=2 → past 2 samples
    expect(playback.isFinished()).toBe(true);
  });

  test("reset replays from start", () => {
    const recording = makeRecording([50, -200, -8, 0, 60, -220, -6, 0], 2);
    const playback = createShadowPlayback(recording);

    playback.tick();
    playback.tick();
    playback.tick();
    playback.tick();
    playback.tick();
    expect(playback.isFinished()).toBe(true);

    playback.reset();
    expect(playback.isFinished()).toBe(false);
    const s = playback.tick();
    expect(s).not.toBeNull();
  });

  test("getScore returns recording score", () => {
    const recording = makeRecording([50, -200, -8, 0], 3, 5000);
    const playback = createShadowPlayback(recording);
    expect(playback.getScore()).toBe(5000);
  });

  test("handles playerState correctly", () => {
    // interval=2: tick 1 → sampleIdx=0 (alive), tick 2 → sampleIdx=1 (dead)
    const recording = makeRecording([50, -200, -8, 0, 60, -220, -6, 1], 2);
    const playback = createShadowPlayback(recording);
    const s1 = playback.tick(); // sampleIdx=0, frac=0.5, playerState from sample 0
    expect(s1!.playerState).toBe(0); // alive
    const s2 = playback.tick(); // sampleIdx=1
    expect(s2!.playerState).toBe(1); // dead
  });

  test("smooth interpolation produces values between samples", () => {
    const recording = makeRecording([0, -100, -10, 0, 100, -200, -5, 0], 6);
    const playback = createShadowPlayback(recording);

    // Collect all ticks
    const xs: number[] = [];
    for (let i = 0; i < 6; i++) {
      const s = playback.tick();
      if (s) xs.push(s.x);
    }
    // Values should be monotonically increasing (0 → 100)
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1]);
    }
  });
});
