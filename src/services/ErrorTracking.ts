/** Error tracking — catches unhandled errors and reports them. */

const ENDPOINT = ""; // Set to error reporting endpoint when deployed
const MAX_ERRORS = 10; // Don't spam — cap per session

let errorCount = 0;

/** Initialize global error handlers. Call once at app start. */
export function initErrorTracking(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    reportError({
      type: "error",
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      col: event.colno,
      stack: event.error?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError({
      type: "unhandledrejection",
      message: String(event.reason),
      stack: event.reason?.stack,
    });
  });
}

interface ErrorReport {
  type: string;
  message: string;
  filename?: string;
  line?: number;
  col?: number;
  stack?: string;
}

function reportError(report: ErrorReport): void {
  errorCount++;
  if (errorCount > MAX_ERRORS) return;

  if (!ENDPOINT) {
    // No endpoint configured — just log to console in dev
    return;
  }

  fetch(`${ENDPOINT}/error`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...report,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
    keepalive: true,
  }).catch(() => {
    // Silently fail
  });
}
