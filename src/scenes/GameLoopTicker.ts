/** Per-frame game loop ticker — updates scene, HUD, effects, and handles game over. */

import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { GameScene } from "./GameScene";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config/constants";
import { FireworkDisplay } from "../rendering/fireworks";
import { stopMusic, killBossMusic, playSfxHighScore } from "../systems/Audio";
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
import { getShadowContext } from "./GameLauncher";
import { saveShadow } from "../systems/ShadowRecorder";
import {
  getTodayDateKey,
  getMedalThresholds,
  recordDailyResult,
  loadDailyData,
  saveDailyData,
  getMedalsInRange,
} from "../systems/DailyChallengeState";
import { showDailyGameOver } from "../ui/DailyGameOverView";

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

    // Shadow recording + playback
    const shadow = getShadowContext();
    if (shadow.recorder && !scene.isGameOver()) {
      shadow.recorder.tick(scene.getState());
    }
    if (shadow.playback && shadow.renderer && !scene.isGameOver()) {
      const ghostState = shadow.playback.tick();
      if (ghostState) {
        shadow.renderer.update(ghostState, scene.getState().camera.y, scene.getState().player.y);
      } else { shadow.renderer.hide(); }
    }

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

    // Effect timer bar (no text label — HUD shows description)
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
    }
    overlays.effectTimerLabel.visible = false;

    // Game over
    if (scene.isGameOver()) {
      stopMusic();
      killBossMusic();
      gameOverHandled = true;

      const gameResult = {
        score: scene.getScore(),
        height: scene.getHeight(),
        meatballs: scene.getMeatballsCollected(),
        combo: scene.getBestCombo(),
        zone: scene.getZone(),
        seconds: scene.getElapsedSeconds(),
        bossesDefeated: scene.getBossesDefeated(),
      };
      // Only save stats for normal runs (not custom/practice)
      const isCustom = scene.isCustomRun();
      const stats = isCustom ? loadStats() : updateStatsAfterGame(loadStats(), gameResult);
      if (!isCustom) saveStats(stats);

      const isDaily = scene.getState().runConfig.isDailyChallenge;
      let dailyStreak = 0;
      let dailyMedal: string | null = null;
      let dailyWeekHasAllMedals = false;
      if (isDaily) {
        const dConfig = scene.getState().runConfig;
        const dThresholds = getMedalThresholds(dConfig);
        const dDate = getTodayDateKey();
        let dd = loadDailyData();
        dd = recordDailyResult(dd, dDate, gameResult.score, gameResult.height, dThresholds);
        dailyStreak = dd.currentStreak;
        dailyMedal = dd.results[dDate]?.medal ?? null;
        dailyWeekHasAllMedals = getMedalsInRange(dd.results, dDate, 7).size >= 3;
      }
      const gameStats: GameStats = {
        ...gameResult,
        powerUps: scene.getPowerUpsCollected(),
        platforms: scene.getPlatformsPassed(),
        streak: scene.getBestStreak(),
        enemiesKilled: scene.getEnemiesKilled(),
        bossStomps: scene.getBossStomps(),
        powerUpsCollected: scene.getPowerUpsCollected(),
        isDailyChallenge: isDaily,
        dailyMedal, dailyStreak, dailyWeekHasAllMedals,
      };
      const achState = loadAchievements();
      const achResult = checkAchievements(achState, stats, gameStats);
      if (achResult.newlyUnlocked.length > 0) {
        saveAchievements(achResult.state);
      }

      // Sync cosmetics with newly unlocked achievements
      const cosState = syncCosmeticsWithAchievements(loadCosmetics(), achResult.state.unlocked);
      saveCosmetics(cosState);

      // Save shadow recording (mode-based)
      const shadowCtx = getShadowContext();
      if (shadowCtx.recorder) {
        const rec = shadowCtx.recorder.finalize(gameResult.score, gameResult.height);
        saveShadow(shadowCtx.mode, shadowCtx.qualifier, rec);
      }

      const achNames = achResult.newlyUnlocked.map((id) => getAchievement(id)?.name ?? id);

      // Daily challenge: compute medal, save result, show daily game-over
      if (scene.getState().runConfig.isDailyChallenge) {
        const config = scene.getState().runConfig;
        const thresholds = getMedalThresholds(config);
        const dateKey = getTodayDateKey();
        let dailyData = loadDailyData();
        dailyData = recordDailyResult(dailyData, dateKey, gameResult.score, gameResult.height, thresholds);
        saveDailyData(dailyData);
        const prevBest = dailyData.results[dateKey];
        showDailyGameOver(app, {
          score: gameResult.score, height: gameResult.height,
          seconds: scene.getElapsedSeconds(), meatballs: gameResult.meatballs,
          powerUps: scene.getPowerUpsCollected(), bestCombo: gameResult.combo,
          bestStreak: scene.getBestStreak(), platforms: scene.getPlatformsPassed(),
          medal: prevBest?.medal ?? null, thresholds, streak: dailyData.currentStreak,
          isNewBest: prevBest?.score === gameResult.score,
        }, onRestart, onHome, achNames);
      } else {
        showGameOver(app, {
          score: gameResult.score, height: gameResult.height,
          seconds: scene.getElapsedSeconds(), highScore: scene.getHighScore(),
          meatballs: gameResult.meatballs, powerUps: scene.getPowerUpsCollected(),
          bestCombo: gameResult.combo, bestStreak: scene.getBestStreak(),
          platforms: scene.getPlatformsPassed(), isCustomRun: isCustom,
        }, onRestart, onHome, achNames);
      }
    }
  };
  return gameLoopFn;
}
