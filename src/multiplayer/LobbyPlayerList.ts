/**
 * Player list rendering for the multiplayer lobby.
 * Extracted from LobbyUI to keep files under 400 LOC.
 */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH } from "../config/constants";
import { drawCharacter } from "../rendering/PlayerCharacters";
import { getPeerColor } from "./OnlineResults";
import type { LobbyPlayer } from "./LobbyCountdown";
import { SMALL } from "./LobbyUI";

export function renderPlayerList(
  playerListContainer: Container,
  playerCountText: Text,
  localName: string,
  localChar: string,
  localReady: boolean,
  remotePlayers: Map<string, LobbyPlayer>,
  role: string,
  kickPlayer: (id: string) => void,
): void {
  playerListContainer.removeChildren();
  const cx = GAME_WIDTH / 2;
  let y = 0;
  const hdr = new Text({ text: "─── Players ───", style: SMALL });
  hdr.x = cx;
  hdr.y = y;
  hdr.anchor.set(0.5, 0.5);
  playerListContainer.addChild(hdr);
  y += 16;
  renderPlayerRow(playerListContainer, cx, y, localName || "You", localChar, localReady, 0);
  y += 22;
  for (const p of remotePlayers.values()) {
    renderPlayerRow(
      playerListContainer,
      cx,
      y,
      p.name || p.peerId.slice(0, 6),
      p.character,
      p.ready,
      p.colorIndex,
      role === "host" ? p.peerId : undefined,
      kickPlayer,
    );
    y += 22;
  }
  playerCountText.text = `Players: ${1 + remotePlayers.size}`;
}

function renderPlayerRow(
  parent: Container,
  cx: number,
  y: number,
  label: string,
  charId: string,
  ready: boolean,
  ci: number,
  kickId?: string,
  kickPlayer?: (id: string) => void,
): void {
  const d = new Graphics();
  d.circle(cx - 120, y, 4);
  d.fill(getPeerColor(ci));
  parent.addChild(d);
  const g = new Graphics();
  g.x = cx - 100;
  g.y = y - 10;
  drawCharacter(g, 16, 20, charId);
  parent.addChild(g);
  const rs = new TextStyle({
    fontFamily: "monospace",
    fontSize: 11,
    fill: "#ffffff",
    stroke: { color: "#000000", width: 1 },
  });
  const n = new Text({ text: label, style: rs });
  n.x = cx - 75;
  n.y = y;
  n.anchor.set(0, 0.5);
  parent.addChild(n);
  const s = new Text({
    text: ready ? "Ready" : "...",
    style: new TextStyle({ ...rs, fill: ready ? "#44ff44" : "#888888" }),
  });
  s.x = cx + 80;
  s.y = y;
  s.anchor.set(0, 0.5);
  parent.addChild(s);
  if (kickId && kickPlayer) {
    const k = new Text({
      text: "\u2715",
      style: new TextStyle({ ...rs, fontSize: 14, fill: "#ff4444" }),
    });
    k.x = cx + 115;
    k.y = y;
    k.anchor.set(0.5, 0.5);
    k.eventMode = "static";
    k.cursor = "pointer";
    k.on("pointertap", () => kickPlayer(kickId));
    parent.addChild(k);
  }
}
