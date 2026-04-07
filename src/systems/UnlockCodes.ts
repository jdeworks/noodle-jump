/** Unlock code system — per-item phrases and master code. */

import { COSMETICS, UNLOCKABLE_CHARACTERS, type CosmeticState, unlockCosmetic } from "./Cosmetics";

const STORAGE_KEY = "noodle-jump-unlock-codes";
const MASTER_CODE = "i love jdeworks";

interface UnlockCodeState {
  usedCodes: Set<string>;
}

/** All codes mapped to what they unlock. */
function buildCodeMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  // Per-cosmetic phrases
  for (const c of COSMETICS) {
    if (c.unlockPhrase) {
      const key = c.unlockPhrase.toLowerCase().trim();
      const existing = map.get(key) ?? [];
      existing.push(c.id);
      map.set(key, existing);
    }
  }
  // Per-character phrases
  for (const ch of UNLOCKABLE_CHARACTERS) {
    if (ch.unlockPhrase) {
      const key = ch.unlockPhrase.toLowerCase().trim();
      const existing = map.get(key) ?? [];
      existing.push(`char:${ch.id}`);
      map.set(key, existing);
    }
  }
  return map;
}

const CODE_MAP = buildCodeMap();

/** Try an unlock code. Returns updated cosmetic state + unlocked character IDs, or null if invalid. */
export function tryCode(
  code: string,
  cosmeticState: CosmeticState,
): { cosmetics: CosmeticState; unlockedCharacters: string[] } | null {
  const normalized = code.toLowerCase().trim();
  if (!normalized) return null;

  // Master code — unlock everything
  if (normalized === MASTER_CODE) {
    let state = cosmeticState;
    for (const c of COSMETICS) state = unlockCosmetic(state, c.id);
    const chars = UNLOCKABLE_CHARACTERS.map((ch) => ch.id);
    return { cosmetics: state, unlockedCharacters: chars };
  }

  // Per-item code
  const targets = CODE_MAP.get(normalized);
  if (!targets) return null;

  let state = cosmeticState;
  const chars: string[] = [];
  for (const t of targets) {
    if (t.startsWith("char:")) {
      chars.push(t.slice(5));
    } else {
      state = unlockCosmetic(state, t);
    }
  }
  return { cosmetics: state, unlockedCharacters: chars };
}

export function loadUnlockCodeState(): UnlockCodeState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { usedCodes: new Set(JSON.parse(stored)) };
  } catch {
    /* defaults */
  }
  return { usedCodes: new Set() };
}

export function saveUnlockCodeState(state: UnlockCodeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.usedCodes]));
  } catch {
    /* localStorage unavailable */
  }
}

/** Record that a code was used. */
export function markCodeUsed(state: UnlockCodeState, code: string): UnlockCodeState {
  const usedCodes = new Set(state.usedCodes);
  usedCodes.add(code.toLowerCase().trim());
  return { usedCodes };
}

/** Check if the master code has been used. */
export function isAllUnlocked(state: UnlockCodeState): boolean {
  return state.usedCodes.has(MASTER_CODE);
}
