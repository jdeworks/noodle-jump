/** Per-frame game loop ticker — updates scene, HUD, effects, and handles game over. */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GameScene } from "./GameScene";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config/constants";
import { FireworkDisplay } from "../rendering/fireworks";
import { stopMusic, playSfxHighScore } from "../systems/Audio";
import { showGameOver } from "../ui/GameOverView";
import { HUD } from "../ui/HUD";
import { loadStats, updateStatsAfterGame, saveStats } from "../ui/StatsPanel";
import {
  loadAchievements,
  checkAchievements,
  saveAchievements,
  getAchievement,
  type GameStats,
} from "../systems/Achievements";
import {
  loadCosmetics,
  syncCosmeticsWithAchievements,
  saveCosmetics,
} from "../systems/Cosmetics";

export interface OverlayElements {
  effectTimerBar: Graphics;
  effectTimerLabel: Text;
  countdownText: Text;
}

export function createGameLoopTicker(
  app: Application,
  scene: GameScene,
  hud: HUD,
  overlays: OverlayElements,
  onRestart: () => void,
  onHome: () => void,
): () => void {
  let inGameFireworks: FireworkDisplay | null = null;
  let inGameHighScoreLabel: Text | null = null;
  let goTextTicks = 0;
  let gameOverHandled = false;

  const gameLoopFn = () => {
    if (gameOverHandled) return;
    scene.update();

    // Countdown display
    const cd = scene.getCountdownSeconds();
    if (cd !== undefined && cd > 0) {
      overlays.countdownText.text = `${cd}`;
      overlays.countdownText.visible = true;
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
      overlays.countdownText.scale.set(pulse);
      goTextTicks = 40;
    } else if (goTextTicks > 0) {
      overlays.countdownText.text = "GO!";
      overlays.countdownText.visible = true;
      overlays.countdownText.scale.set(1 + (40 - goTextTicks) * 0.02);
      overlays.countdownText.alpha = goTextTicks / 40;
      goTextTicks--;
    } else if (overlays.countdownText.visible) {
      overlays.countdownText.visible = false;
      overlays.countdownText.alpha = 1;
    }

    // Update HUD from game state
    hud.update(scene.getState(), scene.getElapsedSeconds());

    // High score fireworks
    if (scene.checkNewHighScore() && !inGameFireworks) {
      playSfxHighScore();
      inGameFireworks = new FireworkDisplay(10);
      app.stage.addChild(inGameFireworks.container);
      inGameHighScoreLabel = new Text({
        text: "NEW HIGH SCORE!",
        style: new TextStyle({
          fontFamily: "monospace", fontSize: 18,
          fill: "#ffdd44", fontWeight: "bold",
          stroke: { color: "#000000", width: 3 },
          align: "center",
        }),
      });
      inGameHighScoreLabel.x = GAME_WIDTH / 2;
      inGameHighScoreLabel.y = GAME_HEIGHT * 0.15;
      inGameHighScoreLabel.anchor.set(0.5, 0.5);
      app.stage.addChild(inGameHighScoreLabel);
    }

    if (inGameFireworks) {
      if (!inGameFireworks.update()) {
        inGameFireworks.destroy();
        inGameFireworks = null;
        if (inGameHighScoreLabel) {
          app.stage.removeChild(inGameHighScoreLabel);
          inGameHighScoreLabel.destroy();
          inGameHighScoreLabel = null;
        }
      } else if (inGameHighScoreLabel) {
        const pulse = 0.9 + Math.sin(Date.now() * 0.008) * 0.1;
        inGameHighScoreLabel.scale.set(pulse);
      }
    }

    // Effect timer bar
    overlays.effectTimerBar.clear();
    const effectName = scene.getActiveEffectName();
    const effectProgress = scene.getActiveEffectProgress();
    if (effectName && effectProgress > 0) {
      const barW = (GAME_WIDTH - 40) * effectProgress;
      const color = COLORS.powerups[effectName] ?? 0xffffff;
      overlays.effectTimerBar.rect(20, GAME_HEIGHT - 6, GAME_WIDTH - 40, 4);
      overlays.effectTimerBar.fill({ color: 0x333333, alpha: 0.5 });
      overlays.effectTimerBar.rect(20, GAME_HEIGHT - 6, barW, 4);
      overlays.effectTimerBar.fill(color);
      overlays.effectTimerLabel.text = effectName.replace("_", " ").toUpperCase();
      overlays.effectTimerLabel.visible = true;
    } else {
      overlays.effectTimerLabel.visible = false;
    }

    // Game over
    if (scene.isGameOver()) {
      stopMusic();
      gameOverHandled = true;

      const gameResult = {
        score: scene.getScore(),
        height: scene.getHeight(),
        meatballs: scene.getMeatballsCollected(),
        combo: scene.getBestCombo(),
        zone: scene.getZone(),
        seconds: scene.getElapsedSeconds(),
      };
      // Only save stats for normal runs (not custom/practice)
      const isCustom = scene.isCustomRun();
      const stats = isCustom ? loadStats() : updateStatsAfterGame(loadStats(), gameResult);
      if (!isCustom) saveStats(stats);

      const gameStats: GameStats = {
        ...gameResult,
        powerUps: scene.getPowerUpsCollected(),
        platforms: scene.getPlatformsPassed(),
        streak: scene.getBestStreak(),
        enemiesKilled: scene.getEnemiesKilled(),
      };
      const achState = loadAchievements();
      const achResult = checkAchievements(achState, stats, gameStats);
      if (achResult.newlyUnlocked.length > 0) {
        saveAchievements(achResult.state);
      }

      // Sync cosmetics with newly unlocked achievements
      const cosState = syncCosmeticsWithAchievements(
        loadCosmetics(),
        achResult.state.unlocked,
      );
      saveCosmetics(cosState);

      showGameOver(
        app,
        {
          score: scene.getScore(),
          height: scene.getHeight(),
          seconds: scene.getElapsedSeconds(),
          highScore: scene.getHighScore(),
          meatballs: scene.getMeatballsCollected(),
          powerUps: scene.getPowerUpsCollected(),
          bestCombo: scene.getBestCombo(),
          bestStreak: scene.getBestStreak(),
          platforms: scene.getPlatformsPassed(),
          isCustomRun: scene.isCustomRun(),
        },
        onRestart,
        onHome,
        achResult.newlyUnlocked.map((id) => getAchievement(id)?.name ?? id),
      );
    }
  };
  return gameLoopFn;
}
