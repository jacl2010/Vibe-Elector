# Source Build

## Prerequisites

- Node.js `22.17.1` (see `.nvmrc`)
- pnpm `10.15.1` (declared in `package.json`)
- Firefox Desktop and/or Chrome for manual testing

## Reproducible build

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build:firefox
pnpm lint
pnpm build:chrome
pnpm lint:chrome
```

The Firefox Manifest V3 output is written to `.output/firefox-mv3/`; the Chrome Manifest V3 output is written to `.output/chrome-mv3/`. The build is fully local: no remote code, runtime downloads, or build-time credentials are used. Do not include `node_modules/`, `.output/`, local specifications, environment files, or personal test data in a source archive.

## Lint note

The selector UI is mounted with DOM APIs. Dynamic labels and toast messages are assigned with `textContent`, so page content, selected element data, and clipboard data never enter HTML parsing.

## Firefox smoke test

1. Run `pnpm dev:firefox` and load the temporary extension in Firefox.
2. Open an HTTPS page or localhost page, then activate Vibe Selector from the toolbar.
3. Lock an element, copy its locator, and confirm that no request leaves the browser.
4. Open a local `file://` page, then click the Vibe Selector toolbar icon to start selecting.
5. Try `about:addons` or addons.mozilla.org and confirm the temporary error badge appears.

## Chrome smoke test

1. Run `pnpm build:chrome`.
2. Open `chrome://extensions`, turn on **Developer mode**, select **Load unpacked**, and choose `.output/chrome-mv3/`.
3. Open an HTTPS page or localhost page, then activate Vibe Selector from the toolbar.
4. Lock an element, copy its locator, and confirm that no request leaves the browser.
5. Open the extension details page, enable **Allow access to file URLs**, then confirm a local `file://` page can be selected.
6. Try `chrome://extensions` or Chrome Web Store and confirm the temporary error badge appears.
