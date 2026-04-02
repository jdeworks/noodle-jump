import { describe, test, expect, beforeEach, vi } from "vitest";

const KEY = "noodle-jump-tilt-inverted";

// Provide a minimal localStorage mock
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

import { isTiltInverted, setTiltInverted } from "../src/systems/TiltSettings";

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  vi.clearAllMocks();
});

describe("TiltSettings", () => {
  test("isTiltInverted returns false by default", () => {
    expect(isTiltInverted()).toBe(false);
  });

  test("setTiltInverted(true) persists '1' and isTiltInverted returns true", () => {
    setTiltInverted(true);
    expect(localStorage.getItem(KEY)).toBe("1");
    expect(isTiltInverted()).toBe(true);
  });

  test("setTiltInverted(false) persists '0' and isTiltInverted returns false", () => {
    setTiltInverted(false);
    expect(localStorage.getItem(KEY)).toBe("0");
    expect(isTiltInverted()).toBe(false);
  });

  test("toggling back and forth works correctly", () => {
    setTiltInverted(true);
    expect(isTiltInverted()).toBe(true);
    setTiltInverted(false);
    expect(isTiltInverted()).toBe(false);
    setTiltInverted(true);
    expect(isTiltInverted()).toBe(true);
  });
});
