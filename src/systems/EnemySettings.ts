/** Enemy settings — opt-in toggle, persisted to localStorage. */

const SETTINGS_KEY = "noodle-jump-enemy-settings";

let enemiesEnabled = false;

function load(): void {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) enemiesEnabled = JSON.parse(stored);
  } catch {
    // use default
  }
}

function save(): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(enemiesEnabled));
  } catch {
    // localStorage may be unavailable
  }
}

load();

export function isEnemiesEnabled(): boolean {
  return enemiesEnabled;
}

export function setEnemiesEnabled(v: boolean): void {
  enemiesEnabled = v;
  save();
}
