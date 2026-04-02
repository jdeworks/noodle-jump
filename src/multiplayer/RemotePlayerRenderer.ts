/**
 * Renders the remote player on the local player's canvas.
 * - Tinted semi-transparent chef when on-screen (orange=above, green=below)
 * - Directional arrow with distance when off-screen
 */

import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { drawCharacter } from "../rendering/PlayerCharacters";
import { worldToScreen } from "../systems/Camera";
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT } from "../config/constants";
import type { InterpolatedState } from "./InterpolationBuffer";

const GHOST_ALPHA = 0.55;
const GHOST_DEAD_ALPHA = 0.3;
const ARROW_MARGIN = 30;
const ARROW_SIZE = 14;

// Tint colors: orange when opponent is ahead, green when behind
const COLOR_ABOVE = 0xff8833; // opponent is higher (ahead)
const COLOR_BELOW = 0x33cc55; // opponent is lower (behind)
const COLOR_SAME = 0xffcc44;  // roughly same height

export class RemotePlayerRenderer {
  readonly container = new Container();
  private chefGfx = new Graphics();
  private arrowGfx = new Graphics();
  private distanceText: Text;
  private characterId = "chef";

  constructor(characterId = "chef") {
    this.characterId = characterId;
    this.chefGfx.alpha = GHOST_ALPHA;
    this.container.addChild(this.chefGfx);

    this.arrowGfx.visible = false;
    this.container.addChild(this.arrowGfx);

    this.distanceText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 12,
        fill: "#ffffff",
        fontWeight: "bold",
        stroke: { color: "#000000", width: 2 },
      }),
    });
    this.distanceText.anchor.set(0.5, 0.5);
    this.distanceText.visible = false;
    this.container.addChild(this.distanceText);

    drawCharacter(this.chefGfx, PLAYER_WIDTH, PLAYER_HEIGHT, this.characterId);
  }

  /** Update the remote player position each frame. */
  update(remote: InterpolatedState, localCameraY: number, localPlayerY?: number): void {
    const screenX = remote.x;
    const screenY = worldToScreen(remote.y, localCameraY);

    // Determine tint: is remote player above or below local player?
    const refY = localPlayerY ?? localCameraY;
    const heightDiff = refY - remote.y; // positive = remote is higher (lower Y = higher)
    const tintColor = heightDiff > 50 ? COLOR_ABOVE : heightDiff < -50 ? COLOR_BELOW : COLOR_SAME;

    const onScreen = screenY > -PLAYER_HEIGHT && screenY < GAME_HEIGHT + PLAYER_HEIGHT;

    if (onScreen) {
      this.chefGfx.visible = true;
      this.chefGfx.x = screenX;
      this.chefGfx.y = screenY;
      this.chefGfx.tint = tintColor;
      this.chefGfx.alpha = remote.playerState >= 1 ? GHOST_DEAD_ALPHA : GHOST_ALPHA;

      this.arrowGfx.visible = false;
      this.distanceText.visible = false;
    } else {
      this.chefGfx.visible = false;
      this.arrowGfx.visible = true;
      this.distanceText.visible = true;

      const aboveScreen = screenY <= -PLAYER_HEIGHT;
      const distanceM = Math.abs(Math.round((remote.y - localCameraY) / 10));
      const arrowColor = aboveScreen ? COLOR_ABOVE : COLOR_BELOW;

      const arrowX = Math.max(ARROW_MARGIN, Math.min(GAME_WIDTH - ARROW_MARGIN, screenX + PLAYER_WIDTH / 2));
      const arrowY = aboveScreen ? ARROW_MARGIN : GAME_HEIGHT - ARROW_MARGIN;

      this.arrowGfx.clear();
      this.arrowGfx.moveTo(arrowX, arrowY + (aboveScreen ? ARROW_SIZE : -ARROW_SIZE));
      this.arrowGfx.lineTo(arrowX - ARROW_SIZE * 0.7, arrowY + (aboveScreen ? -2 : 2));
      this.arrowGfx.lineTo(arrowX + ARROW_SIZE * 0.7, arrowY + (aboveScreen ? -2 : 2));
      this.arrowGfx.closePath();
      this.arrowGfx.fill({ color: arrowColor, alpha: 0.85 });

      const label = aboveScreen ? `${distanceM}m` : `${distanceM}m`;
      this.distanceText.text = label;
      this.distanceText.style.fill = "#" + arrowColor.toString(16).padStart(6, "0");
      this.distanceText.x = arrowX;
      this.distanceText.y = arrowY + (aboveScreen ? ARROW_SIZE + 12 : -ARROW_SIZE - 12);
    }
  }

  hide(): void {
    this.chefGfx.visible = false;
    this.arrowGfx.visible = false;
    this.distanceText.visible = false;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
