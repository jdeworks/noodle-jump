import { describe, test, expect, beforeEach } from "vitest";
import { createInitialState } from "../src/scenes/GameState";
import { rescuePlayer } from "../src/scenes/GameLoopHelpers";
import { resetPlatformIds } from "../src/entities/Platform";
import { resetPowerUpIds } from "../src/entities/PowerUp";
import { resetCollectibleIds } from "../src/entities/Collectible";
import { GAME_WIDTH, GAME_HEIGHT } from "../src/config/constants";

beforeEach(() => {
  resetPlatformIds();
  resetPowerUpIds();
  resetCollectibleIds();
});

describe("rescuePlayer", () => {
  test("player is placed on a platform near the center of the screen", () => {
    const state = createInitialState();
    const rescued = rescuePlayer(state);

    const camTop = rescued.camera.y;
    const camBot = camTop + GAME_HEIGHT;
    const camMid = camTop + GAME_HEIGHT * 0.5;

    // Player should be within the visible screen area
    expect(rescued.player.y).toBeGreaterThanOrEqual(camTop - 100);
    expect(rescued.player.y).toBeLessThanOrEqual(camBot + 100);

    // Player should have an upward bounce velocity
    expect(rescued.player.vy).toBe(-8);
    expect(rescued.player.isJumping).toBe(true);
  });

  test("breaking and crumbling platforms are filtered out", () => {
    let state = createInitialState();

    // Replace all platforms with breaking ones, plus one static near mid-screen
    const camTop = state.camera.y;
    const camMid = camTop + GAME_HEIGHT * 0.5;
    const breakingPlatform = {
      x: 100, y: camMid - 20, width: 80, height: 15,
      type: "breaking" as const, broken: false, id: 9990,
      originX: 100, moveDirection: 0,
    };
    const staticPlatform = {
      x: 150, y: camMid + 10, width: 80, height: 15,
      type: "static" as const, broken: false, id: 9991,
      originX: 150, moveDirection: 0,
    };
    state = { ...state, platforms: [breakingPlatform, staticPlatform] };

    const rescued = rescuePlayer(state);

    // Player should be placed on the static platform, not the breaking one
    expect(rescued.player.x).toBeGreaterThanOrEqual(staticPlatform.x - 50);
    expect(rescued.player.x).toBeLessThanOrEqual(staticPlatform.x + staticPlatform.width + 50);
  });

  test("when deathPenaltyEnabled, height and highestHeight are reduced by 10%", () => {
    let state = createInitialState();
    state = {
      ...state,
      deathPenaltyEnabled: true,
      scoreState: {
        ...state.scoreState,
        height: 1000,
        highestHeight: 1000,
        points: 500,
      },
    };

    const rescued = rescuePlayer(state);

    expect(rescued.scoreState.height).toBe(900);
    expect(rescued.scoreState.highestHeight).toBe(900);
  });

  test("when deathPenaltyEnabled is false, score is unchanged", () => {
    let state = createInitialState();
    state = {
      ...state,
      deathPenaltyEnabled: false,
      scoreState: {
        ...state.scoreState,
        height: 1000,
        highestHeight: 1000,
        points: 500,
      },
    };

    const rescued = rescuePlayer(state);

    expect(rescued.scoreState.height).toBe(1000);
    expect(rescued.scoreState.highestHeight).toBe(1000);
    expect(rescued.scoreState.points).toBe(500);
  });

  test("stagnantTicks is reset to 0", () => {
    let state = createInitialState();
    state = { ...state, stagnantTicks: 999 };

    const rescued = rescuePlayer(state);

    expect(rescued.stagnantTicks).toBe(0);
  });
});
