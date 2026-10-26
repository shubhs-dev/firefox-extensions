// Loaded after convert.js, which defines EpochConvert.

const MENU_ID = "epoch-to-date";

browser.runtime.onInstalled.addListener(() => {
  browser.menus.create({
    id: MENU_ID,
    title: "Convert epoch “%s” to date",
    contexts: ["selection"],
  });
});

browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) return;

  const text = info.selectionText;
  try {
    const target = { tabId: tab.id, frameIds: [info.frameId] };
    await browser.scripting.executeScript({ target, files: ["convert.js", "content/overlay.js"] });
    await browser.scripting.executeScript({
      target,
      func: (selection) => showEpochOverlay(selection),
      args: [text],
    });
  } catch (err) {
    // Privileged pages (PDF viewer, about:, addons.mozilla.org) block injection.
    console.warn("Epoch Converter: could not show overlay", err);
    await notify(text);
  }
});

async function notify(text) {
  const parsed = EpochConvert.parse(text);
  if (!parsed) {
    await browser.notifications.create({
      type: "basic",
      iconUrl: "icons/icon-96.png",
      title: "Not an epoch timestamp",
      message: `“${text}”`,
    });
    return;
  }

  const utc = EpochConvert.toUtcIso(parsed);
  let copied = false;
  try {
    await navigator.clipboard.writeText(utc);
    copied = true;
  } catch (err) {
    console.error("Epoch Converter: clipboard write failed", err);
  }

  await browser.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-96.png",
    title: utc,
    message: `Local: ${EpochConvert.toLocalIso(parsed)}\n`
      + `${EpochConvert.relative(parsed)} · read as ${parsed.unit}`
      + (copied ? "\nUTC copied to clipboard" : ""),
  });
}
