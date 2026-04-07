import { describe, it, expect } from "vitest";
import { electHost, computeRoleAfterMigration } from "../../src/multiplayer/HostElection";

describe("electHost", () => {
  it("returns the only candidate when given one peer", () => {
    expect(electHost(["abc123"])).toBe("abc123");
  });

  it("returns lowest peerId from two peers", () => {
    expect(electHost(["zzz", "aaa"])).toBe("aaa");
    expect(electHost(["aaa", "zzz"])).toBe("aaa");
  });

  it("returns lowest peerId from five peers", () => {
    expect(electHost(["delta", "echo", "alpha", "charlie", "bravo"])).toBe("alpha");
  });

  it("is deterministic regardless of input order", () => {
    const peers = ["peer3", "peer1", "peer2", "peer0"];
    const shuffled = ["peer2", "peer0", "peer3", "peer1"];
    expect(electHost(peers)).toBe(electHost(shuffled));
  });

  it("handles peers with similar prefixes", () => {
    expect(electHost(["abc1", "abc0", "abc2"])).toBe("abc0");
  });

  it("throws on empty array", () => {
    expect(() => electHost([])).toThrow("no candidates");
  });
});

describe("computeRoleAfterMigration", () => {
  it("returns host when local peer wins election", () => {
    const result = computeRoleAfterMigration(["aaa", "bbb", "ccc"], "aaa");
    expect(result).toEqual({ newHostId: "aaa", localRole: "host" });
  });

  it("returns guest when remote peer wins election", () => {
    const result = computeRoleAfterMigration(["aaa", "bbb", "ccc"], "ccc");
    expect(result).toEqual({ newHostId: "aaa", localRole: "guest" });
  });

  it("handles single remaining peer (becomes host)", () => {
    const result = computeRoleAfterMigration(["solo"], "solo");
    expect(result).toEqual({ newHostId: "solo", localRole: "host" });
  });
});
