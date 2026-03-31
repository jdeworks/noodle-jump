import { Application } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "./config/constants";
import { showTitleScreen } from "./ui/TitleScreenView";
import { launchGame } from "./scenes/GameLauncher";
import { registerServiceWorker, listenForInstallPrompt } from "./services/PWA";
import { initErrorTracking } from "./services/ErrorTracking";

// Lock to portrait via Screen Orientation API
const orient = screen.orientation as
  | { lock?: (o: string) => Promise<void> }
  | undefined;
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

  const container = document.getElementById("game");
  if (!container) throw new Error("Missing #game element");
  container.appendChild(app.canvas);

  // Resize canvas to cover the full screen (no letterboxing)
  function resizeCanvas() {
    const w = container!.clientWidth;
    const h = container!.clientHeight;
    const aspect = GAME_WIDTH / GAME_HEIGHT;
    let canvasW: number, canvasH: number;
    // Cover: use the larger dimension so canvas fills the viewport
    if (w / h > aspect) {
      // Screen is wider than game — match width, overflow height
      canvasW = w;
      canvasH = w / aspect;
    } else {
      // Screen is taller than game — match height, overflow width
      canvasH = h;
      canvasW = h * aspect;
    }
    app.canvas.style.width = `${canvasW}px`;
    app.canvas.style.height = `${canvasH}px`;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("fullscreenchange", resizeCanvas);

  showTitleScreen(app, (runConfig) => launchGame(app, runConfig));
}

registerServiceWorker();
listenForInstallPrompt();
initErrorTracking();
main();
