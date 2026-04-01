/**
 * Local co-op launcher — two side-by-side game views on one PC.
 * Player 1: WASD, Player 2: Arrow keys.
 * Uses a single PixiJS Application with a wider canvas (800x700).
 */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GameScene } from "../scenes/GameScene";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { playMusic, stopMusic, killBossMusic } from "../systems/Audio";
import { resetPlatformIds } from "../entities/Platform";
import { resetPowerUpIds } from "../entities/PowerUp";
import { resetCollectibleIds } from "../entities/Collectible";
import { resetEnemyIds } from "../entities/Enemy";
import { resetProjectileIds } from "../entities/Projectile";
import { resetRNG, getRNGFunction, setRNGFunction } from "../systems/RNG";
import { seededRandom } from "../systems/DailyChallenge";
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
  // Resize canvas for split-screen and override CSS constraints
  app.renderer.resize(SPLIT_WIDTH, GAME_HEIGHT);
  const canvas = app.canvas;
  canvas.style.maxWidth = "1000px";
  canvas.style.aspectRatio = `${SPLIT_WIDTH} / ${GAME_HEIGHT}`;

  const input = new LocalInput();
  input.init();

  const config: RunConfig = { ...createDefaultRunConfig(), seed };

  // Create two game scenes with the same seed.
  // Each createInitialState() calls initRNG(seed) which resets the global RNG,
  // so both scenes get identical initial worlds.
  const scene1 = new GameScene(config);
  const scene2 = new GameScene(config);

  // Create separate RNG streams for each player's ongoing gameplay.
  // Without this, both scenes share the global RNG and their worlds diverge.
  let p1Rng = seededRandom(seed);
  let p2Rng = seededRandom(seed);

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

  // FPS counter (always visible during multiplayer testing)
  const fpsText = new Text({
    text: "FPS: --",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#00ff00",
      stroke: { color: "#000000", width: 2 } }),
  });
  fpsText.x = SPLIT_WIDTH / 2;
  fpsText.y = GAME_HEIGHT - 16;
  fpsText.anchor.set(0.5, 0);
  app.stage.addChild(fpsText);
  let fpsFrames = 0, fpsLast = performance.now();

  // Countdown overlay
  const countdownText = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace",
    fontSize: 48, fill: "#ffffff", fontWeight: "bold", stroke: { color: "#000000", width: 4 } }) });
  countdownText.x = SPLIT_WIDTH / 2; countdownText.y = GAME_HEIGHT * 0.4;
  countdownText.anchor.set(0.5, 0.5); app.stage.addChild(countdownText);

  scene1.startCountdown();
  scene2.startCountdown();

  playMusic(0);

  // Escape to quit mid-game
  let quitRequested = false;
  const midGameEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !quitRequested) {
      quitRequested = true;
      window.removeEventListener("keydown", midGameEscape);
      setTimeout(() => {
        cleanupLocalCoop(app, scene1, scene2, input, gameLoop);
        app.renderer.resize(GAME_WIDTH, GAME_HEIGHT);
        app.canvas.style.maxWidth = "500px";
        app.canvas.style.aspectRatio = "400 / 700";
        showTitleScreen(app, (runConfig) => launchGame(app, runConfig));
      }, 0);
    }
  };
  window.addEventListener("keydown", midGameEscape);

  let p1Dead = false;
  let p2Dead = false;
  let p1DeathHeight = 0;
  let p2DeathHeight = 0;

  // Game loop
  const gameLoop = () => {
    input.update();

    // Tick scenes with split keyboard input and separate RNG streams
    if (!scene1.isGameOver()) {
      setRNGFunction(p1Rng);
      scene1.updateWithInput(input.p1InputX);
      p1Rng = getRNGFunction();
    }
    if (!scene2.isGameOver()) {
      setRNGFunction(p2Rng);
      scene2.updateWithInput(input.p2InputX);
      p2Rng = getRNGFunction();
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

    // Countdown display
    const cd = scene1.getCountdownSeconds();
    if (cd !== undefined && cd >= 0) {
      countdownText.text = cd > 0 ? `${cd}` : "GO!";
      countdownText.visible = true;
    } else { countdownText.visible = false; }

    // FPS counter
    fpsFrames++;
    const now = performance.now();
    if (now - fpsLast >= 500) {
      fpsText.text = `FPS: ${Math.round(fpsFrames / ((now - fpsLast) / 1000))}`;
      fpsFrames = 0;
      fpsLast = now;
    }

    // Toast timer
    if (toastTimer > 0) {
      toastTimer--;
      if (toastTimer === 0) deathToast.visible = false;
    }

    // Both dead → show results
    if (scene1.isGameOver() && scene2.isGameOver()) {
      app.ticker.remove(gameLoop);
      window.removeEventListener("keydown", midGameEscape);
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

    // Rematch ready-up: P1 presses W, P2 presses Up to ready
    let p1Ready = false, p2Ready = false;

    const makeReadyStyle = () => new TextStyle({
      fontFamily: "monospace", fontSize: 14, fill: "#aaaaaa",
      stroke: { color: "#000000", width: 2 },
    });
    const p1ReadyText = new Text({ text: "P1: Press W to rematch", style: makeReadyStyle() });
    p1ReadyText.x = SPLIT_WIDTH / 2;
    p1ReadyText.y = GAME_HEIGHT * 0.53;
    p1ReadyText.anchor.set(0.5, 0.5);
    app.stage.addChild(p1ReadyText);

    const p2ReadyText = new Text({ text: "P2: Press ↑ to rematch", style: makeReadyStyle() });
    p2ReadyText.x = SPLIT_WIDTH / 2;
    p2ReadyText.y = GAME_HEIGHT * 0.58;
    p2ReadyText.anchor.set(0.5, 0.5);
    app.stage.addChild(p2ReadyText);

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
        // Defer cleanup to next frame to avoid destroying mid-handler
        setTimeout(() => {
          cleanupLocalCoop(app, scene1, scene2, input, gameLoop);
          const newSeed = Math.floor(Math.random() * 0xffffffff);
          launchLocalCoop(app, newSeed);
        }, 0);
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
    homeHint.x = SPLIT_WIDTH / 2;
    homeHint.y = GAME_HEIGHT * 0.65;
    homeHint.anchor.set(0.5, 0.5);
    app.stage.addChild(homeHint);
    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.removeEventListener("keydown", rematchKeyHandler);
        window.removeEventListener("keydown", escapeHandler);
        setTimeout(() => {
          cleanupLocalCoop(app, scene1, scene2, input, gameLoop);
          app.renderer.resize(GAME_WIDTH, GAME_HEIGHT);
          app.canvas.style.maxWidth = "500px";
          app.canvas.style.aspectRatio = "400 / 700";
          showTitleScreen(app, (runConfig) => launchGame(app, runConfig));
        }, 0);
      }
    };
    window.addEventListener("keydown", escapeHandler);
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

  // Remove scene containers from stage before destroying them
  if (scene1.container.parent) scene1.container.parent.removeChild(scene1.container);
  if (scene2.container.parent) scene2.container.parent.removeChild(scene2.container);
  scene1.destroy();
  scene2.destroy();

  // Clear remaining stage children (overlays, masks, labels, results)
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
