/**
 * Split keyboard input for local co-op.
 * Player 1: WASD, Player 2: Arrow keys.
 * Each outputs normalized -1 (left) to +1 (right).
 */

export class LocalInput {
  private keysDown = new Set<string>();
  private _p1InputX = 0;
  private _p2InputX = 0;
  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;

  constructor() {
    this.onKeyDownBound = (e) => this.keysDown.add(e.key);
    this.onKeyUpBound = (e) => this.keysDown.delete(e.key);
  }

  get p1InputX(): number {
    return this._p1InputX;
  }

  get p2InputX(): number {
    return this._p2InputX;
  }

  init(): void {
    window.addEventListener("keydown", this.onKeyDownBound);
    window.addEventListener("keyup", this.onKeyUpBound);
  }

  update(): void {
    // Player 1: A/D
    let x1 = 0;
    if (this.keysDown.has("a") || this.keysDown.has("A")) x1 -= 1;
    if (this.keysDown.has("d") || this.keysDown.has("D")) x1 += 1;
    this._p1InputX = x1;

    // Player 2: Arrow keys
    let x2 = 0;
    if (this.keysDown.has("ArrowLeft")) x2 -= 1;
    if (this.keysDown.has("ArrowRight")) x2 += 1;
    this._p2InputX = x2;
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDownBound);
    window.removeEventListener("keyup", this.onKeyUpBound);
    this.keysDown.clear();
  }
}
