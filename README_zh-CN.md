<p align="right">
  <a href="README.md">English</a> | <strong>简体中文</strong>
</p>

# Vibe Elector

面向 Coding Agent 的 Firefox 页面元素选择器。点击页面元素，即可复制一段简洁、稳定、可直接粘贴到 AI 编程对话中的定位信息，减少“我说的到底是哪个按钮”的沟通成本。

## 为什么使用 Vibe Elector

- **为 Coding Agent 设计**：输出 URL、元素摘要、Selector、DOM Path、尺寸与安全 HTML 签名，而不是整页 DOM。
- **定位更可靠**：优先使用稳定的 `id`、测试属性和语义属性；必要时生成结构路径，并支持 open Shadow DOM 的 `>>>` 分段 Selector。
- **连续选择更顺手**：复制后自动解除锁定并保持选择模式，可继续选择下一个元素。
- **本地优先**：不联网、不遥测、不持久化页面数据，定位结果只写入本地剪贴板。

## 使用方法

### 1. 开启选择模式并锁定元素

点击 Firefox 工具栏中的 Vibe Elector 图标，或按 `Alt + Shift + E`。移动鼠标预览元素，单击后锁定目标。

![开启选择模式并锁定元素](docs/images/vibe-elector-select-zh-CN.png)

### 2. 复制定位包

点击浮窗中的“复制到对话”，或按 `Alt + Shift + C`。复制成功后目标会自动解锁，选择模式保持开启。

### 3. 粘贴给 Coding Agent

把定位包与修改要求一起粘贴到 Codex、Claude Code、Cursor 等编程工具中，Agent 可直接按 Selector 和上下文查找目标。

![复制定位包并粘贴到 Coding Agent](docs/images/vibe-elector-copy-zh-CN.png)

定位包示例：

```text
[Vibe Elector v1]
URL: http://localhost:3000
Title: Dashboard
Target: button "立即开始"
Selector: button.primary
Path: main > section > button
Rect: x=122, y=542, width=342, height=74
HTML: <button class="primary">立即开始</button>
```

再次点击工具栏图标、按 `Alt + Shift + E`，或点击浮窗关闭按钮即可退出选择模式。

## 构建与安装

环境要求：Firefox Desktop、Node.js `22.17.1`、pnpm `10.15.1`。

```bash
nvm use
pnpm install --frozen-lockfile
pnpm build:firefox
```

在 Firefox 地址栏打开 `about:debugging#/runtime/this-firefox`，点击“临时载入附加组件”，选择：

```text
.output/firefox-mv3/manifest.json
```

也可以通过命令启动测试浏览器：

```bash
pnpm exec web-ext run --source-dir .output/firefox-mv3 --no-reload
```

> 暂不建议使用 `pnpm dev:firefox`：当前 WXT `0.20.9` 的 Firefox Manifest V3 开发运行器存在启动兼容问题。

## 快捷键

| 操作 | 快捷键 |
| --- | --- |
| 开启或退出选择模式 | `Alt + Shift + E` |
| 复制已锁定元素 | `Alt + Shift + C` |

快捷键冲突时，可在 `about:addons` 的扩展快捷键设置中重新绑定。

## 支持范围与限制

- 支持 HTTP、HTTPS、localhost，以及用户授权后的 `file://` 页面。
- 支持普通 DOM 与 open Shadow DOM；closed Shadow DOM 只能选择其 host。
- 不进入 iframe 内部，但可以选择 `<iframe>` 元素本身。
- Firefox 系统页面、`about:*`、AMO 等受限页面不允许脚本注入。
- MVP 不包含历史记录、账号、云同步、截图和源码映射。

## 隐私与权限

Vibe Elector 不会上传或持久化页面内容。密码输入框不会复制文本值，HTML 签名只保留安全属性。扩展使用 `activeTab`、`scripting` 和 `clipboardWrite`，仅在需要访问 `file://` 时请求可选权限。详情见 [PRIVACY.md](PRIVACY.md)。

## 开发验证

```bash
pnpm test          # 运行 Vitest 自动化测试
pnpm typecheck     # 检查 strict TypeScript 类型
pnpm build:firefox # 构建 Firefox MV3 扩展
pnpm lint          # 类型检查并运行 web-ext lint
```

项目使用 WXT、strict TypeScript、原生 DOM/CSS、Shadow DOM、Vitest 与 `happy-dom`。参与开发前请阅读 [AGENTS.md](AGENTS.md)，可复现构建说明见 [SOURCE_BUILD.md](SOURCE_BUILD.md)。

## License

本项目采用 [MIT License](LICENSE) 开源。
