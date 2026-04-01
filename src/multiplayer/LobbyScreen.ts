/**
 * Multiplayer lobby — shows both players, ready-up, mode selection.
 * Host controls mode and triggers game start.
 * Communicates ready/start/seed via GameSync events.
 */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import type { GameSync, GameSyncEvent } from "./GameSync";

export type LobbyRole = "host" | "guest";

export interface LobbyCallbacks {
  onStart: (seed: number, mode: string) => void;
}

const HEADER_STYLE = new TextStyle({
  fontFamily: "monospace",
  fontSize: 24,
  fill: "#ffffff",
  fontWeight: "bold",
  stroke: { color: "#000000", width: 3 },
});

const LABEL_STYLE = new TextStyle({
  fontFamily: "monospace",
  fontSize: 16,
  fill: "#ffffff",
  stroke: { color: "#000000", width: 2 },
});

const STATUS_STYLE = new TextStyle({
  fontFamily: "monospace",
  fontSize: 14,
  fill: "#aaaaaa",
  stroke: { color: "#000000", width: 2 },
});

export class LobbyScreen {
  readonly container = new Container();
  private role: LobbyRole;
  private sync: GameSync;
  private callbacks: LobbyCallbacks;

  private hostReady = false;
  private guestReady = false;
  private mode = "best-height";

  private p1StatusText: Text;
  private p2StatusText: Text;
  private startBtn: Graphics;
  private startText: Text;
  private waitingText: Text;

