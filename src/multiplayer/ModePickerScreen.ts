/**
 * Mode picker for local co-op — shown before the game starts.
 * Host (P1) uses W/S to cycle modes, Enter to confirm.
 */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import type { LocalCoopMode } from "./LocalCoopLauncher";

const MODES: LocalCoopMode[] = ["best-height", "first-to-die", "timed-2min"];
const MODE_LABELS: Record<LocalCoopMode, string> = {
  "best-height": "Best Height",
  "first-to-die": "First to Die",
  "timed-2min": "Timed (2 min)",
};
const MODE_DESCS: Record<LocalCoopMode, string> = {
  "best-height": "Both play until dead. Ghost mode after first death.\nHighest height wins.",
  "first-to-die": "First player to die loses. Fast rounds.",
  "timed-2min": "Both play for 2 minutes. Deaths respawn.\nHighest height at the end wins.",
};

const SPLIT_WIDTH = GAME_WIDTH * 2;

export function showModePicker(
  app: Application,
  onSelect: (mode: LocalCoopMode) => void,
): void {
  const view = new Container();
  let selectedIdx = 0;

  const bg = new Graphics();
  bg.rect(0, 0, SPLIT_WIDTH, GAME_HEIGHT);
  bg.fill({ color: 0x0a0a1a, alpha: 0.95 });
  view.addChild(bg);

  const title = new Text({
    text: "SELECT MODE",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 28,
      fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 3 } }),
  });
  title.x = SPLIT_WIDTH / 2; title.y = 80; title.anchor.set(0.5, 0.5);
  view.addChild(title);

  const hint = new Text({
    text: "P1: W/S to select, Enter to confirm",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 13,
      fill: "#888888", stroke: { color: "#000000", width: 2 } }),
  });
  hint.x = SPLIT_WIDTH / 2; hint.y = 120; hint.anchor.set(0.5, 0.5);
  view.addChild(hint);

  const modeTexts: Text[] = [];
  const descText = new Text({
    text: MODE_DESCS[MODES[0]],
    style: new TextStyle({ fontFamily: "monospace", fontSize: 14,
      fill: "#aaaaaa", align: "center", stroke: { color: "#000000", width: 2 } }),
  });
  descText.x = SPLIT_WIDTH / 2; descText.y = 400; descText.anchor.set(0.5, 0.5);
  view.addChild(descText);

  for (let i = 0; i < MODES.length; i++) {
    const t = new Text({
      text: MODE_LABELS[MODES[i]],
      style: new TextStyle({ fontFamily: "monospace", fontSize: 22,
        fill: i === 0 ? "#ffdd44" : "#666666", fontWeight: "bold",
        stroke: { color: "#000000", width: 3 } }),
    });
    t.x = SPLIT_WIDTH / 2; t.y = 200 + i * 55; t.anchor.set(0.5, 0.5);
    view.addChild(t);
    modeTexts.push(t);
  }

  const updateSelection = () => {
    for (let i = 0; i < modeTexts.length; i++) {
      modeTexts[i].style.fill = i === selectedIdx ? "#ffdd44" : "#666666";
      modeTexts[i].style.fontSize = i === selectedIdx ? 24 : 20;
    }
    descText.text = MODE_DESCS[MODES[selectedIdx]];
  };

  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
      selectedIdx = (selectedIdx - 1 + MODES.length) % MODES.length;
      updateSelection();
    } else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
      selectedIdx = (selectedIdx + 1) % MODES.length;
      updateSelection();
    } else if (e.key === "Enter") {
      window.removeEventListener("keydown", keyHandler);
      app.stage.removeChild(view);
      view.destroy({ children: true });
      onSelect(MODES[selectedIdx]);
    }
  };
  window.addEventListener("keydown", keyHandler);
  app.stage.addChild(view);
}
