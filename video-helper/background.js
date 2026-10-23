// Loaded after defaults.js, which defines DEFAULT_SELECTORS, normalizeHost and getSelectors.

const MENU_CONFIGURE = "configure-selector";

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  browser.menus.create({
    id: MENU_CONFIGURE,
    title: "Set CSS selector for this site…",
    contexts: ["action"],
  });

  if (reason === "install") {
    await browser.storage.local.set({ selectors: DEFAULT_SELECTORS });
  }
});

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_CONFIGURE) return;

  const host = hostOf(tab?.url);
  if (host) {
    const url = browser.runtime.getURL(`options/options.html?host=${encodeURIComponent(host)}`);
    browser.tabs.create({ url });
  } else {
    browser.runtime.openOptionsPage();
  }
});

browser.action.onClicked.addListener(async (tab) => {
  const host = hostOf(tab.url);
  const selector = host ? (await getSelectors())[host] : undefined;

  let text = null;
  if (selector) {
    try {
      const [result] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: (sel) => {
          const el = document.querySelector(sel);
          return el ? el.innerText : null;
        },
        args: [selector],
      });
      text = result?.result ?? null;
    } catch (err) {
      // Privileged pages (about:, addons.mozilla.org) block injection; fall back to URL only.
      console.warn("Video Helper: could not read page", err);
    }
  }

  // Collapse newlines/indentation so the result is a single line.
  const cleaned = text ? text.replace(/\s+/g, " ").trim() : "";
  const output = cleaned ? `${tab.url} ${cleaned}` : tab.url;

  try {
    await navigator.clipboard.writeText(output);
  } catch (err) {
    console.error("Video Helper: clipboard write failed", err);
    await flashBadge(tab.id, "✗", "#d70022", "Copy failed");
    return;
  }

  if (cleaned) {
    await flashBadge(tab.id, "✓", "#2ac3a2", `Copied: ${output}`);
  } else if (!selector) {
    await flashBadge(tab.id, "!", "#ff9400",
      `No selector set for ${host || "this page"} — copied URL only. Right-click the icon to set one.`);
  } else {
    await flashBadge(tab.id, "!", "#ff9400", `No element matched "${selector}" — copied URL only`);
  }
});

function hostOf(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol.startsWith("http") ? normalizeHost(hostname) : null;
  } catch {
    return null;
  }
}

async function flashBadge(tabId, text, color, title) {
  await browser.action.setBadgeBackgroundColor({ tabId, color });
  await browser.action.setBadgeText({ tabId, text });
  await browser.action.setTitle({ tabId, title });
  setTimeout(() => {
    browser.action.setBadgeText({ tabId, text: "" });
    browser.action.setTitle({ tabId, title: null });
  }, 2000);
}
