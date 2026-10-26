# Firefox Extensions

Personal Firefox extensions. Each folder is a standalone extension with its own `manifest.json`. All extensions require Firefox 140 or newer.

| Extension | What it does |
|---|---|
| [`video-helper`](#video-helper) | Toolbar button that copies the page URL plus the text of a chosen element |
| [`epoch-converter`](#epoch-converter) | Right-click a selected epoch timestamp to see it as an ISO 8601 date |

## Installing

Release Firefox only installs extensions signed by Mozilla. Pick one of these options.

### Option 1: Temporary (quickest, any Firefox)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and select the extension's `manifest.json`.

The extension stays loaded until Firefox restarts. After you edit the code, click **Reload** on the same page.

### Option 2: Permanent, unsigned (Developer Edition, Nightly or ESR only)

1. In `about:config`, set `xpinstall.signatures.required` to `false`.
2. Build a package:
   ```bash
   npx web-ext build --source-dir video-helper --artifacts-dir dist/video-helper --overwrite-dest
   ```
3. Open `about:addons`, click the gear icon, choose **Install Add-on From File…** and pick the `.zip` file from `dist/video-helper/`.

### Option 3: Permanent on regular Firefox (self-signed, not public)

Mozilla signs "unlisted" extensions for free. They don't appear on addons.mozilla.org.

1. Create API credentials at <https://addons.mozilla.org/developers/addon/api/key/>.
2. Sign the extension:
   ```bash
   npx web-ext sign --source-dir video-helper --artifacts-dir dist/video-helper \
     --channel unlisted --api-key "$AMO_JWT_ISSUER" --api-secret "$AMO_JWT_SECRET"
   ```
3. Drag the signed `.xpi` file from `dist/video-helper/` onto a Firefox window.

Increase `version` in `manifest.json` before each re-sign, because Mozilla won't sign the same version twice.

## Extensions

### video-helper

Copies `<page URL> <element text>` to the clipboard with one click. This is handy for pasting into a video downloader.

**Use:** Open a video page and click the red play icon in the toolbar. The badge shows the result:

- **✓** (green): the URL and the text were copied.
- **!** (orange): no selector is set for this site, or nothing matched it, so only the URL was copied.
- **✗** (red): the clipboard write failed.

**Choose the element (per site):** Right-click the toolbar icon and choose **Set CSS selector for this site…**. A settings tab opens with the current site's hostname filled in. Enter a CSS selector and click **Save**. Each hostname has its own selector (`www.` is ignored), and the extension copies the text of the first matching element, joined into a single line. On a site with no selector, only the URL is copied.

YouTube comes preconfigured with `h1.ytd-watch-metadata`, the video title. To see, edit or remove all saved sites, open `about:addons` → **Video Helper** → **Preferences**. Selectors are saved in the extension's local storage, so they're lost if you remove the extension.

To find a selector on another site, right-click the element, choose **Inspect**, then right-click the highlighted node in DevTools and choose **Copy → CSS Selector**.

If the icon isn't visible, click the puzzle-piece (Extensions) button and pin **Video Helper** to the toolbar.

### epoch-converter

Converts a selected Unix epoch timestamp to an ISO 8601 date.

**Use:** Select a timestamp on any page, right-click it and choose **Convert epoch "…" to date**. A panel opens next to the selection showing:

- **UTC:** for example, `2023-11-14T22:13:20.123Z`
- **Local:** the same moment with your UTC offset, for example `2023-11-15T03:43:20.123+05:30`
- **Relative:** for example, "3 years ago"

Each date has a **Copy** button. To close the panel, press **Esc** or click outside it.

**Units** are worked out from the number of digits:

| Digits | Read as |
|---|---|
| up to 11 | seconds |
| 12–14 | milliseconds |
| 15–17 | microseconds |
| 18–19 | nanoseconds |

Precision finer than a second is kept in the output, and decimal seconds such as `1700000000.5` also work. Spaces, commas and underscores in the selection are ignored, and negative values convert to dates before 1970.

Some pages don't let extensions add anything to them, such as Firefox's PDF viewer, `about:` pages and addons.mozilla.org. There, the result appears as a system notification instead, and the UTC date is copied to the clipboard automatically.

## Development

```bash
npx web-ext lint --source-dir <extension>   # validate
npx web-ext run  --source-dir <extension>   # launch a throwaway Firefox profile with the extension loaded
```
