/**
 * Unified input manager — tilt (primary), touch (fallback), keyboard (desktop).
 * Outputs a normalized horizontal value from -1 (left) to +1 (right).
 */

import { isTiltInverted, isTouchControlsForced, getControlMode } from "./TiltSettings";

export type InputMethod = "tilt" | "touch" | "keyboard";

const TILT_SENSITIVITY = 5; // m/s² from rest for full input (~30° tilt)
const TILT_DEADZONE = 0.5; // m/s² — ignore tiny wobbles
const TILT_SMOOTHING = 0.25; // low-pass filter (0 = no smoothing, 1 = frozen)
const CALIBRATION_SAMPLES = 20;

export class InputManager {
  private _inputX = 0;
  private _rawTilt = 0; // unsmoothed tilt value for debug display
  private _activeMethod: InputMethod = "keyboard";
  private tiltAvailable = false;
  private tiltPermissionDenied = false;

  // Touch state
  private touchActive = false;
  private canvasWidth = 0;

  // Mouse state (emulates touch when touch controls forced on PC)
  private mouseActive = false;
  private _mouseEnabled = true; // disabled for split-screen co-op
  private canvas: HTMLCanvasElement | null = null;

  // Keyboard state
  private keysDown = new Set<string>();

  // Tilt calibration
  private tiltOffset = 0;
  private calibrationReadings: number[] = [];
  private calibrated = false;
  private lastTiltAngle: number | null = null;
  private _rawGamma = 0;
  private _rawBeta = 0;
  private _rawAlpha = 0;
  private _accelX = 0; // accelerometer left/right

  get inputX(): number {
    return this._inputX;
  }

  /** Raw tilt angle relative to calibration (for debug display). */
  get rawTilt(): number {
    return this._rawTilt;
  }

  /** The calibration offset that was computed. */
  get tiltCalibrationOffset(): number {
    return this.tiltOffset;
  }

  /** Raw sensor values for debugging. */
  get rawGamma(): number {
    return this._rawGamma;
  }
  get rawBeta(): number {
    return this._rawBeta;
  }
  get rawAlpha(): number {
    return this._rawAlpha;
  }
  get accelX(): number {
    return this._accelX;
  }

  get activeMethod(): InputMethod {
    return this._activeMethod;
  }

  get needsTiltPermission(): boolean {
    // Only iOS/Safari requires explicit permission via requestPermission()
    const DME = DeviceMotionEvent as unknown as { requestPermission?: unknown };
    return (
      !this.tiltAvailable &&
      !this.tiltPermissionDenied &&
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DME.requestPermission === "function"
    );
  }

  /** Disable mouse-as-touch input (for split-screen co-op). */
  set mouseEnabled(v: boolean) {
    this._mouseEnabled = v;
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupKeyboard();
    this.setupTouch(canvas);
    this.setupMouse(canvas);
    this.tryTilt();
  }

  recalibrate(): void {
    this.calibrated = false;
    this.calibrationReadings = [];
  }

  async requestTiltPermission(): Promise<boolean> {
    const DME = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };

    if (typeof DME.requestPermission === "function") {
      try {
        const result = await DME.requestPermission();
        if (result === "granted") {
          this.setupTilt();
          return true;
        }
        this.tiltPermissionDenied = true;
        return false;
      } catch {
        this.tiltPermissionDenied = true;
        return false;
      }
    }

