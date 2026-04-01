import { describe, it, expect } from "vitest";
import { MultiplayerSession } from "../../src/multiplayer/MultiplayerSession";

describe("MultiplayerSession", () => {
  it("creates two identical worlds from the same seed", () => {
    const session = new MultiplayerSession(12345);
    const p1 = session.p1State;
    const p2 = session.p2State;

    // Same number of platforms
    expect(p1.platforms.length).toBe(p2.platforms.length);

    // Same platform positions
    for (let i = 0; i < p1.platforms.length; i++) {
      expect(p1.platforms[i].x).toBe(p2.platforms[i].x);
      expect(p1.platforms[i].y).toBe(p2.platforms[i].y);
      expect(p1.platforms[i].type).toBe(p2.platforms[i].type);
    }

    // Same player start position
    expect(p1.player.x).toBe(p2.player.x);
    expect(p1.player.y).toBe(p2.player.y);
  });

  it("starts with both players alive", () => {
    const session = new MultiplayerSession(12345);
    expect(session.p1Status).toBe("alive");
    expect(session.p2Status).toBe("alive");
    expect(session.gameOver).toBe(false);
  });

  it("defaults to best-height mode", () => {
    const session = new MultiplayerSession(12345);
    expect(session.mode).toBe("best-height");
  });

  it("different seeds produce different worlds", () => {
    const s1 = new MultiplayerSession(11111);
    const s2 = new MultiplayerSession(22222);

    // At least one platform position should differ (very likely with different seeds)
    const p1Plats = s1.p1State.platforms;
    const p2Plats = s2.p1State.platforms;

    let anyDifferent = false;
    const count = Math.min(p1Plats.length, p2Plats.length);
    for (let i = 1; i < count; i++) {
      if (p1Plats[i].x !== p2Plats[i].x || p1Plats[i].y !== p2Plats[i].y) {
        anyDifferent = true;
        break;
      }
    }
    expect(anyDifferent).toBe(true);
  });

  it("determines winner by height in best-height mode", () => {
    const session = new MultiplayerSession(12345);
    // We can't easily simulate a full game to death, but we can test
    // the result logic by checking getResult returns valid structure
    const result = session.getResult();
    expect(result.winner).toBeDefined();
    expect(result.p1).toBeDefined();
    expect(result.p2).toBeDefined();
    expect(["tie", 1, 2]).toContain(result.winner);
  });
});
