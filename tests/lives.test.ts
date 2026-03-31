import { describe, test, expect } from "vitest";
import {
  createLivesState,
  loseLife,
  gainLife,
  hasLives,
  resetLives,
} from "../src/systems/Lives";

describe("Lives system", () => {
  test("createLivesState with lives enabled", () => {
    const state = createLivesState(true, 3);
    expect(state.lives).toBe(3);
    expect(state.maxLives).toBe(3);
    expect(state.enabled).toBe(true);
  });

  test("createLivesState defaults to disabled", () => {
    const state = createLivesState();
    expect(state.enabled).toBe(false);
  });

  test("loseLife decrements lives", () => {
    const state = createLivesState(true, 3);
    const result = loseLife(state);
    expect(result.state.lives).toBe(2);
    expect(result.gameOver).toBe(false);
  });

  test("loseLife at 1 life triggers game over", () => {
    const state = createLivesState(true, 1);
    const result = loseLife(state);
    expect(result.state.lives).toBe(0);
    expect(result.gameOver).toBe(true);
  });

  test("loseLife with disabled lives always game over", () => {
    const state = createLivesState(false);
    const result = loseLife(state);
    expect(result.gameOver).toBe(true);
  });

  test("gainLife adds a life up to max", () => {
    const state = { ...createLivesState(true, 3), lives: 2 };
    const gained = gainLife(state);
    expect(gained.lives).toBe(3);
  });

  test("gainLife does not exceed maxLives", () => {
    const state = createLivesState(true, 3);
    const gained = gainLife(state);
    expect(gained.lives).toBe(3);
  });

  test("gainLife does nothing when disabled", () => {
    const state = createLivesState(false);
    const gained = gainLife(state);
    expect(gained.lives).toBe(state.lives);
  });

  test("hasLives returns true when lives remain", () => {
    expect(hasLives(createLivesState(true, 3))).toBe(true);
  });

  test("hasLives returns false when no lives", () => {
    expect(hasLives({ ...createLivesState(true, 3), lives: 0 })).toBe(false);
  });

  test("hasLives returns false when disabled", () => {
    expect(hasLives(createLivesState(false))).toBe(false);
  });

  test("resetLives restores to max", () => {
    const state = { ...createLivesState(true, 5), lives: 1 };
    const reset = resetLives(state);
    expect(reset.lives).toBe(5);
  });
});
