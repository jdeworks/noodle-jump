import { describe, test, expect } from "vitest";
import { POWER_UP_PARTICLE_CONFIGS } from "../src/config/particles";

const ALL_POWER_UP_TYPES = [
  "spaghetti_spring",
  "fusilli_tornado",
  "ravioli_rocket",
  "lasagna_layers",
  "pepper_sneeze",
  "meatball_magnet",
  "chili_pepper",
  "soggy_noodle",
  "garlic_breath",
  "burnt_toast",
];

describe("POWER_UP_PARTICLE_CONFIGS", () => {
  test("has config for every power-up type", () => {
    for (const type of ALL_POWER_UP_TYPES) {
      expect(POWER_UP_PARTICLE_CONFIGS[type], `Missing particle config for ${type}`).toBeDefined();
    }
  });

  test("all configs have valid count", () => {
    for (const [type, config] of Object.entries(POWER_UP_PARTICLE_CONFIGS)) {
      expect(config.count, `${type} count`).toBeGreaterThan(0);
    }
  });

  test("all configs have valid lifetime", () => {
    for (const [type, config] of Object.entries(POWER_UP_PARTICLE_CONFIGS)) {
      expect(config.lifetime, `${type} lifetime`).toBeGreaterThan(0);
    }
  });

  test("all configs have at least one color", () => {
    for (const [type, config] of Object.entries(POWER_UP_PARTICLE_CONFIGS)) {
      expect(config.colors.length, `${type} should have colors`).toBeGreaterThan(0);
    }
  });

  test("all configs have valid alpha range", () => {
    for (const [type, config] of Object.entries(POWER_UP_PARTICLE_CONFIGS)) {
      expect(config.alpha, `${type} alpha`).toBeGreaterThan(0);
      expect(config.alpha, `${type} alpha`).toBeLessThanOrEqual(1);
    }
  });

  test("all configs have valid size range", () => {
    for (const [type, config] of Object.entries(POWER_UP_PARTICLE_CONFIGS)) {
      expect(config.size[0], `${type} size min`).toBeGreaterThan(0);
      expect(config.size[1], `${type} size max`).toBeGreaterThanOrEqual(config.size[0]);
    }
  });

  test("all configs have valid fadeRate", () => {
    for (const [type, config] of Object.entries(POWER_UP_PARTICLE_CONFIGS)) {
      expect(config.fadeRate, `${type} fadeRate`).toBeGreaterThan(0);
      expect(config.fadeRate, `${type} fadeRate`).toBeLessThan(1);
    }
  });

  test("burst configs have non-zero spawnRate", () => {
    for (const [type, config] of Object.entries(POWER_UP_PARTICLE_CONFIGS)) {
      if (!config.burst) {
        expect(config.spawnRate, `${type} spawnRate`).toBeGreaterThan(0);
      }
    }
  });

  test("no config has zero drag (would freeze)", () => {
    for (const [type, config] of Object.entries(POWER_UP_PARTICLE_CONFIGS)) {
      expect(config.drag, `${type} drag`).toBeGreaterThan(0);
    }
  });
});
