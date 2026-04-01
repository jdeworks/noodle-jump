import { describe, it, expect } from "vitest";
import {
  encodePosition,
  decodePosition,
  type PlayerSyncState,
} from "../../src/multiplayer/GameSync";

describe("position encoding", () => {
  it("round-trips a position state", () => {
    const state: PlayerSyncState = {
      x: 123.456,
      y: -789.012,
      vx: 3.5,
      vy: -15.0,
      state: 0,
      seq: 42,
    };

    const encoded = encodePosition(state);
    expect(encoded.byteLength).toBe(19);

    const decoded = decodePosition(encoded);
    expect(decoded.x).toBeCloseTo(state.x, 2);
    expect(decoded.y).toBeCloseTo(state.y, 2);
    expect(decoded.vx).toBeCloseTo(state.vx, 2);
    expect(decoded.vy).toBeCloseTo(state.vy, 2);
    expect(decoded.state).toBe(state.state);
    expect(decoded.seq).toBe(state.seq);
  });

  it("handles zero values", () => {
    const state: PlayerSyncState = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      state: 0,
      seq: 0,
    };

    const decoded = decodePosition(encodePosition(state));
    expect(decoded.x).toBe(0);
    expect(decoded.y).toBe(0);
    expect(decoded.vx).toBe(0);
    expect(decoded.vy).toBe(0);
    expect(decoded.state).toBe(0);
    expect(decoded.seq).toBe(0);
  });

  it("handles max sequence number", () => {
    const state: PlayerSyncState = {
      x: 100,
      y: 200,
      vx: 0,
      vy: 0,
      state: 2,
      seq: 65535, // uint16 max
    };

    const decoded = decodePosition(encodePosition(state));
    expect(decoded.seq).toBe(65535);
    expect(decoded.state).toBe(2);
  });

  it("handles all player states", () => {
    for (const playerState of [0, 1, 2]) {
      const state: PlayerSyncState = {
        x: 50,
        y: 100,
        vx: 1,
        vy: -1,
        state: playerState,
        seq: 1,
      };
      const decoded = decodePosition(encodePosition(state));
      expect(decoded.state).toBe(playerState);
    }
  });

  it("handles large coordinate values", () => {
    const state: PlayerSyncState = {
      x: 400,
      y: -50000,
      vx: 8,
      vy: -15,
      state: 0,
      seq: 10000,
    };

    const decoded = decodePosition(encodePosition(state));
    expect(decoded.x).toBeCloseTo(400, 0);
    expect(decoded.y).toBeCloseTo(-50000, 0);
  });

  it("produces exactly 19 bytes", () => {
    const state: PlayerSyncState = {
      x: 1,
      y: 2,
      vx: 3,
      vy: 4,
      state: 1,
      seq: 100,
    };
    expect(encodePosition(state).byteLength).toBe(19);
  });
});
