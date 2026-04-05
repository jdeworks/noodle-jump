import { describe, test, expect } from "vitest";
import {
  createDebugConfig,
  applyPreset,
  bossTestPreset,
  enemyTestPreset,
  powerUpTestPreset,
  perfTestPreset,
} from "../src/config/debug";

describe("DebugConfig", () => {
  test("createDebugConfig returns sane defaults", () => {
    const config = createDebugConfig();
    expect(config.seed).toBe(0);
    expect(config.invincible).toBe(false);
    expect(config.infiniteKnives).toBe(false);
    expect(config.gameSpeed).toBe(1.0);
    expect(config.forceBossType).toBeNull();
    expect(config.showHitboxes).toBe(false);
  });

  test("applyPreset merges into config", () => {
    const config = createDebugConfig();
    const result = applyPreset(config, { invincible: true, seed: 42 });
    expect(result.invincible).toBe(true);
    expect(result.seed).toBe(42);
    expect(result.gameSpeed).toBe(1.0); // unchanged
  });

  test("bossTestPreset has quick transitions", () => {
    const preset = bossTestPreset();
    expect(preset.quickZoneTransitions).toBeGreaterThan(0);
  });

  test("enemyTestPreset has fast spawns and hitboxes", () => {
    const preset = enemyTestPreset();
    expect(preset.enemySpawnMultiplier).toBeGreaterThan(1);
    expect(preset.showHitboxes).toBe(true);
  });

  test("powerUpTestPreset forces type and invincibility", () => {
    const preset = powerUpTestPreset("pasta_shield");
    expect(preset.forcePowerUpType).toBe("pasta_shield");
    expect(preset.invincible).toBe(true);
  });

  test("perfTestPreset disables visual effects", () => {
    const preset = perfTestPreset();
    expect(preset.disableWeather).toBe(true);
    expect(preset.disableParallax).toBe(true);
    expect(preset.disableEffectParticles).toBe(true);
    expect(preset.showFPS).toBe(true);
  });

  test("presets can be chained", () => {
    let config = createDebugConfig();
    config = applyPreset(config, bossTestPreset());
    config = applyPreset(config, { seed: 12345 });
    expect(config.quickZoneTransitions).toBeGreaterThan(0);
    expect(config.seed).toBe(12345);
  });
});
