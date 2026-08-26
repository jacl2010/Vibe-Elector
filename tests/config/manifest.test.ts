import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");

describe("Firefox manifest configuration", () => {
  it("declares the minimal Firefox MV3 permissions and commands", async () => {
    const configModule = await import(resolve(root, "wxt.config.ts"));
    const manifest = configModule.default.manifest;

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
