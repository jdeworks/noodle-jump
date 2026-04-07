/**
 * Helper functions for OnlineSession — UI creation, cleanup, results.
 * Extracted to keep OnlineSession.ts under 400 LOC.
 */

import { Graphics, Text, TextStyle } from "pixi.js";
import type { Application } from "pixi.js";
import type { GameScene } from "../scenes/GameScene";
import { GAME_WIDTH, GAME_HEIGHT, DEBUG_MODE } from "../config/constants";
import { createDefaultRunConfig, type RunConfig } from "../systems/CustomRunConfig";
import { createDebugConfig, setDebugConfig } from "../config/debug";
import { setTouchControlsForced } from "../systems/TiltSettings";
import { resetPlatformIds } from "../entities/Platform";
import { resetPowerUpIds } from "../entities/PowerUp";
import { resetCollectibleIds } from "../entities/Collectible";
import { resetEnemyIds } from "../entities/Enemy";
import { resetProjectileIds } from "../entities/Projectile";
import { resetRNG } from "../systems/RNG";
import { resetRendererState } from "../scenes/EntityRenderer";
import { GameScene as GameSceneCls } from "../scenes/GameScene";
import { GameSync } from "./GameSync";
import type { RemoteCosmetics } from "./RemotePlayerRenderer";
import { RemotePlayerRenderer } from "./RemotePlayerRenderer";
import { InterpolationBuffer } from "./InterpolationBuffer";
import { LiveLeaderboard } from "./LiveLeaderboard";
import { showOnlineResults, getPeerColor, type PlayerResult } from "./OnlineResults";

export interface RemotePeer {
  renderer: RemotePlayerRenderer;
  interpolation: InterpolationBuffer;
  dead: boolean;
  disconnected: boolean;
  deathHeight: number;
  lastKnownHeight: number;
  character: string;
  cosmetics?: RemoteCosmetics;
  colorIndex: number;
  name: string;
}

export function makeToast(): Text {
  const t = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 16,
      fill: "#ff6666",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 3 },
    }),
  });
  t.x = GAME_WIDTH / 2;
  t.y = GAME_HEIGHT * 0.15;
  t.anchor.set(0.5, 0.5);
  t.visible = false;
  return t;
}

export function makeFps(): Text | null {
  if (!DEBUG_MODE) return null;
  const t = new Text({
    text: "FPS: --",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 11,
      fill: "#00ff00",
      stroke: { color: "#000000", width: 2 },
    }),
  });
  t.x = 10;
  t.y = GAME_HEIGHT - 16;
  return t;
}

export function makeConnDot(): Graphics {
  const dot = new Graphics();
  dot.circle(GAME_WIDTH - 15, 15, 6);
  dot.fill(0x44ff44);
  return dot;
}

export function initCountdownUI(app: Application): { dim: Graphics; text: Text } {
  const dim = new Graphics();
  dim.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  dim.fill({ color: 0x000000, alpha: 0.4 });
  app.stage.addChild(dim);
  const text = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 48,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 4 },
    }),
  });
  text.x = GAME_WIDTH / 2;
  text.y = GAME_HEIGHT * 0.4;
  text.anchor.set(0.5, 0.5);
  app.stage.addChild(text);
  return { dim, text };
}

export function addPeer(
  peerId: string,
  peers: Map<string, RemotePeer>,
  app: Application,
  leaderboard: LiveLeaderboard,
  nextColorIndex: { value: number },
  character = "chef",
  cosmetics?: RemoteCosmetics,
  name?: string,
): RemotePeer {
  if (peers.has(peerId)) return peers.get(peerId)!;
  const colorIndex = nextColorIndex.value++;
  const disableTrail = peers.size >= 7;
  const cos = disableTrail ? { tint: cosmetics?.tint } : cosmetics;
  const renderer = new RemotePlayerRenderer(character, cos);
  renderer.hide();
  app.stage.addChild(renderer.container);
  const label = name || peerId.slice(0, 6);
  const peer: RemotePeer = {
    renderer,
    interpolation: new InterpolationBuffer(),
    dead: false,
    disconnected: false,
    deathHeight: 0,
    lastKnownHeight: 0,
    character,
    cosmetics,
    colorIndex,
    name: label,
  };
  peers.set(peerId, peer);
  leaderboard.addPlayer(peerId, label, colorIndex, false);
  return peer;
}

