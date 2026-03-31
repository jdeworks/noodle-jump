/** Wake lock and fullscreen helpers for mobile gameplay. */

let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<void> {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    }
  } catch {
    // Wake lock request failed (e.g. tab not visible)
  }
}

export function releaseWakeLock(): void {
  wakeLock?.release();
  wakeLock = null;
}

// Re-acquire after tab becomes visible again (auto-released on hide)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !wakeLock) {
    requestWakeLock();
  }
});

export function requestFullscreen(): void {
  // Toggle: exit if already fullscreen
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
    return;
  }
  const doc = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };
  (
    doc.requestFullscreen?.() ??
    doc.webkitRequestFullscreen?.() ??
    doc.msRequestFullscreen?.() ??
    Promise.resolve()
  ).catch(() => {});
}
