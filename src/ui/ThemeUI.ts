/** UI theme colors — menus, buttons, and text adapt to the active cosmetic theme. */

import { loadCosmetics } from "../systems/Cosmetics";

export interface UIThemeColors {
  bg: number;
  bgAlpha: number;
  text: string;
  textDim: string;
  accent: string;
  buttonBg: number;
  buttonBorder: number;
  sectionText: string;
}

const THEMES: Record<string, UIThemeColors> = {
  theme_default: {
    bg: 0x111111, bgAlpha: 1, text: "#ffffff", textDim: "#665544",
    accent: "#ffcc88", buttonBg: 0x222233, buttonBorder: 0x555566, sectionText: "#ffcc88",
  },
  theme_neon: {
    bg: 0x080818, bgAlpha: 1, text: "#00ffff", textDim: "#006666",
    accent: "#ff00ff", buttonBg: 0x0a0a2a, buttonBorder: 0x00ffff, sectionText: "#00ffff",
  },
  theme_pixel: {
    bg: 0x222222, bgAlpha: 1, text: "#dddddd", textDim: "#666666",
    accent: "#88ff44", buttonBg: 0x333333, buttonBorder: 0x888888, sectionText: "#88ff44",
  },
  theme_candy: {
    bg: 0xffeef4, bgAlpha: 1, text: "#884466", textDim: "#cc99aa",
    accent: "#ff66aa", buttonBg: 0xffddee, buttonBorder: 0xff88bb, sectionText: "#ff66aa",
  },
  theme_dark: {
    bg: 0x0a0a14, bgAlpha: 1, text: "#aa88cc", textDim: "#443355",
    accent: "#ff4466", buttonBg: 0x151525, buttonBorder: 0x6644aa, sectionText: "#ff4466",
  },
};

/** Get UI theme colors for the currently equipped cosmetic theme. */
export function getUITheme(): UIThemeColors {
  const cosmetics = loadCosmetics();
  const theme = cosmetics.equipped.theme ?? "theme_default";
  return THEMES[theme] ?? THEMES.theme_default;
}

/** Get UI theme colors for a specific theme ID. */
export function getUIThemeFor(themeId: string): UIThemeColors {
  return THEMES[themeId] ?? THEMES.theme_default;
}
