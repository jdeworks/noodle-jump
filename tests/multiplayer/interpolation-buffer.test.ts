import { describe, it, expect } from "vitest";
import { InterpolationBuffer } from "../../src/multiplayer/InterpolationBuffer";

describe("InterpolationBuffer", () => {
  it("starts not ready", () => {
    const buf = new InterpolationBuffer();
    expect(buf.isReady).toBe(false);
    const state = buf.getState();
    expect(state.x).toBe(0);
    expect(state.y).toBe(0);
  });

  it("snaps to first position update", () => {
    const buf = new InterpolationBuffer();
    buf.pushUpdate(100, 200, 3, -5, 0);
    expect(buf.isReady).toBe(true);

    const state = buf.getState();
    // Should be near 100, 200 (with some extrapolation from velocity)
    expect(state.x).toBeCloseTo(100 + 3 * 0.3, 0);
    expect(state.y).toBeCloseTo(200 + -5 * 0.3, 0);
  });

  it("interpolates toward new position over multiple frames", () => {
    const buf = new InterpolationBuffer();
    buf.pushUpdate(0, 0, 0, 0, 0);
    buf.getState(); // consume first frame

    buf.pushUpdate(100, 100, 0, 0, 0);

    // After one getState, should be partway to 100, 100
    const s1 = buf.getState();
    expect(s1.x).toBeGreaterThan(0);
    expect(s1.x).toBeLessThan(100);

    // After more frames, should be closer
    const s2 = buf.getState();
    expect(s2.x).toBeGreaterThan(s1.x);
  });

  it("tracks player state (alive/dead/ghost)", () => {
    const buf = new InterpolationBuffer();
    buf.pushUpdate(50, 50, 0, 0, 0);
    expect(buf.playerState).toBe(0);

    buf.pushUpdate(50, 50, 0, 0, 1);
    expect(buf.playerState).toBe(1);

    buf.pushUpdate(50, 50, 0, 0, 2);
    expect(buf.playerState).toBe(2);
  });

  it("resets cleanly", () => {
    const buf = new InterpolationBuffer();
    buf.pushUpdate(100, 200, 3, -5, 1);
    expect(buf.isReady).toBe(true);

    buf.reset();
    expect(buf.isReady).toBe(false);
    expect(buf.playerState).toBe(0);
  });

  it("extrapolates using velocity", () => {
    const buf = new InterpolationBuffer();
    buf.pushUpdate(100, 100, 10, 0, 0);

    const state = buf.getState();
    // Should be ahead of 100 due to velocity extrapolation
    expect(state.x).toBeGreaterThan(100);
  });
});
