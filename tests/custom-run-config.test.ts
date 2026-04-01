import { describe, test, expect } from "vitest";
import {
  createDefaultRunConfig,
  createDailyChallengeConfig,
  isPowerUpEnabled,
  serializeRunConfig,
  deserializeRunConfig,
  ALL_POWER_UP_TYPES,
} from "../src/systems/CustomRunConfig";

describe("CustomRunConfig", () => {
  test("createDefaultRunConfig returns sane defaults", () => {
    const config = createDefaultRunConfig();
    expect(config.seed).toBe(0);
    expect(config.enemiesEnabled).toBe(false);
    expect(config.startingZone).toBe(0);
    expect(config.difficultyMultiplier).toBe(1.0);
    expect(config.practiceMode).toBe(false);
    expect(config.isDailyChallenge).toBe(false);
    expect(config.enabledPowerUps.size).toBe(ALL_POWER_UP_TYPES.length);
  });

  test("createDailyChallengeConfig sets seed and flag", () => {
    const config = createDailyChallengeConfig(12345);
    expect(config.seed).toBe(12345);
    expect(config.isDailyChallenge).toBe(true);
  });

  test("isPowerUpEnabled checks config", () => {
    const config = createDefaultRunConfig();
    expect(isPowerUpEnabled(config, "spaghetti_spring")).toBe(true);

    // Remove one
    config.enabledPowerUps.delete("spaghetti_spring");
    expect(isPowerUpEnabled(config, "spaghetti_spring")).toBe(false);
    expect(isPowerUpEnabled(config, "fusilli_tornado")).toBe(true);
  });

  test("isPowerUpEnabled with empty set enables all", () => {
    const config = createDefaultRunConfig();
    config.enabledPowerUps = new Set();
    expect(isPowerUpEnabled(config, "spaghetti_spring")).toBe(true);
  });

  test("serializeRunConfig and deserializeRunConfig roundtrip", () => {
    const config = createDefaultRunConfig();
    config.seed = 42;
    config.enemiesEnabled = true;
    config.startingZone = 3;
    config.difficultyMultiplier = 1.5;

    const serialized = serializeRunConfig(config);
    const restored = deserializeRunConfig(serialized);

    expect(restored).not.toBeNull();
    expect(restored!.seed).toBe(42);
    expect(restored!.enemiesEnabled).toBe(true);
    expect(restored!.startingZone).toBe(3);
    expect(restored!.difficultyMultiplier).toBe(1.5);
  });

  test("deserializeRunConfig returns null for invalid input", () => {
    expect(deserializeRunConfig("not json")).toBeNull();
  });

  test("ALL_POWER_UP_TYPES has all 14 types", () => {
    expect(ALL_POWER_UP_TYPES).toHaveLength(14);
    expect(ALL_POWER_UP_TYPES).toContain("pasta_shield");
    expect(ALL_POWER_UP_TYPES).toContain("burnt_toast");
  });
});
