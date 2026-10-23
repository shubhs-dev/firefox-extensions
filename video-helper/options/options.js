// Loaded after defaults.js, which defines normalizeHost and getSelectors.

const form = document.getElementById("form");
const rows = document.getElementById("rows");
const status = document.getElementById("status");

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function isValidSelector(sel) {
  try {
    document.createDocumentFragment().querySelector(sel);
    return true;
  } catch {
    return false;
  }
}

function addRow(host = "", selector = "") {
  const row = document.createElement("div");
  row.className = "grid";

  const hostInput = document.createElement("input");
  hostInput.className = "host";
  hostInput.placeholder = "example.com";
  hostInput.value = host;

  const selectorInput = document.createElement("input");
  selectorInput.className = "selector";
  selectorInput.placeholder = "h1.title";
  selectorInput.value = selector;

  for (const input of [hostInput, selectorInput]) {
    input.type = "text";
    input.spellcheck = false;
    input.autocomplete = "off";
  }

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Remove";
  remove.title = "Remove (takes effect on Save)";
  remove.addEventListener("click", () => row.remove());

  row.append(hostInput, selectorInput, remove);
  rows.append(row);
  return row;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectors = {};

  for (const row of rows.children) {
    const host = normalizeHost(row.querySelector(".host").value);
    const selector = row.querySelector(".selector").value.trim();
    if (!host && !selector) continue;
    if (!host) {
      showStatus("Every selector needs a hostname", true);
      return;
    }
    if (!selector || !isValidSelector(selector)) {
      showStatus(`Invalid CSS selector for ${host}`, true);
      return;
    }
    if (host in selectors) {
      showStatus(`${host} is listed twice`, true);
      return;
    }
    selectors[host] = selector;
  }

  await browser.storage.local.set({ selectors });
  showStatus("Saved");
});

document.getElementById("add").addEventListener("click", () => {
  addRow().querySelector(".host").focus();
});

(async () => {
  const selectors = await getSelectors();
  for (const [host, selector] of Object.entries(selectors).sort()) {
    addRow(host, selector);
  }

  // Opened from the toolbar context menu: focus (or create) the current site's row.
  const requested = new URLSearchParams(location.search).get("host");
  if (requested) {
    const host = normalizeHost(requested);
    const existing = [...rows.children].find((r) => r.querySelector(".host").value === host);
    const row = existing ?? addRow(host);
    row.querySelector(".selector").focus();
  } else if (!rows.children.length) {
    addRow();
  }
})();
