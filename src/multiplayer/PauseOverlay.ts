/** Shared pause overlay for multiplayer modes. */
import { Application, Graphics, Text, TextStyle } from "pixi.js";

export class PauseOverlay {
  paused = false;
  private dim: Graphics;
  private label: Text;
  private leaveBtn: Text;
  private hint: Text;
  private pauseBtn: Text;

  constructor(
    private app: Application,
    width: number,
    height: number,
    private onLeave: () => void,
  ) {
    this.dim = new Graphics();
    this.dim.rect(0, 0, width, height);
    this.dim.fill({ color: 0x000000, alpha: 0.55 });
    this.dim.visible = false;
    app.stage.addChild(this.dim);
    const cx = width / 2,
      cy = height * 0.38;
    this.label = new Text({
      text: "PAUSED",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 24,
        fill: "#ffffff",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 3 },
      }),
    });
    this.label.x = cx;
    this.label.y = cy;
    this.label.anchor.set(0.5, 0.5);
    this.label.visible = false;
    app.stage.addChild(this.label);
    this.leaveBtn = new Text({
      text: "[Leave Game]",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 16,
        fill: "#ff8888",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    this.leaveBtn.x = cx;
    this.leaveBtn.y = cy + 45;
    this.leaveBtn.anchor.set(0.5, 0.5);
    this.leaveBtn.eventMode = "static";
    this.leaveBtn.cursor = "pointer";
    this.leaveBtn.visible = false;
    this.leaveBtn.on("pointertap", () => setTimeout(onLeave, 0));
    app.stage.addChild(this.leaveBtn);
    this.hint = new Text({
      text: "ESC or tap ⏸ to resume",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 13,
        fill: "#aaaaaa",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    this.hint.x = cx;
    this.hint.y = cy + 80;
    this.hint.anchor.set(0.5, 0.5);
    this.hint.visible = false;
    app.stage.addChild(this.hint);

    // Pause button for touch/mobile (always visible, top-right)
    this.pauseBtn = new Text({
      text: "⏸",
      style: new TextStyle({ fontFamily: "monospace", fontSize: 22, fill: "#ffffff", stroke: { color: "#000000", width: 2 } }),
    });
    this.pauseBtn.x = width - 40;
    this.pauseBtn.y = 14;
    this.pauseBtn.anchor.set(0.5, 0.5);
    this.pauseBtn.eventMode = "static";
    this.pauseBtn.cursor = "pointer";
    this.pauseBtn.alpha = 0.6;
    app.stage.addChild(this.pauseBtn);
  }

  /** Set the external tap handler (called by OnlineSession after construction). */
  onPauseTap(handler: () => void): void {
    this.pauseBtn.on("pointertap", handler);
  }

  toggle(): void {
    this.paused = !this.paused;
    this.dim.visible = this.paused;
    this.label.visible = this.paused;
    this.leaveBtn.visible = this.paused;
    this.hint.visible = this.paused;
  }

  destroy(): void {
    for (const el of [this.dim, this.label, this.leaveBtn, this.hint, this.pauseBtn]) {
      if (el.parent) el.parent.removeChild(el);
      el.destroy();
    }
  }
}
