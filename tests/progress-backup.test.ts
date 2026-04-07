import { describe, test, expect, beforeEach } from "vitest";

// Provide localStorage mock for Node test environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => {
    store[key] = val;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
};
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

import { exportProgress, importProgress } from "../src/systems/ProgressBackup";

describe("ProgressBackup", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("export produces a base64 string", () => {
    const encoded = exportProgress();
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
    // Should be valid base64
    expect(() => atob(encoded)).not.toThrow();
  });

  test("import restores exported data", () => {
    localStorage.setItem("noodle-jump-achievements", JSON.stringify(["zone_2", "score_10k"]));
    localStorage.setItem("noodle-jump-character", "ninja");
    localStorage.setItem("noodle-jump-high-score", "5000");

    const encoded = exportProgress();
    localStorage.clear();

    expect(importProgress(encoded)).toBe(true);
    expect(JSON.parse(localStorage.getItem("noodle-jump-achievements")!)).toContain("zone_2");
    expect(localStorage.getItem("noodle-jump-character")).toBe("ninja");
    expect(localStorage.getItem("noodle-jump-high-score")).toBe("5000");
  });

  test("import rejects invalid data", () => {
    expect(importProgress("not-valid-base64!!!")).toBe(false);
    expect(importProgress(btoa("{}"))).toBe(false);
    expect(importProgress("")).toBe(false);
  });

  test("round-trip preserves cosmetics", () => {
    const cosmetics = {
      unlocked: ["trail_fire", "tint_gold"],
      equipped: {
        trail: "trail_fire",
        tint: "tint_gold",
        theme: "theme_default",
      },
    };
    localStorage.setItem("noodle-jump-cosmetics", JSON.stringify(cosmetics));

    const encoded = exportProgress();
    localStorage.clear();
    importProgress(encoded);

    const restored = JSON.parse(localStorage.getItem("noodle-jump-cosmetics")!);
    expect(restored.unlocked).toContain("trail_fire");
    expect(restored.equipped.trail).toBe("trail_fire");
  });
});
