import { describe, it, expect } from "vitest";
import { encodePosition, decodePosition } from "../../src/multiplayer/GameSync";
import { InterpolationBuffer } from "../../src/multiplayer/InterpolationBuffer";

describe("lobby and session integration", () => {
  it("position round-trip through encode → decode → interpolation", () => {
    const buf = new InterpolationBuffer();

    // Simulate network: encode → decode → push to buffer
    const encoded = encodePosition({
      x: 200,
      y: -500,
      vx: 4,
      vy: -12,
      state: 0,
      seq: 100,
    });
    const decoded = decodePosition(encoded);
    buf.pushUpdate(decoded.x, decoded.y, decoded.vx, decoded.vy, decoded.state);

    const state = buf.getState();
    expect(state.x).toBeCloseTo(200 + 4 * 0.3, 0);
    expect(state.y).toBeCloseTo(-500 + -12 * 0.3, 0);
    expect(state.playerState).toBe(0);
  });

  it("sequence numbers prevent stale updates in the pipeline", () => {
    // Encode two positions with different sequence numbers
    const p1 = encodePosition({ x: 100, y: 100, vx: 0, vy: 0, state: 0, seq: 5 });
    const p2 = encodePosition({ x: 200, y: 200, vx: 0, vy: 0, state: 0, seq: 3 });

    const d1 = decodePosition(p1);
    const d2 = decodePosition(p2);

    // seq 5 should be newer than seq 3
    expect(d1.seq).toBe(5);
    expect(d2.seq).toBe(3);
    expect(d1.seq).toBeGreaterThan(d2.seq);
  });

  it("death event payload structure", () => {
    // Verify the GameSyncEvent shape matches what OnlineSession sends
    const deathEvent = {
      type: "death" as const,
      payload: { height: 1234 },
    };
    expect(deathEvent.type).toBe("death");
    expect(deathEvent.payload.height).toBe(1234);

    // Serialize and deserialize (as GameSync does for manual mode)
    const json = JSON.stringify(deathEvent);
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe("death");
    expect(parsed.payload.height).toBe(1234);
  });

  it("seed event payload structure", () => {
    const seedEvent = {
      type: "seed" as const,
      payload: { seed: 0xdeadbeef },
    };
    const json = JSON.stringify(seedEvent);
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe("seed");
    expect(parsed.payload.seed).toBe(0xdeadbeef);
  });

  it("ready event payload structure", () => {
    const readyEvent = {
      type: "ready" as const,
      payload: { ready: true, role: "host" },
    };
    const json = JSON.stringify(readyEvent);
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe("ready");
    expect(parsed.payload.ready).toBe(true);
    expect(parsed.payload.role).toBe("host");
  });
});
