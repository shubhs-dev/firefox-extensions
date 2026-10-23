# Firefox Extensions

Personal Firefox extensions. Each folder is a standalone extension with its own `manifest.json`. All extensions require Firefox 140 or newer.

| Extension | What it does |
|---|---|
| [`video-helper`](#video-helper) | Toolbar button that copies the page URL plus the text of a chosen element |

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
- **!** (orange): no element matched the selector, so only the URL was copied.
- **✗** (red): the clipboard write failed.

**Choose the element:** Right-click the toolbar icon and choose **Set CSS selector…**. Enter any CSS selector. The extension copies the text of the first matching element, joined into a single line. The default is `h1.ytd-watch-metadata`, which matches the video title on YouTube.

To find a selector on another site, right-click the element, choose **Inspect**, then right-click the highlighted node in DevTools and choose **Copy → CSS Selector**.

If the icon isn't visible, click the puzzle-piece (Extensions) button and pin **Video Helper** to the toolbar.

## Development

```bash
npx web-ext lint --source-dir <extension>   # validate
npx web-ext run  --source-dir <extension>   # launch a throwaway Firefox profile with the extension loaded
```