export function removePeer(
  peerId: string,
  peers: Map<string, RemotePeer>,
  leaderboard: LiveLeaderboard,
): void {
  const peer = peers.get(peerId);
  if (!peer) return;
  peer.renderer.destroy();
  peers.delete(peerId);
  leaderboard.removePlayer(peerId);
}

export function doShowResults(
  app: Application,
  scene: GameScene,
  sync: GameSync,
  peers: Map<string, RemotePeer>,
  localDead: boolean,
  localDeathHeight: number,
  localName: string,
  mode: string,
  gameLoop: (() => void) | null,
  returnToLobby: () => void,
  goHome: () => void,
): null {
  if (gameLoop) app.ticker.remove(gameLoop);
  scene.forceStop();
  sync.stopSending();
  const localH = localDead ? localDeathHeight : scene.getMaxHeight();
  const results: PlayerResult[] = [
    {
      peerId: "__local__",
      label: localName || "You",
      height: localH,
      score: scene.getScore(),
      isLocal: true,
      color: getPeerColor(0),
      dead: localDead,
    },
  ];
  for (const [id, p] of peers) {
    const h = p.disconnected ? 0 : p.dead ? p.deathHeight || p.lastKnownHeight : p.lastKnownHeight;
    const lbl = p.disconnected ? `${p.name} (left)` : p.name;
    results.push({
      peerId: id,
      label: lbl,
      height: h,
      score: 0,
      isLocal: false,
      color: getPeerColor(p.colorIndex),
      dead: p.dead,
    });
  }
  showOnlineResults(app, results, mode, returnToLobby, goHome);
  return null;
}

export function doCleanup(
  app: Application,
  scene: GameScene,
  sync: GameSync,
  peers: Map<string, RemotePeer>,
  leaderboard: LiveLeaderboard,
  gameLoop: (() => void) | null,
): null {
  if (gameLoop) app.ticker.remove(gameLoop);
  sync.stopSending();
  if (scene.container.parent) scene.container.parent.removeChild(scene.container);
  scene.destroy();
  for (const peer of peers.values()) peer.renderer.destroy();
  peers.clear();
  leaderboard.destroy();
  while (app.stage.children.length > 0) {
    const c = app.stage.children[0];
    app.stage.removeChild(c);
    c.destroy({ children: true });
  }
  resetPlatformIds();
  resetPowerUpIds();
  resetCollectibleIds();
  resetEnemyIds();
  resetProjectileIds();
  resetRNG();
  resetRendererState();
  return null;
}

export interface NewGameInit {
  scene: GameScene;
  leaderboard: LiveLeaderboard;
  deathToast: Text;
  fpsText: Text | null;
  connDot: Graphics;
  countdownDim: Graphics;
  countdownText: Text;
}

