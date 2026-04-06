import { describe, it, expect } from "vitest";
import { encodePosition, decodePosition } from "../../src/multiplayer/GameSync";
import { InterpolationBuffer } from "../../src/multiplayer/InterpolationBuffer";
import { getPeerColor, type PlayerResult } from "../../src/multiplayer/PeerColors";

describe("multi-peer position routing", () => {
  it("routes positions by peerId through separate interpolation buffers", () => {
    const buffers = new Map<string, InterpolationBuffer>();
    buffers.set("peer-a", new InterpolationBuffer());
    buffers.set("peer-b", new InterpolationBuffer());

    // Simulate receiving from peer-a
    const posA = encodePosition({ x: 100, y: -500, vx: 2, vy: -10, state: 0, seq: 1 });
    const decodedA = decodePosition(posA);
    buffers.get("peer-a")!.pushUpdate(decodedA.x, decodedA.y, decodedA.vx, decodedA.vy, decodedA.state);

    // Simulate receiving from peer-b
    const posB = encodePosition({ x: 300, y: -1000, vx: -1, vy: -8, state: 0, seq: 1 });
    const decodedB = decodePosition(posB);
    buffers.get("peer-b")!.pushUpdate(decodedB.x, decodedB.y, decodedB.vx, decodedB.vy, decodedB.state);

    const stateA = buffers.get("peer-a")!.getState();
    const stateB = buffers.get("peer-b")!.getState();

    // Peer A is at ~100, Peer B is at ~300 — they should be distinct
    expect(stateA.x).toBeCloseTo(100 + 2 * 0.3, 0);
    expect(stateB.x).toBeCloseTo(300 + -1 * 0.3, 0);
    expect(stateA.y).not.toBeCloseTo(stateB.y, 0);
  });

  it("per-peer sequence tracking drops stale from correct peer only", () => {
    const lastSeq = new Map<string, number>();

    const accept = (peerId: string, seq: number): boolean => {
      const last = lastSeq.get(peerId) ?? -1;
      if (seq <= last && last - seq < 1000) return false;
      lastSeq.set(peerId, seq);
      return true;
    };

    expect(accept("peer-a", 1)).toBe(true);
    expect(accept("peer-a", 2)).toBe(true);
    expect(accept("peer-a", 1)).toBe(false); // stale for peer-a
    expect(accept("peer-b", 1)).toBe(true);  // fresh for peer-b
    expect(accept("peer-b", 3)).toBe(true);
    expect(accept("peer-b", 2)).toBe(false); // stale for peer-b
  });
});

describe("multi-peer death tracking", () => {
  it("allRemoteDead only when every peer is dead", () => {
    const peers = new Map<string, { dead: boolean }>();
    peers.set("a", { dead: false });
    peers.set("b", { dead: false });
    peers.set("c", { dead: false });

    const allDead = () => {
      if (peers.size === 0) return false;
      for (const p of peers.values()) if (!p.dead) return false;
      return true;
    };

    expect(allDead()).toBe(false);
    peers.get("a")!.dead = true;
    expect(allDead()).toBe(false);
    peers.get("b")!.dead = true;
    expect(allDead()).toBe(false);
    peers.get("c")!.dead = true;
    expect(allDead()).toBe(true);
  });

  it("empty peers map returns false for allRemoteDead", () => {
    const peers = new Map<string, { dead: boolean }>();
    const allDead = () => {
      if (peers.size === 0) return false;
      for (const p of peers.values()) if (!p.dead) return false;
      return true;
    };
    expect(allDead()).toBe(false);
  });
});

