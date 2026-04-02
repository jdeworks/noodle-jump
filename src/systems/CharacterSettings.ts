/** Character selection persistence via localStorage. */

const STORAGE_KEY = "noodle-jump-character";

export function getSelectedCharacter(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "chef";
  } catch {
    return "chef";
  }
}

export function setSelectedCharacter(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage may be unavailable
  }
}
