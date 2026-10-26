# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

A collection of independent Firefox WebExtensions (MIT licensed). Each extension lives in its own top-level directory with its own `manifest.json`; there is no shared build across extensions unless one is added explicitly.

```
<extension-name>/
  manifest.json      # entry point; web-ext runs from this directory
  background.js      # background script (event page / service worker)
  content/           # content scripts injected into pages
  popup/, options/   # browser_action popup and options UI
  icons/
```

Extensions are plain JavaScript with no bundler by default. Introduce a `package.json` / build step inside an extension only when it genuinely needs dependencies.

## Commands

Use Mozilla's `web-ext` via `npx` (Node 22 is available). Run from inside an extension directory, or pass `--source-dir <extension-name>`:

```bash
npx web-ext lint --source-dir <extension-name>     # validate manifest, APIs, and AMO rules
npx web-ext build --source-dir <extension-name> --artifacts-dir dist/<extension-name> --overwrite-dest
npx web-ext run --source-dir <extension-name>      # launches Firefox with the extension (needs a local Firefox; not available in cloud sessions)
```

`web-ext lint` is the primary check in cloud sessions — run it after every manifest or API change. Build artifacts go in `dist/` (git-ignored).

## Firefox-specific conventions

- Target Manifest V3 for new extensions. Firefox MV3 differs from Chrome: background uses `"background": { "scripts": [...] }` (event page), not `service_worker`, and host permissions are opt-in by the user at runtime.
- Every manifest needs `browser_specific_settings.gecko.id` (e.g. `"<name>@shubhs-dev"`) and `strict_min_version: "140.0"` (repo-wide minimum); AMO signing and `storage.sync` depend on a stable ID. New AMO submissions also require `browser_specific_settings.gecko.data_collection_permissions`.
- Every manifest also needs `browser_specific_settings.gecko.update_url` set to `https://raw.githubusercontent.com/shubhs-dev/firefox-extensions/main/updates.json` so installed copies self-update.
- Use the promise-based `browser.*` namespace, not callback-style `chrome.*`.
- Request the minimum permissions; prefer `activeTab` and optional permissions over broad host permissions.
- AMO review rejects remote code, `eval`/`new Function`, and minified/obfuscated sources without source. Keep all code in the package and avoid `innerHTML` with untrusted data (lint flags it).

## Releases

Extensions are signed as AMO **unlisted** (self-distributed, personal use) by `.github/workflows/release.yml` → `.github/scripts/release.sh`. On push to `main`, any extension whose manifest `version` is missing from `updates.json` is linted (`--self-hosted`), signed with `web-ext sign --channel unlisted`, published as GitHub Release `<ext>-v<version>` with asset `<ext>-<version>.xpi`, and appended to `updates.json` (committed back by the workflow). So: bump `version` in a manifest whenever an extension's code changes, and never edit `updates.json` by hand. AMO rejects re-signing an existing version. Secrets: `AMO_JWT_ISSUER`, `AMO_JWT_SECRET`.

## Git workflow

Commit and push directly to `main`; no feature branches or PRs needed for this repo.
