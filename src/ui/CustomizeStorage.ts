/** Shared row builders and styles for the Customize screen. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Cosmetic } from "../systems/Cosmetics";
import type { Achievement } from "../systems/Achievements";
import type { UIThemeColors } from "./ThemeUI";

export const ROW_H = 30;
const GRID_H = 32;

const equipped = new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#44ff44", fontWeight: "bold" });
const achOk = new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#44ff44" });

export interface TapRegion { x: number; y: number; w: number; h: number; action: () => void }

/** Section header. */
export function addSection(c: Container, gw: number, text: string, y: number, t: UIThemeColors): number {
  const s = new Text({ text, style: new TextStyle({ fontFamily: "monospace", fontSize: 14, fill: t.sectionText, fontWeight: "bold" }) });
  s.x = gw / 2; s.y = y; s.anchor.set(0.5, 0); c.addChild(s);
  return y + 22;
}

/** Full-width cosmetic row (for themes with descriptions). */
export function addCosmeticRow(
  c: Container, taps: TapRegion[], gw: number,
  cosmetic: Cosmetic, unlocked: boolean, isEquipped: boolean,
  y: number, onEquip: () => void, t: UIThemeColors,
): number {
  const style = !unlocked ? new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: t.textDim })
    : isEquipped ? equipped : new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: t.text });
  const prefix = isEquipped ? "* " : unlocked ? "  " : "# ";
  const txt = new Text({ text: `${prefix}${cosmetic.name} — ${cosmetic.description}`, style });
  txt.x = 14; txt.y = y; c.addChild(txt);
  if (!unlocked && cosmetic.unlockPhrase) {
    const r = new Text({ text: `"${cosmetic.unlockPhrase}"`, style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: t.textDim }) });
    r.x = gw - 14; r.y = y + 2; r.anchor.set(1, 0); c.addChild(r);
  }
  if (unlocked) taps.push({ x: 0, y, w: gw, h: ROW_H, action: onEquip });
  return y + ROW_H;
}

/** Achievement row. */
export function addAchievementRow(
  c: Container, gw: number, ach: Achievement, unlocked: boolean, y: number, t: UIThemeColors,
): number {
  const icon = unlocked ? "+" : "-";
  const style = unlocked ? achOk : new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: t.textDim });
  const txt = new Text({ text: `${icon} ${ach.name}`, style });
  txt.x = 14; txt.y = y; c.addChild(txt);
  const d = new Text({ text: ach.description, style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: t.textDim }) });
  d.x = gw - 14; d.y = y + 2; d.anchor.set(1, 0); c.addChild(d);
  return y + ROW_H;
}

/** 3-column grid item for cosmetics/characters. */
export function addGridItem(
  c: Container, taps: TapRegion[], gw: number,
  label: string, unlocked: boolean, isEquipped: boolean,
  col: number, y: number, onTap: () => void, t: UIThemeColors, swatchColor?: number,
): void {
  const colW = (gw - 16) / 3;
  const x = 8 + col * colW;
  const style = !unlocked ? new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: t.textDim })
    : isEquipped ? equipped : new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: t.text });
  const prefix = isEquipped ? "* " : unlocked ? "" : "# ";
  const txt = new Text({ text: `${prefix}${label}`, style });
  txt.x = x + 4; txt.y = y + 4; c.addChild(txt);
  if (swatchColor !== undefined && swatchColor !== 0xffffff) {
    const sw = new Graphics();
    sw.roundRect(x + colW - 20, y + 6, 14, 14, 3);
    sw.fill(unlocked ? swatchColor : 0x444444);
    c.addChild(sw);
  }
  if (unlocked) taps.push({ x, y, w: colW, h: GRID_H, action: onTap });
}

/** Return Y after a grid of N items in 3 columns. */
export function gridEndY(y: number, count: number): number {
  return y + Math.ceil(count / 3) * GRID_H + 4;
}

/** Inline action buttons (all on one line). */
export function addButtonLine(
  c: Container, taps: TapRegion[], gw: number,
  buttons: { label: string; color: string; action: () => void }[],
  y: number, t: UIThemeColors,
): number {
  const totalW = gw - 20;
  const btnW = Math.floor(totalW / buttons.length) - 4;
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const bx = 10 + i * (btnW + 4);
    const bg = new Graphics();
    bg.roundRect(bx, y, btnW, 28, 5);
    bg.fill({ color: t.buttonBg, alpha: 0.8 });
    bg.stroke({ width: 1, color: t.buttonBorder, alpha: 0.5 });
    c.addChild(bg);
    const txt = new Text({ text: btn.label, style: new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: btn.color, fontWeight: "bold" }) });
    txt.x = bx + btnW / 2; txt.y = y + 14; txt.anchor.set(0.5, 0.5); c.addChild(txt);
    taps.push({ x: bx, y, w: btnW, h: 28, action: btn.action });
  }
  return y + 34;
}

/** Small dim text line. */
export function addInfoText(c: Container, gw: number, text: string, y: number, t: UIThemeColors): number {
  const txt = new Text({ text, style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: t.textDim, wordWrap: true, wordWrapWidth: gw - 30 }) });
  txt.x = gw / 2; txt.y = y; txt.anchor.set(0.5, 0); c.addChild(txt);
  return y + txt.height + 4;
}
