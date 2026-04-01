/** Custom run configuration screen — PixiJS modal with scrolling, persistence, and debug presets. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, DEBUG_MODE } from "../config/constants";
import {
  createDefaultRunConfig,
  ALL_POWER_UP_TYPES,
  type RunConfig,
} from "../systems/CustomRunConfig";
import { seedToCode } from "../systems/DailyChallenge";
import {
  type DebugConfig,
  createDebugConfig,
  setDebugConfig,
} from "../config/debug";
import {
  STORAGE_RUN_CONFIG,
  STORAGE_DEBUG_CONFIG,
  saveRunConfigToStorage,
  loadRunConfigFromStorage,
  saveDebugConfigToStorage,
  loadDebugConfigFromStorage,
  TAP_THRESHOLD,
  type TapRegion,
  addSectionHeader,
  addRow,
  addToggleRow,
  addPresetRow,
  buildPresets,
  addPowerUpGrid,
  createBottomBar,
} from "./CustomRunStorage";

// ── Screen class ────────────────────────────────────────────────────────

export class CustomRunScreen {
  readonly container = new Container();
  private active = false;
  private config: RunConfig = createDefaultRunConfig();
  private debugCfg: DebugConfig = createDebugConfig();
  private onStart: ((config: RunConfig) => void) | null = null;
  onClose: (() => void) | null = null;

  // Scroll state (manual — no InertiaScroll dependency)
  private scrollContent = new Container();
  private scrollY = 0;
  private scrollVelocity = 0;
  private maxScroll = 0;
  private dragging = false;
  private dragStartY = 0;
  private dragLastY = 0;
  private dragLastTime = 0;
  private dragVelocity = 0;
  private totalDragDist = 0;

  // Tap regions (in scroll-content coordinates)
  private tapRegions: TapRegion[] = [];

  private tickerActive = false;

  // Fixed regions
  private static readonly TOP_Y = 44;
  private static readonly BOTTOM_H = 72;
  private static readonly SCROLL_TOP = CustomRunScreen.TOP_Y;
  private static readonly SCROLL_BOTTOM = GAME_HEIGHT - CustomRunScreen.BOTTOM_H;

  constructor() {
    this.container.visible = false;
  }

  show(callback: (config: RunConfig) => void): void {
    this.active = true;
    this.config = loadRunConfigFromStorage();
    this.debugCfg = loadDebugConfigFromStorage();
    this.onStart = callback;
    this.container.visible = true;
    this.scrollY = 0;
    this.scrollVelocity = 0;
    this.render();
  }

  hide(): void {
    this.active = false;
    this.container.visible = false;
    this.onStart = null;
    this.tickerActive = false;
    this.clearChildren();
    this.onClose?.();
  }

  isActive(): boolean {
    return this.active;
  }

  private clearChildren(): void {
    while (this.container.children.length > 0) {
      const child = this.container.children[0];
      this.container.removeChild(child);
      child.destroy();
    }
  }

  private persist(): void {
    saveRunConfigToStorage(this.config);
    if (DEBUG_MODE) saveDebugConfigToStorage(this.debugCfg);
  }

  // ── Hit testing ─────────────────────────────────────────────────────────

  /** Find which tap region (if any) was hit at screen position (sx, sy). */
  private hitTest(sx: number, sy: number): TapRegion | null {
    // Convert screen Y to content Y (account for scroll offset)
    const cy = sy + this.scrollY;
    for (const r of this.tapRegions) {
      if (sx >= r.x && sx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
        return r;
      }
    }
    return null;
  }

  // ── Render ──────────────────────────────────────────────────────────────

  private render(): void {
    this.persist();
    this.tapRegions = [];

    // Build everything in a temp container, then swap atomically (no flicker)
    const oldChildren = [...this.container.children];

    // ── Background ──────────────────────────────────────────────
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x000000, alpha: 0.9 });
    bg.eventMode = "static";
    bg.on("pointertap", (e: Event) => e.stopPropagation());
    this.container.addChild(bg);

    // ── Fixed title ─────────────────────────────────────────────
    const title = new Text({
      text: "CUSTOM RUN",
      style: new TextStyle({
        fontFamily: "monospace", fontSize: 20,
        fill: "#ffdd44", fontWeight: "bold",
      }),
    });
    title.x = GAME_WIDTH / 2;
    title.y = 14;
    title.anchor.set(0.5, 0);
    this.container.addChild(title);

    // ── Scrollable content area ─────────────────────────────────
    this.scrollContent = new Container();
    this.container.addChild(this.scrollContent);

    const scrollMask = new Graphics();
    scrollMask.rect(0, CustomRunScreen.SCROLL_TOP, GAME_WIDTH,
      CustomRunScreen.SCROLL_BOTTOM - CustomRunScreen.SCROLL_TOP);
    scrollMask.fill(0xffffff);
    this.container.addChild(scrollMask);
    this.scrollContent.mask = scrollMask;

    // ── Build content rows ──────────────────────────────────────
    let y = CustomRunScreen.SCROLL_TOP + 4;

    y = addSectionHeader(this.scrollContent, GAME_WIDTH,"GAME SETTINGS", "#ccbbaa", y);

    y = addRow(this.scrollContent, this.tapRegions, GAME_WIDTH,`Seed: ${this.config.seed === 0 ? "RANDOM" : seedToCode(this.config.seed)}`, "[Change]", y, () => {
      const seeds = [0, 12345, 42, 99999, 314159];
      const idx = seeds.indexOf(this.config.seed);
      this.config.seed = seeds[(idx + 1) % seeds.length];
      this.render();
    });

    y = addToggleRow(this.scrollContent, this.tapRegions, GAME_WIDTH,"Enemies", this.config.enemiesEnabled, y, () => {
      this.config.enemiesEnabled = !this.config.enemiesEnabled;
      this.render();
    });

    y = addRow(this.scrollContent, this.tapRegions, GAME_WIDTH,`Difficulty: ${this.config.difficultyMultiplier.toFixed(1)}x`, "[Cycle]", y, () => {
      const levels = [0.5, 0.75, 1.0, 1.5, 2.0];
      const idx = levels.indexOf(this.config.difficultyMultiplier);
      this.config.difficultyMultiplier = levels[(idx + 1) % levels.length];
      this.render();
    });

    const zoneNames = ["Kitchen", "Boiling Pot", "Space", "Freezer", "Volcano", "Candy", "Final Kitchen"];
    y = addRow(this.scrollContent, this.tapRegions, GAME_WIDTH,`Start Zone: ${zoneNames[this.config.startingZone]}`, "[Next]", y, () => {
      this.config.startingZone = (this.config.startingZone + 1) % 7;
      this.render();
    });

    y = addToggleRow(this.scrollContent, this.tapRegions, GAME_WIDTH,"Practice (no death)", this.config.practiceMode, y, () => {
      this.config.practiceMode = !this.config.practiceMode;
      this.render();
    });

    y += 6;

    // ─── Power-ups ──────────────────────────────────────────────
    y = addSectionHeader(this.scrollContent, GAME_WIDTH,"POWER-UPS (tap to toggle)", "#ccbbaa", y);
    y = addPowerUpGrid(
      this.scrollContent, this.tapRegions, GAME_WIDTH,
      this.config.enabledPowerUps, ALL_POWER_UP_TYPES,
      y, () => this.render(),
    );

    // ─── Debug section ──────────────────────────────────────────
    if (DEBUG_MODE) {
      y += 4;
      y = addSectionHeader(this.scrollContent, GAME_WIDTH,"DEBUG OPTIONS", "#ff8844", y);
      y = addPresetRow(
        this.scrollContent, this.tapRegions, GAME_WIDTH,
        buildPresets(
          (cfg) => { this.config = cfg; },
          (dbg) => { this.debugCfg = dbg; },
        ), y, () => this.render(),
      );

      y = addToggleRow(this.scrollContent, this.tapRegions, GAME_WIDTH,"Infinite Knives", this.debugCfg.infiniteKnives, y, () => {
        this.debugCfg.infiniteKnives = !this.debugCfg.infiniteKnives;
        this.render();
      });

      y = addToggleRow(this.scrollContent, this.tapRegions, GAME_WIDTH,"Show Hitboxes", this.debugCfg.showHitboxes, y, () => {
        this.debugCfg.showHitboxes = !this.debugCfg.showHitboxes;
        this.render();
      });

      y = addToggleRow(this.scrollContent, this.tapRegions, GAME_WIDTH,"Show FPS", this.debugCfg.showFPS, y, () => {
        this.debugCfg.showFPS = !this.debugCfg.showFPS;
        this.render();
      });

      y = addRow(this.scrollContent, this.tapRegions, GAME_WIDTH,`Game Speed: ${this.debugCfg.gameSpeed.toFixed(1)}x`, "[Cycle]", y, () => {
        const speeds = [0.25, 0.5, 1.0, 1.5, 2.0, 3.0];
        const idx = speeds.findIndex(s => Math.abs(s - this.debugCfg.gameSpeed) < 0.01);
        this.debugCfg.gameSpeed = speeds[(idx + 1) % speeds.length];
        this.render();
      });

      y = addRow(this.scrollContent, this.tapRegions, GAME_WIDTH,
        `Quick Zones: ${this.debugCfg.quickZoneTransitions === 0 ? "OFF" : `every ${this.debugCfg.quickZoneTransitions} plat`}`,
        "[Cycle]", y, () => {
          const opts = [0, 10, 15, 25, 50];
          const idx = opts.indexOf(this.debugCfg.quickZoneTransitions);
          this.debugCfg.quickZoneTransitions = opts[(idx + 1) % opts.length];
          this.render();
        },
      );

      const allTypes = ["(none)", ...ALL_POWER_UP_TYPES];
      const currentForce = this.debugCfg.forcePowerUpType ?? "(none)";
      const forceName = currentForce.replace(/_/g, " ");
      y = addRow(this.scrollContent, this.tapRegions, GAME_WIDTH,`Force PowerUp: ${forceName}`, "[Next]", y, () => {
        const idx = allTypes.indexOf(currentForce);
        const next = allTypes[(idx + 1) % allTypes.length];
        this.debugCfg.forcePowerUpType = next === "(none)" ? null : next;
        this.render();
      });
    }

    y += 10;

    // Set scroll limits
    const contentHeight = y - CustomRunScreen.SCROLL_TOP;
    const viewHeight = CustomRunScreen.SCROLL_BOTTOM - CustomRunScreen.SCROLL_TOP;
    this.maxScroll = Math.max(0, contentHeight - viewHeight);
    if (this.scrollY > this.maxScroll) this.scrollY = this.maxScroll;
    this.scrollContent.y = -this.scrollY;

    // ── Scroll + tap overlay ────────────────────────────────────
    // Single overlay handles both scroll drag and tap detection
    const overlay = new Graphics();
    overlay.rect(0, CustomRunScreen.SCROLL_TOP, GAME_WIDTH,
      CustomRunScreen.SCROLL_BOTTOM - CustomRunScreen.SCROLL_TOP);
    overlay.fill({ color: 0x000000, alpha: 0.001 });
    overlay.eventMode = "static";
    overlay.cursor = "default";
    this.container.addChild(overlay);

    overlay.on("pointerdown", (e) => {
      this.dragging = true;
      this.scrollVelocity = 0;
      this.dragStartY = e.globalY;
      this.dragLastY = e.globalY;
      this.dragLastTime = Date.now();
      this.dragVelocity = 0;
      this.totalDragDist = 0;
    });

    overlay.on("pointermove", (e) => {
      if (!this.dragging) return;
      const dy = this.dragLastY - e.globalY;
      this.totalDragDist += Math.abs(dy);
      const now = Date.now();
      const dt = Math.max(1, now - this.dragLastTime);
      this.dragVelocity = this.dragVelocity * 0.3 + (dy / dt) * 16 * 0.7;
      this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + dy));
      this.scrollContent.y = -this.scrollY;
      this.dragLastY = e.globalY;
      this.dragLastTime = now;
    });

    const endDrag = (e: { globalX: number; globalY: number }) => {
      if (!this.dragging) return;
      this.dragging = false;

      if (this.totalDragDist < TAP_THRESHOLD) {
        // This was a tap, not a drag — find and trigger the tapped region
        const hit = this.hitTest(e.globalX, e.globalY);
        if (hit) hit.action();
      } else if (Math.abs(this.dragVelocity) > 1) {
        // Flick — apply momentum
        this.scrollVelocity = this.dragVelocity;
      }
    };
    overlay.on("pointerup", endDrag);
    overlay.on("pointerupoutside", endDrag);

    overlay.on("wheel", (e: WheelEvent) => {
      this.scrollVelocity = 0;
      this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + e.deltaY * 0.5));
      this.scrollContent.y = -this.scrollY;
    });

    // ── Fixed bottom bar ────────────────────────────────────────
    createBottomBar(this.container, GAME_WIDTH, GAME_HEIGHT, CustomRunScreen.BOTTOM_H, {
      onStart: () => {
        this.persist();
        if (DEBUG_MODE) {
          this.debugCfg.invincible = this.config.practiceMode;
          setDebugConfig(this.debugCfg);
        }
        if (this.onStart) this.onStart(this.config);
        this.hide();
      },
      onReset: () => {
        this.config = createDefaultRunConfig();
        this.debugCfg = createDebugConfig();
        localStorage.removeItem(STORAGE_RUN_CONFIG);
        localStorage.removeItem(STORAGE_DEBUG_CONFIG);
        this.scrollY = 0;
        this.scrollVelocity = 0;
        this.render();
      },
      onBack: () => this.hide(),
    });

    // Now destroy old children (swap complete — no flicker)
    for (const child of oldChildren) {
      this.container.removeChild(child);
      child.destroy();
    }

    // Start momentum ticker
    this.startTicker();
  }

  // ── Scroll momentum ticker ──────────────────────────────────────────────

  private startTicker(): void {
    if (this.tickerActive) return;
    this.tickerActive = true;
    const loop = () => {
      if (!this.tickerActive) return;
      if (!this.dragging && Math.abs(this.scrollVelocity) > 0.5) {
        this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + this.scrollVelocity));
        this.scrollContent.y = -this.scrollY;
        this.scrollVelocity *= 0.92;
      } else if (!this.dragging) {
        this.scrollVelocity = 0;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  destroy(): void {
    this.tickerActive = false;
    this.container.destroy({ children: true });
  }
}
