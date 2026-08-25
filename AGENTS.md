# Repository Guidelines

## Project Status & Structure

This repository is currently design-only. The product baseline is `docs/specs/vibe-elector-firefox-design.md`; obtain explicit approval before scaffolding or implementing the extension. The planned stack is WXT, strict TypeScript, native DOM/CSS, and Shadow DOM for Firefox Desktop.

When implementation begins, keep WXT browser entry points in `entrypoints/`, reusable selection logic in `src/`, static assets and Firefox locales in `public/`, and automated tests in `tests/` or beside their modules as `*.test.ts`. Keep selector generation, session state, UI mounting, clipboard access, and browser orchestration in separate modules.

## Build, Test, and Development Commands

There is no executable toolchain yet: `package.json` and the lockfile do not exist. When scaffolding is approved, use pnpm, pin Node and pnpm versions, and expose these stable scripts:

- `pnpm dev:firefox` — run the extension in Firefox during development.
- `pnpm test` — run Vitest with `happy-dom`.
- `pnpm build:firefox` — create the production Manifest V3 build.
- `pnpm lint` — run formatting, type checks, and `web-ext lint`.

Treat `package.json` scripts as authoritative once added. Do not report a build as passing until the production build and Firefox lint both succeed.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, and repository formatter settings. Name types and classes in `PascalCase`, functions and variables in `camelCase`, files in `kebab-case`, and protocol constants such as `COPY_SELECTION` in `UPPER_SNAKE_CASE`. Prefer small public seams such as `buildSelectionPacket()` over testing private methods. Access Firefox APIs through WXT or a local adapter; keep the core selector logic browser-neutral.

## Testing Guidelines

Follow one red-green-refactor slice at a time. Cover public behavior with Vitest and `happy-dom`; substitute only external boundaries such as clipboard, permissions, and browser APIs. Every state transition, Shadow DOM path, cleanup path, permission outcome, and sensitive-field filter needs a regression test. Finish with one real Firefox smoke test covering HTTPS, localhost, `file://`, shortcuts, scrolling, repeated selection, and restricted pages.

## Commit & Pull Request Guidelines

No Git history is available to infer conventions. Use concise Conventional Commit subjects in Chinese, for example `feat: 添加元素锁定状态机`. Keep commits focused. Pull requests must summarize behavior, link the approved specification or issue, list verification commands, and include screenshots for UI changes plus permission/privacy notes for manifest changes. Never commit secrets, `.env*`, runtime data, generated packages, or local design documents. Commit, push, AMO upload, and public release require explicit maintainer authorization.
