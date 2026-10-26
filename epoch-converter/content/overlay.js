// Injected on demand by background.js after convert.js. A function declaration (not const) so
// re-injection into the same frame doesn't throw.

function showEpochOverlay(text) {
  const TAG = "epoch-converter-overlay";
  document.querySelector(TAG)?.remove();

  const parsed = EpochConvert.parse(text);
  const anchor = selectionRect();

  // A custom element + closed shadow root keeps page CSS out and ours in.
  const host = document.createElement(TAG);
  host.style.cssText = "all: initial; position: fixed; z-index: 2147483647; top: 0; left: 0;";
  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = STYLES;
  const panel = el("div", "panel");
  shadow.append(style, panel);

  const header = el("div", "header");
  header.append(el("span", "title", parsed ? `Epoch (${parsed.unit})` : "Not an epoch timestamp"));
  const close = el("button", "close", "×");
  close.title = "Close (Esc)";
  header.append(close);
  panel.append(header);

  if (parsed) {
    panel.append(
      row("UTC", EpochConvert.toUtcIso(parsed), true),
      row(`Local (${EpochConvert.timeZoneName()})`, EpochConvert.toLocalIso(parsed), true),
      row("Relative", EpochConvert.relative(parsed), false),
    );
  } else {
    const shown = text.length > 60 ? `${text.slice(0, 60)}…` : text;
    panel.append(el("div", "error", `“${shown}” isn't a number of seconds, ms, µs or ns since 1970.`));
  }

  document.documentElement.append(host);
  position(panel, anchor);

  const dismiss = () => {
    host.remove();
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("mousedown", onOutside, true);
  };
  const onKey = (e) => {
    if (e.key === "Escape") dismiss();
  };
  const onOutside = (e) => {
    if (!e.composedPath().includes(host)) dismiss();
  };
  close.addEventListener("click", dismiss);
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("mousedown", onOutside, true);

  function row(label, value, copyable) {
    const r = el("div", "row");
    r.append(el("div", "label", label), el("div", "value", value));
    if (copyable) {
      const btn = el("button", "copy", "Copy");
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(value);
          btn.textContent = "Copied";
        } catch {
          btn.textContent = "Failed";
        }
        setTimeout(() => (btn.textContent = "Copy"), 1500);
      });
      r.append(btn);
    } else {
      r.append(el("span"));
    }
    return r;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function selectionRect() {
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width || rect.height) return rect;
    }
    // Selections inside <input>/<textarea> have no range rect; use the field itself.
    const active = document.activeElement;
    if (active && active !== document.body) return active.getBoundingClientRect();
    return null;
  }

  function position(node, rect) {
    const margin = 8;
    const { width, height } = node.getBoundingClientRect();
    let top = rect ? rect.bottom + 6 : margin;
    let left = rect ? rect.left : window.innerWidth - width - margin;
    if (rect && top + height > window.innerHeight - margin) top = rect.top - height - 6;
    top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    host.style.top = `${top}px`;
    host.style.left = `${left}px`;
  }
}

var STYLES = `
  .panel {
    --bg: #fff; --fg: #15141a; --muted: #5b5b66; --border: #cfcfd8; --btn: #f0f0f4; --btn-hover: #e0e0e6;
    font: 13px/1.4 system-ui, sans-serif;
    color: var(--fg);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    padding: 8px 10px 10px;
    min-width: 280px;
    max-width: min(480px, calc(100vw - 16px));
  }
  @media (prefers-color-scheme: dark) {
    .panel { --bg: #2b2a33; --fg: #fbfbfe; --muted: #bfbfc9; --border: #52525e; --btn: #3a3944; --btn-hover: #4a4955; }
  }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .title { font-weight: 600; }
  .row { display: grid; grid-template-columns: 1fr auto; column-gap: 8px; align-items: center; margin-top: 6px; }
  .label { grid-column: 1 / -1; color: var(--muted); font-size: 11px; }
  .value { font-family: ui-monospace, monospace; user-select: all; overflow-wrap: anywhere; }
  .error { color: var(--muted); }
  button {
    font: inherit; color: inherit; background: var(--btn);
    border: 1px solid var(--border); border-radius: 4px; padding: 1px 8px; cursor: pointer;
  }
  button:hover { background: var(--btn-hover); }
  .close { border: none; background: none; font-size: 16px; line-height: 1; padding: 0 4px; }
`;
