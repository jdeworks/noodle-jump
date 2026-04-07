/** Customize screen action handlers — code entry, export, import. */

import {
  loadCosmetics,
  saveCosmetics,
  UNLOCKABLE_CHARACTERS,
  type CosmeticState,
} from "../systems/Cosmetics";
import { loadAchievements, saveAchievements } from "../systems/Achievements";
import {
  tryCode,
  loadUnlockCodeState,
  saveUnlockCodeState,
  markCodeUsed,
} from "../systems/UnlockCodes";
import { exportProgress, importProgress, copyToClipboard } from "../systems/ProgressBackup";

export function promptCode(
  cosmeticState: CosmeticState,
  onUpdate: (state: CosmeticState) => void,
): void {
  const code = window.prompt("Enter unlock code:");
  if (!code) return;
  const result = tryCode(code, cosmeticState);
  if (!result) {
    window.alert("Invalid code.");
    return;
  }
  const newState = result.cosmetics;
  saveCosmetics(newState);
  let codeState = loadUnlockCodeState();
  codeState = markCodeUsed(codeState, code);
  saveUnlockCodeState(codeState);
  for (const charId of result.unlockedCharacters) {
    const ch = UNLOCKABLE_CHARACTERS.find((u) => u.id === charId);
    if (ch?.unlockAchievement) {
      const achs = loadAchievements();
      if (!achs.unlocked.has(ch.unlockAchievement)) {
        achs.unlocked.add(ch.unlockAchievement);
        saveAchievements(achs);
      }
    }
  }
  onUpdate(newState);
}

export async function doExport(): Promise<void> {
  const ok = await copyToClipboard(exportProgress());
  window.alert(ok ? "Progress copied to clipboard!" : "Failed to copy. Try manually.");
}

export function doImport(onUpdate: (state: CosmeticState) => void): void {
  const encoded = window.prompt("Paste your progress code:");
  if (!encoded || !importProgress(encoded)) {
    if (encoded) window.alert("Invalid progress code.");
    return;
  }
  onUpdate(loadCosmetics());
  window.alert("Progress restored!");
}
