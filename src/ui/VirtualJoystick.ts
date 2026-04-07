/** Virtual joystick — touch-based tilt alternative. PixiJS. */

import { Container, Graphics } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

const JOYSTICK_SIZE = 60;
const THUMB_SIZE = 24;
const MAX_OFFSET = 25;

export class VirtualJoystick {
  readonly container = new Container();
  private base = new Graphics();
  private thumb = new Graphics();
  private active = false;
  private originX = 0;
  private originY = 0;
  private _inputX = 0;

  /** Current horizontal input value (-1 to 1). */
  get inputX(): number {
    return this._inputX;
  }

  constructor() {
    // Base circle
    this.base.circle(0, 0, JOYSTICK_SIZE / 2);
    this.base.fill({ color: 0xffffff, alpha: 0.15 });
    this.base.stroke({ width: 2, color: 0xffffff, alpha: 0.2 });
    this.container.addChild(this.base);

    // Thumb
    this.thumb.circle(0, 0, THUMB_SIZE / 2);
    this.thumb.fill({ color: 0xffffff, alpha: 0.35 });
    this.container.addChild(this.thumb);

    // Position in bottom-left
    this.container.x = 50;
    this.container.y = GAME_HEIGHT - 70;
    this.container.visible = false;
  }

  /** Show and enable the joystick. */
  enable(): void {
    this.container.visible = true;
  }

  /** Hide and disable. */
  disable(): void {
    this.container.visible = false;
    this._inputX = 0;
  }

  /** Initialize touch listeners on the canvas. */
  init(canvas: HTMLCanvasElement): void {
    canvas.addEventListener("touchstart", (e) => this.onTouchStart(e, canvas), {
      passive: true,
    });
    canvas.addEventListener("touchmove", (e) => this.onTouchMove(e, canvas), {
      passive: true,
    });
    canvas.addEventListener("touchend", () => this.onTouchEnd());
    canvas.addEventListener("touchcancel", () => this.onTouchEnd());
  }

  private onTouchStart(e: TouchEvent, canvas: HTMLCanvasElement): void {
    if (!this.container.visible) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const x = (touch.clientX - rect.left) * scaleX;
    // Only activate if touch is in left third of screen (joystick area)
    if (x < GAME_WIDTH / 3) {
      this.active = true;
      this.originX = x;
    }
  }

  private onTouchMove(e: TouchEvent, canvas: HTMLCanvasElement): void {
    if (!this.active) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const x = (touch.clientX - rect.left) * scaleX;
    const dx = x - this.originX;
    const clamped = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dx));
    this._inputX = clamped / MAX_OFFSET;
    this.thumb.x = clamped;
  }

  private onTouchEnd(): void {
    this.active = false;
    this._inputX = 0;
    this.thumb.x = 0;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
