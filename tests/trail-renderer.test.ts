import { describe, it, expect, vi } from "vitest";

// Mock pixi.js to avoid navigator dependency in CI
vi.mock("pixi.js", () => {
  class MockGraphics {
    x = 0;
    y = 0;
    visible = true;
    children: unknown[] = [];
    circle = vi.fn().mockReturnThis();
    fill = vi.fn().mockReturnThis();
    clear = vi.fn().mockReturnThis();
    destroy = vi.fn();
  }
  class MockContainer {
    children: unknown[] = [];
    addChild(child: unknown) { this.children.push(child); }
    removeChild(child: unknown) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
    }
    destroy = vi.fn();
  }
  return { Container: MockContainer, Graphics: MockGraphics };
});

import { TrailRenderer } from "../src/rendering/TrailRenderer";

describe("TrailRenderer", () => {
  it("initializes with no points", () => {
    const trail = new TrailRenderer();
    expect(trail.container.children.length).toBe(0);
  });

  it("does not add points when trail type is null", () => {
    const trail = new TrailRenderer();
    trail.setTrailType(null);
    trail.addPoint(100, 200);
    trail.update(0);
    expect(trail.container.children.length).toBe(0);
  });

  it("does not add points when trail type is trail_none", () => {
    const trail = new TrailRenderer();
    trail.setTrailType("trail_none");
    trail.addPoint(100, 200);
    trail.update(0);
    expect(trail.container.children.length).toBe(0);
  });

  it("renders trail points when active", () => {
    const trail = new TrailRenderer();
    trail.setTrailType("trail_sparkle");
    trail.addPoint(100, 200);
    trail.addPoint(110, 210);
    trail.update(0);
    expect(trail.container.children.length).toBeGreaterThan(0);
  });

  it("clears all points", () => {
    const trail = new TrailRenderer();
    trail.setTrailType("trail_fire");
    trail.addPoint(100, 200);
    trail.update(0);
    const countBefore = trail.container.children.length;
    expect(countBefore).toBeGreaterThan(0);
    trail.clear();
    // Pooled graphics are hidden, not removed — verify no visible points
    const visible = (trail.container.children as Array<{ visible: boolean }>)
      .filter((c) => c.visible);
    expect(visible.length).toBe(0);
  });

  it("supports speed trail types", () => {
    const trail = new TrailRenderer();
    trail.setTrailType("speed_rocket");
    trail.addPoint(50, 100);
    trail.update(0);
    expect(trail.container.children.length).toBeGreaterThan(0);
  });
});
