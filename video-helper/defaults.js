// Shared by the background script and the options page.

// Seeded into storage on first install; keyed by normalized hostname.
const DEFAULT_SELECTORS = {
  "youtube.com": "h1.ytd-watch-metadata",
};

// "www.youtube.com" and "youtube.com" share one entry.
function normalizeHost(host) {
  return host.trim().toLowerCase().replace(/^www\./, "");
}

async function getSelectors() {
  const { selectors = {} } = await browser.storage.local.get("selectors");
  return selectors;
}
