import { describe, it, expect } from "vitest";
import { FloatingTextManager } from "../src/scenes/FloatingText";
import { Container } from "pixi.js";

describe("FloatingTextManager", () => {
  it("spawns a floating text entry", () => {
    const mgr = new FloatingTextManager();
    const parent = new Container();
    mgr.spawn(parent, "Test", 0xffffff, 100, 200, 32, 0);
    expect(parent.children.length).toBe(1);
  });

  it("updates and removes expired text", () => {
    const mgr = new FloatingTextManager();
    const parent = new Container();
    mgr.spawn(parent, "Test", 0xffffff, 100, 200, 32, 0, 14, 2);
    mgr.update(); // life: 1
    expect(parent.children.length).toBe(1);
    mgr.update(); // life: 0 — removed
    expect(parent.children.length).toBe(0);
  });

  it("destroys all entries", () => {
    const mgr = new FloatingTextManager();
    const parent = new Container();
    mgr.spawn(parent, "A", 0xff0000, 0, 0, 32, 0);
    mgr.spawn(parent, "B", 0x00ff00, 0, 0, 32, 0);
    mgr.destroy();
    expect(parent.children.length).toBe(0);
  });
});
