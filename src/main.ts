import { Application } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "./config/constants";
import { showTitleScreen } from "./ui/TitleScreenView";
import { launchGame } from "./scenes/GameLauncher";

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

  showTitleScreen(app, () => launchGame(app));
}

main();
