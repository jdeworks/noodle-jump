import { describe, test, expect } from "vitest";
import { createDayNight, tickDayNight } from "../src/systems/DayNight";

describe("DayNight", () => {
  test("createDayNight starts at max brightness", () => {
    const dn = createDayNight();
    expect(dn.brightness).toBe(1.0);
    expect(dn.ticks).toBe(0);
  });

  test("tickDayNight increments ticks", () => {
    const dn = createDayNight();
    const ticked = tickDayNight(dn);
    expect(ticked.ticks).toBe(1);
  });

  test("brightness stays within valid range", () => {
    let dn = createDayNight();
    for (let i = 0; i < 20000; i++) {
      dn = tickDayNight(dn);
      expect(dn.brightness).toBeGreaterThanOrEqual(0.85);
      expect(dn.brightness).toBeLessThanOrEqual(1.0);
    }
  });

  test("brightness varies over a full cycle", () => {
    let dn = createDayNight();
    let minBrightness = 1;
    let maxBrightness = 0;
    for (let i = 0; i < 18000; i++) {
      dn = tickDayNight(dn);
      if (dn.brightness < minBrightness) minBrightness = dn.brightness;
      if (dn.brightness > maxBrightness) maxBrightness = dn.brightness;
    }
    // Should have varied across the full range
    expect(maxBrightness).toBeGreaterThan(0.99);
    expect(minBrightness).toBeLessThan(0.86);
  });
});
