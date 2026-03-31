/** Inertia scroll helper — touch/mouse drag with flick momentum. */

import { Graphics } from "pixi.js";

export class InertiaScroll {
  scrollY = 0;
  private velocity = 0;
  private dragging = false;
  private maxScroll = 0;
  private lastY = 0;
  private lastTime = 0;
  private dragVelocity = 0;

  setMaxScroll(max: number): void {
    this.maxScroll = Math.max(0, max);
  }

  /** Attach drag/wheel listeners to a Graphics hit area. */
  attach(bg: Graphics): void {
    bg.on("wheel", (e: WheelEvent) => {
      this.velocity = 0;
      this.applyDelta(e.deltaY * 0.5);
    });

    bg.on("pointerdown", (e) => {
      this.dragging = true;
      this.velocity = 0;
      this.lastY = e.globalY;
      this.lastTime = Date.now();
      this.dragVelocity = 0;
    });

    bg.on("pointermove", (e) => {
      if (!this.dragging || e.pressure <= 0) return;
      const dy = this.lastY - e.globalY;
      const now = Date.now();
      const dt = Math.max(1, now - this.lastTime);
      this.dragVelocity = this.dragVelocity * 0.3 + (dy / dt) * 16 * 0.7;
      this.applyDelta(dy);
      this.lastY = e.globalY;
      this.lastTime = now;
    });

    const endDrag = () => {
      if (!this.dragging) return;
      this.dragging = false;
      if (Math.abs(this.dragVelocity) > 1) {
        this.velocity = this.dragVelocity;
      }
    };
    bg.on("pointerup", endDrag);
    bg.on("pointerupoutside", endDrag);
  }

  /** Call each frame to apply inertia. Returns true if still moving. */
  tick(): boolean {
    if (this.dragging) return false;
    if (Math.abs(this.velocity) > 0.5) {
      this.applyDelta(this.velocity);
      this.velocity *= 0.92;
      return true;
    }
    this.velocity = 0;
    return false;
  }

  private applyDelta(dy: number): void {
    this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + dy));
  }

  reset(): void {
    this.scrollY = 0;
    this.velocity = 0;
    this.dragging = false;
  }
}
