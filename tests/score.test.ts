import { describe, test, expect } from "vitest";
import {
  createScoreState,
  updateHeightScore,
  addMeatballScore,
  addPowerUpScore,
  tickCombo,
  addCloseCallBonus,
  addLandingStreak,
} from "../src/systems/Score";
import {
  MEATBALL_POINTS,
  POWERUP_POINTS,
  CLOSE_CALL_BONUS,
  LANDING_STREAK_BONUS,
  COMBO_TIMEOUT_TICKS,
} from "../src/config/constants";

describe("Score", () => {
  test("starts at zero", () => {
    const state = createScoreState();
    expect(state.points).toBe(0);
    expect(state.height).toBe(0);
  });

  test("height score increases as player climbs", () => {
    let state = createScoreState();
    // Player at y=300 (lower Y = higher in game)
    state = updateHeightScore(state, 300);
    expect(state.height).toBeGreaterThan(0);
    expect(state.points).toBeGreaterThan(0);
  });

  test("height score does not decrease when player falls", () => {
    let state = createScoreState();
    state = updateHeightScore(state, 100); // high
    const highPoints = state.points;
    state = updateHeightScore(state, 500); // fell down
    expect(state.points).toBe(highPoints); // no change
    expect(state.height).toBe(state.highestHeight);
  });

  test("meatball adds correct points", () => {
    let state = createScoreState();
    state = addMeatballScore(state, 3);
    expect(state.points).toBe(3 * MEATBALL_POINTS);
    expect(state.meatballsCollected).toBe(3);
  });

  test("power-up adds correct points", () => {
    let state = createScoreState();
    state = addPowerUpScore(state);
    expect(state.points).toBe(POWERUP_POINTS);
    expect(state.powerUpsCollected).toBe(1);
  });

  test("meatball combo builds multiplier", () => {
    let state = createScoreState();
    state = addMeatballScore(state, 1); // 1st — 1x
    expect(state.comboMultiplier).toBe(1);
    state = addMeatballScore(state, 1); // 2nd — 2x
    expect(state.comboMultiplier).toBe(2);
    state = addMeatballScore(state, 1); // 3rd
    state = addMeatballScore(state, 1); // 4th — 3x
    expect(state.comboMultiplier).toBe(3);
    expect(state.comboTimer).toBe(COMBO_TIMEOUT_TICKS);
  });

  test("combo resets when timer expires", () => {
    let state = createScoreState();
    state = addMeatballScore(state, 1);
    state = addMeatballScore(state, 1);
    expect(state.comboMultiplier).toBe(2);
    // Tick down the full timer
    for (let i = 0; i < COMBO_TIMEOUT_TICKS; i++) {
      state = tickCombo(state);
    }
    expect(state.comboMultiplier).toBe(1);
    expect(state.comboCount).toBe(0);
  });

  test("close call bonus adds points", () => {
    let state = createScoreState();
    state = addCloseCallBonus(state);
    expect(state.points).toBe(CLOSE_CALL_BONUS);
  });

  test("landing streak awards bonus every 5 landings", () => {
    let state = createScoreState();
    for (let i = 0; i < 4; i++) {
      state = addLandingStreak(state);
    }
    expect(state.points).toBe(0); // no bonus yet
    state = addLandingStreak(state); // 5th landing
    expect(state.points).toBe(LANDING_STREAK_BONUS);
    expect(state.landingStreak).toBe(5);
  });
});
