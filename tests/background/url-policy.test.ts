import { describe, expect, it } from "vitest";
import { getUrlAccess } from "../../src/background/url-policy";

describe("URL access policy", () => {
  it.each(["http://localhost:3000", "http://127.0.0.1:5173", "https://example.test/page"])("allows %s", (url) => {
    expect(getUrlAccess(url)).toBe("web");
  });

  it("marks local files for file access", () => {
    expect(getUrlAccess("file:///tmp/demo.html")).toBe("file");
  });

  it.each([
    "about:config",
    "chrome://extensions/",
    "https://addons.mozilla.org/en-US/firefox/",
    "https://chromewebstore.google.com/",
    "moz-extension://abc/page.html",
    undefined,
  ])("rejects %s", (url) => {
    expect(getUrlAccess(url)).toBe("unsupported");
  });
});
