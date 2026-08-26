<p align="right">
  <a href="README.md">English</a> | <strong>简体中文</strong>
</p>

# Vibe Elector

面向 Coding Agent 的 Firefox 页面元素选择器。点击页面元素，即可复制一段简洁、稳定、可直接粘贴到 AI 编程对话中的定位信息，减少“我说的到底是哪个按钮”的沟通成本。

**[从 Firefox Add-ons 安装 Vibe Elector](https://addons.mozilla.org/zh-CN/firefox/addon/vibe-elector/)**

> **浏览器支持**：目前支持 Firefox，其他浏览器扩展正在开发中。

## 为什么使用 Vibe Elector

- **为 Coding Agent 设计**：输出 URL、元素摘要、Selector、DOM Path、尺寸与安全 HTML 签名，而不是整页 DOM。
- **定位更可靠**：优先使用稳定的 `id`、测试属性和语义属性；必要时生成结构路径，并支持 open Shadow DOM 的 `>>>` 分段 Selector。
- **连续选择更顺手**：复制后自动解除锁定并保持选择模式，可继续选择下一个元素。
- **本地优先**：不联网、不遥测、不持久化页面数据，定位结果只写入本地剪贴板。

## 使用方法

### 1. 开启选择模式并锁定元素

点击 Firefox 工具栏中的 Vibe Elector 图标，或按 `Option/Alt + Shift + E`。移动鼠标预览元素，单击后锁定目标。

### 2. 复制定位包

点击浮窗中的“复制到对话”，或按 `Option/Alt + Shift + C`。复制成功后目标会自动解锁，选择模式保持开启。

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

## 快捷键

| 操作 | 快捷键 |
| --- | --- |
| 开启或退出选择模式 | `Option/Alt + Shift + E` |
| 复制已锁定元素 | `Option/Alt + Shift + C` |

## 支持范围与限制

- 支持 HTTP、HTTPS、localhost，以及重新载入扩展后可用的本地 `file://` 页面。
- 支持普通 DOM 与 open Shadow DOM；closed Shadow DOM 只能选择其 host。
- 不进入 iframe 内部，但可以选择 `<iframe>` 元素本身。
- Firefox 系统页面、`about:*`、AMO 等受限页面不允许脚本注入。
- MVP 不包含历史记录、账号、云同步、截图和源码映射。

## 隐私与权限

Vibe Elector 不会上传或持久化页面内容。密码输入框不会复制文本值，HTML 签名只保留安全属性。扩展使用 `activeTab`、`scripting` 和 `clipboardWrite`，并声明 `file://` 访问权限以支持本地文件页。详情见 [PRIVACY.md](PRIVACY.md)。

项目使用 WXT、strict TypeScript、原生 DOM/CSS、Shadow DOM、Vitest 与 `happy-dom`。参与开发前请阅读 [AGENTS.md](AGENTS.md)，可复现构建说明见 [SOURCE_BUILD.md](SOURCE_BUILD.md)。

## License

本项目采用 [MIT License](LICENSE) 开源。
