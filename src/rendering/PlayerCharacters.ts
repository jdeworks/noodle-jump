/** Player character definitions — 10 visually distinct tiny sprites (32x40). */

import { Graphics } from "pixi.js";
import {
  drawChefBase,
  drawGoblin,
  drawGrandma,
  drawRobot,
  drawNinja,
  drawPrincess,
  drawAlien,
  drawViking,
  drawPirate,
  drawWizard,
} from "./PlayerCharacterDraws";
import { drawNeonChef, drawNyanCat, drawSkeleton } from "./UnlockableCharacterDraws";

export interface CharacterDef {
  id: string;
  name: string;
  draw: (gfx: Graphics, w: number, h: number) => void;
}

// ── Character registry ─────────────────────────────────────────────

export const CHARACTERS: CharacterDef[] = [
  { id: "chef", name: "Chef", draw: drawChefBase },
  { id: "goblin", name: "Goblin", draw: drawGoblin },
  { id: "grandma", name: "Grandma", draw: drawGrandma },
  { id: "robot", name: "Robot", draw: drawRobot },
  { id: "ninja", name: "Ninja", draw: drawNinja },
  { id: "princess", name: "Princess", draw: drawPrincess },
  { id: "alien", name: "Alien", draw: drawAlien },
  { id: "viking", name: "Viking", draw: drawViking },
  { id: "pirate", name: "Pirate", draw: drawPirate },
  { id: "wizard", name: "Wizard", draw: drawWizard },
  { id: "neon_chef", name: "Neon Chef", draw: drawNeonChef },
  { id: "nyan_cat", name: "Nyan Cat", draw: drawNyanCat },
  { id: "skeleton", name: "Skeleton", draw: drawSkeleton },
];

const characterMap = new Map(CHARACTERS.map((c) => [c.id, c.draw]));

/** Draw the character with the given ID (falls back to chef). */
export function drawCharacter(gfx: Graphics, w: number, h: number, id: string): void {
  gfx.clear();
  const draw = characterMap.get(id) ?? drawChefBase;
  draw(gfx, w, h);
}
