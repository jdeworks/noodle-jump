/**
 * Mode picker for local co-op — shown before the game starts.
 * Host (P1) uses W/S to cycle modes, Enter to confirm.
 */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { CHARACTERS, drawCharacter } from "../rendering/PlayerCharacters";
import { getSelectedCharacter, setSelectedCharacter } from "../systems/CharacterSettings";
import { getUITheme } from "../ui/ThemeUI";
import type { LocalCoopMode } from "./LocalCoopLauncher";
import type { RunConfig } from "../systems/CustomRunConfig";
import { loadRunConfigFromStorage, loadDebugConfigFromStorage } from "../ui/CustomRunStorage";
import { setDebugConfig } from "../config/debug";

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
  onSelect: (mode: LocalCoopMode, p1Char: string, p2Char: string, runConfig?: RunConfig) => void,
): void {
  const view = new Container();
  let selectedIdx = 0;
  let useCustom = false;
  const uiT = getUITheme();

  const bg = new Graphics();
  bg.rect(0, 0, SPLIT_WIDTH, GAME_HEIGHT);
  bg.fill({ color: uiT.bg, alpha: 0.95 });
  view.addChild(bg);

  const title = new Text({
    text: "SELECT MODE",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 28,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 3 },
    }),
  });
  title.x = SPLIT_WIDTH / 2;
  title.y = 40;
  title.anchor.set(0.5, 0.5);
  view.addChild(title);

  const hint = new Text({
    text: "W/S: mode  A/D: P1 char  ←/→: P2 char  Enter: start  Esc: back",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 11,
      fill: "#888888",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  hint.x = SPLIT_WIDTH / 2;
  hint.y = 68;
  hint.anchor.set(0.5, 0.5);
  view.addChild(hint);

  const modeTexts: Text[] = [];
  const descText = new Text({
    text: MODE_DESCS[MODES[0]],
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 14,
      fill: "#aaaaaa",
      align: "center",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  descText.x = SPLIT_WIDTH / 2;
  descText.y = 290;
  descText.anchor.set(0.5, 0.5);
  view.addChild(descText);

  // Character pickers for P1 and P2
  let p1CharIdx = CHARACTERS.findIndex((c) => c.id === getSelectedCharacter());
  if (p1CharIdx < 0) p1CharIdx = 0;
  let p2CharIdx = (p1CharIdx + 1) % CHARACTERS.length; // default to different char

  const charLabelStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 13,
    fill: "#ffffff",
    fontWeight: "bold",
    stroke: { color: "#000000", width: 2 },
  });
  const charNameStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 11,
    fill: "#ffcc44",
    stroke: { color: "#000000", width: 2 },
  });

  // P1 character (left side)
  const charY = 340;
  const p1Title = new Text({ text: "P1 (tap/A/D)", style: charLabelStyle });
  p1Title.x = SPLIT_WIDTH / 2 - 100;
  p1Title.y = charY;
  p1Title.anchor.set(0.5, 0.5);
  view.addChild(p1Title);
  const p1Gfx = new Graphics();
  p1Gfx.x = SPLIT_WIDTH / 2 - 100 - 12;
  p1Gfx.y = charY + 15;
  view.addChild(p1Gfx);
  const p1Name = new Text({ text: "", style: charNameStyle });
  p1Name.x = SPLIT_WIDTH / 2 - 100;
  p1Name.y = charY + 48;
  p1Name.anchor.set(0.5, 0.5);
  view.addChild(p1Name);

  // P2 character (right side)
  const p2Title = new Text({ text: "P2 (tap/←/→)", style: charLabelStyle });
  p2Title.x = SPLIT_WIDTH / 2 + 100;
  p2Title.y = charY;
  p2Title.anchor.set(0.5, 0.5);
  view.addChild(p2Title);
  const p2Gfx = new Graphics();
  p2Gfx.x = SPLIT_WIDTH / 2 + 100 - 12;
  p2Gfx.y = charY + 15;
  view.addChild(p2Gfx);
  const p2Name = new Text({ text: "", style: charNameStyle });
  p2Name.x = SPLIT_WIDTH / 2 + 100;
  p2Name.y = charY + 48;
  p2Name.anchor.set(0.5, 0.5);
  view.addChild(p2Name);

  const updateChars = () => {
    p1Gfx.clear();
    drawCharacter(p1Gfx, 24, 30, CHARACTERS[p1CharIdx].id);
    p1Name.text = CHARACTERS[p1CharIdx].name;
    p2Gfx.clear();
    drawCharacter(p2Gfx, 24, 30, CHARACTERS[p2CharIdx].id);
    p2Name.text = CHARACTERS[p2CharIdx].name;
  };
  updateChars();

  // Clickable character cycling
  p1Title.eventMode = "static";
  p1Title.cursor = "pointer";
  p1Title.on("pointertap", () => {
    p1CharIdx = (p1CharIdx + 1) % CHARACTERS.length;
    updateChars();
  });
  p1Name.eventMode = "static";
  p1Name.cursor = "pointer";
  p1Name.on("pointertap", () => {
    p1CharIdx = (p1CharIdx + 1) % CHARACTERS.length;
    updateChars();
  });
  p2Title.eventMode = "static";
  p2Title.cursor = "pointer";
  p2Title.on("pointertap", () => {
    p2CharIdx = (p2CharIdx + 1) % CHARACTERS.length;
    updateChars();
  });
  p2Name.eventMode = "static";
  p2Name.cursor = "pointer";
  p2Name.on("pointertap", () => {
    p2CharIdx = (p2CharIdx + 1) % CHARACTERS.length;
    updateChars();
  });

  // Custom run toggle
  const customLabel = new Text({
    text: "Custom Run: OFF (tap to toggle)",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 13,
      fill: "#888888",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  customLabel.x = SPLIT_WIDTH / 2;
  customLabel.y = 430;
  customLabel.anchor.set(0.5, 0.5);
  customLabel.eventMode = "static";
  customLabel.cursor = "pointer";
  customLabel.on("pointertap", () => {
    useCustom = !useCustom;
    customLabel.text = useCustom
      ? "Custom Run: ON (uses saved settings)"
      : "Custom Run: OFF (tap to toggle)";
    customLabel.style.fill = useCustom ? "#44ff44" : "#888888";
  });
  view.addChild(customLabel);

  // Start button (clickable)
  const startBtnY = 480;
  const startBg = new Graphics();
  startBg.roundRect(SPLIT_WIDTH / 2 - 110, startBtnY - 22, 220, 44, 10);
  startBg.fill({ color: uiT.buttonBg, alpha: 0.9 });
  startBg.roundRect(SPLIT_WIDTH / 2 - 110, startBtnY - 22, 220, 44, 10);
  startBg.stroke({ width: 1.5, color: uiT.buttonBorder, alpha: 0.5 });
  startBg.eventMode = "static";
  startBg.cursor = "pointer";
  view.addChild(startBg);
  const startText = new Text({
    text: "Start Game",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 20,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  startText.x = SPLIT_WIDTH / 2;
  startText.y = startBtnY;
  startText.anchor.set(0.5, 0.5);
  startText.eventMode = "static";
  startText.cursor = "pointer";
  view.addChild(startText);
  const doStart = () => {
    window.removeEventListener("keydown", keyHandler);
    setSelectedCharacter(CHARACTERS[p1CharIdx].id);
    app.stage.removeChild(view);
    view.destroy({ children: true });
    if (useCustom) {
      const cfg = loadRunConfigFromStorage();
      setDebugConfig(loadDebugConfigFromStorage());
      onSelect(MODES[selectedIdx], CHARACTERS[p1CharIdx].id, CHARACTERS[p2CharIdx].id, cfg);
    } else {
      onSelect(MODES[selectedIdx], CHARACTERS[p1CharIdx].id, CHARACTERS[p2CharIdx].id);
    }
  };
  startBg.on("pointertap", doStart);
  startText.on("pointertap", doStart);

  for (let i = 0; i < MODES.length; i++) {
    const by = 120 + i * 50;
    const btnBg = new Graphics();
    btnBg.roundRect(SPLIT_WIDTH / 2 - 160, by - 20, 320, 42, 8);
    btnBg.fill({ color: uiT.buttonBg, alpha: 0.6 });
    btnBg.eventMode = "static";
    btnBg.cursor = "pointer";
    btnBg.on("pointertap", () => {
      selectedIdx = i;
      updateSelection();
    });
    view.addChild(btnBg);

    const t = new Text({
      text: MODE_LABELS[MODES[i]],
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 20,
        fill: i === 0 ? "#ffdd44" : "#666666",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 3 },
      }),
    });
    t.x = SPLIT_WIDTH / 2;
    t.y = by;
    t.anchor.set(0.5, 0.5);
    t.eventMode = "static";
    t.cursor = "pointer";
    t.on("pointertap", () => {
      selectedIdx = i;
      updateSelection();
    });
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
      doStart();
    } else if (e.key === "Escape") {
      window.removeEventListener("keydown", keyHandler);
      app.stage.removeChild(view);
      view.destroy({ children: true });
      // Re-show title screen
      import("../ui/TitleScreenView").then(({ showTitleScreen }) =>
        import("../scenes/GameLauncher").then(({ launchGame }) =>
          showTitleScreen(app, (rc) => launchGame(app, rc)),
        ),
      );
    }
  };
  window.addEventListener("keydown", keyHandler);
  app.stage.addChild(view);
}
