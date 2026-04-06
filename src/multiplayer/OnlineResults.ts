/** Results overlay for online multiplayer — sorted leaderboard for N players. */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

export interface PlayerResult {
  peerId: string;
  label: string;
  height: number;
  score: number;
  isLocal: boolean;
  color: number;
}

const PEER_COLORS = [
  0xff8833, 0x33cc55, 0x3388ff, 0xff33aa,
  0xffcc44, 0x33cccc, 0xcc33ff, 0xff5555,
];

export function getPeerColor(index: number): number {
  return PEER_COLORS[index % PEER_COLORS.length];
}

export function showOnlineResults(
  app: Application,
  results: PlayerResult[],
  mode: string,
  onRematch: () => void,
  onLeave: () => void,
): void {
  const cx = GAME_WIDTH / 2;
  const sorted = [...results].sort((a, b) => b.height - a.height);
  const localRank = sorted.findIndex((r) => r.isLocal);
  const winner = localRank === 0 ? "You Win!" : localRank === sorted.length - 1 ? "You Lose!" : `#${localRank + 1}`;

  const bg = new Graphics();
  bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  bg.fill({ color: 0x000000, alpha: 0.75 });
  app.stage.addChild(bg);

  const wt = new Text({
    text: mode === "timed-2min" ? `Time's Up! ${winner}` : winner,
    style: new TextStyle({
      fontFamily: "monospace", fontSize: 26, fontWeight: "bold",
      fill: localRank === 0 ? "#44ff44" : "#ffdd44",
      stroke: { color: "#000000", width: 4 },
    }),
  });
  wt.x = cx; wt.y = 60; wt.anchor.set(0.5, 0.5);
  app.stage.addChild(wt);

  const rowStyle = new TextStyle({
    fontFamily: "monospace", fontSize: 13, fill: "#ffffff",
    stroke: { color: "#000000", width: 2 },
  });

  const maxRows = Math.min(sorted.length, 12);
  for (let i = 0; i < maxRows; i++) {
    const r = sorted[i];
    const y = 100 + i * 24;

    // Color dot
    const dot = new Graphics();
    dot.circle(cx - 140, y, 5);
    dot.fill(r.color);
    app.stage.addChild(dot);

    // Rank + label + height
    const isMe = r.isLocal;
    const txt = new Text({
      text: `${i + 1}. ${r.label}  ${r.height}m`,
      style: new TextStyle({
        ...rowStyle, fill: isMe ? "#ffdd44" : "#ffffff",
        fontWeight: isMe ? "bold" : "normal",
      }),
    });
    txt.x = cx - 125; txt.y = y; txt.anchor.set(0, 0.5);
    app.stage.addChild(txt);
  }

  if (sorted.length > maxRows) {
    const more = new Text({
      text: `+${sorted.length - maxRows} more`,
      style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#888888" }),
    });
    more.x = cx; more.y = 100 + maxRows * 24;
    more.anchor.set(0.5, 0.5);
    app.stage.addChild(more);
  }

  const btnY = Math.min(120 + maxRows * 24 + 30, GAME_HEIGHT - 120);
  const rematchBg = makeBtn(app, cx, btnY, 180, 36, 0x1a3355, true);
  const rematchTx = makeLbl(app, "Rematch", cx, btnY, 18);
  rematchBg.on("pointertap", () => setTimeout(onRematch, 0));
  rematchTx.on("pointertap", () => setTimeout(onRematch, 0));

  const leaveBg = makeBtn(app, cx, btnY + 46, 180, 32, 0x222244, false);
  const leaveTx = makeLbl(app, "Leave", cx, btnY + 46, 15);
  leaveBg.on("pointertap", () => setTimeout(onLeave, 0));
  leaveTx.on("pointertap", () => setTimeout(onLeave, 0));
}

function makeBtn(app: Application, x: number, y: number, w: number, h: number, color: number, stroke: boolean): Graphics {
  const g = new Graphics();
  g.roundRect(x - w / 2, y - h / 2, w, h, 10);
  g.fill({ color, alpha: 0.9 });
  if (stroke) { g.roundRect(x - w / 2, y - h / 2, w, h, 10); g.stroke({ width: 1.5, color: 0x6688bb, alpha: 0.5 }); }
  g.eventMode = "static"; g.cursor = "pointer";
  app.stage.addChild(g);
  return g;
}

function makeLbl(app: Application, text: string, x: number, y: number, size: number): Text {
  const t = new Text({
    text,
    style: new TextStyle({
      fontFamily: "monospace", fontSize: size, fill: "#ffffff",
      fontWeight: "bold", stroke: { color: "#000000", width: 2 },
    }),
  });
  t.x = x; t.y = y; t.anchor.set(0.5, 0.5);
  t.eventMode = "static"; t.cursor = "pointer";
  app.stage.addChild(t);
  return t;
}
