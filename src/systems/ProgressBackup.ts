/** Progress export/import — clipboard-based backup for localStorage data. */

const BACKUP_VERSION = 1;

interface BackupData {
  v: number;
  achievements: string[];
  cosmetics: { unlocked: string[]; equipped: Record<string, string | null> };
  stats: Record<string, unknown>;
  character: string;
  codes: string[];
  highScore: number;
}

/** Keys we back up from localStorage. */
const KEYS = {
  achievements: "noodle-jump-achievements",
  cosmetics: "noodle-jump-cosmetics",
  stats: "noodle-jump-player-stats",
  character: "noodle-jump-character",
  codes: "noodle-jump-unlock-codes",
  highScore: "noodle-jump-high-score",
} as const;

/** Export all progress as a base64 string. */
export function exportProgress(): string {
  const data: BackupData = {
    v: BACKUP_VERSION,
    achievements: safeParseArray(KEYS.achievements),
    cosmetics: safeParseObject(KEYS.cosmetics, { unlocked: [], equipped: {} }),
    stats: safeParseObject(KEYS.stats, {}),
    character: localStorage.getItem(KEYS.character) ?? "chef",
    codes: safeParseArray(KEYS.codes),
    highScore: Number(localStorage.getItem(KEYS.highScore) ?? "0"),
  };
  return btoa(JSON.stringify(data));
}

/** Import progress from a base64 string. Returns true on success. */
export function importProgress(encoded: string): boolean {
  try {
    const json = atob(encoded.trim());
    const data: BackupData = JSON.parse(json);
    if (!data.v || typeof data.v !== "number") return false;

    // Write each key back to localStorage
    if (Array.isArray(data.achievements)) {
      localStorage.setItem(KEYS.achievements, JSON.stringify(data.achievements));
    }
    if (data.cosmetics && typeof data.cosmetics === "object") {
      localStorage.setItem(KEYS.cosmetics, JSON.stringify(data.cosmetics));
    }
    if (data.stats && typeof data.stats === "object") {
      localStorage.setItem(KEYS.stats, JSON.stringify(data.stats));
    }
    if (typeof data.character === "string") {
      localStorage.setItem(KEYS.character, data.character);
    }
    if (Array.isArray(data.codes)) {
      localStorage.setItem(KEYS.codes, JSON.stringify(data.codes));
    }
    if (typeof data.highScore === "number") {
      localStorage.setItem(KEYS.highScore, String(data.highScore));
    }
    return true;
  } catch {
    return false;
  }
}

/** Copy text to clipboard, returns true on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch { return false; }
  }
}

function safeParseArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr)) return arr; }
  } catch { /* ignore */ }
  return [];
}

function safeParseObject<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return fallback;
}
