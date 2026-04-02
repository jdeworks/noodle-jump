/**
 * Multiplayer menu — entry point for all multiplayer modes.
 * Shows Local Co-op / Quick Connect / Private Connect options.
 * Handles create/join flows and wires into LobbyScreen -> OnlineSession.
 */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { ConnectionManager } from "./ConnectionManager";
import { GameSync } from "./GameSync";
import { LobbyScreen } from "./LobbyScreen";
import { OnlineSession } from "./OnlineSession";
import { launchLocalCoop } from "./LocalCoopLauncher";
import { showModePicker } from "./ModePickerScreen";
import {
  MenuContext,
  doQuickCreate,
  doQuickJoin,
  doPrivateCreate,
  doPrivateJoin,
} from "./ConnectFlows";
import { createCodeInput, createSubmitButton } from "./HtmlOverlay";

export type MenuCallback = () => void;

const HEADER_STYLE = new TextStyle({
  fontFamily: "monospace",
  fontSize: 22,
  fill: "#ffffff",
  fontWeight: "bold",
  stroke: { color: "#000000", width: 3 },
});

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

export class MultiplayerMenu implements MenuContext {
  readonly container = new Container();
  private app: Application;
  private onBack: MenuCallback;
  private onLaunch: MenuCallback | null;
  private connection: ConnectionManager | null = null;
  private currentView: Container | null = null;

  constructor(app: Application, onBack: MenuCallback, onLaunch?: MenuCallback) {
    this.app = app;
    this.onLaunch = onLaunch ?? null;
    this.onBack = onBack;
    this.showMainMenu();
  }
  clearView(): void {
    if (this.currentView) {
      this.container.removeChild(this.currentView);
      this.currentView.destroy({ children: true });
      this.currentView = null;
    }
  }

  setCurrentView(view: Container): void { this.currentView = view; }
  setConnection(conn: ConnectionManager): void { this.connection = conn; }
  getConnection(): ConnectionManager | null { return this.connection; }

