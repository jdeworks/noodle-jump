import { describe, test, expect, beforeEach } from "vitest";
import { seededRandom } from "../src/systems/DailyChallenge";
import { createInitialState } from "../src/scenes/GameState";
import { createDefaultRunConfig } from "../src/systems/CustomRunConfig";
import { resetPlatformIds } from "../src/entities/Platform";
import { resetPowerUpIds } from "../src/entities/PowerUp";
import { resetCollectibleIds } from "../src/entities/Collectible";

beforeEach(() => {
  resetPlatformIds();
  resetPowerUpIds();
  resetCollectibleIds();
});

describe("Seeded generation determinism", () => {
  test("same seed produces same random sequence", () => {
    const rng1 = seededRandom(42);
    const rng2 = seededRandom(42);
    const seq1 = Array.from({ length: 50 }, () => rng1());
    const seq2 = Array.from({ length: 50 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  test("createInitialState produces consistent platform count", () => {
    const config = createDefaultRunConfig();
    config.seed = 12345;

    const state1 = createInitialState(config);
    resetPlatformIds();
    resetPowerUpIds();
    resetCollectibleIds();
    const state2 = createInitialState(config);

    // Platform count should be the same
    expect(state1.platforms.length).toBe(state2.platforms.length);
  });

  test("RunConfig practiceMode is applied to state", () => {
    const config = createDefaultRunConfig();
    config.practiceMode = true;
    const state = createInitialState(config);
    expect(state.practiceMode).toBe(true);
  });

  test("RunConfig is stored in state", () => {
    const config = createDefaultRunConfig();
    config.seed = 99999;
    config.enemiesEnabled = true;
    const state = createInitialState(config);
    expect(state.runConfig.seed).toBe(99999);
    expect(state.runConfig.enemiesEnabled).toBe(true);
  });
});
