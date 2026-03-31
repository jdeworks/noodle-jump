import { describe, test, expect } from "vitest";
import {
  createWeather,
  tickWeather,
  changeWeatherZone,
  getWeatherType,
} from "../src/systems/Weather";

describe("Weather", () => {
  test("createWeather sets type from zone", () => {
    expect(createWeather(0).type).toBe("steam");
    expect(createWeather(1).type).toBe("bubbles");
    expect(createWeather(2).type).toBe("stars");
    expect(createWeather(3).type).toBe("snow");
    expect(createWeather(4).type).toBe("embers");
    expect(createWeather(5).type).toBe("sugar_crystals");
    expect(createWeather(6).type).toBe("sparkles");
  });

  test("createWeather starts with empty particles", () => {
    const w = createWeather(0);
    expect(w.particles).toHaveLength(0);
  });

  test("tickWeather spawns particles over time", () => {
    let w = createWeather(0); // steam
    // Tick many times to ensure some spawn (probabilistic)
    for (let i = 0; i < 100; i++) {
      w = tickWeather(w);
    }
    expect(w.particles.length).toBeGreaterThan(0);
  });

  test("tickWeather removes dead particles", () => {
    let w = createWeather(0);
    // Spawn some
    for (let i = 0; i < 50; i++) w = tickWeather(w);
    const initialCount = w.particles.length;
    // Tick many more to let them die
    for (let i = 0; i < 200; i++) {
      // Stop spawning by making type "none"-like (just tick existing)
      w = { ...w, particles: w.particles.map((p) => ({ ...p, life: 1 })) };
      w = tickWeather(w);
    }
    // Most should be dead
    expect(w.particles.length).toBeLessThan(initialCount);
  });

  test("changeWeatherZone creates new weather for different zone", () => {
    const w = createWeather(0);
    const changed = changeWeatherZone(w, 3);
    expect(changed.type).toBe("snow");
    expect(changed.zone).toBe(3);
  });

  test("changeWeatherZone returns same state for same zone", () => {
    const w = createWeather(0);
    const same = changeWeatherZone(w, 0);
    expect(same).toBe(w);
  });

  test("getWeatherType returns correct type", () => {
    expect(getWeatherType(0)).toBe("steam");
    expect(getWeatherType(4)).toBe("embers");
    expect(getWeatherType(6)).toBe("sparkles");
  });

  test("getWeatherType clamps to last zone for out of range", () => {
    expect(getWeatherType(99)).toBe("sparkles");
  });
});
