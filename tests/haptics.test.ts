import { describe, test, expect } from "vitest";

// Haptics functions are thin wrappers around navigator.vibrate.
// In test environment (node), navigator.vibrate doesn't exist.
// We verify the module exports correctly and doesn't throw.

describe("Haptics", () => {
  test("all haptic functions are importable and callable", async () => {
    const mod = await import("../src/systems/Haptics");
    expect(typeof mod.vibrateImpact).toBe("function");
    expect(typeof mod.vibratePowerUp).toBe("function");
    expect(typeof mod.vibrateNegative).toBe("function");
    expect(typeof mod.vibrateDeath).toBe("function");
    expect(typeof mod.vibrateMeatball).toBe("function");
    expect(typeof mod.vibrateEnemyKill).toBe("function");
    expect(typeof mod.vibrateThrow).toBe("function");
  });

  test("calling haptic functions without navigator.vibrate does not throw", async () => {
    const mod = await import("../src/systems/Haptics");
    // These should silently no-op in test environment
    expect(() => mod.vibrateImpact()).not.toThrow();
    expect(() => mod.vibrateDeath()).not.toThrow();
    expect(() => mod.vibrateThrow()).not.toThrow();
  });
});
