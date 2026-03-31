import { describe, test, expect } from "vitest";
import { _computeHash, wouldMakeLeaderboard } from "../src/services/LeaderboardAPI";

describe("Local leaderboard", () => {
  test("computeHash is deterministic", () => {
    const a = _computeHash(1000, 50, 2, 1234567890);
    const b = _computeHash(1000, 50, 2, 1234567890);
    expect(a).toBe(b);
  });

  test("different scores produce different hashes", () => {
    const a = _computeHash(1000, 50, 2, 1234567890);
    const b = _computeHash(2000, 50, 2, 1234567890);
    expect(a).not.toBe(b);
  });

  test("different timestamps produce different hashes", () => {
    const a = _computeHash(1000, 50, 2, 1234567890);
    const b = _computeHash(1000, 50, 2, 1234567891);
    expect(a).not.toBe(b);
  });

  test("hash is a non-empty string", () => {
    const h = _computeHash(500, 100, 1, Date.now());
    expect(typeof h).toBe("string");
    expect(h.length).toBeGreaterThan(0);
  });

  test("wouldMakeLeaderboard returns true when board is empty", () => {
    // In test environment localStorage is fresh, so board is empty
    expect(wouldMakeLeaderboard(1)).toBe(true);
  });
});
