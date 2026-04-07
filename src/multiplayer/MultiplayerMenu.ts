/**
 * Multiplayer menu — entry point for all multiplayer modes.
 * Shows Local Co-op / Quick Connect / Private Connect options.
 * Handles create/join flows and wires into LobbyScreen -> OnlineSession.
 */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { getUITheme } from "../ui/ThemeUI";
import { ConnectionManager } from "./ConnectionManager";
import { GameSync } from "./GameSync";
import { LobbyScreen, getPlayerName } from "./LobbyScreen";
import { OnlineSession } from "./OnlineSession";
import { launchLocalCoop } from "./LocalCoopLauncher";
import { showModePicker } from "./ModePickerScreen";
import type { MenuContext } from "./ConnectFlows";
import { showQuickConnectView, showPrivateConnectView, showErrorView } from "./MenuViews";

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
  private escHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(app: Application, onBack: MenuCallback, onLaunch?: MenuCallback) {
    this.app = app;
    this.onLaunch = onLaunch ?? null;
    this.onBack = onBack;
    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.container.visible) {
        this.destroy();
        onBack();
      }
    };
    window.addEventListener("keydown", this.escHandler);
    this.showMainMenu();
  }

  clearView(): void {
    if (this.currentView) {
      this.container.removeChild(this.currentView);
      this.currentView.destroy({ children: true });
      this.currentView = null;
    }
  }

  setCurrentView(view: Container): void {
    this.currentView = view;
  }

  setConnection(conn: ConnectionManager): void {
    this.connection = conn;
  }

  getConnection(): ConnectionManager | null {
    return this.connection;
  }

  showMainMenu(): void {
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
    const btnW = 260,
      btnH = 44,
      btnX = (GAME_WIDTH - btnW) / 2;

    y = this.addButton(view, "Local Co-op", y, btnW, btnH, btnX, 0x1a3355, () => {
      this.onLaunch?.();
      this.container.visible = false;
      this.app.renderer.resize(GAME_WIDTH * 2, GAME_HEIGHT);
      this.app.canvas.style.maxWidth = "1000px";
      this.app.canvas.style.aspectRatio = `${GAME_WIDTH * 2} / ${GAME_HEIGHT}`;
      showModePicker(this.app, (m, p1c, p2c, rc) =>
        launchLocalCoop(this.app, Math.floor(Math.random() * 0xffffffff), m, p1c, p2c, rc),
      );
    });

    const localInfo = new Text({
      text: "Same PC \u2014 Player 1: WASD, Player 2: Arrows",
      style: INFO_STYLE,
    });
    localInfo.x = GAME_WIDTH / 2;
    localInfo.y = y;
    localInfo.anchor.set(0.5, 0);
    view.addChild(localInfo);
    y += 30;

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

    y += 10;
    y = this.addButton(view, "Private Connect", y, btnW, btnH, btnX, 0x2a6e3f, () => {
      this.showPrivateConnect();
    });

    const pcInfo = new Text({
      text: "2 players only. No external servers.\nExchange codes via Telegram, WhatsApp, etc.",
      style: INFO_STYLE,
    });
    pcInfo.x = GAME_WIDTH / 2;
    pcInfo.y = y;
    pcInfo.anchor.set(0.5, 0);
    view.addChild(pcInfo);
    y += 45;

    y += 20;
    this.addButton(view, "Back", y, 160, 36, (GAME_WIDTH - 160) / 2, 0x222244, () => {
      this.destroy();
      this.onBack();
    });

    this.container.addChild(view);
  }

  showQuickConnect(): void {
    showQuickConnectView(this);
  }

  showPrivateConnect(): void {
    showPrivateConnectView(this);
  }

  enterLobby(role: "host" | "guest", roomCode?: string): void {
    if (!this.connection) return;
    this.clearView();
    const sync = new GameSync();
    const connMode = this.connection.getMode();
    if (connMode === "nostr") {
      const room = this.connection.getRoom();
      if (room) sync.initWithRoom(room);
    } else {
      const ch = this.connection.getChannel();
      if (ch) sync.initWithChannel(ch);
    }

    const lobby = new LobbyScreen(
      role,
      sync,
      {
        onStart: (seed, mode, touchControls, remotePeers, sharedRunConfig) => {
          this.connection?.setOnPeerLeave(null);
          this.container.removeChild(lobby.container);
          lobby.destroy();
          this.onLaunch?.();
          this.container.visible = false;
          const session = new OnlineSession({
            app: this.app,
            connection: this.connection!,
            seed,
            role,
            mode,
            touchControls,
            remotePeers,
            sync,
            sharedRunConfig,
            localName: getPlayerName(),
          });
          session.start();
        },
        onKicked: () => {
          this.connection?.setOnPeerLeave(null);
          this.container.removeChild(lobby.container);
          lobby.destroy();
          this.connection?.disconnect();
          this.showMainMenu();
        },
      },
      roomCode,
    );
    this.connection.setOnPeerLeave((id) => lobby.handlePeerLeave(id));
    this.container.addChild(lobby.container);
  }

  showError(message: string): void {
    showErrorView(this, message);
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
    const uiT = getUITheme();
    bg.fill({ color: uiT.buttonBg, alpha: 0.85 });
    bg.roundRect(x, y, w, h, 8);
    bg.stroke({ width: 1, color: uiT.buttonBorder, alpha: 0.4 });
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
    if (this.escHandler) {
      window.removeEventListener("keydown", this.escHandler);
      this.escHandler = null;
    }
    this.connection?.disconnect();
    this.container.destroy({ children: true });
  }
}
