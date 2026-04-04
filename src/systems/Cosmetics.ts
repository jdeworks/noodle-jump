/** Cosmetics system — unlockable trails, tints, themes, characters. Pure logic. */

const STORAGE_KEY = "noodle-jump-cosmetics";

export type CosmeticType = "trail" | "tint" | "theme";

export interface Cosmetic {
  id: string;
  type: CosmeticType;
  name: string;
  description: string;
  /** Achievement ID required to unlock, or null if free. */
  unlockAchievement: string | null;
  /** Optional unlock phrase (shown once earned naturally). */
  unlockPhrase: string | null;
}

/** Character that can be unlocked via achievements. */
export interface UnlockableCharacter {
  id: string;
  name: string;
  /** Achievement required, or null if available from the start. */
  unlockAchievement: string | null;
  /** Optional unlock phrase. */
  unlockPhrase: string | null;
}

export interface CosmeticState {
  unlocked: Set<string>;
  equipped: Record<CosmeticType, string | null>;
}

// ── Tint color map ────────────────────────────────────────────────────

export const TINT_COLORS: Record<string, number> = {
  tint_none: 0xffffff,
  tint_gold: 0xffdd44,
  tint_ice: 0x88ccff,
  tint_fire: 0xff8866,
  tint_neon: 0x66ff88,
  tint_shadow: 0x8866aa,
  tint_rose: 0xff99bb,
  tint_sunset: 0xffaa44,
};

// ── Cosmetic definitions ──────────────────────────────────────────────

export const COSMETICS: Cosmetic[] = [
  // Trails
  { id: "trail_none", type: "trail", name: "No Trail", description: "Clean movement", unlockAchievement: null, unlockPhrase: null },
  { id: "trail_sparkle", type: "trail", name: "Sparkle", description: "Glittering sparkles", unlockAchievement: "meatball_100", unlockPhrase: null },
  { id: "trail_fire", type: "trail", name: "Fire", description: "Blazing flames", unlockAchievement: "height_1000", unlockPhrase: null },
  { id: "trail_rainbow", type: "trail", name: "Rainbow", description: "Colorful rainbow streak", unlockAchievement: "score_100k", unlockPhrase: null },
  { id: "trail_stars", type: "trail", name: "Stars", description: "Twinkling stars", unlockAchievement: "zone_5", unlockPhrase: null },
  { id: "trail_hearts", type: "trail", name: "Hearts", description: "Floating hearts", unlockAchievement: "games_50", unlockPhrase: null },
  { id: "trail_snow", type: "trail", name: "Snow", description: "Snowflake particles", unlockAchievement: "zone_4", unlockPhrase: null },
  { id: "trail_neon", type: "trail", name: "Neon", description: "Cyan & magenta glow", unlockAchievement: "combo_5x", unlockPhrase: null },

  // Tints
  { id: "tint_none", type: "tint", name: "None", description: "No color overlay", unlockAchievement: null, unlockPhrase: null },
  { id: "tint_gold", type: "tint", name: "Gold", description: "Golden glow", unlockAchievement: "score_50k", unlockPhrase: null },
  { id: "tint_ice", type: "tint", name: "Ice", description: "Icy blue", unlockAchievement: "zone_4", unlockPhrase: null },
  { id: "tint_fire", type: "tint", name: "Fire", description: "Warm red", unlockAchievement: "zone_5", unlockPhrase: null },
  { id: "tint_neon", type: "tint", name: "Neon", description: "Electric green", unlockAchievement: "height_500", unlockPhrase: null },
  { id: "tint_shadow", type: "tint", name: "Shadow", description: "Dark purple", unlockAchievement: "enemy_slayer", unlockPhrase: null },
  { id: "tint_rose", type: "tint", name: "Rose", description: "Soft pink", unlockAchievement: "meatball_1000", unlockPhrase: null },
  { id: "tint_sunset", type: "tint", name: "Sunset", description: "Warm orange", unlockAchievement: "zone_6", unlockPhrase: null },

  // Themes (full visual reskin — enemies, bosses, platforms)
  { id: "theme_default", type: "theme", name: "Classic", description: "Normal zone-based visuals", unlockAchievement: null, unlockPhrase: null },
  { id: "theme_neon", type: "theme", name: "Neon", description: "Glowing neon outlines on everything", unlockAchievement: "score_100k", unlockPhrase: "neon dreams" },
  { id: "theme_pixel", type: "theme", name: "Pixel", description: "Retro 8-bit pixel art style", unlockAchievement: "games_100", unlockPhrase: "8 bit world" },
  { id: "theme_candy", type: "theme", name: "Candy", description: "Everything is candy-themed", unlockAchievement: "zone_6", unlockPhrase: "sugar rush" },
  { id: "theme_dark", type: "theme", name: "Dark", description: "Shadowy dark versions", unlockAchievement: "boss_defeated_3", unlockPhrase: "embrace darkness" },
];

