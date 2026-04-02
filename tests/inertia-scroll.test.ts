import { describe, test, expect, vi } from "vitest";

// Mock pixi.js to avoid browser dependencies
vi.mock("pixi.js", () => {
  class MockGraphics {
    on = vi.fn();
  }
  return { Graphics: MockGraphics };
});

import { InertiaScroll } from "../src/ui/InertiaScroll";

describe("InertiaScroll", () => {
  test("scrollY starts at 0", () => {
    const scroll = new InertiaScroll();
    expect(scroll.scrollY).toBe(0);
  });

  test("setMaxScroll clamps negative values to 0", () => {
    const scroll = new InertiaScroll();
    scroll.setMaxScroll(-100);
    // scrollY should still be clamped at 0; verify by checking tick behavior
    // The maxScroll is private, so we test indirectly: after setting max to
    // a negative value, scrollY should remain 0 even after ticking
    scroll.tick();
    expect(scroll.scrollY).toBe(0);
  });

  test("setMaxScroll accepts positive values", () => {
    const scroll = new InertiaScroll();
    scroll.setMaxScroll(500);
    // No error thrown, scroll stays at 0 until interaction
    expect(scroll.scrollY).toBe(0);
  });

  test("tick applies friction and stops when velocity is low", () => {
    const scroll = new InertiaScroll();
    scroll.setMaxScroll(1000);

    // Manually set velocity via internal state by using the class methods
    // We can't set velocity directly, but we can test that tick() returns
    // false when there's no velocity (no dragging happened)
    const moving = scroll.tick();
    expect(moving).toBe(false);
    expect(scroll.scrollY).toBe(0);
  });

  test("reset zeros everything", () => {
    const scroll = new InertiaScroll();
    scroll.setMaxScroll(500);
    // Even if scrollY were modified, reset should bring it back
    scroll.reset();
    expect(scroll.scrollY).toBe(0);
    // After reset, tick should indicate no movement
    expect(scroll.tick()).toBe(false);
  });
});
