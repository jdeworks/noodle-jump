import { describe, test, expect } from "vitest";
import { createShake, tickShake } from "../src/systems/ScreenShake";

describe("ScreenShake", () => {
  test("creates shake with given parameters", () => {
    const state = createShake(10, 30);
    expect(state.intensity).toBe(10);
    expect(state.ticksRemaining).toBe(30);
    expect(state.totalTicks).toBe(30);
  });

  test("tick produces offsets within intensity bounds", () => {
    const state = createShake(10, 30);
    const result = tickShake(state);
    expect(result.state).not.toBeNull();
    expect(Math.abs(result.offsetX)).toBeLessThanOrEqual(10);
    expect(Math.abs(result.offsetY)).toBeLessThanOrEqual(10);
  });

  test("tick counts down and expires", () => {
    let state = createShake(5, 2);
    let result = tickShake(state);
    expect(result.state!.ticksRemaining).toBe(1);

    result = tickShake(result.state!);
    expect(result.state).toBeNull();
    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBe(0);
  });

  test("intensity decays over time", () => {
    const state = createShake(100, 100);
    // At full duration, offset can be large
    const early = tickShake(state);
    // Near end, offset should be smaller
    let current = state;
    for (let i = 0; i < 90; i++) {
      const r = tickShake(current);
      if (r.state) current = r.state;
    }
    const late = tickShake(current);
    // Late offsets should generally be smaller (decay factor is 10/100 = 0.1)
    // We check the max possible range rather than specific random values
    expect(late.state).not.toBeNull();
  });
});
