import { describe, expect, it, vi } from "vitest";
import { createBackgroundController, type BrowserAdapter } from "../../src/background/controller";

function makeBrowser(overrides: Partial<BrowserAdapter> = {}): BrowserAdapter {
  return {
    getActiveTab: vi.fn().mockResolvedValue({ id: 7, url: "https://example.test" }),
    hasFilePermission: vi.fn().mockResolvedValue(false),
    requestFilePermission: vi.fn().mockResolvedValue(false),
    injectSelector: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    setBadge: vi.fn().mockResolvedValue(undefined),
    setTitle: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("background controller", () => {
  it("injects the fixed selector entry and toggles on ordinary web pages", async () => {
    const browser = makeBrowser();
    const controller = createBackgroundController(browser, () => "Unavailable");

    await controller.toggle();

    expect(browser.injectSelector).toHaveBeenCalledWith(7, ["/selector.js"]);
    expect(browser.sendMessage).toHaveBeenCalledWith(7, { type: "TOGGLE_SESSION" });
  });

  it("sends copy without reinjecting an existing session", async () => {
    const browser = makeBrowser();
    const controller = createBackgroundController(browser, () => "Unavailable");

    await controller.copy();

    expect(browser.injectSelector).toHaveBeenCalledWith(7, ["/selector.js"]);
    expect(browser.sendMessage).toHaveBeenCalledWith(7, { type: "COPY_SELECTION" });
  });

  it("requests file access only when it is not already granted", async () => {
    const browser = makeBrowser({
      getActiveTab: vi.fn().mockResolvedValue({ id: 7, url: "file:///tmp/demo.html" }),
      requestFilePermission: vi.fn().mockResolvedValue(true),
    });
    const controller = createBackgroundController(browser, () => "Unavailable");

    await controller.toggle();

    expect(browser.requestFilePermission).toHaveBeenCalledWith(["file:///*"]);
    expect(browser.injectSelector).toHaveBeenCalled();
  });

  it("shows a temporary error badge when file access is refused", async () => {
    vi.useFakeTimers();
    const browser = makeBrowser({
      getActiveTab: vi.fn().mockResolvedValue({ id: 7, url: "file:///tmp/demo.html" }),
    });
    const controller = createBackgroundController(browser, () => "Unavailable");

    await controller.toggle();

    expect(browser.setBadge).toHaveBeenCalledWith(7, "!", "#DC2626");
    expect(browser.setTitle).toHaveBeenCalledWith(7, "Unavailable");
    await vi.advanceTimersByTimeAsync(2500);
    expect(browser.setBadge).toHaveBeenLastCalledWith(7, "");
    vi.useRealTimers();
  });

  it.each(["about:addons", "https://addons.mozilla.org/en-US/firefox/"])("rejects restricted page %s", async (url) => {
    const browser = makeBrowser({ getActiveTab: vi.fn().mockResolvedValue({ id: 7, url }) });
    const controller = createBackgroundController(browser, () => "Unavailable");

    await controller.toggle();

    expect(browser.injectSelector).not.toHaveBeenCalled();
    expect(browser.setBadge).toHaveBeenCalledWith(7, "!", "#DC2626");
  });

  it("routes action and command events to toggle and copy", async () => {
    const browser = makeBrowser();
    const controller = createBackgroundController(browser, () => "Unavailable");

    await controller.handleCommand("_execute_action");
    await controller.handleCommand("copy-selection");

    expect(browser.sendMessage).toHaveBeenNthCalledWith(1, 7, { type: "TOGGLE_SESSION" });
    expect(browser.sendMessage).toHaveBeenNthCalledWith(2, 7, { type: "COPY_SELECTION" });
  });
});
