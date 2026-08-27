import { getUrlAccess } from "./url-policy";

export type ExtensionMessage = { type: "TOGGLE_SESSION" } | { type: "COPY_SELECTION" };

export interface BrowserAdapter {
  getActiveTab(): Promise<{ id?: number; url?: string }>;
  injectSelector(tabId: number, files: string[]): Promise<void>;
  sendMessage(tabId: number, message: ExtensionMessage): Promise<void>;
  setBadge(tabId: number, text: string, color?: string): Promise<void>;
  setTitle(tabId: number, title: string): Promise<void>;
}

export interface BackgroundController {
  toggle(): Promise<void>;
  copy(): Promise<void>;
  handleCommand(command: string): Promise<void>;
}

const SELECTOR_FILE = ["/selector.js"];
const BADGE_DURATION_MS = 2500;

export function createBackgroundController(browser: BrowserAdapter, unsupportedTitle: () => string): BackgroundController {
  async function showFailure(tabId: number): Promise<void> {
    await browser.setBadge(tabId, "!", "#DC2626");
    await browser.setTitle(tabId, unsupportedTitle());
    globalThis.setTimeout(() => {
      void browser.setBadge(tabId, "");
      void browser.setTitle(tabId, "Vibe Selector");
    }, BADGE_DURATION_MS);
  }

  async function dispatch(message: ExtensionMessage): Promise<void> {
    const tab = await browser.getActiveTab();
    if (tab.id === undefined || getUrlAccess(tab.url) === "unsupported") {
      if (tab.id !== undefined) await showFailure(tab.id);
      return;
    }
    try {
      await browser.injectSelector(tab.id, SELECTOR_FILE);
      await browser.sendMessage(tab.id, message);
    } catch {
      await showFailure(tab.id);
    }
  }

  return {
    toggle: () => dispatch({ type: "TOGGLE_SESSION" }),
    copy: () => dispatch({ type: "COPY_SELECTION" }),
    async handleCommand(command): Promise<void> {
      if (command === "_execute_action") await dispatch({ type: "TOGGLE_SESSION" });
      if (command === "copy-selection") await dispatch({ type: "COPY_SELECTION" });
    },
  };
}
