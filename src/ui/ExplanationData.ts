/** Static section data for the explanation/help screen. */

import { COLORS } from "../config/constants";
import { POWER_UP_INFO } from "./PowerUpDescriptions";
import { type PlatformStyle } from "../rendering/PlatformSprites";

export interface ExplanationItem {
  label: string;
  desc: string;
  color?: number;
  platformStyle?: PlatformStyle;
  powerUpType?: string;
}

export interface Section {
  title: string;
  items: ExplanationItem[];
}

export const SECTIONS: Section[] = [
  {
    title: "CONTROLS",
    items: [
      { label: "Tilt / Arrows / WASD", desc: "Move left and right" },
      { label: "Tap / Click", desc: "Throw a knife (when enemies are on)" },
    ],
  },
  {
    title: "SCORING",
    items: [
      { label: "Climb higher", desc: "Height = points" },
      { label: "Meatballs", desc: "1000 points each — collect quickly for combos" },
      { label: "Edge landings", desc: "Close call bonus for landing near edges" },
      { label: "Streaks", desc: "Every 5 consecutive landings = bonus" },
    ],
  },
  {
    title: "PLATFORMS",
    items: [
      {
        label: "Normal",
        desc: "Standard — always bouncy",
        color: 0xd4a574,
        platformStyle: "normal" as PlatformStyle,
      },
      {
        label: "Breaking",
        desc: "Bounces once then breaks",
        color: 0x8b6914,
        platformStyle: "breaking" as PlatformStyle,
      },
      {
        label: "Brittle",
        desc: "Fall through instantly!",
        color: 0xc4a882,
        platformStyle: "brittle" as PlatformStyle,
      },
      {
        label: "Moving",
        desc: "Slides left and right",
        color: 0xc8915a,
        platformStyle: "moving" as PlatformStyle,
      },
      {
        label: "Conveyor",
        desc: "Pushes you sideways",
        color: 0x999999,
        platformStyle: "conveyor" as PlatformStyle,
      },
      {
        label: "Spring",
        desc: "Extra high bounce",
        color: 0x44cc44,
        platformStyle: "spring" as PlatformStyle,
      },
      {
        label: "Ice",
        desc: "Slippery — you slide",
        color: 0xaaddff,
        platformStyle: "ice" as PlatformStyle,
      },
      {
        label: "Crumbling",
        desc: "Breaks after 1.5 seconds",
        color: 0xbb8855,
        platformStyle: "crumbling" as PlatformStyle,
      },
      {
        label: "Teleport",
        desc: "Warps you to another",
        color: 0x8844ff,
        platformStyle: "teleport" as PlatformStyle,
      },
      {
        label: "Weighted",
        desc: "Tilts where you land",
        color: 0xaa8866,
        platformStyle: "weighted" as PlatformStyle,
      },
    ],
  },
  {
    title: "POSITIVE POWER-UPS",
    items: Object.entries(POWER_UP_INFO)
      .filter(([, info]) => info.positive)
      .map(([type, info]) => ({
        label: info.name,
        desc: info.description,
        color: COLORS.powerups[type] ?? 0x44ff44,
        powerUpType: type,
      })),
  },
  {
    title: "NEGATIVE POWER-UPS  —  avoid these!",
    items: Object.entries(POWER_UP_INFO)
      .filter(([, info]) => !info.positive)
      .map(([type, info]) => ({
        label: info.name,
        desc: info.description,
        color: COLORS.powerups[type] ?? 0xff4444,
        powerUpType: type,
      })),
  },
  {
    title: "7 ZONES",
    items: [
      { label: "Kitchen", desc: "Warm start — where it all begins" },
      { label: "Boiling Pot", desc: "Steamy bubbling zone — watch the heat" },
      { label: "Space", desc: "Dark void — stars and planets" },
      { label: "Freezer", desc: "Icy cold — snow and slippery platforms" },
      { label: "Volcano", desc: "Fiery — embers and rising heat" },
      { label: "Candy World", desc: "Sweet pastels — sugar crystals" },
      { label: "Final Kitchen", desc: "Golden — everything combined" },
    ],
  },
  {
    title: "ENEMIES & BOSSES",
    items: [
      { label: "Enemies", desc: "Toggle in settings — rats, fish, aliens per zone" },
      { label: "Knives", desc: "Tap to throw! 3 ammo, regenerates over time" },
      { label: "Killed enemies", desc: "Turn into meatballs you can collect" },
      { label: "Bosses", desc: "Appear at zone transitions — 3 unique types" },
    ],
  },
];
