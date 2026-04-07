import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock pixi.js to avoid navigator dependency in CI
vi.mock("pixi.js", () => {
  class MockText {
    text = "";
    x = 0;
    y = 0;
    alpha = 1;
    anchor = { set: vi.fn() };
    style = {};
    parent: MockContainer | null = null;
    destroy = vi.fn();
    constructor(opts?: { text?: string; style?: unknown }) {
      if (opts?.text) this.text = opts.text;
      if (opts?.style) this.style = opts.style;
    }
  }
  class MockContainer {
    children: unknown[] = [];
    addChild(child: unknown) {
      this.children.push(child);
      (child as MockText).parent = this;
    }
    removeChild(child: unknown) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      (child as MockText).parent = null;
    }
  }
  class MockTextStyle {
    constructor(_opts?: unknown) {}
  }
  return { Container: MockContainer, Text: MockText, TextStyle: MockTextStyle };
});

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
