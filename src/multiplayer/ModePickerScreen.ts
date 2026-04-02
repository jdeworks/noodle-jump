/**
 * Mode picker for local co-op — shown before the game starts.
 * Host (P1) uses W/S to cycle modes, Enter to confirm.
 */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { CHARACTERS, drawCharacter } from "../rendering/PlayerCharacters";
import { getSelectedCharacter, setSelectedCharacter } from "../systems/CharacterSettings";
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
  onSelect: (mode: LocalCoopMode, p1Char: string, p2Char: string) => void,
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
    text: "W/S: mode  A/D: P1 char  ←/→: P2 char  Enter: start",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 11,
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
  descText.x = SPLIT_WIDTH / 2; descText.y = 380; descText.anchor.set(0.5, 0.5);
  view.addChild(descText);

  // Character pickers for P1 and P2
  let p1CharIdx = CHARACTERS.findIndex(c => c.id === getSelectedCharacter());
  if (p1CharIdx < 0) p1CharIdx = 0;
  let p2CharIdx = (p1CharIdx + 1) % CHARACTERS.length; // default to different char

  const charLabelStyle = new TextStyle({ fontFamily: "monospace", fontSize: 13,
    fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 2 } });
  const charNameStyle = new TextStyle({ fontFamily: "monospace", fontSize: 11,
    fill: "#ffcc44", stroke: { color: "#000000", width: 2 } });

  // P1 character (left side)
  const p1Title = new Text({ text: "P1 (A/D)", style: charLabelStyle });
  p1Title.x = SPLIT_WIDTH / 2 - 100; p1Title.y = 440; p1Title.anchor.set(0.5, 0.5);
  view.addChild(p1Title);
  const p1Gfx = new Graphics();
  p1Gfx.x = SPLIT_WIDTH / 2 - 100 - 12; p1Gfx.y = 455;
  view.addChild(p1Gfx);
  const p1Name = new Text({ text: "", style: charNameStyle });
  p1Name.x = SPLIT_WIDTH / 2 - 100; p1Name.y = 488; p1Name.anchor.set(0.5, 0.5);
  view.addChild(p1Name);

  // P2 character (right side)
  const p2Title = new Text({ text: "P2 (←/→)", style: charLabelStyle });
  p2Title.x = SPLIT_WIDTH / 2 + 100; p2Title.y = 440; p2Title.anchor.set(0.5, 0.5);
  view.addChild(p2Title);
  const p2Gfx = new Graphics();
  p2Gfx.x = SPLIT_WIDTH / 2 + 100 - 12; p2Gfx.y = 455;
  view.addChild(p2Gfx);
  const p2Name = new Text({ text: "", style: charNameStyle });
  p2Name.x = SPLIT_WIDTH / 2 + 100; p2Name.y = 488; p2Name.anchor.set(0.5, 0.5);
  view.addChild(p2Name);

  const updateChars = () => {
    p1Gfx.clear(); drawCharacter(p1Gfx, 24, 30, CHARACTERS[p1CharIdx].id);
    p1Name.text = CHARACTERS[p1CharIdx].name;
    p2Gfx.clear(); drawCharacter(p2Gfx, 24, 30, CHARACTERS[p2CharIdx].id);
    p2Name.text = CHARACTERS[p2CharIdx].name;
  };
  updateChars();

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
    if (e.key === "w" || e.key === "W") {
      selectedIdx = (selectedIdx - 1 + MODES.length) % MODES.length;
      updateSelection();
    } else if (e.key === "s" || e.key === "S") {
      selectedIdx = (selectedIdx + 1) % MODES.length;
      updateSelection();
    } else if (e.key === "a" || e.key === "A") {
      p1CharIdx = (p1CharIdx - 1 + CHARACTERS.length) % CHARACTERS.length;
      updateChars();
    } else if (e.key === "d" || e.key === "D") {
      p1CharIdx = (p1CharIdx + 1) % CHARACTERS.length;
      updateChars();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      p2CharIdx = (p2CharIdx - 1 + CHARACTERS.length) % CHARACTERS.length;
      updateChars();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      p2CharIdx = (p2CharIdx + 1) % CHARACTERS.length;
      updateChars();
    } else if (e.key === "Enter") {
      window.removeEventListener("keydown", keyHandler);
      setSelectedCharacter(CHARACTERS[p1CharIdx].id);
      app.stage.removeChild(view);
      view.destroy({ children: true });
      onSelect(MODES[selectedIdx], CHARACTERS[p1CharIdx].id, CHARACTERS[p2CharIdx].id);
    }
  };
  window.addEventListener("keydown", keyHandler);
  app.stage.addChild(view);
}
