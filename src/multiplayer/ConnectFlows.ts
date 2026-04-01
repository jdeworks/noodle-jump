/**
 * Async connect flows for multiplayer — extracted from MultiplayerMenu.
 * Each function takes a MenuContext with the references it needs.
 */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { ManualSignaling } from "./ManualSignaling";
import { NostrSignaling } from "./NostrSignaling";
import { ConnectionManager } from "./ConnectionManager";

const BTN_STYLE = new TextStyle({
  fontFamily: "monospace",
  fontSize: 16,
  fill: "#ffffff",
  fontWeight: "bold",
  stroke: { color: "#000000", width: 2 },
});

const INFO_STYLE = new TextStyle({
  fontFamily: "monospace",
  fontSize: 11,
  fill: "#aaaaaa",
  wordWrap: true,
  wordWrapWidth: GAME_WIDTH - 60,
  stroke: { color: "#000000", width: 1 },
});

/** Subset of MultiplayerMenu that connect flows need access to. */
export interface MenuContext {
  readonly container: Container;
  clearView(): void;
  setCurrentView(view: Container): void;
  setConnection(conn: ConnectionManager): void;
  getConnection(): ConnectionManager | null;
  addButton(
    parent: Container,
    label: string,
    y: number,
    w: number,
    h: number,
    x: number,
    color: number,
    onClick: () => void,
  ): number;
  showQuickConnect(): void;
  showPrivateConnect(): void;
  enterLobby(role: "host" | "guest"): void;
  showError(message: string): void;
}

function makeBackground(): Graphics {
  const bg = new Graphics();
  bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  bg.fill({ color: 0x0a0a1a, alpha: 0.95 });
  return bg;
}

export function setupConnectionCallbacks(
  ctx: MenuContext,
  role: "host" | "guest",
): void {
  const conn = ctx.getConnection();
  if (!conn) return;

  conn.on({
    onStateChange: (state) => {
      if (state === "connected") ctx.enterLobby(role);
    },
    onError: (error) => {
      ctx.showError(error);
    },
    onDataChannel: () => {
      // Channel ready — lobby will use GameSync
    },
    onRoom: () => {
      // Room ready — lobby will use GameSync
    },
  });
}

export async function doQuickCreate(ctx: MenuContext): Promise<void> {
  ctx.clearView();
  const view = new Container();
  ctx.setCurrentView(view);

  view.addChild(makeBackground());

  const statusText = new Text({ text: "Creating room...", style: BTN_STYLE });
  statusText.x = GAME_WIDTH / 2;
  statusText.y = 100;
  statusText.anchor.set(0.5, 0.5);
  view.addChild(statusText);
  ctx.container.addChild(view);

  try {
    const signaling = new NostrSignaling();
    const connection = new ConnectionManager();
    ctx.setConnection(connection);
    setupConnectionCallbacks(ctx, "host");
    const code = await connection.createRoom(signaling, "nostr");

    statusText.text = "Room Code:";

    const codeText = new Text({
      text: code,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 36,
        fill: "#ffdd44",
        fontWeight: "bold",
        letterSpacing: 4,
        stroke: { color: "#000000", width: 3 },
      }),
    });
    codeText.x = GAME_WIDTH / 2;
    codeText.y = 150;
    codeText.anchor.set(0.5, 0.5);
    view.addChild(codeText);

    const waitText = new Text({
      text: "Share this code with your friend.\nWaiting for them to join...",
      style: INFO_STYLE,
    });
    waitText.x = GAME_WIDTH / 2;
    waitText.y = 200;
    waitText.anchor.set(0.5, 0);
    view.addChild(waitText);

    const copyBtnY = 270;
    ctx.addButton(view, "Copy Code", copyBtnY, 180, 36,
      (GAME_WIDTH - 180) / 2, 0x333355, async () => {
        try {
          await navigator.clipboard.writeText(code);
        } catch { /* clipboard may not be available */ }
      });

    ctx.addButton(view, "Cancel", 330, 160, 36,
      (GAME_WIDTH - 160) / 2, 0x993333, () => {
        ctx.getConnection()?.disconnect();
        ctx.showQuickConnect();
      });
  } catch {
    statusText.text = "Failed to create room.";
    ctx.addButton(view, "Back", 200, 160, 36,
      (GAME_WIDTH - 160) / 2, 0x222244, () => {
        ctx.showQuickConnect();
      });
  }
}

export async function doQuickJoin(
  ctx: MenuContext,
  code: string,
): Promise<void> {
  ctx.clearView();
  const view = new Container();
  ctx.setCurrentView(view);

  view.addChild(makeBackground());

  const statusText = new Text({ text: "Connecting...", style: BTN_STYLE });
  statusText.x = GAME_WIDTH / 2;
  statusText.y = GAME_HEIGHT * 0.4;
  statusText.anchor.set(0.5, 0.5);
  view.addChild(statusText);
  ctx.container.addChild(view);

  try {
    const signaling = new NostrSignaling();
    const connection = new ConnectionManager();
    ctx.setConnection(connection);
    setupConnectionCallbacks(ctx, "guest");
    await connection.joinRoom(signaling, "nostr", code);
  } catch {
    statusText.text = "Failed to connect.";
    ctx.addButton(view, "Back", GAME_HEIGHT * 0.55, 160, 36,
      (GAME_WIDTH - 160) / 2, 0x222244, () => {
        ctx.showQuickConnect();
      });
  }
}

