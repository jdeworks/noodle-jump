import { describe, test, expect } from "vitest";
import {
  createShadowRecorder,
  getSampleCount,
  getFrame,
  getShadowSlot,
} from "../src/systems/ShadowRecorder";
import { createInitialState } from "../src/scenes/GameState";
import { createDefaultRunConfig } from "../src/systems/CustomRunConfig";

describe("ShadowRecorder", () => {
  function makeState(x = 100, y = -500, vy = -10, isDying = false) {
    const state = createInitialState();
    return {
      ...state,
      player: { ...state.player, x, y, vy },
      isDying,
      gameOver: false,
    };
  }

  test("records at correct sample interval", () => {
    const recorder = createShadowRecorder(3);
    const state = makeState(100, -500, -10);
    // Ticks 1, 2 — no recording. Tick 3 — records.
    recorder.tick(state);
    recorder.tick(state);
    recorder.tick(state);
    const recording = recorder.finalize(1000, 50);
    expect(getSampleCount(recording)).toBe(1);
  });

  test("flat array format with 4 values per sample", () => {
    const recorder = createShadowRecorder(1); // record every tick
    recorder.tick(makeState(50, -200, -8));
    recorder.tick(makeState(60, -220, -6));
    const recording = recorder.finalize(500, 22);
    expect(recording.frames.length).toBe(8); // 2 samples × 4 values
    expect(recording.score).toBe(500);
    expect(recording.height).toBe(22);
  });

  test("getFrame extracts correct values", () => {
    const recorder = createShadowRecorder(1);
    recorder.tick(makeState(50.5, -200.3, -8.7));
    recorder.tick(makeState(60, -220, -6, true));
    const recording = recorder.finalize(500, 22);
    const f0 = getFrame(recording, 0);
    expect(f0).not.toBeNull();
    expect(f0!.x).toBeCloseTo(50.5, 0);
    expect(f0!.y).toBeCloseTo(-200.3, 0);
    expect(f0!.vy).toBeCloseTo(-8.7, 0);
    expect(f0!.playerState).toBe(0); // alive

    const f1 = getFrame(recording, 1);
    expect(f1!.playerState).toBe(1); // dying
  });

  test("getFrame returns null for out-of-bounds", () => {
    const recorder = createShadowRecorder(1);
    recorder.tick(makeState());
    const recording = recorder.finalize(100, 10);
    expect(getFrame(recording, 0)).not.toBeNull();
    expect(getFrame(recording, 1)).toBeNull();
  });

  test("empty recording when no ticks", () => {
    const recorder = createShadowRecorder(3);
    const recording = recorder.finalize(0, 0);
    expect(getSampleCount(recording)).toBe(0);
    expect(recording.frames.length).toBe(0);
  });

  test("subsampling only records every Nth tick", () => {
    const recorder = createShadowRecorder(5);
    for (let i = 0; i < 15; i++) {
      recorder.tick(makeState(i * 10, -i * 20, -10));
    }
    const recording = recorder.finalize(1500, 100);
    expect(getSampleCount(recording)).toBe(3); // ticks 5, 10, 15
  });

  test("finalize includes timestamp", () => {
    const recorder = createShadowRecorder(1);
    recorder.tick(makeState());
    const recording = recorder.finalize(100, 10);
    expect(recording.timestamp).toBeGreaterThan(0);
    expect(recording.sampleInterval).toBe(1);
  });

  test("getShadowSlot returns normal for default config", () => {
    const slot = getShadowSlot(createDefaultRunConfig());
    expect(slot.mode).toBe("normal");
  });

  test("getShadowSlot returns daily for daily challenge", () => {
    const config = {
      ...createDefaultRunConfig(),
      isDailyChallenge: true,
      seed: 12345,
    };
    expect(getShadowSlot(config).mode).toBe("daily");
  });

  test("getShadowSlot returns custom for seeded config", () => {
    expect(getShadowSlot({ ...createDefaultRunConfig(), seed: 42 }).mode).toBe("custom");
  });

  test("different custom configs get different qualifiers", () => {
    const a = getShadowSlot({ ...createDefaultRunConfig(), seed: 42 });
    const b = getShadowSlot({ ...createDefaultRunConfig(), seed: 99 });
    expect(a.qualifier).not.toBe(b.qualifier);
  });
});
