/** Floating text manager — spawn and animate floating text overlays. */

import { Container, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { worldToScreen } from "../systems/Camera";

interface FloatingTextEntry {
  text: Text;
  life: number;
  maxLife: number;
}

export class FloatingTextManager {
  private entries: FloatingTextEntry[] = [];

  spawn(
    parent: Container,
    msg: string,
    color: number,
    playerX: number,
    playerY: number,
    playerW: number,
    camY: number,
    size = 14,
    duration = 40,
    centered = false,
  ): void {
    const text = new Text({
      text: msg,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: size,
        fill: "#" + color.toString(16).padStart(6, "0"),
        fontWeight: "bold",
        stroke: { color: "#000000", width: Math.max(2, size / 6) },
      }),
    });
    if (centered) {
      text.x = GAME_WIDTH / 2;
      text.y = GAME_HEIGHT * 0.35;
    } else {
      text.x = playerX + playerW / 2;
      text.y = worldToScreen(playerY - 20, camY);
    }
    text.anchor.set(0.5, 0.5);
    parent.addChild(text);
    this.entries.push({ text, life: duration, maxLife: duration });
  }

  update(): void {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const ft = this.entries[i];
      ft.text.y -= 1;
      ft.life--;
      // Full opacity for first half, then fade out during second half
      const progress = 1 - ft.life / ft.maxLife; // 0 → 1
      ft.text.alpha = progress < 0.5 ? 1 : Math.max(0, 1 - (progress - 0.5) * 2);
      if (ft.life <= 0) {
        ft.text.parent?.removeChild(ft.text);
        ft.text.destroy();
        // Swap-and-pop for O(1) removal
        this.entries[i] = this.entries[this.entries.length - 1];
        this.entries.pop();
      }
    }
  }

  destroy(): void {
    for (const ft of this.entries) {
      ft.text.parent?.removeChild(ft.text);
      ft.text.destroy();
    }
    this.entries = [];
  }
}
