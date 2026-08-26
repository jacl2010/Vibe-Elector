import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");

async function manifestFor(browser: "firefox" | "chrome") {
  const configModule = await import(resolve(root, "wxt.config.ts"));
  const manifest = configModule.default.manifest;
  return typeof manifest === "function" ? manifest({ browser } as never) : manifest;
}

describe("Firefox manifest configuration", () => {
  it("declares the minimal Firefox MV3 permissions and commands", async () => {
    const manifest = await manifestFor("firefox");

    expect(manifest.default_locale).toBe("en");
    expect(manifest.permissions).toEqual(["activeTab", "scripting", "clipboardWrite"]);
    expect(manifest.host_permissions).toEqual(["file:///*"]);
    expect(manifest.optional_host_permissions).toBeUndefined();
    expect(manifest.browser_specific_settings?.gecko).toMatchObject({
      id: "vibe-elector@element-selector.local",
      data_collection_permissions: { required: ["none"] },
    });
    expect(manifest.commands).toMatchObject({
      _execute_action: { suggested_key: { default: "Alt+Shift+E" } },
      "copy-selection": { suggested_key: { default: "Alt+Shift+C" } },
    });
  });

  it("omits Firefox-only metadata from the Chrome manifest", async () => {
    const manifest = await manifestFor("chrome");

    expect(manifest.host_permissions).toEqual(["file:///*"]);
    expect(manifest.browser_specific_settings).toBeUndefined();
  });

  it("uses PNG icons at Chrome's standard sizes", async () => {
    const manifest = await manifestFor("chrome");
    const icons = {
      16: "icon/vibe-elector-16.png",
      32: "icon/vibe-elector-32.png",
      48: "icon/vibe-elector-48.png",
      128: "icon/vibe-elector-128.png",
    };

    expect(manifest.icons).toEqual(icons);
    expect(manifest.action?.default_icon).toEqual(icons);
    for (const iconPath of Object.values(icons)) {
      const icon = await readFile(resolve(root, "public", iconPath));
      expect(icon.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    }
  });

  it("provides every required message in English and Simplified Chinese", async () => {
    const keys = [
      "extensionName", "extensionDescription", "toggleCommand", "copyCommand",
      "statusSelecting", "copyToChat", "copySuccess", "copyFailed", "selectFirst",
      "staleElement", "unsupportedPage", "closeSelector",
    ];
    for (const locale of ["en", "zh_CN"]) {
      const source = await readFile(resolve(root, `public/_locales/${locale}/messages.json`), "utf8");
      const messages = JSON.parse(source) as Record<string, { message: string }>;
      for (const key of keys) expect(messages[key]?.message).toBeTruthy();
    }
  });
});
