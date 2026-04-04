/** Shared row builders and styles for the Customize screen. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Cosmetic } from "../systems/Cosmetics";
import type { Achievement } from "../systems/Achievements";

export const ROW_H = 26;

const labelStyle = new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#ffffff" });
const lockedStyle = new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#666655" });
const equippedStyle = new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: "#44ff44", fontWeight: "bold" });
const sectionStyle = new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#ffcc88", fontWeight: "bold" });
const achUnlocked = new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#44ff44" });
const achLocked = new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#887766" });
const dimStyle = new TextStyle({ fontFamily: "monospace", fontSize: 10, fill: "#665544" });

export interface TapRegion { x: number; y: number; w: number; h: number; action: () => void }

/** Section header. */
export function addSection(c: Container, gw: number, text: string, y: number): number {
  const t = new Text({ text, style: sectionStyle });
  t.x = gw / 2; t.y = y; t.anchor.set(0.5, 0);
  c.addChild(t);
  return y + 20;
}

/** Cosmetic item row: name, lock state, equipped indicator. */
export function addCosmeticRow(
  c: Container, taps: TapRegion[], gw: number,
  cosmetic: Cosmetic, unlocked: boolean, equipped: boolean,
  y: number, onEquip: () => void, swatchColor?: number,
): number {
  const style = !unlocked ? lockedStyle : equipped ? equippedStyle : labelStyle;
  const prefix = equipped ? "* " : unlocked ? "  " : "# ";
  const label = `${prefix}${cosmetic.name}`;
  const t = new Text({ text: label, style });
  t.x = 20; t.y = y; c.addChild(t);

  // Color swatch for tints
  if (swatchColor !== undefined && swatchColor !== 0xffffff) {
    const sw = new Graphics();
    sw.roundRect(gw - 50, y + 2, 14, 14, 3);
    sw.fill(unlocked ? swatchColor : 0x444444);
    c.addChild(sw);
  }

  // Right side: requirement or phrase
  if (!unlocked) {
    const req = cosmetic.unlockAchievement ?? "???";
    const r = new Text({ text: req, style: dimStyle });
    r.x = gw - 20; r.y = y + 2; r.anchor.set(1, 0); c.addChild(r);
  } else if (cosmetic.unlockPhrase) {
    const r = new Text({ text: `"${cosmetic.unlockPhrase}"`, style: dimStyle });
    r.x = gw - 20; r.y = y + 2; r.anchor.set(1, 0); c.addChild(r);
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
  t.x = 20; t.y = y; c.addChild(t);
  const d = new Text({ text: ach.description, style: dimStyle });
  d.x = gw - 20; d.y = y + 1; d.anchor.set(1, 0); c.addChild(d);
  return y + ROW_H;
}

/** Character row with lock gating. */
export function addCharacterRow(
  c: Container, taps: TapRegion[], gw: number,
  id: string, name: string, unlocked: boolean, selected: boolean,
  y: number, onSelect: () => void,
): number {
  const style = !unlocked ? lockedStyle : selected ? equippedStyle : labelStyle;
  const prefix = selected ? "* " : unlocked ? "  " : "# ";
  const t = new Text({ text: `${prefix}${name}`, style });
  t.x = 20; t.y = y; c.addChild(t);
  if (!unlocked) {
    const r = new Text({ text: "locked", style: dimStyle });
    r.x = gw - 20; r.y = y + 2; r.anchor.set(1, 0); c.addChild(r);
  }
  if (unlocked) taps.push({ x: 0, y, w: gw, h: ROW_H, action: onSelect });
  return y + ROW_H;
}

/** Action button row. */
export function addButtonRow(
  c: Container, taps: TapRegion[], gw: number,
  label: string, color: string, y: number, action: () => void,
): number {
  const t = new Text({ text: `[ ${label} ]`, style: new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: color, fontWeight: "bold" }) });
  t.x = gw / 2; t.y = y; t.anchor.set(0.5, 0); c.addChild(t);
  const tw = Math.min(200, gw - 40);
  taps.push({ x: gw / 2 - tw / 2, y, w: tw, h: ROW_H, action });
  return y + ROW_H + 4;
}

/** Small dim text line. */
export function addInfoText(c: Container, gw: number, text: string, y: number): number {
  const t = new Text({ text, style: new TextStyle({ fontFamily: "monospace", fontSize: 10, fill: "#554433", wordWrap: true, wordWrapWidth: gw - 40 }) });
  t.x = gw / 2; t.y = y; t.anchor.set(0.5, 0); c.addChild(t);
  return y + t.height + 6;
}
