/** Animated countdown display for local co-op — "3, 2, 1, GO!" with effects. */

import { Graphics, Text } from "pixi.js";

const GO_ANIM_DURATION = 60; // ~1 second at 60fps

export class CountdownAnim {
  private goTicks = 0;

  /** Update countdown text/dim each frame. Returns true while active. */
  update(
    cd: number | undefined,
    text: Text,
    dim: Graphics,
  ): void {
    if (this.goTicks === -1) return; // finished

    if (this.goTicks > 0) {
      const t = this.goTicks / GO_ANIM_DURATION;
      const scale = t < 0.3 ? 1 + (t / 0.3) * 1.2 : 2.2 - t * 0.7;
      text.scale.set(scale);
      const hue = (t * 360) % 360;
      const r = Math.round(255 * (0.5 + 0.5 * Math.cos(hue * Math.PI / 180)));
      const g = Math.round(255 * (0.5 + 0.5 * Math.cos((hue - 120) * Math.PI / 180)));
      const b = Math.round(200 * (0.5 + 0.5 * Math.cos((hue - 240) * Math.PI / 180)));
      text.style.fill = `rgb(${r},${g},${b})`;
      text.rotation = (Math.random() - 0.5) * 0.08 * (1 - t);
      text.alpha = t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1;
      dim.alpha = Math.max(0, 1 - t * 2.5);
      this.goTicks++;
      if (this.goTicks >= GO_ANIM_DURATION) {
        this.goTicks = -1;
        text.visible = false;
        dim.visible = false;
      }
    } else if (cd !== undefined && cd >= 0) {
      text.text = cd > 0 ? `${cd}` : "GO!";
      text.visible = true;
      dim.visible = true;
      if (cd === 0) {
        this.goTicks = 1;
      } else {
        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.06;
        text.scale.set(pulse);
      }
    } else {
      text.visible = false;
      dim.visible = false;
    }
  }
}
