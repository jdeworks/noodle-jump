import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  LobbyCountdown,
  COUNTDOWN_LONG,
  COUNTDOWN_SHORT,
  type LobbyPlayer,
  type CountdownDeps,
} from "../../src/multiplayer/LobbyCountdown";

function makeMockDeps(overrides?: Partial<CountdownDeps>): CountdownDeps {
  return {
    sync: { sendGameEvent: vi.fn() } as unknown as CountdownDeps["sync"],
    getRemotePlayers: () => new Map<string, LobbyPlayer>(),
    getLocalReady: () => false,
    getLocalState: () => ({
      mode: "best-height",
      localChar: "chef",
      localName: "Test",
      selectedTheme: "theme_default",
      touchControls: false,
      useCustomRun: false,
    }),
    setCountdownText: vi.fn(),
    onStart: vi.fn(),
    ...overrides,
  };
}

describe("LobbyCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("evaluate cancels countdown when not ready", () => {
    const deps = makeMockDeps();
    const cd = new LobbyCountdown(deps);
    cd.evaluate();
    expect(deps.sync.sendGameEvent).toHaveBeenCalledWith({
      type: "zone",
      payload: { countdown: 0 },
    });
    expect(cd.countdownEndTime).toBe(-1);
  });

  it("evaluate starts long countdown when local ready + has remote peers", () => {
    const remote = new Map<string, LobbyPlayer>();
    remote.set("peer1", {
      peerId: "peer1",
      character: "chef",
      cosmetics: {},
      ready: false,
      colorIndex: 1,
      name: "P1",
      announced: true,
      lastHeartbeat: 0,
    });
    const deps = makeMockDeps({ getRemotePlayers: () => remote, getLocalReady: () => true });
    const cd = new LobbyCountdown(deps);
    cd.evaluate();
    expect(deps.sync.sendGameEvent).toHaveBeenCalledWith({
      type: "zone",
      payload: { countdown: Math.ceil(COUNTDOWN_LONG / 1000) },
    });
    expect(cd.countdownEndTime).toBeGreaterThan(0);
  });

  it("evaluate switches to short countdown when all ready", () => {
    const remote = new Map<string, LobbyPlayer>();
    remote.set("peer1", {
      peerId: "peer1",
      character: "chef",
      cosmetics: {},
      ready: true,
      colorIndex: 1,
      name: "P1",
      announced: true,
      lastHeartbeat: 0,
    });
    const deps = makeMockDeps({ getRemotePlayers: () => remote, getLocalReady: () => true });
    const cd = new LobbyCountdown(deps);
    cd.evaluate();
    expect(deps.sync.sendGameEvent).toHaveBeenCalledWith({
      type: "zone",
      payload: { countdown: Math.ceil(COUNTDOWN_SHORT / 1000) },
    });
  });

  it("cancels countdown when local unreadies", () => {
    const deps = makeMockDeps({ getLocalReady: () => false });
    const cd = new LobbyCountdown(deps);
    cd.countdownEndTime = performance.now() + 10000; // simulate active countdown
    cd.evaluate();
    expect(deps.sync.sendGameEvent).toHaveBeenCalledWith({
      type: "zone",
      payload: { countdown: 0 },
    });
    expect(cd.countdownEndTime).toBe(-1);
  });

  it("abort clears all state and timers", () => {
    const remote = new Map<string, LobbyPlayer>();
    remote.set("peer1", {
      peerId: "peer1",
      character: "chef",
      cosmetics: {},
      ready: true,
      colorIndex: 1,
      name: "P1",
      announced: true,
      lastHeartbeat: 0,
    });
    const deps = makeMockDeps({ getRemotePlayers: () => remote, getLocalReady: () => true });
    const cd = new LobbyCountdown(deps);
    cd.evaluate(); // starts countdown
    cd.starting = true; // simulate mid-start
    cd.abort();
    expect(cd.starting).toBe(false);
    expect(cd.countdownEndTime).toBe(-1);
    expect(deps.setCountdownText).toHaveBeenCalledWith("");
  });

  it("does not evaluate during starting phase", () => {
    const deps = makeMockDeps({ getLocalReady: () => true });
    const cd = new LobbyCountdown(deps);
    cd.starting = true;
    cd.evaluate();
    expect(deps.sync.sendGameEvent).not.toHaveBeenCalled();
  });
});
