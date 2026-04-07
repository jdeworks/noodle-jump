/**
 * Sub-views for the multiplayer menu (Quick Connect, Private Connect, code input, error).
 * Extracted from MultiplayerMenu to keep files under 400 LOC.
 */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";
import { createCodeInput, createSubmitButton } from "./HtmlOverlay";
import { doQuickCreate, doQuickJoin, doPrivateCreate, doPrivateJoin } from "./ConnectFlows";
import type { MultiplayerMenu } from "./MultiplayerMenu";

const HEADER_STYLE = new TextStyle({
  fontFamily: "monospace",
  fontSize: 22,
  fill: "#ffffff",
  fontWeight: "bold",
  stroke: { color: "#000000", width: 3 },
});

const INFO_STYLE = new TextStyle({
  fontFamily: "monospace",
  fontSize: 11,
  fill: "#aaaaaa",
  wordWrap: true,
  wordWrapWidth: GAME_WIDTH - 60,
  stroke: { color: "#000000", width: 1 },
});

export function showQuickConnectView(menu: MultiplayerMenu): void {
  menu.clearView();
  const view = new Container();
  menu.setCurrentView(view);

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

  y = menu.addButton(view, "Create Game", y, btnW, btnH, btnX, 0x1a3355, () => {
    doQuickCreate(menu);
  });
  y += 15;
  y = menu.addButton(view, "Join Game", y, btnW, btnH, btnX, 0x1a3355, () => {
    showQuickJoinView(menu);
  });
  y += 30;
  menu.addButton(view, "Back", y, 160, 36, (GAME_WIDTH - 160) / 2, 0x222244, () => {
    menu.showMainMenu();
  });

  menu.container.addChild(view);
}

function showQuickJoinView(menu: MultiplayerMenu): void {
  showCodeInputView(
    menu,
    "QUICK CONNECT \u2014 JOIN",
    "Enter room code:",
    (code) => {
      doQuickJoin(menu, code);
    },
    () => showQuickConnectView(menu),
  );
}

export function showPrivateConnectView(menu: MultiplayerMenu): void {
  menu.clearView();
  const view = new Container();
  menu.setCurrentView(view);

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

  y = menu.addButton(view, "Create Game", y, btnW, btnH, btnX, 0x2a6e3f, () => {
    doPrivateCreate(menu);
  });
  y += 15;
  y = menu.addButton(view, "Join Game", y, btnW, btnH, btnX, 0x2a6e3f, () => {
    showPrivateJoinStep1(menu);
  });
  y += 30;
  menu.addButton(view, "Back", y, 160, 36, (GAME_WIDTH - 160) / 2, 0x222244, () => {
    menu.showMainMenu();
  });

  menu.container.addChild(view);
}

function showPrivateJoinStep1(menu: MultiplayerMenu): void {
  showCodeInputView(
    menu,
    "PRIVATE \u2014 JOIN (Step 1)",
    "Paste the host's code:",
    async (code) => {
      await doPrivateJoin(menu, code);
    },
    () => showPrivateConnectView(menu),
  );
}

export function showCodeInputView(
  menu: MultiplayerMenu,
  titleStr: string,
  promptStr: string,
  onSubmit: (code: string) => void,
  onCancel: () => void,
): void {
  menu.clearView();
  const view = new Container();
  menu.setCurrentView(view);

  const bg = new Graphics();
  bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  bg.fill({ color: 0x0a0a1a, alpha: 0.95 });
  view.addChild(bg);

  const titleText = new Text({ text: titleStr, style: HEADER_STYLE });
  titleText.x = GAME_WIDTH / 2;
  titleText.y = 50;
  titleText.anchor.set(0.5, 0.5);
  view.addChild(titleText);

  const promptText = new Text({ text: promptStr, style: INFO_STYLE });
  promptText.x = GAME_WIDTH / 2;
  promptText.y = 90;
  promptText.anchor.set(0.5, 0);
  view.addChild(promptText);

  const { element: input, cleanup: cleanupInput } = createCodeInput(
    "Enter code here...",
    (value) => {
      cleanupInput();
      cleanupBtn();
      onSubmit(value);
    },
  );
  const { cleanup: cleanupBtn } = createSubmitButton("Submit", () => {
    if (input.value.trim()) {
      const val = input.value.trim();
      cleanupInput();
      cleanupBtn();
      onSubmit(val);
    }
  });

  menu.addButton(
    view,
    "Cancel",
    GAME_HEIGHT - 80,
    160,
    36,
    (GAME_WIDTH - 160) / 2,
    0x222244,
    () => {
      cleanupInput();
      cleanupBtn();
      onCancel();
    },
  );

  menu.container.addChild(view);
}

export function showErrorView(menu: MultiplayerMenu, message: string): void {
  menu.clearView();
  const view = new Container();
  menu.setCurrentView(view);

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

  menu.addButton(view, "Back", GAME_HEIGHT * 0.5, 160, 36, (GAME_WIDTH - 160) / 2, 0x222244, () => {
    menu.getConnection()?.disconnect();
    menu.showMainMenu();
  });

  menu.container.addChild(view);
}
