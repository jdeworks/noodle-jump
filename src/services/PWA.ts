/** PWA registration — service worker + install prompt. */

let deferredPrompt: Event | null = null;

/** Register the service worker. Call once at app start. */
export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // SW registration failed (e.g., no HTTPS in dev)
    });
  });
}

/** Listen for the beforeinstallprompt event. */
export function listenForInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

/** Check if install prompt is available. */
export function canShowInstallPrompt(): boolean {
  return deferredPrompt !== null;
}

/** Show the install prompt. Returns true if user accepted. */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  };
  prompt.prompt();
  const result = await prompt.userChoice;
  deferredPrompt = null;
  return result.outcome === "accepted";
}
