/**
 * HTML overlay utilities for multiplayer UI.
 * PixiJS has no native text input, so we overlay real HTML elements
 * on top of the canvas for code entry and copy/paste.
 */

const OVERLAY_Z = "10000";

/** Create an HTML text input overlaid on the game canvas. Returns cleanup function. */
export function createCodeInput(
  placeholder: string,
  onSubmit: (value: string) => void,
  topPercent = 50,
): { element: HTMLInputElement; cleanup: () => void } {
  const container = document.getElementById("game");
  if (!container) throw new Error("Missing #game element");

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.autocapitalize = "off";
  input.spellcheck = false;
  input.style.cssText = `
    position: absolute;
    top: ${topPercent}%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 320px;
    padding: 12px 16px;
    font-family: monospace;
    font-size: 16px;
    background: #1a1a2e;
    color: #ffffff;
    border: 2px solid #4466aa;
    border-radius: 8px;
    outline: none;
    text-align: center;
    z-index: ${OVERLAY_Z};
  `;

  container.style.position = "relative";
  container.appendChild(input);

  // Auto-focus (opens keyboard on mobile)
  setTimeout(() => input.focus(), 100);

  // Prevent all keyboard events from reaching the game
  const stopProp = (e: Event) => {
    e.stopPropagation();
  };
  input.addEventListener("keydown", stopProp);
  input.addEventListener("keyup", stopProp);
  input.addEventListener("keypress", stopProp);

  // Submit on Enter
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && input.value.trim()) {
      onSubmit(input.value.trim());
    }
  };
  input.addEventListener("keydown", onKeyDown);

  const cleanup = () => {
    input.removeEventListener("keydown", onKeyDown);
    input.removeEventListener("keydown", stopProp);
    input.removeEventListener("keyup", stopProp);
    input.removeEventListener("keypress", stopProp);
    input.remove();
  };

  return { element: input, cleanup };
}

/** Create an HTML "Submit" button next to a code input. */
export function createSubmitButton(
  label: string,
  onClick: () => void,
  topPercent = 50,
): { element: HTMLButtonElement; cleanup: () => void } {
  const container = document.getElementById("game");
  if (!container) throw new Error("Missing #game element");

  const btn = document.createElement("button");
  btn.textContent = label;
  btn.style.cssText = `
    position: absolute;
    top: calc(${topPercent}% + 40px);
    left: 50%;
    transform: translate(-50%, 0);
    padding: 10px 24px;
    font-family: monospace;
    font-size: 14px;
    font-weight: bold;
    background: #2a6e3f;
    color: #ffffff;
    border: 1px solid #44bb66;
    border-radius: 8px;
    cursor: pointer;
    z-index: ${OVERLAY_Z};
  `;

  container.appendChild(btn);
  btn.addEventListener("click", onClick);

  const cleanup = () => {
    btn.removeEventListener("click", onClick);
    btn.remove();
  };

  return { element: btn, cleanup };
}

/** Copy text to clipboard with fallback for mobile. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: create a temporary textarea
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      ta.remove();
    }
  }
}

/** Show a temporary HTML toast message. */
export function showHtmlToast(message: string, durationMs = 2000): void {
  const container = document.getElementById("game");
  if (!container) return;

  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    font-family: monospace;
    font-size: 13px;
    background: #2a6e3f;
    color: #ffffff;
    border-radius: 6px;
    z-index: ${OVERLAY_Z};
    pointer-events: none;
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), durationMs);
}
