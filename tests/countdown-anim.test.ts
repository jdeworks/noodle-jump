import { describe, test, expect, vi } from "vitest";

// Mock pixi.js
vi.mock("pixi.js", () => {
  class MockText {
    text = "";
    visible = false;
    alpha = 1;
    rotation = 0;
    scale = { set: vi.fn() };
    style: Record<string, unknown> = {};
  }
  class MockGraphics {
    visible = false;
    alpha = 1;
  }
  return { Text: MockText, Graphics: MockGraphics };
});

import { CountdownAnim } from "../src/multiplayer/CountdownAnim";
import { Text, Graphics } from "pixi.js";

function makeText(): Text {
  return new Text() as unknown as Text;
}
function makeDim(): Graphics {
  return new Graphics() as unknown as Graphics;
}

const GO_ANIM_DURATION = 60;

describe("CountdownAnim", () => {
  test("when cd > 0, text shows the number and is visible", () => {
    const anim = new CountdownAnim();
    const text = makeText();
    const dim = makeDim();

    anim.update(3, text, dim);

    expect((text as any).text).toBe("3");
    expect((text as any).visible).toBe(true);
    expect((dim as any).visible).toBe(true);
  });

  test("when cd === 0, the GO animation starts with 'GO!' text", () => {
    const anim = new CountdownAnim();
    const text = makeText();
    const dim = makeDim();

    anim.update(0, text, dim);

    expect((text as any).text).toBe("GO!");
    expect((text as any).visible).toBe(true);
  });

  test("after GO_ANIM_DURATION frames, text becomes invisible", () => {
    const anim = new CountdownAnim();
    const text = makeText();
    const dim = makeDim();

    // Start the GO animation
    anim.update(0, text, dim);

    // Tick through the full animation duration
    // After update(0), goTicks is set to 1. Each subsequent update increments it.
    // We need GO_ANIM_DURATION - 1 more updates (goTicks goes from 1 to 60).
    for (let i = 0; i < GO_ANIM_DURATION - 1; i++) {
      anim.update(undefined, text, dim);
    }

    expect((text as any).visible).toBe(false);
    expect((dim as any).visible).toBe(false);
  });

  test("after animation finishes, further updates don't change visibility", () => {
    const anim = new CountdownAnim();
    const text = makeText();
    const dim = makeDim();

    // Run through the full animation
    anim.update(0, text, dim);
    for (let i = 0; i < GO_ANIM_DURATION - 1; i++) {
      anim.update(undefined, text, dim);
    }

    // Animation is finished (goTicks === -1)
    expect((text as any).visible).toBe(false);

    // Set visible to true manually, then call update again
    (text as any).visible = true;
    (dim as any).visible = true;
    anim.update(undefined, text, dim);

    // The early return (goTicks === -1) should leave them unchanged
    expect((text as any).visible).toBe(true);
    expect((dim as any).visible).toBe(true);
  });

  test("when cd is undefined, text and dim are hidden", () => {
    const anim = new CountdownAnim();
    const text = makeText();
    const dim = makeDim();

    (text as any).visible = true;
    (dim as any).visible = true;

    anim.update(undefined, text, dim);

    expect((text as any).visible).toBe(false);
    expect((dim as any).visible).toBe(false);
  });
});
