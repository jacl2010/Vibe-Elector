# Repository Guidelines

## Project Status & Structure

This repository supports Firefox Desktop and Chrome with Manifest V3. Keep both browser builds behaviorally equivalent unless a browser platform limitation is explicitly documented. The stack is WXT, strict TypeScript, native DOM/CSS, and Shadow DOM.

Keep WXT browser entry points in `entrypoints/`, reusable selection logic in `src/`, static assets and locales in `public/`, and automated tests in `tests/` or beside their modules as `*.test.ts`. Keep selector generation, session state, UI mounting, clipboard access, and browser orchestration in separate modules.

## Build, Test, and Development Commands

Use pnpm with the Node and pnpm versions declared in `package.json`. The stable scripts are:

- `pnpm dev:firefox` — run the extension in Firefox during development.
- `pnpm dev:chrome` — run the extension in Chrome during development.
- `pnpm test` — run Vitest with `happy-dom`.
- `pnpm build:firefox` — create the production Manifest V3 build.
- `pnpm build:chrome` — create the production Manifest V3 build.
- `pnpm lint` — type-check and run Firefox `web-ext lint`.
- `pnpm lint:chrome` — type-check and build the Chrome target.

Treat `package.json` scripts as authoritative. Do not report cross-browser work as passing until both production builds, Firefox lint, and the relevant automated tests succeed.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, and repository formatter settings. Name types and classes in `PascalCase`, functions and variables in `camelCase`, files in `kebab-case`, and protocol constants such as `COPY_SELECTION` in `UPPER_SNAKE_CASE`. Prefer small public seams such as `buildSelectionPacket()` over testing private methods. Access browser APIs through WXT or a small compatibility seam; keep the core selector logic browser-neutral.

## Testing Guidelines

Follow one red-green-refactor slice at a time. Cover public behavior with Vitest and `happy-dom`; substitute only external boundaries such as clipboard, permissions, and browser APIs. Every state transition, Shadow DOM path, cleanup path, permission outcome, and sensitive-field filter needs a regression test. Finish with Firefox and Chrome smoke tests covering HTTPS, localhost, `file://`, shortcuts, scrolling, repeated selection, and restricted pages. In Chrome, enable **Allow access to file URLs** before the local-file smoke test.

## Commit & Pull Request Guidelines

No Git history is available to infer conventions. Use concise Conventional Commit subjects in Chinese, for example `feat: 添加元素锁定状态机`. Keep commits focused. Pull requests must summarize behavior, link the approved specification or issue, list Firefox and Chrome verification commands, and include screenshots for UI changes plus permission/privacy notes for manifest changes. Never commit secrets, `.env*`, runtime data, generated packages, or local design documents. Commit, push, AMO upload, Chrome Web Store upload, and public release require explicit maintainer authorization.
