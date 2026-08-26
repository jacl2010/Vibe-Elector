import { defineConfig } from "wxt";

export default defineConfig({
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    default_locale: "en",
    name: "__MSG_extensionName__",
    description: "__MSG_extensionDescription__",
    permissions: ["activeTab", "scripting", "clipboardWrite"],
    host_permissions: ["file:///*"],
    action: {
      default_title: "__MSG_extensionName__",
      default_icon: {
        16: "icon/vibe-elector-16.png",
        32: "icon/vibe-elector-32.png",
        48: "icon/vibe-elector-48.png",
        128: "icon/vibe-elector-128.png",
      },
    },
    icons: {
      16: "icon/vibe-elector-16.png",
      32: "icon/vibe-elector-32.png",
      48: "icon/vibe-elector-48.png",
      128: "icon/vibe-elector-128.png",
    },
    commands: {
      _execute_action: {
        suggested_key: { default: "Alt+Shift+E" },
        description: "__MSG_toggleCommand__",
      },
      "copy-selection": {
        suggested_key: { default: "Alt+Shift+C" },
        description: "__MSG_copyCommand__",
      },
    },
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "vibe-elector@element-selector.local",
              data_collection_permissions: { required: ["none"] },
            } as never,
          },
        }
      : {}),
  }),
});