  constructor(role: LobbyRole, sync: GameSync, callbacks: LobbyCallbacks) {
    this.role = role;
    this.sync = sync;
    this.callbacks = callbacks;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x0a0a1a, alpha: 0.95 });
    this.container.addChild(bg);

    // Title
    const title = new Text({ text: "LOBBY", style: HEADER_STYLE });
    title.x = GAME_WIDTH / 2;
    title.y = 60;
    title.anchor.set(0.5, 0.5);
    this.container.addChild(title);

    // Role label
    const roleText = new Text({
      text: role === "host" ? "You are the Host" : "You are the Guest",
      style: STATUS_STYLE,
    });
    roleText.x = GAME_WIDTH / 2;
    roleText.y = 90;
    roleText.anchor.set(0.5, 0.5);
    this.container.addChild(roleText);

    // Player 1 (Host)
    const p1Label = new Text({ text: "Player 1 (Host)", style: LABEL_STYLE });
    p1Label.x = GAME_WIDTH / 2;
    p1Label.y = 150;
    p1Label.anchor.set(0.5, 0.5);
    this.container.addChild(p1Label);

    this.p1StatusText = new Text({ text: "Not Ready", style: STATUS_STYLE });
    this.p1StatusText.x = GAME_WIDTH / 2;
    this.p1StatusText.y = 175;
    this.p1StatusText.anchor.set(0.5, 0.5);
    this.container.addChild(this.p1StatusText);

    // Player 2 (Guest)
    const p2Label = new Text({ text: "Player 2 (Guest)", style: LABEL_STYLE });
    p2Label.x = GAME_WIDTH / 2;
    p2Label.y = 220;
    p2Label.anchor.set(0.5, 0.5);
    this.container.addChild(p2Label);

    this.p2StatusText = new Text({ text: "Not Ready", style: STATUS_STYLE });
    this.p2StatusText.x = GAME_WIDTH / 2;
    this.p2StatusText.y = 245;
    this.p2StatusText.anchor.set(0.5, 0.5);
    this.container.addChild(this.p2StatusText);

    // Mode selection (host can cycle, guest sees current)
    const MODES = ["best-height", "first-to-die", "timed-2min"] as const;
    const MODE_LABELS: Record<string, string> = {
      "best-height": "Best Height", "first-to-die": "First to Die", "timed-2min": "Timed (2 min)",
    };
    const modeLabel = new Text({ text: `Mode: ${MODE_LABELS[this.mode]}`, style: LABEL_STYLE });
    modeLabel.x = GAME_WIDTH / 2; modeLabel.y = 300; modeLabel.anchor.set(0.5, 0.5);
    this.container.addChild(modeLabel);
    if (role === "host") {
      modeLabel.eventMode = "static"; modeLabel.cursor = "pointer";
      modeLabel.on("pointertap", () => {
        const idx = MODES.indexOf(this.mode as typeof MODES[number]);
        this.mode = MODES[(idx + 1) % MODES.length];
        modeLabel.text = `Mode: ${MODE_LABELS[this.mode]} (tap to change)`;
        this.sync.sendGameEvent({ type: "ready", payload: { mode: this.mode } });
      });
      modeLabel.text = `Mode: ${MODE_LABELS[this.mode]} (tap to change)`;
    }

    // Ready button
    const readyBtnY = 370;
    const readyBg = new Graphics();
    readyBg.roundRect(GAME_WIDTH / 2 - 100, readyBtnY - 20, 200, 40, 10);
    readyBg.fill({ color: 0x2a6e3f, alpha: 0.9 });
    readyBg.roundRect(GAME_WIDTH / 2 - 100, readyBtnY - 20, 200, 40, 10);
    readyBg.stroke({ width: 1.5, color: 0x44bb66, alpha: 0.5 });
    readyBg.eventMode = "static";
    readyBg.cursor = "pointer";
    this.container.addChild(readyBg);

    const readyText = new Text({
      text: "Ready",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 18,
        fill: "#ffffff",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    readyText.x = GAME_WIDTH / 2;
    readyText.y = readyBtnY;
    readyText.anchor.set(0.5, 0.5);
    readyText.eventMode = "static";
    readyText.cursor = "pointer";
    this.container.addChild(readyText);

    const toggleReady = () => {
      if (this.role === "host") {
        this.hostReady = !this.hostReady;
      } else {
        this.guestReady = !this.guestReady;
      }
      readyText.text = this.isLocalReady() ? "Not Ready" : "Ready";
      readyBg.clear();
      readyBg.roundRect(GAME_WIDTH / 2 - 100, readyBtnY - 20, 200, 40, 10);
      readyBg.fill({ color: this.isLocalReady() ? 0x993333 : 0x2a6e3f, alpha: 0.9 });
      readyBg.roundRect(GAME_WIDTH / 2 - 100, readyBtnY - 20, 200, 40, 10);
      readyBg.stroke({ width: 1.5, color: this.isLocalReady() ? 0xbb4444 : 0x44bb66, alpha: 0.5 });

      this.sync.sendGameEvent({
        type: "ready",
        payload: { ready: this.isLocalReady(), role: this.role },
      });
      this.updateUI();
    };
    readyBg.on("pointertap", toggleReady);
    readyText.on("pointertap", toggleReady);

    // Start button (host only)
    const startBtnY = 440;
    this.startBtn = new Graphics();
    this.startText = new Text({
      text: "Start Game",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 20,
        fill: "#ffffff",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    this.startText.x = GAME_WIDTH / 2;
    this.startText.y = startBtnY;
    this.startText.anchor.set(0.5, 0.5);

    if (role === "host") {
      this.renderStartButton(startBtnY, false);
      this.container.addChild(this.startBtn);
      this.startText.eventMode = "static";
      this.startText.cursor = "pointer";
      this.container.addChild(this.startText);

      const startGame = () => {
        if (!this.hostReady || !this.guestReady) return;
        const seed = Math.floor(Math.random() * 0xffffffff);
        this.sync.sendGameEvent({
          type: "start",
          payload: { seed, mode: this.mode },
        });
        this.callbacks.onStart(seed, this.mode);
      };
      this.startBtn.on("pointertap", startGame);
      this.startText.on("pointertap", startGame);
    }

    // Waiting text (guest only)
    this.waitingText = new Text({
      text: "Waiting for host to start...",
      style: STATUS_STYLE,
    });
    this.waitingText.x = GAME_WIDTH / 2;
    this.waitingText.y = startBtnY;
    this.waitingText.anchor.set(0.5, 0.5);
    this.waitingText.visible = role === "guest";
    this.container.addChild(this.waitingText);

    // Listen for remote events
    this.sync.on({
      onRemotePosition: () => {},
      onRemoteEvent: (event) => this.handleRemoteEvent(event),
    });

    this.updateUI();
  }

  private isLocalReady(): boolean {
    return this.role === "host" ? this.hostReady : this.guestReady;
  }

  private handleRemoteEvent(event: GameSyncEvent): void {
    if (event.type === "ready") {
      if (event.payload.mode) {
        this.mode = event.payload.mode as string;
      }
      if (event.payload.role) {
        const isHost = event.payload.role === "host";
        if (isHost) this.hostReady = event.payload.ready as boolean;
        else this.guestReady = event.payload.ready as boolean;
      }
      this.updateUI();
    }

    if (event.type === "start" && this.role === "guest") {
      const seed = event.payload.seed as number;
      const mode = (event.payload.mode as string) || "best-height";
      this.callbacks.onStart(seed, mode);
    }
  }

  private updateUI(): void {
    this.p1StatusText.text = this.hostReady ? "Ready!" : "Not Ready";
    this.p1StatusText.style.fill = this.hostReady ? "#44ff44" : "#aaaaaa";

    this.p2StatusText.text = this.guestReady ? "Ready!" : "Not Ready";
    this.p2StatusText.style.fill = this.guestReady ? "#44ff44" : "#aaaaaa";

    if (this.role === "host") {
      const canStart = this.hostReady && this.guestReady;
      this.renderStartButton(440, canStart);
      this.startText.alpha = canStart ? 1 : 0.4;
    }
  }

  private renderStartButton(y: number, enabled: boolean): void {
    this.startBtn.clear();
    this.startBtn.roundRect(GAME_WIDTH / 2 - 110, y - 22, 220, 44, 10);
    this.startBtn.fill({ color: enabled ? 0x1a3355 : 0x333333, alpha: 0.9 });
    this.startBtn.roundRect(GAME_WIDTH / 2 - 110, y - 22, 220, 44, 10);
    this.startBtn.stroke({ width: 1.5, color: enabled ? 0x6688bb : 0x555555, alpha: 0.5 });
    this.startBtn.eventMode = enabled ? "static" : "none";
    this.startBtn.cursor = enabled ? "pointer" : "default";
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