  private showMainMenu(): void {
    this.clearView();
    const view = new Container();
    this.currentView = view;

    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x0a0a1a, alpha: 0.95 });
    view.addChild(bg);

    const title = new Text({ text: "MULTIPLAYER", style: HEADER_STYLE });
    title.x = GAME_WIDTH / 2;
    title.y = 50;
    title.anchor.set(0.5, 0.5);
    view.addChild(title);

    let y = 110;
    const btnW = 260, btnH = 44, btnX = (GAME_WIDTH - btnW) / 2;

    y = this.addButton(view, "Local Co-op", y, btnW, btnH, btnX, 0x1a3355, () => {
      this.onLaunch?.(); this.container.visible = false;
      this.app.renderer.resize(GAME_WIDTH * 2, GAME_HEIGHT);
      this.app.canvas.style.maxWidth = "1000px";
      this.app.canvas.style.aspectRatio = `${GAME_WIDTH * 2} / ${GAME_HEIGHT}`;
      showModePicker(this.app, (m, p1c, p2c) => launchLocalCoop(this.app, Math.floor(Math.random() * 0xffffffff), m, p1c, p2c));
    });

    const localInfo = new Text({ text: "Same PC — Player 1: WASD, Player 2: Arrows", style: INFO_STYLE });
    localInfo.x = GAME_WIDTH / 2; localInfo.y = y;
    localInfo.anchor.set(0.5, 0);
    view.addChild(localInfo);
    y += 30;

    // Quick Connect
    y += 10;
    y = this.addButton(view, "Quick Connect", y, btnW, btnH, btnX, 0x1a3355, () => {
      this.showQuickConnect();
    });

    const qcInfo = new Text({
      text: "Uses public Nostr relays for connection.\nYour IP address is shared with relay servers.",
      style: INFO_STYLE,
    });
    qcInfo.x = GAME_WIDTH / 2;
    qcInfo.y = y;
    qcInfo.anchor.set(0.5, 0);
    view.addChild(qcInfo);
    y += 45;

    // Private Connect
    y += 10;
    y = this.addButton(view, "Private Connect", y, btnW, btnH, btnX, 0x2a6e3f, () => {
      this.showPrivateConnect();
    });

    const pcInfo = new Text({
      text: "No external servers. Exchange codes manually\nvia your own channel (Telegram, WhatsApp, etc.).",
      style: INFO_STYLE,
    });
    pcInfo.x = GAME_WIDTH / 2;
    pcInfo.y = y;
    pcInfo.anchor.set(0.5, 0);
    view.addChild(pcInfo);
    y += 45;

    // Back button
    y += 20;
    this.addButton(view, "Back", y, 160, 36, (GAME_WIDTH - 160) / 2, 0x222244, () => {
      this.destroy();
      this.onBack();
    });

    this.container.addChild(view);
  }

  showQuickConnect(): void {
    this.clearView();
    const view = new Container();
    this.currentView = view;

    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x0a0a1a, alpha: 0.95 });
    view.addChild(bg);

    const title = new Text({ text: "QUICK CONNECT", style: HEADER_STYLE });
    title.x = GAME_WIDTH / 2;
    title.y = 50;
    title.anchor.set(0.5, 0.5);
    view.addChild(title);

    let y = 110;
    const btnW = 220;
    const btnH = 40;
    const btnX = (GAME_WIDTH - btnW) / 2;

    y = this.addButton(view, "Create Game", y, btnW, btnH, btnX, 0x1a3355, () => {
      doQuickCreate(this);
    });
    y += 15;
    y = this.addButton(view, "Join Game", y, btnW, btnH, btnX, 0x1a3355, () => {
      this.showQuickJoin();
    });
    y += 30;
    this.addButton(view, "Back", y, 160, 36, (GAME_WIDTH - 160) / 2, 0x222244, () => {
      this.showMainMenu();
    });

    this.container.addChild(view);
  }

  private showQuickJoin(): void {
    this.showCodeInput("QUICK CONNECT — JOIN", "Enter room code:", (code) => {
      doQuickJoin(this, code);
    }, () => this.showQuickConnect());
  }

  showPrivateConnect(): void {
    this.clearView();
    const view = new Container();
    this.currentView = view;

    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x0a0a1a, alpha: 0.95 });
    view.addChild(bg);

    const title = new Text({ text: "PRIVATE CONNECT", style: HEADER_STYLE });
    title.x = GAME_WIDTH / 2;
    title.y = 50;
    title.anchor.set(0.5, 0.5);
    view.addChild(title);

    let y = 110;
    const btnW = 220;
    const btnH = 40;
    const btnX = (GAME_WIDTH - btnW) / 2;

    y = this.addButton(view, "Create Game", y, btnW, btnH, btnX, 0x2a6e3f, () => {
      doPrivateCreate(this);
    });
    y += 15;
    y = this.addButton(view, "Join Game", y, btnW, btnH, btnX, 0x2a6e3f, () => {
      this.showPrivateJoinStep1();
    });
    y += 30;
    this.addButton(view, "Back", y, 160, 36, (GAME_WIDTH - 160) / 2, 0x222244, () => {
      this.showMainMenu();
    });

    this.container.addChild(view);
  }

  private showPrivateJoinStep1(): void {
    this.showCodeInput(
      "PRIVATE — JOIN (Step 1)",
      "Paste the host's code:",
      async (code) => { await doPrivateJoin(this, code); },
      () => this.showPrivateConnect(),
    );
  }

  enterLobby(role: "host" | "guest"): void {
    if (!this.connection) return;

    this.clearView();
    const sync = new GameSync();

    const mode = this.connection.getMode();
    if (mode === "nostr") {
      const room = this.connection.getRoom();
      if (room) sync.initWithRoom(room);
    } else {
      const channel = this.connection.getChannel();
      if (channel) sync.initWithChannel(channel);
    }

    const lobby = new LobbyScreen(role, sync, {
      onStart: (seed, _mode, touchControls, remoteChar) => {
        this.container.removeChild(lobby.container);
        lobby.destroy();
        this.onLaunch?.();
        this.container.visible = false;

        const session = new OnlineSession({
          app: this.app,
          connection: this.connection!,
          seed,
          role,
          touchControls,
          remoteCharacter: remoteChar,
        });
        session.start();
      },
    });

    this.container.addChild(lobby.container);
  }

  showError(message: string): void {
    this.clearView();
    const view = new Container();
    this.currentView = view;

    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x0a0a1a, alpha: 0.95 });
    view.addChild(bg);

    const errorText = new Text({
      text: message,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 14,
        fill: "#ff6666",
        wordWrap: true,
        wordWrapWidth: GAME_WIDTH - 60,
        stroke: { color: "#000000", width: 2 },
      }),
    });
    errorText.x = GAME_WIDTH / 2;
    errorText.y = GAME_HEIGHT * 0.35;
    errorText.anchor.set(0.5, 0.5);
    view.addChild(errorText);

    this.addButton(view, "Back", GAME_HEIGHT * 0.5, 160, 36,
      (GAME_WIDTH - 160) / 2, 0x222244, () => {
        this.connection?.disconnect();
        this.showMainMenu();
      });

    this.container.addChild(view);
  }

  private showCodeInput(
    title: string,
    prompt: string,
    onSubmit: (code: string) => void,
    onCancel: () => void,
  ): void {
    this.clearView();
    const view = new Container();
    this.currentView = view;

    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.fill({ color: 0x0a0a1a, alpha: 0.95 });
    view.addChild(bg);

    const titleText = new Text({ text: title, style: HEADER_STYLE });
    titleText.x = GAME_WIDTH / 2;
    titleText.y = 50;
    titleText.anchor.set(0.5, 0.5);
    view.addChild(titleText);

    const promptText = new Text({ text: prompt, style: INFO_STYLE });
    promptText.x = GAME_WIDTH / 2;
    promptText.y = 90;
    promptText.anchor.set(0.5, 0);
    view.addChild(promptText);

    // Real HTML input for mobile keyboard support
    const { element: input, cleanup: cleanupInput } = createCodeInput(
      "Enter code here...",
      (value) => { cleanupInput(); cleanupBtn(); onSubmit(value); },
    );
    const { cleanup: cleanupBtn } = createSubmitButton("Submit", () => {
      if (input.value.trim()) {
        const val = input.value.trim();
        cleanupInput();
        cleanupBtn();
        onSubmit(val);
      }
    });

    this.addButton(view, "Cancel", GAME_HEIGHT - 80, 160, 36,
      (GAME_WIDTH - 160) / 2, 0x222244, () => {
        cleanupInput();
        cleanupBtn();
        onCancel();
      });

    this.container.addChild(view);
  }

  addButton(
    parent: Container,
    label: string,
    y: number,
    w: number,
    h: number,
    x: number,
    color: number,
    onClick: () => void,
  ): number {
    const bg = new Graphics();
    bg.roundRect(x, y, w, h, 8);
    bg.fill({ color, alpha: 0.85 });
    bg.roundRect(x, y, w, h, 8);
    bg.stroke({ width: 1, color: 0x6688bb, alpha: 0.3 });
    bg.eventMode = "static";
    bg.cursor = "pointer";
    bg.on("pointertap", onClick);
    parent.addChild(bg);

    const text = new Text({ text: label, style: BTN_STYLE });
    text.x = x + w / 2;
    text.y = y + h / 2;
    text.anchor.set(0.5, 0.5);
    text.eventMode = "static";
    text.cursor = "pointer";
    text.on("pointertap", onClick);
    parent.addChild(text);

    return y + h + 8;
  }

  destroy(): void {
    this.connection?.disconnect();
    this.container.destroy({ children: true });
  }
}
