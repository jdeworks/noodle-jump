/** Results overlay for local co-op — extracted from LocalCoopLauncher. */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GameScene } from "../scenes/GameScene";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

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
  const { app, scene1, scene2, p1DeathHeight: h1, p2DeathHeight: h2,
    mode, p1Dead, p2Dead, cleanupAndReset, cleanupAndGoHome } = params;

  const overlay = new Graphics();
  overlay.rect(0, 0, SPLIT_WIDTH, GAME_HEIGHT);
  overlay.fill({ color: 0x000000, alpha: 0.7 });
  app.stage.addChild(overlay);

  // Always use max height for comparison (death penalties reduce current height)
  const cmpH1 = scene1.getMaxHeight();
  const cmpH2 = scene2.getMaxHeight();
  let winner: string;
  if (mode === "first-to-die") {
    winner = p1Dead && !p2Dead ? "Player 2 Wins!" : !p1Dead && p2Dead ? "Player 1 Wins!" : "It's a Tie!";
  } else {
    winner = cmpH1 > cmpH2 ? "Player 1 Wins!" : cmpH2 > cmpH1 ? "Player 2 Wins!" : "It's a Tie!";
  }
  if (mode === "timed-2min") winner = "Time's Up! " + winner;
  const winnerText = new Text({
    text: winner,
    style: new TextStyle({
      fontFamily: "monospace", fontSize: 32, fill: "#ffdd44",
      fontWeight: "bold", stroke: { color: "#000000", width: 4 },
    }),
  });
  winnerText.x = SPLIT_WIDTH / 2;
  winnerText.y = GAME_HEIGHT * 0.25;
  winnerText.anchor.set(0.5, 0.5);
  app.stage.addChild(winnerText);

  const compStyle = new TextStyle({
    fontFamily: "monospace", fontSize: 16, fill: "#ffffff",
    stroke: { color: "#000000", width: 2 },
  });
  const lines = [
    `P1 Height: ${cmpH1}m    |    P2 Height: ${cmpH2}m`,
    `P1 Score:  ${scene1.getScore()}    |    P2 Score:  ${scene2.getScore()}`,
    `P1 Platforms: ${scene1.getPlatformsPassed()}    |    P2 Platforms: ${scene2.getPlatformsPassed()}`,
  ];
  lines.forEach((line, i) => {
    const t = new Text({ text: line, style: compStyle });
    t.x = SPLIT_WIDTH / 2; t.y = GAME_HEIGHT * 0.38 + i * 24; t.anchor.set(0.5, 0.5);
    app.stage.addChild(t);
  });

  // Rematch (Enter) or Quit (Escape)
  const hintText = new Text({
    text: "Enter = Rematch    Escape = Quit",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 14, fill: "#aaaaaa",
      stroke: { color: "#000000", width: 2 } }),
  });
  hintText.x = SPLIT_WIDTH / 2; hintText.y = GAME_HEIGHT * 0.56;
  hintText.anchor.set(0.5, 0.5); app.stage.addChild(hintText);

  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      window.removeEventListener("keydown", keyHandler);
      setTimeout(() => cleanupAndReset(), 0);
    } else if (e.key === "Escape") {
      window.removeEventListener("keydown", keyHandler);
      setTimeout(() => cleanupAndGoHome(), 0);
    }
  };
  window.addEventListener("keydown", keyHandler);
}
