/** Pause overlay for single-player — extracted from GameLauncher. */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { getUITheme } from "../ui/ThemeUI";

export interface PauseMenu {
  overlay: Container;
  onResume: () => void;
  onHome: () => void;
}

export function createPauseMenu(
  onResume: () => void, onHome: () => void,
): Container {
  const uiT = getUITheme();
  const overlay = new Container();
  overlay.visible = false;

  const dim = new Graphics();
  dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  dim.fill({ color: uiT.bg, alpha: 0.7 });
  overlay.addChild(dim);

  const title = new Text({ text: "PAUSED", style: new TextStyle({
    fontFamily: "monospace", fontSize: 28, fill: "#ffffff",
    fontWeight: "bold", stroke: { color: "#000000", width: 3 },
  }) });
  title.x = GAME_WIDTH / 2; title.y = GAME_HEIGHT * 0.3; title.anchor.set(0.5, 0.5);
  overlay.addChild(title);

  // Resume button
  const resumeBg = new Graphics();
  resumeBg.roundRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.42 - 18, 200, 36, 8);
  resumeBg.fill({ color: uiT.buttonBg, alpha: 0.8 });
  resumeBg.roundRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.42 - 18, 200, 36, 8);
  resumeBg.stroke({ width: 1, color: uiT.buttonBorder, alpha: 0.5 });
  resumeBg.eventMode = "static"; resumeBg.cursor = "pointer";
  overlay.addChild(resumeBg);

  const resumeText = new Text({ text: "Resume", style: new TextStyle({
    fontFamily: "monospace", fontSize: 18, fill: uiT.text,
    fontWeight: "bold", stroke: { color: "#000000", width: 2 },
  }) });
  resumeText.x = GAME_WIDTH / 2; resumeText.y = GAME_HEIGHT * 0.42;
  resumeText.anchor.set(0.5, 0.5);
  overlay.addChild(resumeText);

  // Home button
  const homeBg = new Graphics();
  homeBg.roundRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.52 - 18, 200, 36, 8);
  homeBg.fill({ color: 0x222244, alpha: 0.8 });
  homeBg.eventMode = "static"; homeBg.cursor = "pointer";
  overlay.addChild(homeBg);

  const homeText = new Text({ text: "Home", style: new TextStyle({
    fontFamily: "monospace", fontSize: 16, fill: "#aaccff",
    fontWeight: "bold", stroke: { color: "#000000", width: 2 },
  }) });
  homeText.x = GAME_WIDTH / 2; homeText.y = GAME_HEIGHT * 0.52;
  homeText.anchor.set(0.5, 0.5);
  overlay.addChild(homeText);

  resumeBg.on("pointertap", onResume);
  resumeText.eventMode = "static"; resumeText.on("pointertap", onResume);
  homeBg.on("pointertap", onHome);
  homeText.eventMode = "static"; homeText.on("pointertap", onHome);

  return overlay;
}
