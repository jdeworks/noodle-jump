/** Custom run configuration screen — PixiJS modal with scrolling, persistence, and debug presets. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { getUITheme } from "./ThemeUI";
import { createDefaultRunConfig, type RunConfig } from "../systems/CustomRunConfig";
import { type DebugConfig, createDebugConfig, setDebugConfig } from "../config/debug";
import {
  STORAGE_RUN_CONFIG,
  STORAGE_DEBUG_CONFIG,
  saveRunConfigToStorage,
  loadRunConfigFromStorage,
  saveDebugConfigToStorage,
  loadDebugConfigFromStorage,
  TAP_THRESHOLD,
  type TapRegion,
} from "./CustomRunStorage";
import { createBottomBar } from "./CustomRunAdvanced";
import { buildContentRows } from "./CustomRunRows";

export class CustomRunScreen {
  readonly container = new Container();
  private active = false;
  private config: RunConfig = createDefaultRunConfig();
  private debugCfg: DebugConfig = createDebugConfig();
  private onStart: ((config: RunConfig) => void) | null = null;
  onClose: (() => void) | null = null;
  private scrollContent = new Container();
  private scrollY = 0;
  private scrollVelocity = 0;
  private maxScroll = 0;
  private dragging = false;
  private dragLastY = 0;
  private dragLastTime = 0;
  private dragVelocity = 0;
  private totalDragDist = 0;
  private tapRegions: TapRegion[] = [];
  private tickerActive = false;
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
    this.persist();
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
    saveDebugConfigToStorage(this.debugCfg);
  }

  private hitTest(sx: number, sy: number): TapRegion | null {
    const cy = sy + this.scrollY;
    for (const r of this.tapRegions) {
      if (sx >= r.x && sx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return r;
    }
    return null;
  }

  private render(): void {
    this.tapRegions = [];
    const oldChildren = [...this.container.children];
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: getUITheme().bg, alpha: 0.95 });
    bg.eventMode = "static";
    bg.on("pointertap", (e: Event) => e.stopPropagation());
    this.container.addChild(bg);
    const title = new Text({
      text: "CUSTOM RUN",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 20,
        fill: "#ffdd44",
        fontWeight: "bold",
      }),
    });
    title.x = GAME_WIDTH / 2;
    title.y = 14;
    title.anchor.set(0.5, 0);
    this.container.addChild(title);
    this.scrollContent = new Container();
    this.container.addChild(this.scrollContent);
    const scrollMask = new Graphics();
    scrollMask.rect(
      0,
      CustomRunScreen.SCROLL_TOP,
      GAME_WIDTH,
      CustomRunScreen.SCROLL_BOTTOM - CustomRunScreen.SCROLL_TOP,
    );
    scrollMask.fill(0xffffff);
    this.container.addChild(scrollMask);
    this.scrollContent.mask = scrollMask;

    const y = buildContentRows(
      this.scrollContent,
      this.tapRegions,
      this.config,
      this.debugCfg,
      (cfg) => {
        this.config = cfg;
      },
      (dbg) => {
        this.debugCfg = dbg;
      },
      () => this.render(),
      CustomRunScreen.SCROLL_TOP + 4,
    );

    const contentHeight = y - CustomRunScreen.SCROLL_TOP;
    const viewHeight = CustomRunScreen.SCROLL_BOTTOM - CustomRunScreen.SCROLL_TOP;
    this.maxScroll = Math.max(0, contentHeight - viewHeight);
    if (this.scrollY > this.maxScroll) this.scrollY = this.maxScroll;
    this.scrollContent.y = -this.scrollY;

    this.setupScrollOverlay();

    createBottomBar(this.container, GAME_WIDTH, GAME_HEIGHT, CustomRunScreen.BOTTOM_H, {
      onStart: () => {
        this.persist();
        this.debugCfg.invincible = this.config.practiceMode;
        setDebugConfig(this.debugCfg);
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

    for (const child of oldChildren) {
      this.container.removeChild(child);
      child.destroy();
    }
    this.startTicker();
  }

  private setupScrollOverlay(): void {
    const overlay = new Graphics();
    overlay.rect(
      0,
      CustomRunScreen.SCROLL_TOP,
      GAME_WIDTH,
      CustomRunScreen.SCROLL_BOTTOM - CustomRunScreen.SCROLL_TOP,
    );
    overlay.fill({ color: 0x000000, alpha: 0.001 });
    overlay.eventMode = "static";
    overlay.cursor = "default";
    this.container.addChild(overlay);
    overlay.on("pointerdown", (e) => {
      this.dragging = true;
      this.scrollVelocity = 0;
      this.dragLastY = e.globalY;
      this.dragLastTime = Date.now();
      this.dragVelocity = 0;
      this.totalDragDist = 0;
    });
    overlay.on("globalpointermove", (e) => {
      if (!this.dragging) return;
      const dy = this.dragLastY - e.globalY;
      this.totalDragDist += Math.abs(dy);
      const dt = Math.max(1, Date.now() - this.dragLastTime);
      this.dragVelocity = this.dragVelocity * 0.3 + (dy / dt) * 16 * 0.7;
      this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + dy));
      this.scrollContent.y = -this.scrollY;
      this.dragLastY = e.globalY;
      this.dragLastTime = Date.now();
    });
    const endDrag = (e: { globalX: number; globalY: number }) => {
      if (!this.dragging) return;
      this.dragging = false;
      if (this.totalDragDist < TAP_THRESHOLD) {
        const hit = this.hitTest(e.globalX, e.globalY);
        if (hit) hit.action();
      } else if (Math.abs(this.dragVelocity) > 1) this.scrollVelocity = this.dragVelocity;
    };
    overlay.on("pointerup", endDrag);
    overlay.on("pointerupoutside", endDrag);
    overlay.on("wheel", (e: WheelEvent) => {
      this.scrollVelocity = 0;
      this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + e.deltaY * 0.5));
      this.scrollContent.y = -this.scrollY;
    });
  }

  private startTicker(): void {
    if (this.tickerActive) return;
    this.tickerActive = true;
    const loop = () => {
      if (!this.tickerActive) return;
      if (!this.dragging && Math.abs(this.scrollVelocity) > 0.5) {
        this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + this.scrollVelocity));
        this.scrollContent.y = -this.scrollY;
        this.scrollVelocity *= 0.92;
      } else if (!this.dragging) this.scrollVelocity = 0;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  destroy(): void {
    this.tickerActive = false;
    this.container.destroy({ children: true });
  }
}
