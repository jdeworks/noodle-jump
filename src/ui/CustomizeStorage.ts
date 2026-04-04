/** Shared row builders and styles for the Customize screen. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Cosmetic } from "../systems/Cosmetics";
import type { Achievement } from "../systems/Achievements";

export const ROW_H = 30;
const GRID_H = 32;

const labelStyle = new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#ffffff" });
const lockedStyle = new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#666655" });
const equippedStyle = new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#44ff44", fontWeight: "bold" });
const sectionStyle = new TextStyle({ fontFamily: "monospace", fontSize: 14, fill: "#ffcc88", fontWeight: "bold" });
const achUnlocked = new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#44ff44" });
const achLocked = new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#887766" });
const dimStyle = new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#665544" });

export interface TapRegion { x: number; y: number; w: number; h: number; action: () => void }

/** Section header. */
export function addSection(c: Container, gw: number, text: string, y: number): number {
  const t = new Text({ text, style: sectionStyle });
  t.x = gw / 2; t.y = y; t.anchor.set(0.5, 0); c.addChild(t);
  return y + 22;
}

/** Full-width cosmetic row (for themes with descriptions). */
export function addCosmeticRow(
  c: Container, taps: TapRegion[], gw: number,
  cosmetic: Cosmetic, unlocked: boolean, equipped: boolean,
  y: number, onEquip: () => void,
): number {
  const style = !unlocked ? lockedStyle : equipped ? equippedStyle : labelStyle;
  const prefix = equipped ? "* " : unlocked ? "  " : "# ";
  const t = new Text({ text: `${prefix}${cosmetic.name} — ${cosmetic.description}`, style });
  t.x = 14; t.y = y; c.addChild(t);
  if (!unlocked && cosmetic.unlockPhrase) {
    const r = new Text({ text: `"${cosmetic.unlockPhrase}"`, style: dimStyle });
    r.x = gw - 14; r.y = y + 2; r.anchor.set(1, 0); c.addChild(r);
  }
  if (unlocked) taps.push({ x: 0, y, w: gw, h: ROW_H, action: onEquip });
  return y + ROW_H;
}

/** Achievement row. */
export function addAchievementRow(
  c: Container, gw: number, ach: Achievement, unlocked: boolean, y: number,
): number {
  const icon = unlocked ? "+" : "-";
  const style = unlocked ? achUnlocked : achLocked;
  const t = new Text({ text: `${icon} ${ach.name}`, style });
  t.x = 14; t.y = y; c.addChild(t);
  const d = new Text({ text: ach.description, style: dimStyle });
  d.x = gw - 14; d.y = y + 2; d.anchor.set(1, 0); c.addChild(d);
  return y + ROW_H;
}

/** 3-column grid item for cosmetics/characters. */
export function addGridItem(
  c: Container, taps: TapRegion[], gw: number,
  label: string, unlocked: boolean, equipped: boolean,
  col: number, y: number, onTap: () => void, swatchColor?: number,
): void {
  const colW = (gw - 16) / 3;
  const x = 8 + col * colW;
  const style = !unlocked ? lockedStyle : equipped ? equippedStyle : labelStyle;
  const prefix = equipped ? "* " : unlocked ? "" : "# ";
  const t = new Text({ text: `${prefix}${label}`, style });
  t.x = x + 4; t.y = y + 4; c.addChild(t);
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
  y: number,
): number {
  const totalW = gw - 20;
  const btnW = Math.floor(totalW / buttons.length) - 4;
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const bx = 10 + i * (btnW + 4);
    const bg = new Graphics();
    bg.roundRect(bx, y, btnW, 28, 5);
    bg.fill({ color: 0x222233, alpha: 0.8 });
    bg.stroke({ width: 1, color: 0x555566, alpha: 0.5 });
    c.addChild(bg);
    const t = new Text({ text: btn.label, style: new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: btn.color, fontWeight: "bold" }) });
    t.x = bx + btnW / 2; t.y = y + 14; t.anchor.set(0.5, 0.5); c.addChild(t);
    taps.push({ x: bx, y, w: btnW, h: 28, action: btn.action });
  }
  return y + 34;
}

/** Small dim text line. */
export function addInfoText(c: Container, gw: number, text: string, y: number): number {
  const t = new Text({ text, style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#554433", wordWrap: true, wordWrapWidth: gw - 30 }) });
  t.x = gw / 2; t.y = y; t.anchor.set(0.5, 0); c.addChild(t);
  return y + t.height + 4;
}
