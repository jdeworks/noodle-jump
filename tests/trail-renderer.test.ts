import { describe, it, expect } from "vitest";
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
    trail.clear();
    expect(trail.container.children.length).toBe(0);
  });

  it("supports speed trail types", () => {
    const trail = new TrailRenderer();
    trail.setTrailType("speed_rocket");
    trail.addPoint(50, 100);
    trail.update(0);
    expect(trail.container.children.length).toBeGreaterThan(0);
  });
});
