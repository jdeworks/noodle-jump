/** Cosmetics system — unlockable outfits, skins, trails. Pure logic. */

const STORAGE_KEY = "noodle-jump-cosmetics";

export type CosmeticType = "outfit" | "platform_skin" | "trail" | "meatball_variant";

export interface Cosmetic {
  id: string;
  type: CosmeticType;
  name: string;
  description: string;
  /** Achievement ID required to unlock, or null if free. */
  unlockAchievement: string | null;
}

export interface CosmeticState {
  unlocked: Set<string>;
  equipped: Record<CosmeticType, string | null>;
}

export const COSMETICS: Cosmetic[] = [
  // Outfits
  { id: "chef_default", type: "outfit", name: "Classic Chef", description: "The original chef look", unlockAchievement: null },
  { id: "chef_pirate", type: "outfit", name: "Pirate Chef", description: "Arrr! A seafaring cook", unlockAchievement: "zone_2" },
  { id: "chef_space", type: "outfit", name: "Space Chef", description: "Ready for zero-gravity cooking", unlockAchievement: "zone_3" },
  { id: "chef_ice", type: "outfit", name: "Ice Chef", description: "Bundled up for the freezer", unlockAchievement: "zone_4" },
  { id: "chef_fire", type: "outfit", name: "Fire Chef", description: "Heatproof cooking gear", unlockAchievement: "zone_5" },
  { id: "chef_candy", type: "outfit", name: "Candy Chef", description: "Sweet pastel outfit", unlockAchievement: "zone_6" },
  { id: "chef_golden", type: "outfit", name: "Golden Chef", description: "The ultimate chef outfit", unlockAchievement: "zone_7" },

  // Platform skins
  { id: "skin_default", type: "platform_skin", name: "Classic Pasta", description: "Standard platforms", unlockAchievement: null },
  { id: "skin_neon", type: "platform_skin", name: "Neon Glow", description: "Glowing neon platforms", unlockAchievement: "score_10k" },
  { id: "skin_pixel", type: "platform_skin", name: "Pixel Art", description: "Retro pixel platforms", unlockAchievement: "games_50" },

  // Trails
  { id: "trail_none", type: "trail", name: "No Trail", description: "Clean movement", unlockAchievement: null },
  { id: "trail_sparkle", type: "trail", name: "Sparkle Trail", description: "Glittering sparkles follow you", unlockAchievement: "meatball_100" },
  { id: "trail_fire", type: "trail", name: "Fire Trail", description: "Blazing trail of flames", unlockAchievement: "height_1000" },
  { id: "trail_rainbow", type: "trail", name: "Rainbow Trail", description: "Colorful rainbow streak", unlockAchievement: "score_100k" },

  // Meatball variants
  { id: "mb_default", type: "meatball_variant", name: "Classic Meatball", description: "The original", unlockAchievement: null },
  { id: "mb_gold", type: "meatball_variant", name: "Golden Meatball", description: "Shiny and delicious", unlockAchievement: "meatball_1000" },
  { id: "mb_rainbow", type: "meatball_variant", name: "Rainbow Meatball", description: "Colorful and tasty", unlockAchievement: "combo_4x" },
];

function defaultEquipped(): Record<CosmeticType, string | null> {
  return {
    outfit: "chef_default",
    platform_skin: "skin_default",
    trail: "trail_none",
    meatball_variant: "mb_default",
  };
}

export function loadCosmetics(): CosmeticState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        unlocked: new Set(data.unlocked ?? []),
        equipped: { ...defaultEquipped(), ...data.equipped },
      };
    }
  } catch {
    // use defaults
  }
  return { unlocked: new Set(["chef_default", "skin_default", "trail_none", "mb_default"]), equipped: defaultEquipped() };
}

export function saveCosmetics(state: CosmeticState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlocked: [...state.unlocked],
      equipped: state.equipped,
    }));
  } catch {
    // localStorage may be unavailable
  }
}

/** Unlock a cosmetic if the player has the required achievement. */
export function unlockCosmetic(
  state: CosmeticState,
  cosmeticId: string,
): CosmeticState {
  if (state.unlocked.has(cosmeticId)) return state;
  const unlocked = new Set(state.unlocked);
  unlocked.add(cosmeticId);
  return { ...state, unlocked };
}

/** Check achievements and auto-unlock earned cosmetics. */
export function syncCosmeticsWithAchievements(
  state: CosmeticState,
  unlockedAchievements: Set<string>,
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

/** Equip a cosmetic. Must be unlocked. */
export function equipCosmetic(
  state: CosmeticState,
  cosmeticId: string,
): CosmeticState {
  if (!state.unlocked.has(cosmeticId)) return state;
  const cosmetic = COSMETICS.find((c) => c.id === cosmeticId);
  if (!cosmetic) return state;
  return {
    ...state,
    equipped: { ...state.equipped, [cosmetic.type]: cosmeticId },
  };
}

/** Get cosmetics of a specific type. */
export function getCosmeticsByType(type: CosmeticType): Cosmetic[] {
  return COSMETICS.filter((c) => c.type === type);
}
