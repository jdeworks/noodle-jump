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

  let winner: string;
  if (mode === "first-to-die") {
    // Survivor wins — if both dead simultaneously, use height
    winner = p1Dead && !p2Dead ? "Player 2 Wins!" : !p1Dead && p2Dead ? "Player 1 Wins!" : "It's a Tie!";
  } else {
    winner = h1 > h2 ? "Player 1 Wins!" : h2 > h1 ? "Player 2 Wins!" : "It's a Tie!";
  }
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
    `P1 Height: ${h1}m    |    P2 Height: ${h2}m`,
    `P1 Score:  ${scene1.getScore()}    |    P2 Score:  ${scene2.getScore()}`,
    `P1 Platforms: ${scene1.getPlatformsPassed()}    |    P2 Platforms: ${scene2.getPlatformsPassed()}`,
  ];
  lines.forEach((line, i) => {
    const t = new Text({ text: line, style: compStyle });
    t.x = SPLIT_WIDTH / 2; t.y = GAME_HEIGHT * 0.38 + i * 24; t.anchor.set(0.5, 0.5);
    app.stage.addChild(t);
  });

  // Rematch ready-up: P1 presses W, P2 presses Up
  let p1Ready = false, p2Ready = false;
  const readyStyle = () => new TextStyle({
    fontFamily: "monospace", fontSize: 14, fill: "#aaaaaa",
    stroke: { color: "#000000", width: 2 },
  });
  const p1ReadyText = new Text({ text: "P1: Press W to rematch", style: readyStyle() });
  p1ReadyText.x = SPLIT_WIDTH / 2; p1ReadyText.y = GAME_HEIGHT * 0.53;
  p1ReadyText.anchor.set(0.5, 0.5); app.stage.addChild(p1ReadyText);

  const p2ReadyText = new Text({ text: "P2: Press \u2191 to rematch", style: readyStyle() });
  p2ReadyText.x = SPLIT_WIDTH / 2; p2ReadyText.y = GAME_HEIGHT * 0.58;
  p2ReadyText.anchor.set(0.5, 0.5); app.stage.addChild(p2ReadyText);

  const rematchKeyHandler = (e: KeyboardEvent) => {
    if ((e.key === "w" || e.key === "W") && !p1Ready) {
      p1Ready = true;
      p1ReadyText.text = "P1: Ready!";
      p1ReadyText.style.fill = "#44ff44";
    }
    if (e.key === "ArrowUp" && !p2Ready) {
      p2Ready = true;
      p2ReadyText.text = "P2: Ready!";
      p2ReadyText.style.fill = "#44ff44";
    }
    if (p1Ready && p2Ready) {
      window.removeEventListener("keydown", rematchKeyHandler);
      setTimeout(() => cleanupAndReset(), 0);
    }
  };
  window.addEventListener("keydown", rematchKeyHandler);

  // Home — press Escape
  const homeHint = new Text({
    text: "Press Escape to quit",
    style: new TextStyle({
      fontFamily: "monospace", fontSize: 12, fill: "#888888",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  homeHint.x = SPLIT_WIDTH / 2; homeHint.y = GAME_HEIGHT * 0.65;
  homeHint.anchor.set(0.5, 0.5); app.stage.addChild(homeHint);

  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      window.removeEventListener("keydown", rematchKeyHandler);
      window.removeEventListener("keydown", escapeHandler);
      setTimeout(() => cleanupAndGoHome(), 0);
    }
  };
  window.addEventListener("keydown", escapeHandler);
}
