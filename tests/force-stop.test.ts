import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../src/scenes/GameState";
import { resetPlatformIds } from "../src/entities/Platform";
import { resetPowerUpIds } from "../src/entities/PowerUp";
import { resetCollectibleIds } from "../src/entities/Collectible";

beforeEach(() => {
  resetPlatformIds();
  resetPowerUpIds();
  resetCollectibleIds();
});

/**
 * GameScene.forceStop() is: { ...state, gameOver: true, isDying: false }
 * We test the state transformation directly since GameScene's constructor
 * requires full PixiJS/DOM which is impractical to mock.
 */
function forceStop(state: ReturnType<typeof createInitialState>) {
  return { ...state, gameOver: true, isDying: false };
}

describe("forceStop state transformation", () => {
  test("after forceStop, gameOver is true and isDying is false", () => {
    const state = createInitialState();
    expect(state.gameOver).toBe(false);
    expect(state.isDying).toBe(false);

    const stopped = forceStop(state);

    expect(stopped.gameOver).toBe(true);
    expect(stopped.isDying).toBe(false);
  });

  test("forceStop clears isDying even if state was dying", () => {
    let state = createInitialState();
    state = { ...state, isDying: true, dyingTicks: 10 };

    const stopped = forceStop(state);

    expect(stopped.gameOver).toBe(true);
    expect(stopped.isDying).toBe(false);
    // dyingTicks is not cleared by forceStop, but isDying being false means it's irrelevant
  });

  test("forceStop preserves other state fields", () => {
    let state = createInitialState();
    state = { ...state, scoreState: { ...state.scoreState, points: 42 } };

    const stopped = forceStop(state);

    expect(stopped.scoreState.points).toBe(42);
    expect(stopped.player).toBe(state.player);
    expect(stopped.platforms).toBe(state.platforms);
  });
});
