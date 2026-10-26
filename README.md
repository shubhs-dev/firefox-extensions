# Firefox Extensions

Personal Firefox extensions. Each folder is a standalone extension with its own `manifest.json`. All extensions require Firefox 140 or newer.

| Extension | What it does |
|---|---|
| [`video-helper`](#video-helper) | Toolbar button that copies the page URL plus the text of a chosen element |
| [`epoch-converter`](#epoch-converter) | Right-click a selected epoch timestamp to see it as an ISO 8601 date |

## Installing

### Recommended: signed release (regular Firefox, updates itself)

1. Open the [Releases page](https://github.com/shubhs-dev/firefox-extensions/releases) and find the latest release for the extension, for example `video-helper-v1.1.0`.
2. Drag its `.xpi` file onto a Firefox window, or click it, and confirm the install.

Do this once on each device. After that, Firefox checks [`updates.json`](updates.json) about once a day and installs new versions automatically. To check right away, open `about:addons`, click the gear icon and choose **Check for Updates**.

### For development: temporary add-on

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and select the extension's `manifest.json`.

The extension stays loaded until Firefox restarts. After you edit the code, click **Reload** on the same page.

## Releasing a new version

1. Increase `version` in the extension's `manifest.json`. Mozilla never signs the same version twice.
2. Push to `main`.

The [Sign and release extensions](.github/workflows/release.yml) workflow picks up any extension whose version isn't in `updates.json` yet. It signs that version through Mozilla as an unlisted add-on, publishes the `.xpi` as a GitHub Release and adds it to `updates.json`. Installed copies then update themselves.

**One-time setup:** create API credentials at <https://addons.mozilla.org/developers/addon/api/key/>. Add them as repository secrets named `AMO_JWT_ISSUER` (the JWT issuer) and `AMO_JWT_SECRET` under **Settings → Secrets and variables → Actions**. To re-run a failed release, open **Actions → Sign and release extensions → Run workflow**.

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
