/** Settings toggle panel for the title screen. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH } from "../config/constants";
import { getSfxVolume, setSfxVolume, getMusicVolume, setMusicVolume } from "../systems/Audio";
import { isEnemiesEnabled, setEnemiesEnabled } from "../systems/EnemySettings";
import {
  isTiltInverted,
  setTiltInverted,
  getControlMode,
  cycleControlMode,
  isMobileDevice,
} from "../systems/TiltSettings";
import { getUITheme } from "./ThemeUI";

export function createSettingsToggles(): Container {
  const container = new Container();

  const panelW = Math.min(280, GAME_WIDTH - 20);
  const panelX = (GAME_WIDTH - panelW) / 2;

  const mobile = isMobileDevice();
  // On PC: no "Invert Tilt" row, so panel is shorter
  const panelH = mobile ? 196 : 170;

  // Background panel — opaque enough for text contrast
  const bg = new Graphics();
  bg.roundRect(panelX, -8, panelW, panelH, 10);
  const uiT = getUITheme();
  bg.fill({ color: uiT.buttonBg, alpha: 0.85 });
  bg.roundRect(panelX, -8, panelW, panelH, 10);
  bg.stroke({ width: 1, color: uiT.buttonBorder, alpha: 0.6 });
  container.addChild(bg);

  const headerStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 13,
    fill: uiT.sectionText,
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
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 14,
        fill: "#ffffff",
        fontWeight: "bold",
      }),
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
  addVolumeRow(20, "SFX", getSfxVolume, setSfxVolume);

  // Music volume
  addVolumeRow(44, "Music", getMusicVolume, setMusicVolume);

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

  // Controls mode cycler
  const controlsLabel = new Text({ text: "Controls", style: labelStyle });
  controlsLabel.x = leftX;
  controlsLabel.y = 96;
  container.addChild(controlsLabel);

  const modeStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 14,
    fill: "#44ccff",
    fontWeight: "bold",
  });
  const controlsValue = new Text({ text: getControlMode(), style: modeStyle });
  controlsValue.x = rightX - 40;
  controlsValue.y = 96;
  controlsValue.anchor.set(0.5, 0);
  container.addChild(controlsValue);

  // Invert Tilt toggle — only visible on mobile when motion is selected
  const tiltLabel = new Text({ text: "Invert Tilt", style: labelStyle });
  tiltLabel.x = leftX;
  tiltLabel.y = 122;
  container.addChild(tiltLabel);
  const tiltValue = new Text({
    text: isTiltInverted() ? "ON" : "OFF",
    style: valueStyle(isTiltInverted()),
  });
  tiltValue.x = rightX - 40;
  tiltValue.y = 122;
  tiltValue.anchor.set(0.5, 0);
  container.addChild(tiltValue);
  const tiltHit = new Graphics();
  tiltHit.rect(panelX, 118, panelW, 26);
  tiltHit.fill({ color: 0x000000, alpha: 0.001 });
  tiltHit.eventMode = "static";
  tiltHit.cursor = "pointer";
  tiltHit.on("pointertap", (e: Event) => {
    e.stopPropagation();
    setTiltInverted(!isTiltInverted());
    tiltValue.text = isTiltInverted() ? "ON" : "OFF";
    tiltValue.style = valueStyle(isTiltInverted());
  });
  container.addChild(tiltHit);

  const updateTiltVisibility = () => {
    const show = isMobileDevice() && getControlMode() === "motion";
    tiltLabel.visible = show;
    tiltValue.visible = show;
    tiltHit.visible = show;
  };
  updateTiltVisibility();

  // Hint text showing what the current mode does
  const hintTexts: Record<string, string> = {
    arrows: "Use \u2190 \u2192 arrow keys to move",
    wasd: "Use A / D keys to move",
    click: "Click left/right half to move",
    motion: "Tilt your device to move",
    touch: "Tap left/right half to move",
  };
  const hint = new Text({
    text: hintTexts[getControlMode()] ?? "",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 11,
      fill: "#ccbbaa",
    }),
  });
  hint.x = GAME_WIDTH / 2;
  hint.y = mobile ? 149 : 122;
  hint.anchor.set(0.5, 0);
  container.addChild(hint);

  // Hit area for controls cycler
  const controlsHit = new Graphics();
  controlsHit.rect(panelX, 92, panelW, 26);
  controlsHit.fill({ color: 0x000000, alpha: 0.001 });
  controlsHit.eventMode = "static";
  controlsHit.cursor = "pointer";
  controlsHit.on("pointertap", (e: Event) => {
    e.stopPropagation();
    const next = cycleControlMode();
    controlsValue.text = next;
    hint.text = hintTexts[next] ?? "";
    updateTiltVisibility();
  });
  container.addChild(controlsHit);

  // Make panel interactive so taps don't start the game
  bg.eventMode = "static";
  bg.on("pointertap", (e: Event) => e.stopPropagation());

  return container;
}
