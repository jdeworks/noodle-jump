/** Results overlay for local co-op — extracted from LocalCoopLauncher. */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GameScene } from "../scenes/GameScene";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { getUITheme } from "../ui/ThemeUI";

const SPLIT_WIDTH = GAME_WIDTH * 2;

interface ResultsParams {
  app: Application;
  scene1: GameScene;
  scene2: GameScene;
  p1DeathHeight: number;
  p2DeathHeight: number;
  mode?: string;
  p1Dead?: boolean;
  p2Dead?: boolean;
  cleanupAndReset: () => void;
  cleanupAndGoHome: () => void;
}

export function showLocalCoopResults(params: ResultsParams): void {
  const {
    app,
    scene1,
    scene2,
    mode,
    p1Dead,
    p2Dead,
    cleanupAndReset,
    cleanupAndGoHome,
  } = params;

  const uiT = getUITheme();
  const overlay = new Graphics();
  overlay.rect(0, 0, SPLIT_WIDTH, GAME_HEIGHT);
  overlay.fill({ color: uiT.bg, alpha: 0.7 });
  app.stage.addChild(overlay);

  // Always use max height for comparison (death penalties reduce current height)
  const cmpH1 = scene1.getMaxHeight();
  const cmpH2 = scene2.getMaxHeight();
  let winner: string;
  if (mode === "first-to-die") {
    winner =
      p1Dead && !p2Dead
        ? "Player 2 Wins!"
        : !p1Dead && p2Dead
          ? "Player 1 Wins!"
          : "It's a Tie!";
  } else {
    winner =
      cmpH1 > cmpH2
        ? "Player 1 Wins!"
        : cmpH2 > cmpH1
          ? "Player 2 Wins!"
          : "It's a Tie!";
  }
  if (mode === "timed-2min") winner = "Time's Up! " + winner;
  const winnerText = new Text({
    text: winner,
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 32,
      fill: "#ffdd44",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 4 },
    }),
  });
  winnerText.x = SPLIT_WIDTH / 2;
  winnerText.y = GAME_HEIGHT * 0.25;
  winnerText.anchor.set(0.5, 0.5);
  app.stage.addChild(winnerText);

  const compStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 16,
    fill: "#ffffff",
    stroke: { color: "#000000", width: 2 },
  });
  const lines = [
    `P1 Height: ${cmpH1}m    |    P2 Height: ${cmpH2}m`,
    `P1 Score:  ${scene1.getScore()}    |    P2 Score:  ${scene2.getScore()}`,
    `P1 Platforms: ${scene1.getPlatformsPassed()}    |    P2 Platforms: ${scene2.getPlatformsPassed()}`,
  ];
  lines.forEach((line, i) => {
    const t = new Text({ text: line, style: compStyle });
    t.x = SPLIT_WIDTH / 2;
    t.y = GAME_HEIGHT * 0.38 + i * 24;
    t.anchor.set(0.5, 0.5);
    app.stage.addChild(t);
  });

  // Rematch + Quit buttons (tappable + keyboard)
  const btnY = GAME_HEIGHT * 0.54;
  const rematchBg = new Graphics();
  rematchBg.roundRect(SPLIT_WIDTH / 2 - 100, btnY - 18, 200, 36, 10);
  rematchBg.fill({ color: uiT.buttonBg, alpha: 0.9 });
  rematchBg.roundRect(SPLIT_WIDTH / 2 - 100, btnY - 18, 200, 36, 10);
  rematchBg.stroke({ width: 1.5, color: uiT.buttonBorder, alpha: 0.5 });
  rematchBg.eventMode = "static"; rematchBg.cursor = "pointer";
  app.stage.addChild(rematchBg);
  const rematchText = new Text({ text: "Rematch", style: new TextStyle({ fontFamily: "monospace", fontSize: 18, fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 2 } }) });
  rematchText.x = SPLIT_WIDTH / 2; rematchText.y = btnY; rematchText.anchor.set(0.5, 0.5);
  rematchText.eventMode = "static"; rematchText.cursor = "pointer"; app.stage.addChild(rematchText);
  const doRematch = () => { window.removeEventListener("keydown", keyHandler); setTimeout(() => cleanupAndReset(), 0); };
  rematchBg.on("pointertap", doRematch); rematchText.on("pointertap", doRematch);

  const quitBg = new Graphics();
  quitBg.roundRect(SPLIT_WIDTH / 2 - 80, btnY + 30, 160, 30, 8);
  quitBg.fill({ color: 0x222244, alpha: 0.8 });
  quitBg.eventMode = "static"; quitBg.cursor = "pointer"; app.stage.addChild(quitBg);
  const quitText = new Text({ text: "Leave", style: new TextStyle({ fontFamily: "monospace", fontSize: 15, fill: "#aaccff", fontWeight: "bold", stroke: { color: "#000000", width: 2 } }) });
  quitText.x = SPLIT_WIDTH / 2; quitText.y = btnY + 45; quitText.anchor.set(0.5, 0.5);
  quitText.eventMode = "static"; quitText.cursor = "pointer"; app.stage.addChild(quitText);
  const doQuit = () => { window.removeEventListener("keydown", keyHandler); setTimeout(() => cleanupAndGoHome(), 0); };
  quitBg.on("pointertap", doQuit); quitText.on("pointertap", doQuit);

  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === "Enter") doRematch();
    else if (e.key === "Escape") doQuit();
  };
  window.addEventListener("keydown", keyHandler);
}
