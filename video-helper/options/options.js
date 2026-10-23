// Loaded after defaults.js, which defines DEFAULT_SELECTOR.

const form = document.getElementById("form");
const input = document.getElementById("selector");
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

async function save(selector) {
  await browser.storage.local.set({ selector });
  input.value = selector;
  showStatus("Saved");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selector = input.value.trim();
  if (!selector || !isValidSelector(selector)) {
    showStatus("Not a valid CSS selector", true);
    return;
  }
  await save(selector);
});

document.getElementById("reset").addEventListener("click", () => save(DEFAULT_SELECTOR));

browser.storage.local.get("selector").then(({ selector = DEFAULT_SELECTOR }) => {
  input.value = selector;
});
