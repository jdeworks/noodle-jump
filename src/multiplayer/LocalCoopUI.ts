/** Local co-op UI elements — labels, overlays, HUD text for split-screen. */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_HEIGHT, DEBUG_MODE } from "../config/constants";

const DIVIDER_WIDTH = 2;

export interface CoopHUD {
  p1Label: Text;
  p2Label: Text;
  p1Height: Text;
  p2Height: Text;
  deathToast: Text;
  spectateOverlay: Graphics;
  spectateLabel: Text;
  fpsText: Text | null;
  fpsFrames: number;
  fpsLast: number;
  countdownDim: Graphics;
  countdownText: Text;
  timerText: Text | null;
  divider: Graphics;
}

export function createCoopHUD(app: Application, splitWidth: number, gameWidth: number): CoopHUD {
  // Divider line
  const divider = new Graphics();
  divider.rect(gameWidth - DIVIDER_WIDTH / 2, 0, DIVIDER_WIDTH, GAME_HEIGHT);
  divider.fill({ color: 0x000000, alpha: 0.6 });
  app.stage.addChild(divider);

  // Player labels
  const labelStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 12,
    fill: "#ffffff",
    fontWeight: "bold",
    stroke: { color: "#000000", width: 2 },
  });
  const p1Label = new Text({ text: "P1 (WASD)", style: labelStyle });
  p1Label.x = 8;
  p1Label.y = 4;
  app.stage.addChild(p1Label);
  const p2Label = new Text({ text: "P2 (Arrows)", style: labelStyle });
  p2Label.x = gameWidth + 8;
  p2Label.y = 4;
  app.stage.addChild(p2Label);

  // Height displays
  const heightStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 14,
    fill: "#ffdd44",
    fontWeight: "bold",
    stroke: { color: "#000000", width: 2 },
  });
  const p1Height = new Text({ text: "H: 0", style: heightStyle });
  p1Height.x = gameWidth - 8;
  p1Height.y = 4;
  p1Height.anchor.set(1, 0);
  app.stage.addChild(p1Height);
  const p2Height = new Text({ text: "H: 0", style: heightStyle });
  p2Height.x = splitWidth - 8;
  p2Height.y = 4;
  p2Height.anchor.set(1, 0);
  app.stage.addChild(p2Height);

  // Death toast
  const deathToast = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 16,
      fill: "#ff6666",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 3 },
    }),
  });
  deathToast.x = splitWidth / 2;
  deathToast.y = GAME_HEIGHT * 0.15;
  deathToast.anchor.set(0.5, 0.5);
  deathToast.visible = false;
  app.stage.addChild(deathToast);

  // Spectate overlay
  const spectateOverlay = new Graphics();
  spectateOverlay.rect(0, 0, gameWidth, GAME_HEIGHT);
  spectateOverlay.fill({ color: 0x000000, alpha: 0.5 });
  spectateOverlay.visible = false;
  app.stage.addChild(spectateOverlay);
  const spectateLabel = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 18,
      fill: "#ffdd44",
      fontWeight: "bold",
      align: "center",
      stroke: { color: "#000000", width: 3 },
    }),
  });
  spectateLabel.x = gameWidth / 2;
  spectateLabel.y = GAME_HEIGHT * 0.4;
  spectateLabel.anchor.set(0.5, 0.5);
  app.stage.addChild(spectateLabel);

  // FPS counter (debug only)
  let fpsText: Text | null = null;
  if (DEBUG_MODE) {
    fpsText = new Text({
      text: "FPS: --",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 11,
        fill: "#00ff00",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    fpsText.x = splitWidth / 2;
    fpsText.y = GAME_HEIGHT - 16;
    fpsText.anchor.set(0.5, 0);
    app.stage.addChild(fpsText);
  }

  // Countdown overlay
  const countdownDim = new Graphics();
  countdownDim.rect(0, 0, splitWidth, GAME_HEIGHT);
  countdownDim.fill({ color: 0x000000, alpha: 0.4 });
  app.stage.addChild(countdownDim);
  const countdownText = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 48,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 4 },
    }),
  });
  countdownText.x = splitWidth / 2;
  countdownText.y = GAME_HEIGHT * 0.4;
  countdownText.anchor.set(0.5, 0.5);
  app.stage.addChild(countdownText);

  // Timer text (null unless timed mode — caller sets it up)
  const timerText: Text | null = null;

  return {
    p1Label,
    p2Label,
    p1Height,
    p2Height,
    deathToast,
    spectateOverlay,
    spectateLabel,
    fpsText,
    fpsFrames: 0,
    fpsLast: performance.now(),
    countdownDim,
    countdownText,
    timerText,
    divider,
  };
}

export function createTimerText(app: Application, splitWidth: number): Text {
  const timerText = new Text({
    text: "2:00",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 20,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 3 },
    }),
  });
  timerText.x = splitWidth / 2;
  timerText.y = 22;
  timerText.anchor.set(0.5, 0.5);
  app.stage.addChild(timerText);
  return timerText;
}
