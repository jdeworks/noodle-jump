/** Lightweight analytics — sends events to an endpoint (when configured). */

const ENDPOINT = ""; // Set to Cloudflare Worker URL when deployed

interface AnalyticsEvent {
  name: string;
  data?: Record<string, string | number | boolean>;
  timestamp: number;
}

const eventQueue: AnalyticsEvent[] = [];
let enabled = true;

/** Track an event. Queued and sent in batches. */
export function trackEvent(name: string, data?: Record<string, string | number | boolean>): void {
  if (!enabled) return;
  eventQueue.push({ name, data, timestamp: Date.now() });

  // Flush when queue gets large
  if (eventQueue.length >= 10) flushEvents();
}

/** Flush queued events to the endpoint. */
export function flushEvents(): void {
  if (!ENDPOINT || eventQueue.length === 0) {
    eventQueue.length = 0;
    return;
  }

  const events = [...eventQueue];
  eventQueue.length = 0;

  fetch(`${ENDPOINT}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
    keepalive: true,
  }).catch(() => {
    // Silently fail — analytics should never break the game
  });
}

/** Enable/disable analytics. */
export function setAnalyticsEnabled(v: boolean): void {
  enabled = v;
  if (!v) eventQueue.length = 0;
}

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushEvents();
  });
}