describe("results leaderboard sorting", () => {
  it("sorts players by height descending", () => {
    const results: PlayerResult[] = [
      { peerId: "local", label: "You", height: 500, score: 100, isLocal: true, color: 0xff8833 },
      { peerId: "a", label: "PeerA", height: 1200, score: 0, isLocal: false, color: 0x33cc55 },
      { peerId: "b", label: "PeerB", height: 300, score: 0, isLocal: false, color: 0x3388ff },
      { peerId: "c", label: "PeerC", height: 800, score: 0, isLocal: false, color: 0xff33aa },
    ];

    const sorted = [...results].sort((a, b) => b.height - a.height);
    expect(sorted[0].peerId).toBe("a");    // 1200m
    expect(sorted[1].peerId).toBe("c");    // 800m
    expect(sorted[2].peerId).toBe("local"); // 500m
    expect(sorted[3].peerId).toBe("b");    // 300m
  });

  it("local rank is correct", () => {
    const results: PlayerResult[] = [
      { peerId: "local", label: "You", height: 800, score: 100, isLocal: true, color: 0xff8833 },
      { peerId: "a", label: "PeerA", height: 1200, score: 0, isLocal: false, color: 0x33cc55 },
      { peerId: "b", label: "PeerB", height: 600, score: 0, isLocal: false, color: 0x3388ff },
    ];

    const sorted = [...results].sort((a, b) => b.height - a.height);
    const localIdx = sorted.findIndex((r) => r.isLocal);
    expect(localIdx).toBe(1); // 2nd place
  });

  it("detects tie for first place", () => {
    const results: PlayerResult[] = [
      { peerId: "local", label: "You", height: 1000, score: 100, isLocal: true, color: 0xff8833 },
      { peerId: "a", label: "PeerA", height: 1000, score: 0, isLocal: false, color: 0x33cc55 },
      { peerId: "b", label: "PeerB", height: 500, score: 0, isLocal: false, color: 0x3388ff },
    ];

    const sorted = [...results].sort((a, b) => b.height - a.height);
    const localIdx = sorted.findIndex((r) => r.isLocal);
    const localH = sorted[localIdx].height;
    const topH = sorted[0].height;
    const tiedForFirst = localH === topH && sorted.filter((r) => r.height === topH).length > 1;
    expect(tiedForFirst).toBe(true);
  });

  it("does not tie when heights differ", () => {
    const results: PlayerResult[] = [
      { peerId: "local", label: "You", height: 999, score: 100, isLocal: true, color: 0xff8833 },
      { peerId: "a", label: "PeerA", height: 1000, score: 0, isLocal: false, color: 0x33cc55 },
    ];

    const sorted = [...results].sort((a, b) => b.height - a.height);
    const localIdx = sorted.findIndex((r) => r.isLocal);
    const localH = sorted[localIdx].height;
    const topH = sorted[0].height;
    const tiedForFirst = localH === topH && sorted.filter((r) => r.height === topH).length > 1;
    expect(tiedForFirst).toBe(false);
  });

  it("does not tie for non-first-place", () => {
    const results: PlayerResult[] = [
      { peerId: "local", label: "You", height: 500, score: 100, isLocal: true, color: 0xff8833 },
      { peerId: "a", label: "PeerA", height: 1000, score: 0, isLocal: false, color: 0x33cc55 },
      { peerId: "b", label: "PeerB", height: 500, score: 0, isLocal: false, color: 0x3388ff },
    ];

    const sorted = [...results].sort((a, b) => b.height - a.height);
    const localIdx = sorted.findIndex((r) => r.isLocal);
    const localH = sorted[localIdx].height;
    const topH = sorted[0].height;
    const tiedForFirst = localH === topH && sorted.filter((r) => r.height === topH).length > 1;
    // Local is tied for 2nd/3rd at 500m, but NOT tied for first (1000m)
    expect(tiedForFirst).toBe(false);
    expect(localIdx).toBeGreaterThan(0);
  });
});

describe("peer color assignment", () => {
  it("cycles through 8 colors", () => {
    const colors = new Set<number>();
    for (let i = 0; i < 8; i++) colors.add(getPeerColor(i));
    expect(colors.size).toBe(8);
  });

  it("wraps around after 8", () => {
    expect(getPeerColor(0)).toBe(getPeerColor(8));
    expect(getPeerColor(3)).toBe(getPeerColor(11));
  });
});

describe("countdown timer logic", () => {
  it("host ready triggers 15s countdown", () => {
    const COUNTDOWN_LONG = 15_000;
    const COUNTDOWN_SHORT = 3_000;

    let countdownDuration = 0;
    const localReady = true;
    const remotePlayers = [{ ready: false }];
    const hasRemotes = remotePlayers.length > 0;

    // Host ready, guest not → 15s
    if (localReady && hasRemotes && countdownDuration === 0) {
      countdownDuration = COUNTDOWN_LONG;
    }
    expect(countdownDuration).toBe(15_000);

    // All ready → shrink to 3s
    remotePlayers[0].ready = true;
    const allReady = localReady && remotePlayers.every(p => p.ready);
    if (allReady && countdownDuration > COUNTDOWN_SHORT) {
      countdownDuration = COUNTDOWN_SHORT;
    }
    expect(countdownDuration).toBe(3_000);
  });

  it("all ready with timer already under 3s keeps current timer", () => {
    const COUNTDOWN_SHORT = 3_000;
    let remaining = 2_000; // Already under 3s

    // All ready but timer already less than 3s — don't reset
    if (remaining > COUNTDOWN_SHORT) {
      remaining = COUNTDOWN_SHORT;
    }
    // Should stay at 2s
    expect(remaining).toBe(2_000);
  });
});
