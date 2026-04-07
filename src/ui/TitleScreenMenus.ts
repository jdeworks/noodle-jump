/** Title screen sub-menu wiring — extracted to keep TitleScreenView under LOC limit. */

import { Application, Container, Graphics } from "pixi.js";
import { initAudio, playMusic } from "../systems/Audio";
import type { RunConfig } from "../systems/CustomRunConfig";
import { ExplanationScreen } from "./ExplanationScreen";
import { CustomRunScreen } from "./CustomRunScreen";
import { CustomizeScreen } from "./CustomizeScreen";
import { DailyChallengeScreen } from "./DailyChallengeScreen";
import { MultiplayerMenu } from "../multiplayer/MultiplayerMenu";
import { showTitleScreen } from "./TitleScreenView";
import type { ParallaxBackground } from "../systems/Parallax";

type EvTarget = {
  eventMode?: string;
  on: (e: string, fn: (e: Event) => void) => void;
};

export interface TitleMenuContext {
  app: Application;
  titleContainer: Container;
  contentGroup: Container;
  parallax: ParallaxBackground;
  onStartGame: (runConfig?: RunConfig) => Promise<void>;
  getTitleTicker: () => (() => void) | null;
  getHandleKey: () => ((e: KeyboardEvent) => void) | null;
  setTitleDestroyed: () => void;
}

export interface TitleMenuResult {
  explanationScreen: ExplanationScreen;
  customRunScreen: CustomRunScreen;
  customizeScreen: CustomizeScreen;
  dailyChallengeScreen: DailyChallengeScreen;
}

/** Wire all sub-menu buttons and screens. Returns screen refs for isActive() checks. */
export function setupTitleMenus(
  ctx: TitleMenuContext,
  buttons: {
    howBg: Graphics;
    howText: EvTarget;
    customBg: Graphics;
    customText: EvTarget;
    custBg: Graphics;
    custText: EvTarget;
    dailyBg: Graphics;
    dailyText: EvTarget;
    mpBg: Graphics;
    mpText: EvTarget;
  },
): TitleMenuResult {
  const { app, titleContainer, contentGroup, parallax, onStartGame } = ctx;

  const cleanupAndLaunch = (config?: RunConfig) => {
    const hk = ctx.getHandleKey();
    if (hk) window.removeEventListener("keydown", hk);
    initAudio();
    playMusic(0);
    const tt = ctx.getTitleTicker();
    if (tt) app.ticker.remove(tt);
    ctx.setTitleDestroyed();
    parallax.destroy();
    app.stage.removeChild(titleContainer);
    titleContainer.destroy({ children: true });
    onStartGame(config);
  };

  // Explanation
  const explanationScreen = new ExplanationScreen();
  const showHelp = (e: Event) => {
    e.stopPropagation();
    contentGroup.visible = false;
    explanationScreen.show();
  };
  buttons.howBg.on("pointertap", showHelp);
  buttons.howText.eventMode = "static";
  buttons.howText.on("pointertap", showHelp);

  // Custom Run
  const customRunScreen = new CustomRunScreen();
  const showCustom = (e: Event) => {
    e.stopPropagation();
    contentGroup.visible = false;
    customRunScreen.show((config: RunConfig) => cleanupAndLaunch(config));
  };
  buttons.customBg.on("pointertap", showCustom);
  buttons.customText.eventMode = "static";
  buttons.customText.on("pointertap", showCustom);

  // Customize
  const customizeScreen = new CustomizeScreen();
  const showCust = (e: Event) => {
    e.stopPropagation();
    contentGroup.visible = false;
    customizeScreen.show();
  };
  buttons.custBg.on("pointertap", showCust);
  buttons.custText.eventMode = "static";
  buttons.custText.on("pointertap", showCust);

  // Daily Challenge
  const dailyChallengeScreen = new DailyChallengeScreen();
  const showDaily = (e: Event) => {
    e.stopPropagation();
    contentGroup.visible = false;
    dailyChallengeScreen.show((config: RunConfig) => cleanupAndLaunch(config));
  };
  buttons.dailyBg.on("pointertap", showDaily);
  buttons.dailyText.eventMode = "static";
  buttons.dailyText.on("pointertap", showDaily);

  // Multiplayer
  let mpMenu: MultiplayerMenu | null = null;
  const cleanupTitle = () => {
    const tt = ctx.getTitleTicker();
    if (tt) app.ticker.remove(tt);
    const hk = ctx.getHandleKey();
    if (hk) window.removeEventListener("keydown", hk);
    ctx.setTitleDestroyed();
    parallax.destroy();
    app.stage.removeChild(titleContainer);
    titleContainer.destroy({ children: true });
  };
  const showMp = (e: Event) => {
    e.stopPropagation();
    contentGroup.visible = false;
    mpMenu = new MultiplayerMenu(
      app,
      () => {
        contentGroup.visible = true;
        if (mpMenu) {
          app.stage.removeChild(mpMenu.container);
          mpMenu = null;
        }
      },
      cleanupTitle,
    );
    app.stage.addChild(mpMenu.container);
  };
  buttons.mpBg.on("pointertap", showMp);
  buttons.mpText.eventMode = "static";
  buttons.mpText.on("pointertap", showMp);

  // Close handlers
  explanationScreen.onClose = () => {
    contentGroup.visible = true;
  };
  customRunScreen.onClose = () => {
    contentGroup.visible = true;
  };
  dailyChallengeScreen.onClose = () => {
    contentGroup.visible = true;
  };
  customizeScreen.onClose = () => {
    const tt = ctx.getTitleTicker();
    if (tt) app.ticker.remove(tt);
    ctx.setTitleDestroyed();
    parallax.destroy();
    app.stage.removeChild(titleContainer);
    titleContainer.destroy({ children: true });
    showTitleScreen(app, onStartGame);
  };

  // Add containers
  titleContainer.addChild(explanationScreen.container);
  titleContainer.addChild(customRunScreen.container);
  titleContainer.addChild(customizeScreen.container);
  titleContainer.addChild(dailyChallengeScreen.container);

  return {
    explanationScreen,
    customRunScreen,
    customizeScreen,
    dailyChallengeScreen,
  };
}
