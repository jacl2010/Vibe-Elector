# Source Build

## Prerequisites

- Node.js `22.17.1` (see `.nvmrc`)
- pnpm `10.15.1` (declared in `package.json`)
- Firefox Desktop for manual testing

## Reproducible build

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build:firefox
pnpm lint
```

The Firefox Manifest V3 output is written to `.output/firefox-mv3/`. The build is fully local: no remote code, runtime downloads, or build-time credentials are used. Do not include `node_modules/`, `.output/`, local specifications, environment files, or personal test data in a source archive.

## Lint note

`web-ext lint` reports `UNSAFE_VAR_ASSIGNMENT` for the selector UI's Shadow DOM template. The template interpolates only extension-owned CSS constants and strings loaded from packaged Firefox locale files; page content, selected element data, and clipboard data never enter `innerHTML`. Dynamic labels and toast messages are assigned with `textContent`.

## Reviewer smoke test

1. Run `pnpm dev:firefox` and load the temporary extension in Firefox.
2. Open an HTTPS page or localhost page, then activate Vibe Elector from the toolbar.
3. Lock an element, copy its locator, and confirm that no request leaves the browser.
4. Open a local `file://` page and approve the optional permission when prompted.
5. Try `about:addons` or addons.mozilla.org and confirm the temporary error badge appears.