// ── Unlockable characters ─────────────────────────────────────────────

export const UNLOCKABLE_CHARACTERS: UnlockableCharacter[] = [
  { id: "neon_chef", name: "Neon Chef", unlockAchievement: "score_200k", unlockPhrase: "neon chef" },
  { id: "nyan_cat", name: "Nyan Cat", unlockAchievement: "height_2000", unlockPhrase: "nyan nyan nyan" },
  { id: "skeleton", name: "Skeleton", unlockAchievement: "boss_defeated_3", unlockPhrase: "no skin no problem" },
];

// ── Default state ─────────────────────────────────────────────────────

const FREE_IDS = COSMETICS.filter((c) => c.unlockAchievement === null).map((c) => c.id);

function defaultEquipped(): Record<CosmeticType, string | null> {
  return { trail: "trail_none", tint: "tint_none", theme: "theme_default" };
}

// ── Load / Save ───────────────────────────────────────────────────────

export function loadCosmetics(): CosmeticState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const equipped = defaultEquipped();
      // Only apply stored equipped values for valid types
      if (data.equipped) {
        for (const key of Object.keys(equipped) as CosmeticType[]) {
          if (data.equipped[key]) equipped[key] = data.equipped[key];
        }
      }
      return { unlocked: new Set([...FREE_IDS, ...(data.unlocked ?? [])]), equipped };
    }
  } catch { /* use defaults */ }
  return { unlocked: new Set(FREE_IDS), equipped: defaultEquipped() };
}

export function saveCosmetics(state: CosmeticState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlocked: [...state.unlocked],
      equipped: state.equipped,
    }));
  } catch { /* localStorage unavailable */ }
}

// ── Unlock / Equip ────────────────────────────────────────────────────

export function unlockCosmetic(state: CosmeticState, cosmeticId: string): CosmeticState {
  if (state.unlocked.has(cosmeticId)) return state;
  const unlocked = new Set(state.unlocked);
  unlocked.add(cosmeticId);
  return { ...state, unlocked };
}

export function syncCosmeticsWithAchievements(
  state: CosmeticState, unlockedAchievements: Set<string>,
): CosmeticState {
  let updated = state;
  for (const cosmetic of COSMETICS) {
    if (cosmetic.unlockAchievement === null) {
      updated = unlockCosmetic(updated, cosmetic.id);
    } else if (unlockedAchievements.has(cosmetic.unlockAchievement)) {
      updated = unlockCosmetic(updated, cosmetic.id);
    }
  }
  return updated;
}

export function equipCosmetic(state: CosmeticState, cosmeticId: string): CosmeticState {
  if (!state.unlocked.has(cosmeticId)) return state;
  const cosmetic = COSMETICS.find((c) => c.id === cosmeticId);
  if (!cosmetic) return state;
  return { ...state, equipped: { ...state.equipped, [cosmetic.type]: cosmeticId } };
}

export function getCosmeticsByType(type: CosmeticType): Cosmetic[] {
  return COSMETICS.filter((c) => c.type === type);
}

/** Check if a character is unlocked (base 10 are always unlocked). */
export function isCharacterUnlocked(charId: string, unlockedAchievements: Set<string>): boolean {
  const unlockable = UNLOCKABLE_CHARACTERS.find((c) => c.id === charId);
  if (!unlockable) return true; // base characters always unlocked
  if (!unlockable.unlockAchievement) return true;
  return unlockedAchievements.has(unlockable.unlockAchievement);
}
