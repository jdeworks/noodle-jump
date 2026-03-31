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

export function createSettingsToggles(): Container {
  const container = new Container();

  // Background panel — taller for volume controls
  const bg = new Graphics();
  bg.roundRect(GAME_WIDTH / 2 - 130, -8, 260, 130, 8);
  bg.fill({ color: 0x000000, alpha: 0.4 });
  container.addChild(bg);

  const headerStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 12,
    fill: "#888888",
    align: "center",
  });
  const header = new Text({ text: "SETTINGS", style: headerStyle });
  header.x = GAME_WIDTH / 2;
  header.y = -2;
  header.anchor.set(0.5, 0);
  container.addChild(header);

  const labelStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 13,
    fill: "#ffffff",
    fontWeight: "bold",
  });
  const smallStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 13,
    fill: "#88aaff",
    fontWeight: "bold",
  });
  const valueOn = "#44ff44";
  const valueOff = "#666666";
  const valueStyle = (on: boolean) =>
    new TextStyle({
      fontFamily: "monospace",
      fontSize: 13,
      fill: on ? valueOn : valueOff,
      fontWeight: "bold",
    });

  /** Create a volume row with -/+ buttons and percentage display. */
  function addVolumeRow(
    y: number,
    label: string,
    getVal: () => number,
    setVal: (v: number) => void,
  ): void {
    const lbl = new Text({ text: label, style: labelStyle });
    lbl.x = GAME_WIDTH / 2 - 120;
    lbl.y = y;
    container.addChild(lbl);

    const valText = new Text({
      text: `${getVal()}%`,
      style: new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: "#ffffff", fontWeight: "bold" }),
    });
    valText.x = GAME_WIDTH / 2 + 30;
    valText.y = y;
    container.addChild(valText);

    const minus = new Text({ text: "[-]", style: smallStyle });
    minus.x = GAME_WIDTH / 2 + 70;
    minus.y = y;
    minus.eventMode = "static";
    minus.cursor = "pointer";
    minus.on("pointertap", (e: Event) => {
      e.stopPropagation();
      setVal(Math.max(0, getVal() - 10));
      valText.text = `${getVal()}%`;
    });
    container.addChild(minus);

    const plus = new Text({ text: "[+]", style: smallStyle });
    plus.x = GAME_WIDTH / 2 + 100;
    plus.y = y;
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
  addVolumeRow(18, "SFX:", getSfxVolume, (v) => {
    setSfxVolume(v);
    setSfxEnabled(v > 0);
  });

  // Music volume
  addVolumeRow(38, "Music:", getMusicVolume, (v) => {
    setMusicVolume(v);
    setMusicEnabled(v > 0);
  });

  // Enemies toggle
  const enemyLabel = new Text({ text: "Enemies: ", style: labelStyle });
  enemyLabel.x = GAME_WIDTH / 2 - 120;
  enemyLabel.y = 60;
  container.addChild(enemyLabel);

  const enemyValue = new Text({
    text: isEnemiesEnabled() ? "ON" : "OFF",
    style: valueStyle(isEnemiesEnabled()),
  });
  enemyValue.x = GAME_WIDTH / 2 + 30;
  enemyValue.y = 60;
  container.addChild(enemyValue);

  const enemyHit = new Graphics();
  enemyHit.rect(GAME_WIDTH / 2 - 130, 56, 260, 22);
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

  // Make the container interactive so taps on it don't start the game
  bg.eventMode = "static";
  bg.on("pointertap", (e: Event) => e.stopPropagation());

  return container;
}
