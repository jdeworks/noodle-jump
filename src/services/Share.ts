/** Score sharing — Web Share API with clipboard fallback. */

export interface ShareData {
  score: number;
  height: number;
  meatballs: number;
  combo: number;
  zone: number;
}

/** Format a share message. */
export function formatShareMessage(data: ShareData): string {
  const zoneNames = ["Kitchen", "Ocean", "Space", "Freezer", "Volcano", "Candy", "Final Kitchen"];
  const zoneName = zoneNames[data.zone] ?? `Zone ${data.zone + 1}`;
  return (
    `I scored ${data.score.toLocaleString()} on Noodle Jump!\n` +
    `Height: ${data.height} | Zone: ${zoneName}\n` +
    `Meatballs: ${data.meatballs} | Best combo: ${data.combo}x`
  );
}

/** Share score using Web Share API, fallback to clipboard. */
export async function shareScore(data: ShareData): Promise<"shared" | "copied" | "failed"> {
  const text = formatShareMessage(data);

  // Try Web Share API first
  if (navigator.share) {
    try {
      await navigator.share({ title: "Noodle Jump Score", text });
      return "shared";
    } catch {
      // User cancelled or API failed, fall through to clipboard
    }
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

/**
 * Generate a share URL with score encoded in hash.
 * Works on any static hosting (GitHub Pages).
 */
export function generateShareURL(data: ShareData): string {
  const params = new URLSearchParams({
    s: String(data.score),
    h: String(data.height),
    z: String(data.zone),
  });
  return `${window.location.origin}${window.location.pathname}#score=${params.toString()}`;
}
