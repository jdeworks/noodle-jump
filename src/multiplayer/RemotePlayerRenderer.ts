/**
 * Renders the remote player on the local player's canvas.
 * - Semi-transparent chef when on-screen
 * - Directional arrow with distance when off-screen
 */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { drawChef } from "../rendering/ChefSprites";
import { worldToScreen } from "../systems/Camera";
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT } from "../config/constants";
import type { InterpolatedState } from "./InterpolationBuffer";

const GHOST_ALPHA = 0.4;
const ARROW_MARGIN = 30;
const ARROW_SIZE = 12;

export class RemotePlayerRenderer {
  readonly container = new Container();
  private chefGfx = new Graphics();
  private arrowGfx = new Graphics();
  private distanceText: Text;

  constructor() {
    this.chefGfx.alpha = GHOST_ALPHA;
    this.container.addChild(this.chefGfx);

    this.arrowGfx.visible = false;
    this.container.addChild(this.arrowGfx);

    this.distanceText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 11,
        fill: "#ffffff",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    this.distanceText.anchor.set(0.5, 0.5);
    this.distanceText.visible = false;
    this.container.addChild(this.distanceText);

    // Draw the chef sprite once
    drawChef(this.chefGfx, PLAYER_WIDTH, PLAYER_HEIGHT);
  }

  /** Update the remote player position each frame. */
  update(remote: InterpolatedState, localCameraY: number): void {
    const screenX = remote.x;
    const screenY = worldToScreen(remote.y, localCameraY);

    const onScreen =
      screenY > -PLAYER_HEIGHT &&
      screenY < GAME_HEIGHT + PLAYER_HEIGHT;

    if (onScreen) {
      // Show chef ghost on-screen
      this.chefGfx.visible = true;
      this.chefGfx.x = screenX;
      this.chefGfx.y = screenY;

      // Dim further if dead/ghost
      this.chefGfx.alpha = remote.playerState >= 1 ? GHOST_ALPHA * 0.5 : GHOST_ALPHA;

      this.arrowGfx.visible = false;
      this.distanceText.visible = false;
    } else {
      // Off-screen — show arrow + distance
      this.chefGfx.visible = false;
      this.arrowGfx.visible = true;
      this.distanceText.visible = true;

      const aboveScreen = screenY <= -PLAYER_HEIGHT;
      const distanceM = Math.abs(Math.round((remote.y - localCameraY) / 10));

      // Arrow position
      const arrowX = Math.max(ARROW_MARGIN, Math.min(GAME_WIDTH - ARROW_MARGIN, screenX + PLAYER_WIDTH / 2));
      const arrowY = aboveScreen ? ARROW_MARGIN : GAME_HEIGHT - ARROW_MARGIN;

      this.arrowGfx.clear();
      this.arrowGfx.moveTo(arrowX, arrowY + (aboveScreen ? ARROW_SIZE : -ARROW_SIZE));
      this.arrowGfx.lineTo(arrowX - ARROW_SIZE * 0.6, arrowY + (aboveScreen ? -2 : 2));
      this.arrowGfx.lineTo(arrowX + ARROW_SIZE * 0.6, arrowY + (aboveScreen ? -2 : 2));
      this.arrowGfx.closePath();
      this.arrowGfx.fill({ color: 0xffffff, alpha: 0.7 });

      // Distance label
      const label = aboveScreen ? `↑ ${distanceM}m` : `↓ ${distanceM}m`;
      this.distanceText.text = label;
      this.distanceText.x = arrowX;
      this.distanceText.y = arrowY + (aboveScreen ? ARROW_SIZE + 10 : -ARROW_SIZE - 10);
    }
  }

  /** Hide everything (e.g., before first update arrives). */
  hide(): void {
    this.chefGfx.visible = false;
    this.arrowGfx.visible = false;
    this.distanceText.visible = false;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
