import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../src/scenes/GameState";
import { tickGameWorld, startCountdown, togglePause } from "../src/scenes/GameLoop";
import { resetPlatformIds } from "../src/entities/Platform";
import { resetPowerUpIds } from "../src/entities/PowerUp";
import { resetCollectibleIds } from "../src/entities/Collectible";

beforeEach(() => {
  resetPlatformIds();
  resetPowerUpIds();
  resetCollectibleIds();
});

describe("tickGameWorld", () => {
  test("does not advance when paused", () => {
    let state = createInitialState();
    state = togglePause(state);
    expect(state.paused).toBe(true);

    const result = tickGameWorld(state, 0);
    expect(result.state.animTick).toBe(state.animTick);
    expect(result.events).toHaveLength(0);
  });

  test("does not advance when game is over", () => {
    let state = createInitialState();
    state = { ...state, gameOver: true };

    const result = tickGameWorld(state, 0);
    expect(result.events).toHaveLength(0);
  });

  test("countdown decrements each tick", () => {
    let state = createInitialState();
    state = startCountdown(state);
    expect(state.countdownTicks).toBe(180);

    const result = tickGameWorld(state, 0);
    expect(result.state.countdownTicks).toBe(179);
  });

  test("countdown phase updates platforms and camera", () => {
    let state = createInitialState();
    state = startCountdown(state);

    const result = tickGameWorld(state, 0);
    expect(result.state.animTick).toBe(state.animTick + 1);
  });

  test("player falls with gravity when no platforms below", () => {
    let state = createInitialState();
    // Place player high above all platforms
    state = {
      ...state,
      player: { ...state.player, y: -10000, vy: 0 },
      countdownTicks: 0,
    };

    const result = tickGameWorld(state, 0);
    // Player should have fallen (vy increases due to gravity)
    expect(result.state.player.vy).toBeGreaterThan(0);
  });

  test("togglePause toggles paused state", () => {
    const state = createInitialState();
    expect(state.paused).toBe(false);

    const paused = togglePause(state);
    expect(paused.paused).toBe(true);

    const unpaused = togglePause(paused);
    expect(unpaused.paused).toBe(false);
  });

  test("death animation advances dying ticks", () => {
    let state = createInitialState();
    state = { ...state, isDying: true, dyingTicks: 0, countdownTicks: 0 };

    const result = tickGameWorld(state, 0);
    expect(result.state.dyingTicks).toBe(1);
  });

  test("death animation ends with gameOver event", () => {
    let state = createInitialState();
    state = {
      ...state,
      isDying: true,
      dyingTicks: 59, // One tick before DEATH_ANIMATION_TICKS (60)
      countdownTicks: 0,
    };

    const result = tickGameWorld(state, 0);
    expect(result.state.gameOver).toBe(true);
    const gameOverEvent = result.events.find((e) => e.type === "gameOver");
    expect(gameOverEvent).toBeDefined();
  });

  test("animTick increments each active tick", () => {
    let state = createInitialState();
    state = { ...state, countdownTicks: 0 };

    const result = tickGameWorld(state, 0);
    expect(result.state.animTick).toBe(state.animTick + 1);
  });

  test("returns died event when player falls below camera", () => {
    let state = createInitialState();
    state = {
      ...state,
      countdownTicks: 0,
      player: { ...state.player, y: state.camera.y + 2000 },
    };

    const result = tickGameWorld(state, 0);
    const diedEvent = result.events.find((e) => e.type === "died");
    expect(diedEvent).toBeDefined();
    expect(result.state.isDying).toBe(true);
  });
});

describe("startCountdown", () => {
  test("sets countdown ticks to 180", () => {
    const state = createInitialState();
    const result = startCountdown(state);
    expect(result.countdownTicks).toBe(180);
  });
});
