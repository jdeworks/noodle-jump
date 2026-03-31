import { describe, it, expect, beforeEach } from "vitest";
import { initRNG, resetRNG, random } from "../src/systems/RNG";

describe("RNG system", () => {
  beforeEach(() => {
    resetRNG();
  });

  it("returns values in [0, 1)", () => {
    for (let i = 0; i < 100; i++) {
      const v = random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("produces deterministic output with same seed", () => {
    initRNG(12345);
    const values1: number[] = [];
    for (let i = 0; i < 20; i++) values1.push(random());

    initRNG(12345);
    const values2: number[] = [];
    for (let i = 0; i < 20; i++) values2.push(random());

    expect(values1).toEqual(values2);
  });

  it("produces different output with different seeds", () => {
    initRNG(12345);
    const a = random();

    initRNG(99999);
    const b = random();

    expect(a).not.toEqual(b);
  });

  it("seed 0 uses non-deterministic Math.random", () => {
    initRNG(0);
    const v = random();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  it("resetRNG restores non-deterministic behavior", () => {
    initRNG(42);
    resetRNG();
    // Just check it still works
    const v = random();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });
});
