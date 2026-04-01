import { describe, it, expect } from "vitest";
import { LocalInput } from "../../src/multiplayer/LocalInput";

/**
 * Tests for LocalInput logic. Since there's no jsdom, we test by
 * accessing the internal keysDown set directly rather than dispatching events.
 */
describe("LocalInput", () => {
  function createInputWithKeys(...keys: string[]): LocalInput {
    const input = new LocalInput();
    // Access private keysDown set to simulate key state
    const internal = input as unknown as { keysDown: Set<string> };
    for (const key of keys) internal.keysDown.add(key);
    return input;
  }

  it("defaults to zero for both players", () => {
    const input = createInputWithKeys();
    input.update();
    expect(input.p1InputX).toBe(0);
    expect(input.p2InputX).toBe(0);
  });

  it("P1 moves left with A", () => {
    const input = createInputWithKeys("a");
    input.update();
    expect(input.p1InputX).toBe(-1);
    expect(input.p2InputX).toBe(0);
  });

  it("P1 moves right with D", () => {
    const input = createInputWithKeys("d");
    input.update();
    expect(input.p1InputX).toBe(1);
    expect(input.p2InputX).toBe(0);
  });

  it("P2 moves left with ArrowLeft", () => {
    const input = createInputWithKeys("ArrowLeft");
    input.update();
    expect(input.p1InputX).toBe(0);
    expect(input.p2InputX).toBe(-1);
  });

  it("P2 moves right with ArrowRight", () => {
    const input = createInputWithKeys("ArrowRight");
    input.update();
    expect(input.p1InputX).toBe(0);
    expect(input.p2InputX).toBe(1);
  });

  it("both players can move independently", () => {
    const input = createInputWithKeys("a", "ArrowRight");
    input.update();
    expect(input.p1InputX).toBe(-1);
    expect(input.p2InputX).toBe(1);
  });

  it("pressing both P1 directions cancels out", () => {
    const input = createInputWithKeys("a", "d");
    input.update();
    expect(input.p1InputX).toBe(0);
  });

  it("pressing both P2 directions cancels out", () => {
    const input = createInputWithKeys("ArrowLeft", "ArrowRight");
    input.update();
    expect(input.p2InputX).toBe(0);
  });

  it("uppercase A/D works too", () => {
    const input = createInputWithKeys("A", "D");
    input.update();
    // Both pressed = cancels out
    expect(input.p1InputX).toBe(0);
  });
});
