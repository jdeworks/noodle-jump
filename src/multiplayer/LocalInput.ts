/**
 * Split keyboard input for local co-op.
 * Player 1: WASD, Player 2: Arrow keys.
 * Each outputs normalized -1 (left) to +1 (right).
 */

export class LocalInput {
  private keysDown = new Set<string>();
  private _p1InputX = 0;
  private _p2InputX = 0;
  private _p1Fire = false;
  private _p2Fire = false;
  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;

  constructor() {
    this.onKeyDownBound = (e) => this.keysDown.add(e.key);
    this.onKeyUpBound = (e) => this.keysDown.delete(e.key);
  }

  get p1InputX(): number { return this._p1InputX; }
  get p2InputX(): number { return this._p2InputX; }
  /** True for one frame when P1 presses fire (E or Q). */
  get p1Fire(): boolean { return this._p1Fire; }
  /** True for one frame when P2 presses fire (RShift or Numpad0). */
  get p2Fire(): boolean { return this._p2Fire; }

  init(): void {
    window.addEventListener("keydown", this.onKeyDownBound);
    window.addEventListener("keyup", this.onKeyUpBound);
  }

  update(): void {
    // Player 1: A/D move, E/Q fire
    let x1 = 0;
    if (this.keysDown.has("a") || this.keysDown.has("A")) x1 -= 1;
    if (this.keysDown.has("d") || this.keysDown.has("D")) x1 += 1;
    this._p1InputX = x1;
    this._p1Fire = this.keysDown.has("e") || this.keysDown.has("E")
      || this.keysDown.has("q") || this.keysDown.has("Q");

    // Player 2: Arrow keys move, RShift/Numpad0 fire
    let x2 = 0;
    if (this.keysDown.has("ArrowLeft")) x2 -= 1;
    if (this.keysDown.has("ArrowRight")) x2 += 1;
    this._p2InputX = x2;
    this._p2Fire = this.keysDown.has("Shift") || this.keysDown.has("0")
      || this.keysDown.has(" ");

    // Consume fire keys so they only trigger once per press
    if (this._p1Fire) { this.keysDown.delete("e"); this.keysDown.delete("E");
      this.keysDown.delete("q"); this.keysDown.delete("Q"); }
    if (this._p2Fire) { this.keysDown.delete("Shift"); this.keysDown.delete("0");
      this.keysDown.delete(" "); }
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDownBound);
    window.removeEventListener("keyup", this.onKeyUpBound);
    this.keysDown.clear();
  }
}
