/** Settings toggle panel for the title screen. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH } from "../config/constants";
import {
  getSfxVolume,
  setSfxVolume,
  getMusicVolume,
  setMusicVolume,
  setSfxEnabled,
  setMusicEnabled,
} from "../systems/Audio";
import { isEnemiesEnabled, setEnemiesEnabled } from "../systems/EnemySettings";
import { isTiltInverted, setTiltInverted, isTouchControlsForced, setTouchControlsForced } from "../systems/TiltSettings";
import { getSelectedCharacter, setSelectedCharacter } from "../systems/CharacterSettings";
import { CHARACTERS } from "../rendering/PlayerCharacters";

export function createSettingsToggles(): Container {
  const container = new Container();

  const panelW = Math.min(280, GAME_WIDTH - 20);
  const panelX = (GAME_WIDTH - panelW) / 2;

  const panelH = 222;

  // Background panel — opaque enough for text contrast
  const bg = new Graphics();
  bg.roundRect(panelX, -8, panelW, panelH, 10);
  bg.fill({ color: 0x1a1008, alpha: 0.85 });
  bg.roundRect(panelX, -8, panelW, panelH, 10);
  bg.stroke({ width: 1, color: 0x665544, alpha: 0.6 });
  container.addChild(bg);

  const headerStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 13,
    fill: "#ffaa33",
    fontWeight: "bold",
  });
  const header = new Text({ text: "SETTINGS", style: headerStyle });
  header.x = GAME_WIDTH / 2;
  header.y = 0;
  header.anchor.set(0.5, 0);
  container.addChild(header);

  const labelStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 14,
    fill: "#ffffff",
    fontWeight: "bold",
  });
  const btnStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 16,
    fill: "#ffaa33",
    fontWeight: "bold",
  });

  const valueOn = "#44ff44";
  const valueOff = "#ff6644";
  const valueStyle = (on: boolean) =>
    new TextStyle({
      fontFamily: "monospace",
      fontSize: 14,
      fill: on ? valueOn : valueOff,
      fontWeight: "bold",
    });

  const leftX = panelX + 12;
  const rightX = panelX + panelW - 12;

  /** Create a volume row with -/+ buttons and percentage display. */
  function addVolumeRow(
    y: number,
    label: string,
    getVal: () => number,
    setVal: (v: number) => void,
  ): void {
    const lbl = new Text({ text: label, style: labelStyle });
    lbl.x = leftX;
    lbl.y = y;
    container.addChild(lbl);

    const valText = new Text({
      text: `${getVal()}%`,
      style: new TextStyle({ fontFamily: "monospace", fontSize: 14, fill: "#ffffff", fontWeight: "bold" }),
    });
    valText.x = rightX - 80;
    valText.y = y;
    valText.anchor.set(0.5, 0);
    container.addChild(valText);

    const minus = new Text({ text: "  -  ", style: btnStyle });
    minus.x = rightX - 40;
    minus.y = y;
    minus.anchor.set(0.5, 0);
    minus.eventMode = "static";
    minus.cursor = "pointer";
    minus.on("pointertap", (e: Event) => {
      e.stopPropagation();
      setVal(Math.max(0, getVal() - 10));
      valText.text = `${getVal()}%`;
    });
    container.addChild(minus);

    const plus = new Text({ text: "  +  ", style: btnStyle });
    plus.x = rightX;
    plus.y = y;
    plus.anchor.set(0.5, 0);
    plus.eventMode = "static";
    plus.cursor = "pointer";
    plus.on("pointertap", (e: Event) => {
      e.stopPropagation();
      setVal(Math.min(100, getVal() + 10));
      valText.text = `${getVal()}%`;
    });
    container.addChild(plus);
  }

  // SFX volume
  addVolumeRow(20, "SFX", getSfxVolume, (v) => {
    setSfxVolume(v);
    setSfxEnabled(v > 0);
  });

  // Music volume
  addVolumeRow(44, "Music", getMusicVolume, (v) => {
    setMusicVolume(v);
    setMusicEnabled(v > 0);
  });

  // Enemies toggle
  const enemyLabel = new Text({ text: "Enemies", style: labelStyle });
  enemyLabel.x = leftX;
  enemyLabel.y = 70;
  container.addChild(enemyLabel);

  const enemyValue = new Text({
    text: isEnemiesEnabled() ? "ON" : "OFF",
    style: valueStyle(isEnemiesEnabled()),
  });
  enemyValue.x = rightX - 40;
  enemyValue.y = 70;
  enemyValue.anchor.set(0.5, 0);
  container.addChild(enemyValue);

  const enemyHit = new Graphics();
  enemyHit.rect(panelX, 66, panelW, 26);
  enemyHit.fill({ color: 0x000000, alpha: 0.001 });
  enemyHit.eventMode = "static";
  enemyHit.cursor = "pointer";
  enemyHit.on("pointertap", (e: Event) => {
    e.stopPropagation();
    setEnemiesEnabled(!isEnemiesEnabled());
    enemyValue.text = isEnemiesEnabled() ? "ON" : "OFF";
    enemyValue.style = valueStyle(isEnemiesEnabled());
  });
  container.addChild(enemyHit);

  // Invert Tilt toggle
  const tiltLabel = new Text({ text: "Invert Tilt", style: labelStyle });
  tiltLabel.x = leftX; tiltLabel.y = 96;
  container.addChild(tiltLabel);
  const tiltValue = new Text({
    text: isTiltInverted() ? "ON" : "OFF",
    style: valueStyle(isTiltInverted()),
  });
  tiltValue.x = rightX - 40; tiltValue.y = 96; tiltValue.anchor.set(0.5, 0);
  container.addChild(tiltValue);
  const tiltHit = new Graphics();
  tiltHit.rect(panelX, 92, panelW, 26);
  tiltHit.fill({ color: 0x000000, alpha: 0.001 });
  tiltHit.eventMode = "static"; tiltHit.cursor = "pointer";
  tiltHit.on("pointertap", (e: Event) => {
    e.stopPropagation();
    setTiltInverted(!isTiltInverted());
    tiltValue.text = isTiltInverted() ? "ON" : "OFF";
    tiltValue.style = valueStyle(isTiltInverted());
  });
  container.addChild(tiltHit);

  // Touch Controls toggle (tap left/right half instead of tilt)
  const touchLabel = new Text({ text: "Touch Controls", style: labelStyle });
  touchLabel.x = leftX; touchLabel.y = 122;
  container.addChild(touchLabel);
  const touchValue = new Text({
    text: isTouchControlsForced() ? "ON" : "OFF",
    style: valueStyle(isTouchControlsForced()),
  });
  touchValue.x = rightX - 40; touchValue.y = 122; touchValue.anchor.set(0.5, 0);
  container.addChild(touchValue);
  const touchHit = new Graphics();
  touchHit.rect(panelX, 118, panelW, 26);
  touchHit.fill({ color: 0x000000, alpha: 0.001 });
  touchHit.eventMode = "static"; touchHit.cursor = "pointer";
  touchHit.on("pointertap", (e: Event) => {
    e.stopPropagation();
    setTouchControlsForced(!isTouchControlsForced());
    touchValue.text = isTouchControlsForced() ? "ON" : "OFF";
    touchValue.style = valueStyle(isTouchControlsForced());
  });
  container.addChild(touchHit);

  // Character selection row
  const charLabel = new Text({ text: "Character", style: labelStyle });
  charLabel.x = leftX; charLabel.y = 148;
  container.addChild(charLabel);

  function currentCharName(): string {
    const id = getSelectedCharacter();
    return CHARACTERS.find((c) => c.id === id)?.name ?? "Chef";
  }

  const charValueStyle = new TextStyle({
    fontFamily: "monospace", fontSize: 14, fill: "#ffcc44", fontWeight: "bold",
  });
  const charValue = new Text({ text: currentCharName(), style: charValueStyle });
  charValue.x = rightX - 40; charValue.y = 148; charValue.anchor.set(0.5, 0);
  container.addChild(charValue);

  const charHit = new Graphics();
  charHit.rect(panelX, 144, panelW, 26);
  charHit.fill({ color: 0x000000, alpha: 0.001 });
  charHit.eventMode = "static"; charHit.cursor = "pointer";
  charHit.on("pointertap", (e: Event) => {
    e.stopPropagation();
    const curId = getSelectedCharacter();
    const idx = CHARACTERS.findIndex((c) => c.id === curId);
    const next = CHARACTERS[(idx + 1) % CHARACTERS.length];
    setSelectedCharacter(next.id);
    charValue.text = next.name;
  });
  container.addChild(charHit);

  // Hint text
  const hint = new Text({
    text: "Touch: tap left/right half to move",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 11,
      fill: "#ccbbaa",
    }),
  });
  hint.x = GAME_WIDTH / 2;
  hint.y = 178;
  hint.anchor.set(0.5, 0);
  container.addChild(hint);

  // Make panel interactive so taps don't start the game
  bg.eventMode = "static";
  bg.on("pointertap", (e: Event) => e.stopPropagation());

  return container;
}
