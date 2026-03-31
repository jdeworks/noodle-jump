import { describe, test, expect } from "vitest";
import { getAmbientConfig } from "../src/systems/AmbientAudio";

// Note: We can't easily test Web Audio playback without mocking AudioContext.
// These tests verify the dispatch/config logic that doesn't require audio hardware.

describe("Ambient Audio configs", () => {
  test("every zone has an ambient config", () => {
    for (let zone = 0; zone < 7; zone++) {
      const config = getAmbientConfig(zone);
      expect(config).toBeDefined();
      expect(config.vol).toBeGreaterThan(0);
      expect(config.vol).toBeLessThan(0.1); // ambient should be quiet
    }
  });

  test("zone 0 is sine (kitchen hum)", () => {
    expect(getAmbientConfig(0).type).toBe("sine");
  });

  test("zone 3 is noise (freezer wind)", () => {
    expect(getAmbientConfig(3).type).toBe("noise");
  });

  test("zone 4 is sawtooth (volcano rumble)", () => {
    expect(getAmbientConfig(4).type).toBe("sawtooth");
  });

  test("out of range clamps to last zone", () => {
    const config = getAmbientConfig(99);
    expect(config).toBeDefined();
    expect(config.type).toBe("triangle"); // zone 7
  });
});

// Verify the per-power-up SFX dispatch function exists and is callable
// (actual audio output can't be tested without AudioContext mock)
describe("SFX function exports", () => {
  test("playSfxPowerUp is importable", async () => {
    const mod = await import("../src/systems/Audio");
    expect(typeof mod.playSfxPowerUp).toBe("function");
  });

  test("playSfxLanding is importable", async () => {
    const mod = await import("../src/systems/Audio");
    expect(typeof mod.playSfxLanding).toBe("function");
  });

  test("playSfxComboEscalation is importable", async () => {
    const mod = await import("../src/systems/Audio");
    expect(typeof mod.playSfxComboEscalation).toBe("function");
  });

  test("playSfxEnemyKill is importable", async () => {
    const mod = await import("../src/systems/Audio");
    expect(typeof mod.playSfxEnemyKill).toBe("function");
  });

  test("playSfxShieldAbsorb is importable", async () => {
    const mod = await import("../src/systems/Audio");
    expect(typeof mod.playSfxShieldAbsorb).toBe("function");
  });

  test("playSfxThrow is importable", async () => {
    const mod = await import("../src/systems/Audio");
    expect(typeof mod.playSfxThrow).toBe("function");
  });

  test("playSfxWindGust is importable", async () => {
    const mod = await import("../src/systems/Audio");
    expect(typeof mod.playSfxWindGust).toBe("function");
  });

  test("playSfxWhoosh is importable", async () => {
    const mod = await import("../src/systems/Audio");
    expect(typeof mod.playSfxWhoosh).toBe("function");
  });

  test("playSfxCrumbleWarning is importable", async () => {
    const mod = await import("../src/systems/Audio");
    expect(typeof mod.playSfxCrumbleWarning).toBe("function");
  });
});
