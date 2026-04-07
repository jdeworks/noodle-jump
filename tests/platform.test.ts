import { describe, test, expect, beforeEach } from "vitest";
import {
  createPlatform,
  createGroundPlatform,
  generatePlatforms,
  updatePlatforms,
  pruneBelow,
  breakPlatform,
  resetPlatformIds,
} from "../src/entities/Platform";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLATFORM_WIDTH_MIN,
  PLATFORM_WIDTH_MAX,
  PLATFORM_MOVING_SPEED,
} from "../src/config/constants";

beforeEach(() => {
  resetPlatformIds();
});

describe("Platform", () => {
  test("creates platform with random width between min and max", () => {
    const widths = new Set<number>();
    for (let i = 0; i < 50; i++) {
      const p = createPlatform(100, 200);
      expect(p.width).toBeGreaterThanOrEqual(PLATFORM_WIDTH_MIN);
      expect(p.width).toBeLessThanOrEqual(PLATFORM_WIDTH_MAX);
      widths.add(Math.round(p.width));
    }
    expect(widths.size).toBeGreaterThan(1);
  });

  test("creates static platform by default", () => {
    const p = createPlatform(100, 200);
    expect(p.type).toBe("static");
    expect(p.broken).toBe(false);
  });

  test("creates breaking platform when specified", () => {
    const p = createPlatform(100, 200, "breaking");
    expect(p.type).toBe("breaking");
  });

  test("creates moving platform when specified", () => {
    const p = createPlatform(100, 200, "moving");
    expect(p.type).toBe("moving");
    expect(p.originX).toBe(100);
  });

  test("ground platform spans full width near bottom", () => {
    const p = createGroundPlatform(GAME_HEIGHT);
    expect(p.x).toBe(0);
    expect(p.width).toBe(GAME_WIDTH);
    expect(p.y).toBe(GAME_HEIGHT - 50);
    expect(p.type).toBe("static");
  });

  test("generates platforms above the given Y", () => {
    const platforms = generatePlatforms(500, 10);
    expect(platforms).toHaveLength(10);
    for (const p of platforms) {
      expect(p.y).toBeLessThan(500);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + p.width).toBeLessThanOrEqual(GAME_WIDTH + 1); // rounding tolerance
    }
  });

  test("generated platforms are in ascending order", () => {
    const platforms = generatePlatforms(500, 10);
    for (let i = 1; i < platforms.length; i++) {
      expect(platforms[i].y).toBeLessThan(platforms[i - 1].y);
    }
  });

  test("generated platforms include all special types", () => {
    const platforms = generatePlatforms(10000, 200);
    const breaking = platforms.filter((p) => p.type === "breaking");
    const brittle = platforms.filter((p) => p.type === "brittle");
    const moving = platforms.filter((p) => p.type === "moving");
    expect(breaking.length).toBeGreaterThan(0);
    expect(brittle.length).toBeGreaterThan(0);
    expect(moving.length).toBeGreaterThan(0);
  });

  test("never two consecutive brittle platforms (possibility check)", () => {
    // Run multiple times to account for randomness
    for (let run = 0; run < 10; run++) {
      const platforms = generatePlatforms(10000, 100);
      for (let i = 1; i < platforms.length; i++) {
        const prevOk = platforms[i - 1].type !== "brittle";
        const currOk = platforms[i].type !== "brittle";
        // At least one of any two consecutive platforms must not be brittle
        expect(prevOk || currOk).toBe(true);
      }
    }
  });

  test("never two consecutive brittle across batch boundaries", () => {
    for (let run = 0; run < 20; run++) {
      // Generate batch 1, check if last is brittle, pass to batch 2
      const batch1 = generatePlatforms(10000, 20);
      const lastBrittle = batch1[batch1.length - 1].type === "brittle";
      const batch2 = generatePlatforms(batch1[batch1.length - 1].y, 20, undefined, lastBrittle);
      if (lastBrittle) {
        expect(batch2[0].type).not.toBe("brittle");
      }
    }
  });

  test("updatePlatforms moves moving platforms", () => {
    const p = createPlatform(100, 200, "moving");
    const [updated] = updatePlatforms([p]);
    expect(updated.x).not.toBe(p.x);
    expect(Math.abs(updated.x - p.x)).toBeCloseTo(PLATFORM_MOVING_SPEED);
  });

  test("updatePlatforms does not move static platforms", () => {
    const p = createPlatform(100, 200, "static");
    const [updated] = updatePlatforms([p]);
    expect(updated.x).toBe(p.x);
  });

  test("moving platform reverses at range limits", () => {
    // Start at x=200 moving right, should reverse before going off screen
    const p = {
      ...createPlatform(200, 200, "moving"),
      originX: 200,
      moveDirection: 1,
    };
    let current = p;
    for (let i = 0; i < 200; i++) {
      const [updated] = updatePlatforms([current]);
      current = updated;
      expect(current.x).toBeGreaterThanOrEqual(-1);
      expect(current.x + current.width).toBeLessThanOrEqual(GAME_WIDTH + 1);
    }
  });

  test("breakPlatform marks platform as broken", () => {
    const p = createPlatform(0, 0, "breaking");
    const broken = breakPlatform(p);
    expect(broken.broken).toBe(true);
    expect(p.broken).toBe(false);
  });

  test("prunes platforms below threshold", () => {
    const platforms = [createPlatform(0, 100), createPlatform(0, 500), createPlatform(0, 900)];
    const pruned = pruneBelow(platforms, 600);
    expect(pruned).toHaveLength(2);
  });

  test("each platform gets a unique id", () => {
    const a = createPlatform(0, 0);
    const b = createPlatform(0, 0);
    expect(a.id).not.toBe(b.id);
  });
});
