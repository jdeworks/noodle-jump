import { describe, test, expect } from "vitest";
import {
  createCamera,
  updateCamera,
  isPlayerDead,
  worldToScreen,
} from "../src/systems/Camera";
import {
  GAME_HEIGHT,
  CAMERA_GRACE_PLATFORMS,
  PLATFORM_GAP_MAX,
} from "../src/config/constants";

describe("Camera", () => {
  test("creates camera at y=0", () => {
    const cam = createCamera();
    expect(cam.y).toBe(0);
    expect(cam.highestY).toBe(0);
  });

  test("follows player upward over time", () => {
    let cam = createCamera();
    // Simulate player climbing to y=-500
    for (let i = 0; i < 100; i++) {
      cam = updateCamera(cam, -500);
    }
    // Camera should have moved significantly toward the player
    expect(cam.y).toBeLessThan(-100);
  });

  test("tracks highest point reached", () => {
    let cam = createCamera();
    cam = updateCamera(cam, -500);
    const high = cam.highestY;
    cam = updateCamera(cam, 0); // player falls
    expect(cam.highestY).toBeLessThanOrEqual(high); // never increases
  });

  test("worldToScreen converts correctly", () => {
    expect(worldToScreen(500, 200)).toBe(300);
    expect(worldToScreen(0, -100)).toBe(100);
  });

  test("player is dead when far below camera", () => {
    const cam = { y: -1000, highestY: -1000 };
    const graceDistance = CAMERA_GRACE_PLATFORMS * PLATFORM_GAP_MAX;
    const deadY = cam.y + GAME_HEIGHT + graceDistance + 1;
    expect(isPlayerDead(cam, deadY)).toBe(true);
  });

  test("player is alive within grace area", () => {
    const cam = { y: -1000, highestY: -1000 };
    const aliveY = cam.y + GAME_HEIGHT + 50;
    expect(isPlayerDead(cam, aliveY)).toBe(false);
  });
});
