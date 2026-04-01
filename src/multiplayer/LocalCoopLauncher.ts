/**
 * Local co-op launcher — two side-by-side game views on one PC.
 * Player 1: WASD, Player 2: Arrow keys.
 * Uses a single PixiJS Application with a wider canvas (800x700).
 */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GameScene } from "../scenes/GameScene";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { playMusic, stopMusic, killBossMusic } from "../systems/Audio";
import { resetPlatformIds } from "../entities/Platform";
import { resetPowerUpIds } from "../entities/PowerUp";
import { resetCollectibleIds } from "../entities/Collectible";
import { resetEnemyIds } from "../entities/Enemy";
import { resetProjectileIds } from "../entities/Projectile";
import { resetRNG } from "../systems/RNG";
import { resetRendererState } from "../scenes/EntityRenderer";
import { createDefaultRunConfig, type RunConfig } from "../systems/CustomRunConfig";
import { LocalInput } from "./LocalInput";
import { showTitleScreen } from "../ui/TitleScreenView";
import { launchGame } from "../scenes/GameLauncher";

const SPLIT_WIDTH = GAME_WIDTH * 2;
const DIVIDER_WIDTH = 2;

export async function launchLocalCoop(
  app: Application,
  seed: number,
): Promise<void> {
  // Resize canvas for split-screen
  app.renderer.resize(SPLIT_WIDTH, GAME_HEIGHT);

  const input = new LocalInput();
  input.init();

  const config: RunConfig = { ...createDefaultRunConfig(), seed };

  // Create two game scenes with the same seed
  const scene1 = new GameScene(config);
  const scene2 = new GameScene(config);

  // Position scenes side by side
  scene1.container.x = 0;
  scene2.container.x = GAME_WIDTH;

  // Create masks so each scene only renders in its half
  const mask1 = new Graphics();
  mask1.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  mask1.fill(0xffffff);
  scene1.container.mask = mask1;

  const mask2 = new Graphics();
  mask2.rect(GAME_WIDTH, 0, GAME_WIDTH, GAME_HEIGHT);
  mask2.fill(0xffffff);
  scene2.container.mask = mask2;

  app.stage.addChild(mask1, mask2);
  app.stage.addChild(scene1.container, scene2.container);

  // Divider line
  const divider = new Graphics();
  divider.rect(GAME_WIDTH - DIVIDER_WIDTH / 2, 0, DIVIDER_WIDTH, GAME_HEIGHT);
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
  p2Label.x = GAME_WIDTH + 8;
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
  p1Height.x = GAME_WIDTH - 8;
  p1Height.y = 4;
  p1Height.anchor.set(1, 0);
  app.stage.addChild(p1Height);

  const p2Height = new Text({ text: "H: 0", style: heightStyle });
  p2Height.x = SPLIT_WIDTH - 8;
  p2Height.y = 4;
  p2Height.anchor.set(1, 0);
  app.stage.addChild(p2Height);

  // Death toast
  const toastStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 16,
    fill: "#ff6666",
    fontWeight: "bold",
    stroke: { color: "#000000", width: 3 },
  });
  const deathToast = new Text({ text: "", style: toastStyle });
  deathToast.x = SPLIT_WIDTH / 2;
  deathToast.y = GAME_HEIGHT * 0.15;
  deathToast.anchor.set(0.5, 0.5);
  deathToast.visible = false;
  app.stage.addChild(deathToast);
  let toastTimer = 0;

  // Start countdown
  scene1.startCountdown();
  scene2.startCountdown();

  playMusic(0);

  let p1Dead = false;
  let p2Dead = false;
  let p1DeathHeight = 0;
  let p2DeathHeight = 0;

  // Game loop
  const gameLoop = () => {
    input.update();

    // Tick scenes with split keyboard input
    if (!scene1.isGameOver()) {
      scene1.updateWithInput(input.p1InputX);
    }
    if (!scene2.isGameOver()) {
      scene2.updateWithInput(input.p2InputX);
    }

    // Update height displays
    p1Height.text = `H: ${scene1.getHeight()}`;
    p2Height.text = `H: ${scene2.getHeight()}`;

    // Track deaths
    if (!p1Dead && scene1.getState().isDying) {
      p1Dead = true;
      p1DeathHeight = scene1.getHeight();
      showToast(`P1 died at ${p1DeathHeight}m!`);
    }
    if (!p2Dead && scene2.getState().isDying) {
      p2Dead = true;
      p2DeathHeight = scene2.getHeight();
      showToast(`P2 died at ${p2DeathHeight}m!`);
    }

    // Toast timer
    if (toastTimer > 0) {
      toastTimer--;
      if (toastTimer === 0) deathToast.visible = false;
    }

    // Both dead → show results
    if (scene1.isGameOver() && scene2.isGameOver()) {
      app.ticker.remove(gameLoop);
      showResults();
    }
  };

  function showToast(msg: string): void {
    deathToast.text = msg;
    deathToast.visible = true;
    toastTimer = 180; // 3 seconds
  }

  function showResults(): void {
    // Dim overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, SPLIT_WIDTH, GAME_HEIGHT);
    overlay.fill({ color: 0x000000, alpha: 0.7 });
    app.stage.addChild(overlay);

    const h1 = p1DeathHeight;
    const h2 = p2DeathHeight;
    const winner = h1 > h2 ? "Player 1 Wins!" : h2 > h1 ? "Player 2 Wins!" : "It's a Tie!";

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

    // Score comparison
    const compStyle = new TextStyle({
      fontFamily: "monospace",
      fontSize: 16,
      fill: "#ffffff",
      stroke: { color: "#000000", width: 2 },
    });

    const lines = [
      `P1 Height: ${h1}m    |    P2 Height: ${h2}m`,
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

    // Rematch button
    const rematchBg = new Graphics();
    rematchBg.roundRect(SPLIT_WIDTH / 2 - 100, GAME_HEIGHT * 0.55 - 20, 200, 40, 10);
    rematchBg.fill({ color: 0x1a3355, alpha: 0.9 });
    rematchBg.roundRect(SPLIT_WIDTH / 2 - 100, GAME_HEIGHT * 0.55 - 20, 200, 40, 10);
    rematchBg.stroke({ width: 1.5, color: 0x6688bb, alpha: 0.5 });
    rematchBg.eventMode = "static";
    rematchBg.cursor = "pointer";
    app.stage.addChild(rematchBg);

    const rematchText = new Text({
      text: "Rematch",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 20,
        fill: "#ffffff",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    rematchText.x = SPLIT_WIDTH / 2;
    rematchText.y = GAME_HEIGHT * 0.55;
    rematchText.anchor.set(0.5, 0.5);
    rematchText.eventMode = "static";
    rematchText.cursor = "pointer";
    app.stage.addChild(rematchText);

    const doRematch = () => {
      cleanupLocalCoop(app, scene1, scene2, input, gameLoop);
      const newSeed = Math.floor(Math.random() * 0xffffffff);
      launchLocalCoop(app, newSeed);
    };
    rematchBg.on("pointertap", doRematch);
    rematchText.on("pointertap", doRematch);

    // Home button
    const homeBg = new Graphics();
    homeBg.roundRect(SPLIT_WIDTH / 2 - 100, GAME_HEIGHT * 0.63 - 18, 200, 36, 10);
    homeBg.fill({ color: 0x222244, alpha: 0.9 });
    homeBg.eventMode = "static";
    homeBg.cursor = "pointer";
    app.stage.addChild(homeBg);

    const homeText = new Text({
      text: "Home",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 16,
        fill: "#aaccff",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    homeText.x = SPLIT_WIDTH / 2;
    homeText.y = GAME_HEIGHT * 0.63;
    homeText.anchor.set(0.5, 0.5);
    homeText.eventMode = "static";
    homeText.cursor = "pointer";
    app.stage.addChild(homeText);

    const goHome = () => {
      cleanupLocalCoop(app, scene1, scene2, input, gameLoop);
      app.renderer.resize(GAME_WIDTH, GAME_HEIGHT);
      showTitleScreen(app, (runConfig) => launchGame(app, runConfig));
    };
    homeBg.on("pointertap", goHome);
    homeText.on("pointertap", goHome);
  }

  app.ticker.add(gameLoop);
}

function cleanupLocalCoop(
  app: Application,
  scene1: GameScene,
  scene2: GameScene,
  input: LocalInput,
  gameLoop: () => void,
): void {
  app.ticker.remove(gameLoop);
  input.destroy();
  scene1.destroy();
  scene2.destroy();

  while (app.stage.children.length > 0) {
    const child = app.stage.children[0];
    app.stage.removeChild(child);
    child.destroy({ children: true });
  }

  resetPlatformIds();
  resetPowerUpIds();
  resetCollectibleIds();
  resetEnemyIds();
  resetProjectileIds();
  resetRNG();
  resetRendererState();
  stopMusic();
  killBossMusic();
}
