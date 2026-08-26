<p align="right">
  <strong>English</strong> | <a href="README_zh-CN.md">简体中文</a>
</p>

# Vibe Elector

A Firefox and Chrome element selector built for Coding Agents. Click any page element and copy a compact, stable context packet directly into an AI coding conversation—so your agent knows exactly which button, panel, or field you mean.

**[Install Vibe Elector from Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/vibe-elector/)**

> **Browser support:** Firefox is available from Firefox Add-ons. Chrome can be built and loaded locally; Chrome Web Store distribution is not available yet.

## Why Vibe Elector

- **Built for Coding Agents:** Copies the URL, element summary, selector, DOM path, dimensions, and a safe HTML signature instead of dumping the entire DOM.
- **More reliable targeting:** Prefers stable IDs, test attributes, and semantic attributes; falls back to structural paths and supports open Shadow DOM selectors with `>>>` segments.
- **Fast repeated selection:** Copying automatically unlocks the current target while keeping selection mode active.
- **Local-first:** No network requests, telemetry, or stored page data. Selection packets only go to your local clipboard.

## How to Use

### 1. Select and lock an element

Click the Vibe Elector toolbar icon or press `Option/Alt + Shift + E`. Move the pointer to preview elements, then click to lock the target.

### 2. Copy the selection packet

Click **Copy to chat** in the floating panel or press `Option/Alt + Shift + C`. After a successful copy, the target unlocks and selection mode stays active.

### 3. Paste it into a Coding Agent

Paste the packet together with your request into Codex, Claude Code, Cursor, or another coding tool. The agent can use the selector and context to locate the target directly.

![Copy the selection packet into a Coding Agent](docs/images/vibe-elector-copy-zh-CN.png)

Example packet:

```text
[Vibe Elector v1]
URL: http://localhost:3000
Title: Dashboard
Target: button "Get Started"
Selector: button.primary
Path: main > section > button
Rect: x=122, y=542, width=342, height=74
HTML: <button class="primary">Get Started</button>
```

Click the toolbar icon, press `Option/Alt + Shift + E` again, or use the panel close button to exit selection mode.

## Keyboard Shortcuts

| Action | Shortcut |
| --- | --- |
| Toggle selection mode | `Option/Alt + Shift + E` |
| Copy the locked selection | `Option/Alt + Shift + C` |

## Support and Limitations

- Supports HTTP, HTTPS, localhost, and local `file://` pages. In Chrome, enable **Allow access to file URLs** from the extension details page before using local files.
- Supports regular DOM and open Shadow DOM. A closed Shadow DOM can only be targeted through its host.
- Does not enter iframes; the `<iframe>` element itself can still be selected.
- Firefox system pages, `about:*`, AMO, Chrome system pages, and Chrome Web Store do not allow script injection.
- The MVP does not include history, accounts, cloud sync, screenshots, or source maps.

## Privacy and Permissions

Vibe Elector does not upload or persist page content. Password values are excluded, and HTML signatures retain only safe attributes. It uses `activeTab`, `scripting`, and `clipboardWrite`, and declares `file://` access so it can run on local files. See [PRIVACY.md](PRIVACY.md) for details.

The project uses WXT, strict TypeScript, native DOM/CSS, Shadow DOM, Vitest, and `happy-dom`. Read [AGENTS.md](AGENTS.md) before contributing and [SOURCE_BUILD.md](SOURCE_BUILD.md) for reproducible build details.

## License

This project is licensed under the [MIT License](LICENSE).
