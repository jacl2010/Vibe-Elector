import { afterEach, describe, expect, it, vi } from "vitest";

import { getExtensionApi, getMessage, type ExtensionApi } from "../../src/selector/messages";

const extensionGlobals = globalThis as typeof globalThis & {
  browser?: ExtensionApi;
  chrome?: ExtensionApi;
};

afterEach(() => {
  delete extensionGlobals.browser;
  delete extensionGlobals.chrome;
  vi.restoreAllMocks();
});

describe("extension API access", () => {
  it("uses Chrome's runtime namespace when the Firefox browser namespace is absent", () => {
    const runtime = { onMessage: { addListener: vi.fn() } };
    extensionGlobals.chrome = { runtime };

    expect(getExtensionApi()?.runtime).toBe(runtime);
  });

  it("uses Chrome i18n messages when running in Chrome", () => {
    extensionGlobals.chrome = { i18n: { getMessage: vi.fn().mockReturnValue("Copied") } };

    expect(getMessage("copySuccess", "fallback")).toBe("Copied");
  });
});