    this.setupTilt();
    return true;
  }

  update(): void {
    // Touch controls forced: accept touch or mouse input, ignore tilt and keyboard
    if (isTouchControlsForced()) {
      if (this.touchActive || this.mouseActive) this._activeMethod = "touch";
      return;
    }

    if (this.tiltAvailable) return;

    if (this.touchActive) {
      this._activeMethod = "touch";
      return;
    }

    this._activeMethod = "keyboard";
    const mode = getControlMode();
    let x = 0;
    if (mode === "wasd") {
      if (this.keysDown.has("a")) x -= 1;
      if (this.keysDown.has("d")) x += 1;
    } else {
      // "arrows" mode (or any non-touch PC mode fallback)
      if (this.keysDown.has("ArrowLeft")) x -= 1;
      if (this.keysDown.has("ArrowRight")) x += 1;
    }
    this._inputX = x;
  }

  destroy(): void {
    window.removeEventListener("deviceorientation", this.onTilt);
    window.removeEventListener("devicemotion", this.onMotion);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }

  // ── Tilt ───────────────────────────────────────────────────────────────────

  private tryTilt(): void {
    if (typeof DeviceMotionEvent === "undefined") return;

    const DME = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };

    if (typeof DME.requestPermission !== "function") {
      this.setupTilt();
    }
  }

  private setupTilt(): void {
    window.addEventListener("deviceorientation", this.onTilt);
    window.addEventListener("devicemotion", this.onMotion);
    // Don't mark tilt as available until we actually receive motion data.
    // Desktop browsers define DeviceMotionEvent but never fire it,
    // so tiltAvailable stays false and keyboard input works.
  }

  private onMotion = (e: DeviceMotionEvent): void => {
    if (isTouchControlsForced()) return; // touch controls override tilt completely
    const accel = e.accelerationIncludingGravity;
    if (accel?.x == null) return;

    // First real motion data — now we know tilt hardware is present
    if (!this.tiltAvailable) {
      this.tiltAvailable = true;
    }

    this._accelX = accel.x;

    // ── Use accelerometer for input ────────────────────────────────────
    // iOS and Android report opposite signs for accel.x. iOS: tilt right → negative x.
    // Android: tilt right → positive x. Auto-detect via requestPermission (iOS-only API).
    // Users can override via "Invert Tilt" setting.
    const isIOS =
      typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission ===
      "function";
    const defaultSign = isIOS ? 1 : -1;
    const invertSign = isTiltInverted() ? -defaultSign : defaultSign;
    const tiltValue = invertSign * accel.x;

    if (!this.calibrated) {
      this.calibrationReadings.push(tiltValue);
      if (this.calibrationReadings.length >= CALIBRATION_SAMPLES) {
        this.tiltOffset =
          this.calibrationReadings.reduce((a, b) => a + b, 0) / this.calibrationReadings.length;
        this.calibrated = true;
      }
      this._inputX = 0;
      this._activeMethod = "tilt";
      return;
    }

    const adjusted = tiltValue - this.tiltOffset;
    this._rawTilt = adjusted;

    // Reject spikes
    if (this.lastTiltAngle !== null && Math.abs(tiltValue - this.lastTiltAngle) > 8) {
      this._activeMethod = "tilt";
      return;
    }
    this.lastTiltAngle = tiltValue;

    // Dead zone
    if (Math.abs(adjusted) < TILT_DEADZONE) {
      this._inputX = this._inputX * TILT_SMOOTHING;
      this._activeMethod = "tilt";
      return;
    }

    // Normalize: TILT_SENSITIVITY = full tilt in m/s² (gravity component)
    const sign = adjusted > 0 ? 1 : -1;
    const magnitude = Math.abs(adjusted) - TILT_DEADZONE;
    const linear = Math.min(1, magnitude / (TILT_SENSITIVITY - TILT_DEADZONE));
    const eased = linear * linear; // quadratic ease
    const raw = sign * eased;

    this._inputX = this._inputX * TILT_SMOOTHING + raw * (1 - TILT_SMOOTHING);
    this._activeMethod = "tilt";
  };

  /** Orientation listener — debug display only, input comes from accelerometer. */
  private onTilt = (e: DeviceOrientationEvent): void => {
    this._rawGamma = e.gamma ?? 0;
    this._rawBeta = e.beta ?? 0;
    this._rawAlpha = e.alpha ?? 0;
  };

  // ── Touch ──────────────────────────────────────────────────────────────────

  private setupTouch(canvas: HTMLCanvasElement): void {
    this.canvasWidth = canvas.getBoundingClientRect().width;
    canvas.addEventListener("touchstart", this.onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", this.onTouchMove, { passive: true });
    canvas.addEventListener("touchend", this.onTouchEnd, { passive: true });
  }

  private touchXFromEvent(touch: Touch): number {
    const rect = this.canvasWidth || window.innerWidth;
    const center = rect / 2;
    // Binary left/right: left half = -1, right half = +1
    return touch.clientX < center ? -1 : 1;
  }

  private get useTouchInput(): boolean {
    return !this.tiltAvailable || isTouchControlsForced();
  }

  private onTouchStart = (e: TouchEvent): void => {
    if (!this.useTouchInput) return;
    this.touchActive = true;
    this._inputX = this.touchXFromEvent(e.touches[0]);
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (!this.touchActive || !this.useTouchInput) return;
    this._inputX = this.touchXFromEvent(e.touches[0]);
  };

  private onTouchEnd = (): void => {
    if (!this.useTouchInput) return;
    this.touchActive = false;
    this._inputX = 0;
  };

  // ── Mouse (emulates touch on PC when touch controls forced) ────────────────

  private setupMouse(canvas: HTMLCanvasElement): void {
    canvas.addEventListener("mousedown", this.onMouseDown);
    canvas.addEventListener("mousemove", this.onMouseMove);
    canvas.addEventListener("mouseup", this.onMouseUp);
  }

  private mouseXFromEvent(e: MouseEvent): number {
    if (!this.canvas) return 1;
    const rect = this.canvas.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    return localX < rect.width / 2 ? -1 : 1;
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (!this._mouseEnabled || !isTouchControlsForced()) return;
    this.mouseActive = true;
    this._inputX = this.mouseXFromEvent(e);
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.mouseActive || !this._mouseEnabled || !isTouchControlsForced()) return;
    this._inputX = this.mouseXFromEvent(e);
  };

  private onMouseUp = (): void => {
    if (!this._mouseEnabled || !isTouchControlsForced()) return;
    this.mouseActive = false;
    this._inputX = 0;
  };

  // ── Keyboard ───────────────────────────────────────────────────────────────

  private setupKeyboard(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keysDown.add(e.key);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.key);
  };

  private onBlur = (): void => {
    this.keysDown.clear();
    this._inputX = 0;
  };
}
