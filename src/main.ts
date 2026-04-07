import { Application } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, DEBUG_MODE } from "./config/constants";
import { showTitleScreen } from "./ui/TitleScreenView";
import { launchGame } from "./scenes/GameLauncher";
import { registerServiceWorker, listenForInstallPrompt } from "./services/PWA";
import { initErrorTracking } from "./services/ErrorTracking";

// Lock to portrait via Screen Orientation API
const orient = screen.orientation as { lock?: (o: string) => Promise<void> } | undefined;
orient?.lock?.("portrait").catch(() => {});

async function main() {
  const app = new Application();
  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    background: "#fff8e7",
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  // Expose app globally for testing frame rates (e.g. app.ticker.maxFPS = 30)
  (window as unknown as Record<string, unknown>).__app = app;

  const container = document.getElementById("game");
  if (!container) throw new Error("Missing #game element");
  container.appendChild(app.canvas);

  // Canvas fills via CSS (width/height: 100% !important)

  showTitleScreen(app, (runConfig) => launchGame(app, runConfig));

  // Debug mode indicator — overlaid on the canvas itself
  if (DEBUG_MODE) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:relative;display:inline-block";
    app.canvas.parentNode?.insertBefore(wrapper, app.canvas);
    wrapper.appendChild(app.canvas);
    const badge = document.createElement("div");
    badge.textContent = "DEBUG";
    badge.style.cssText =
      "position:absolute;top:4px;left:4px;padding:2px 6px;font:bold 10px monospace;color:#ff0;background:rgba(0,0,0,0.6);border-radius:4px;z-index:99999;pointer-events:none";
    wrapper.appendChild(badge);
  }
}

registerServiceWorker();
listenForInstallPrompt();
initErrorTracking();
main();
