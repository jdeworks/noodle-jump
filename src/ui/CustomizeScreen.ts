/** Customize screen — browse/equip cosmetics, view achievements, enter codes. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import {
  loadCosmetics, saveCosmetics, equipCosmetic, getCosmeticsByType, TINT_COLORS,
  COSMETICS, UNLOCKABLE_CHARACTERS, isCharacterUnlocked, type CosmeticState,
} from "../systems/Cosmetics";
import { ACHIEVEMENTS, loadAchievements, saveAchievements } from "../systems/Achievements";
import { CHARACTERS } from "../rendering/PlayerCharacters";
import { getSelectedCharacter, setSelectedCharacter } from "../systems/CharacterSettings";
import { tryCode, loadUnlockCodeState, saveUnlockCodeState, markCodeUsed } from "../systems/UnlockCodes";
import { exportProgress, importProgress, copyToClipboard } from "../systems/ProgressBackup";
import {
  addSection, addCosmeticRow, addAchievementRow,
  addButtonLine, addInfoText, addGridItem, gridEndY,
  type TapRegion,
} from "./CustomizeStorage";
import { getUITheme } from "./ThemeUI";

const TAP_THRESHOLD = 8;
const BOTTOM_H = 44;

export class CustomizeScreen {
  readonly container = new Container();
  private active = false;
  private cosmeticState: CosmeticState = loadCosmetics();
  private scrollContent = new Container();
  private tapRegions: TapRegion[] = [];
  private scrollY = 0;
  private maxScroll = 0;
  private scrollVelocity = 0;
  private dragging = false;
  private dragStartY = 0;
  private dragLastY = 0;
  private totalDragDist = 0;
  private dragVelocity = 0;
  private tickerFn: (() => void) | null = null;
  onClose: (() => void) | null = null;

  show(): void {
    this.active = true;
    this.container.visible = true;
    this.cosmeticState = loadCosmetics();
    this.scrollY = 0;
    this.scrollVelocity = 0;
    this.render();
  }

  hide(): void {
    this.active = false;
    this.container.visible = false;
    while (this.container.children.length > 0) {
      const c = this.container.children[0];
      this.container.removeChild(c);
      c.destroy({ children: true });
    }
    this.onClose?.();
  }

  isActive(): boolean { return this.active; }

  private render(): void {
    const old = this.scrollContent;
    this.scrollContent = new Container();
    this.tapRegions = [];
    let y = 4;
    const gw = GAME_WIDTH;
    const achs = loadAchievements();
    const selectedChar = getSelectedCharacter();
    const t = getUITheme();
    const equipFn = (id: string) => () => {
      this.cosmeticState = equipCosmetic(this.cosmeticState, id);
      saveCosmetics(this.cosmeticState); this.render();
    };

    // ── Buttons on one line ──
    y = addButtonLine(this.scrollContent, this.tapRegions, gw, [
      { label: "Enter Code", color: t.accent, action: () => this.promptCode() },
      { label: "Export", color: "#88ff88", action: () => this.doExport() },
      { label: "Import", color: "#ffaa88", action: () => this.doImport() },
    ], y, t);
    y = addInfoText(this.scrollContent, gw, "Progress is local — Export to back up before clearing browser data.", y, t);

    // ── Characters (3-column grid) ──
    y = addSection(this.scrollContent, gw, "CHARACTERS", y, t);
    const charStartY = y;
    for (let i = 0; i < CHARACTERS.length; i++) {
      const ch = CHARACTERS[i];
      const unlockable = UNLOCKABLE_CHARACTERS.find((u) => u.id === ch.id);
      const unlocked = unlockable ? isCharacterUnlocked(ch.id, achs.unlocked) : true;
      addGridItem(this.scrollContent, this.tapRegions, gw,
        ch.name, unlocked, ch.id === selectedChar, i % 3, charStartY + Math.floor(i / 3) * 32,
        () => { setSelectedCharacter(ch.id); this.render(); }, t);
    }
    y = gridEndY(charStartY, CHARACTERS.length);

    // ── Trails (3-column grid) ──
    y = addSection(this.scrollContent, gw, "TRAILS", y, t);
    const trails = getCosmeticsByType("trail");
    const trailStartY = y;
    for (let i = 0; i < trails.length; i++) {
      const c = trails[i];
      addGridItem(this.scrollContent, this.tapRegions, gw,
        c.name, this.cosmeticState.unlocked.has(c.id), this.cosmeticState.equipped.trail === c.id,
        i % 3, trailStartY + Math.floor(i / 3) * 32, equipFn(c.id), t);
    }
    y = gridEndY(trailStartY, trails.length);

    // ── Tints (3-column grid with swatches) ──
    y = addSection(this.scrollContent, gw, "TINTS", y, t);
    const tints = getCosmeticsByType("tint");
    const tintStartY = y;
    for (let i = 0; i < tints.length; i++) {
      const c = tints[i];
      addGridItem(this.scrollContent, this.tapRegions, gw,
        c.name, this.cosmeticState.unlocked.has(c.id), this.cosmeticState.equipped.tint === c.id,
        i % 3, tintStartY + Math.floor(i / 3) * 32, equipFn(c.id), t, TINT_COLORS[c.id]);
    }
    y = gridEndY(tintStartY, tints.length);

    // ── Themes (full-width rows with descriptions) ──
    y = addSection(this.scrollContent, gw, "THEMES", y, t);
    for (const c of getCosmeticsByType("theme")) {
      y = addCosmeticRow(this.scrollContent, this.tapRegions, gw, c,
        this.cosmeticState.unlocked.has(c.id), this.cosmeticState.equipped.theme === c.id,
        y, equipFn(c.id), t);
    }
    y += 4;

    // ── Achievements ──
    const unlockCount = [...achs.unlocked].length;
    y = addSection(this.scrollContent, gw, `ACHIEVEMENTS (${unlockCount}/${ACHIEVEMENTS.length})`, y, t);
    for (const a of ACHIEVEMENTS) {
      y = addAchievementRow(this.scrollContent, gw, a, achs.unlocked.has(a.id), y, t);
    }
    y += 16;

    this.maxScroll = Math.max(0, y - (GAME_HEIGHT - BOTTOM_H - 44));
    this.buildUI(old);
  }

  private buildUI(oldContent: Container): void {
    while (this.container.children.length > 0) {
      const c = this.container.children[0];
      this.container.removeChild(c);
      if (c !== oldContent) c.destroy({ children: true });
    }
    oldContent.destroy({ children: true });

    const t = getUITheme();
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT); bg.fill({ color: t.bg, alpha: t.bgAlpha });
    this.container.addChild(bg);

    const title = new Text({ text: "CUSTOMIZE", style: new TextStyle({ fontFamily: "monospace", fontSize: 18, fill: t.accent, fontWeight: "bold" }) });
    title.x = GAME_WIDTH / 2; title.y = 14; title.anchor.set(0.5, 0);
    this.container.addChild(title);

    // Scroll mask
    const mask = new Graphics();
    mask.rect(0, 40, GAME_WIDTH, GAME_HEIGHT - 40 - BOTTOM_H); mask.fill(0xffffff);
    this.container.addChild(mask);
    this.scrollContent.y = 40 - this.scrollY;
    this.scrollContent.mask = mask;
    this.container.addChild(this.scrollContent);

    // Scroll overlay (captures input)
    const overlay = new Graphics();
    overlay.rect(0, 40, GAME_WIDTH, GAME_HEIGHT - 40 - BOTTOM_H);
    overlay.fill({ color: 0x000000, alpha: 0.001 });
    overlay.eventMode = "static";
    this.container.addChild(overlay);
    this.bindScroll(overlay);

    // Bottom bar
    const bar = new Graphics();
    bar.rect(0, GAME_HEIGHT - BOTTOM_H, GAME_WIDTH, BOTTOM_H); bar.fill({ color: t.bg, alpha: 0.95 });
    bar.eventMode = "static";
    this.container.addChild(bar);
    const backBtn = new Text({ text: "[ Back ]", style: new TextStyle({ fontFamily: "monospace", fontSize: 16, fill: t.text, fontWeight: "bold" }) });
    backBtn.x = GAME_WIDTH / 2; backBtn.y = GAME_HEIGHT - BOTTOM_H + 14; backBtn.anchor.set(0.5, 0);
    backBtn.eventMode = "static"; backBtn.cursor = "pointer";
    backBtn.on("pointertap", () => this.hide());
    this.container.addChild(backBtn);

    this.startMomentum();
  }

  private bindScroll(overlay: Graphics): void {
    overlay.on("pointerdown", (e) => {
      this.dragging = true; this.dragStartY = e.globalY; this.dragLastY = e.globalY;
      this.totalDragDist = 0; this.scrollVelocity = 0; this.dragVelocity = 0;
    });
    overlay.on("globalpointermove", (e) => {
      if (!this.dragging) return;
      const dy = this.dragLastY - e.globalY;
      this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + dy));
      this.scrollContent.y = 40 - this.scrollY;
      this.totalDragDist += Math.abs(dy);
      this.dragVelocity = dy;
      this.dragLastY = e.globalY;
    });
    const endDrag = (e: { globalX: number; globalY: number }) => {
      if (!this.dragging) return;
      this.dragging = false;
      if (this.totalDragDist < TAP_THRESHOLD) {
        const sx = e.globalX;
        const sy = e.globalY - 40 + this.scrollY;
        for (const r of this.tapRegions) {
          if (e.globalY >= 40 && e.globalY <= GAME_HEIGHT - BOTTOM_H &&
              sx >= r.x && sx < r.x + r.w && sy >= r.y && sy < r.y + r.h) { r.action(); return; }
        }
      } else { this.scrollVelocity = this.dragVelocity; }
    };
    overlay.on("pointerup", endDrag);
    overlay.on("pointerupoutside", endDrag);
    overlay.on("wheel", (e) => {
      this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + (e as unknown as WheelEvent).deltaY));
      this.scrollContent.y = 40 - this.scrollY;
      this.scrollVelocity = 0;
    });
  }

  private startMomentum(): void {
    if (this.tickerFn) return;
    this.tickerFn = () => {
      if (!this.active) return;
      if (Math.abs(this.scrollVelocity) > 0.5) {
        this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + this.scrollVelocity));
        this.scrollContent.y = 40 - this.scrollY;
        this.scrollVelocity *= 0.92;
      }
    };
    requestAnimationFrame(function tick(fn: () => void) { fn(); requestAnimationFrame(() => tick(fn)); }.bind(null, this.tickerFn));
  }

  private promptCode(): void {
    const code = window.prompt("Enter unlock code:");
    if (!code) return;
    const result = tryCode(code, this.cosmeticState);
    if (result) {
      this.cosmeticState = result.cosmetics;
      saveCosmetics(this.cosmeticState);
      let codeState = loadUnlockCodeState();
      codeState = markCodeUsed(codeState, code);
      saveUnlockCodeState(codeState);
      // Unlock characters via code
      for (const charId of result.unlockedCharacters) {
        // Characters are gated by achievements — mark the required achievement as unlocked
        const ch = UNLOCKABLE_CHARACTERS.find((u) => u.id === charId);
        if (ch?.unlockAchievement) {
          const achs = loadAchievements();
          if (!achs.unlocked.has(ch.unlockAchievement)) {
            achs.unlocked.add(ch.unlockAchievement);
            saveAchievements(achs);
          }
        }
      }
      this.render();
    } else {
      window.alert("Invalid code.");
    }
  }

  private async doExport(): Promise<void> {
    const encoded = exportProgress();
    const ok = await copyToClipboard(encoded);
    window.alert(ok ? "Progress copied to clipboard!" : "Failed to copy. Try manually.");
  }

  private doImport(): void {
    const encoded = window.prompt("Paste your progress code:");
    if (!encoded) return;
    if (importProgress(encoded)) {
      this.cosmeticState = loadCosmetics();
      window.alert("Progress restored!");
      this.render();
    } else {
      window.alert("Invalid progress code.");
    }
  }
}