export async function doPrivateCreate(ctx: MenuContext): Promise<void> {
  ctx.clearView();
  const view = new Container();
  ctx.setCurrentView(view);

  view.addChild(makeBackground());

  const statusText = new Text({ text: "Generating code...", style: BTN_STYLE });
  statusText.x = GAME_WIDTH / 2;
  statusText.y = 40;
  statusText.anchor.set(0.5, 0.5);
  view.addChild(statusText);
  ctx.container.addChild(view);

  try {
    const signaling = new ManualSignaling();
    const connection = new ConnectionManager();
    ctx.setConnection(connection);
    setupConnectionCallbacks(ctx, "host");
    const offerCode = await connection.createRoom(signaling, "manual");

    statusText.text = "Step 1: Send this code to your friend";

    const codeText = new Text({
      text: offerCode,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 10,
        fill: "#ccddff",
        wordWrap: true,
        wordWrapWidth: GAME_WIDTH - 40,
      }),
    });
    codeText.x = GAME_WIDTH / 2;
    codeText.y = 70;
    codeText.anchor.set(0.5, 0);
    view.addChild(codeText);

    let btnY = Math.min(codeText.y + codeText.height + 15, 280);

    ctx.addButton(view, "Copy Code", btnY, 180, 34,
      (GAME_WIDTH - 180) / 2, 0x333355, async () => {
        try { await navigator.clipboard.writeText(offerCode); } catch {}
      });
    btnY += 50;

    const step2Text = new Text({
      text: "Step 2: Paste your friend's response code",
      style: INFO_STYLE,
    });
    step2Text.x = GAME_WIDTH / 2;
    step2Text.y = btnY;
    step2Text.anchor.set(0.5, 0);
    view.addChild(step2Text);
    btnY += 25;

    ctx.addButton(view, "Paste Response", btnY, 200, 36,
      (GAME_WIDTH - 200) / 2, 0x2a6e3f, async () => {
        try {
          const responseCode = await navigator.clipboard.readText();
          if (responseCode && responseCode.startsWith("A")) {
            await ctx.getConnection()?.acceptResponse(responseCode);
          } else {
            step2Text.text = "Invalid code. Make sure to copy the full response.";
            step2Text.style.fill = "#ff6666";
          }
        } catch {
          step2Text.text = "Could not read clipboard. Paste is not supported here.";
          step2Text.style.fill = "#ff6666";
        }
      });
    btnY += 55;

    ctx.addButton(view, "Cancel", btnY, 160, 34,
      (GAME_WIDTH - 160) / 2, 0x993333, () => {
        ctx.getConnection()?.disconnect();
        ctx.showPrivateConnect();
      });
  } catch {
    statusText.text = "Failed to generate offer.";
    ctx.addButton(view, "Back", 200, 160, 36,
      (GAME_WIDTH - 160) / 2, 0x222244, () => {
        ctx.showPrivateConnect();
      });
  }
}

export async function doPrivateJoin(
  ctx: MenuContext,
  hostCode: string,
): Promise<void> {
  ctx.clearView();
  const view = new Container();
  ctx.setCurrentView(view);

  view.addChild(makeBackground());

  const statusText = new Text({ text: "Generating response...", style: BTN_STYLE });
  statusText.x = GAME_WIDTH / 2;
  statusText.y = 40;
  statusText.anchor.set(0.5, 0.5);
  view.addChild(statusText);
  ctx.container.addChild(view);

  try {
    const signaling = new ManualSignaling();
    const connection = new ConnectionManager();
    ctx.setConnection(connection);
    setupConnectionCallbacks(ctx, "guest");
    const answerCode = await connection.joinRoom(signaling, "manual", hostCode);

    if (!answerCode) throw new Error("No answer generated");

    statusText.text = "Step 2: Send this code back to the host";

    const codeText = new Text({
      text: answerCode as string,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 10,
        fill: "#ccddff",
        wordWrap: true,
        wordWrapWidth: GAME_WIDTH - 40,
      }),
    });
    codeText.x = GAME_WIDTH / 2;
    codeText.y = 70;
    codeText.anchor.set(0.5, 0);
    view.addChild(codeText);

    let btnY = Math.min(codeText.y + codeText.height + 15, 280);

    ctx.addButton(view, "Copy Code", btnY, 180, 34,
      (GAME_WIDTH - 180) / 2, 0x333355, async () => {
        try { await navigator.clipboard.writeText(answerCode as string); } catch {}
      });
    btnY += 50;

    const waitText = new Text({
      text: "Waiting for host to accept...",
      style: INFO_STYLE,
    });
    waitText.x = GAME_WIDTH / 2;
    waitText.y = btnY;
    waitText.anchor.set(0.5, 0);
    view.addChild(waitText);
    btnY += 40;

    ctx.addButton(view, "Cancel", btnY, 160, 34,
      (GAME_WIDTH - 160) / 2, 0x993333, () => {
        ctx.getConnection()?.disconnect();
        ctx.showPrivateConnect();
      });
  } catch {
    statusText.text = "Invalid host code or connection failed.";
    ctx.addButton(view, "Back", 200, 160, 36,
      (GAME_WIDTH - 160) / 2, 0x222244, () => {
        ctx.showPrivateConnect();
      });
  }
}