export function initNewGame(
  app: Application,
  seed: number,
  mode: string,
  tc: boolean,
  localName: string,
  peers: Map<string, RemotePeer>,
  nextColorIndex: { value: number },
  remotePeers?: Map<string, { character: string; cosmetics?: RemoteCosmetics; name?: string }>,
  sharedRunConfig?: RunConfig,
): NewGameInit {
  setDebugConfig(createDebugConfig());
  const rc = sharedRunConfig ? { ...sharedRunConfig, seed } : { ...createDefaultRunConfig(), seed };
  const scene = new GameSceneCls(rc);
  const firstCos = remotePeers?.values().next().value;
  if (firstCos?.cosmetics?.theme) scene.setCosmeticTheme(firstCos.cosmetics.theme as string);
  if (mode === "timed-2min") scene.enableTimedRespawn();
  else scene.enableGhostMode();
  scene.initInput(app.canvas);
  if (tc) setTouchControlsForced(true);
  else if (scene.input.needsTiltPermission) scene.input.requestTiltPermission();
  app.stage.addChild(scene.container);

  const leaderboard = new LiveLeaderboard();
  leaderboard.addPlayer("__local__", localName || "You", nextColorIndex.value++, true);
  if (remotePeers)
    for (const [pid, info] of remotePeers)
      addPeer(
        pid,
        peers,
        app,
        leaderboard,
        nextColorIndex,
        info.character,
        info.cosmetics,
        info.name,
      );

  const deathToast = makeToast();
  const fpsText = makeFps();
  const connDot = makeConnDot();
  const { dim: countdownDim, text: countdownText } = initCountdownUI(app);
  app.stage.addChild(deathToast);
  if (fpsText) app.stage.addChild(fpsText);
  app.stage.addChild(connDot);
  app.stage.addChild(leaderboard.container);

  return { scene, leaderboard, deathToast, fpsText, connDot, countdownDim, countdownText };
}

export function createSyncForConnection(connection: {
  getMode: () => string | null;
  getRoom: () => unknown;
  getChannel: () => unknown;
}): GameSync {
  const sync = new GameSync();
  if (connection.getMode() === "nostr") {
    const room = connection.getRoom();
    if (room) sync.initWithRoom(room as Parameters<GameSync["initWithRoom"]>[0]);
  } else {
    const ch = connection.getChannel();
    if (ch) sync.initWithChannel(ch as Parameters<GameSync["initWithChannel"]>[0]);
  }
  return sync;
}

export async function setupPause(
  app: Application,
  goHome: () => void,
  onToggle: (paused: boolean) => void,
): Promise<{
  pause: import("./PauseOverlay").PauseOverlay;
  escapeHandler: (e: KeyboardEvent) => void;
}> {
  const { PauseOverlay } = await import("./PauseOverlay");
  const pause = new PauseOverlay(app, GAME_WIDTH, GAME_HEIGHT, goHome);
  const doPause = () => {
    pause.toggle();
    onToggle(pause.paused);
  };
  pause.onPauseTap(doPause);
  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") doPause();
  };
  window.addEventListener("keydown", escapeHandler);
  return { pause, escapeHandler };
}

export function tickHUD(
  connDot: Graphics | null,
  peers: Map<string, RemotePeer>,
  fpsState: { frames: number; last: number; text: Text | null },
): void {
  if (connDot) {
    let w = 0;
    for (const p of peers.values())
      if (!p.disconnected) w = Math.max(w, p.interpolation.msSinceLastUpdate);
    const c = w < 200 ? 0x44ff44 : w < 500 ? 0xffcc00 : 0xff4444;
    connDot.clear();
    connDot.circle(GAME_WIDTH - 15, 15, 6);
    connDot.fill(c);
  }
  fpsState.frames++;
  const now = performance.now();
  if (now - fpsState.last >= 500 && fpsState.text) {
    fpsState.text.text = `FPS: ${Math.round(fpsState.frames / ((now - fpsState.last) / 1000))}`;
    fpsState.frames = 0;
    fpsState.last = now;
  }
}

export function allRemoteDead(peers: Map<string, RemotePeer>): boolean {
  if (peers.size === 0) return false;
  for (const p of peers.values()) if (!p.dead && !p.disconnected) return false;
  return true;
}

export function makeTimerText(): Text {
  const t = new Text({
    text: "2:00",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 18,
      fill: "#ffffff",
      fontWeight: "bold",
      stroke: { color: "#000000", width: 3 },
    }),
  });
  t.x = GAME_WIDTH / 2;
  t.y = 20;
  t.anchor.set(0.5, 0.5);
  return t;
}

export function makeSpectateText(): Text {
  const t = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 16,
      fill: "#ffdd44",
      fontWeight: "bold",
      align: "center",
      stroke: { color: "#000000", width: 3 },
    }),
  });
  t.x = GAME_WIDTH / 2;
  t.y = 50;
  t.anchor.set(0.5, 0.5);
  return t;
}
