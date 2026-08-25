import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { createBackgroundController, type BrowserAdapter, type ExtensionMessage } from "../src/background/controller";

function adaptBrowser(): BrowserAdapter {
  return {
    async getActiveTab() {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      return {
        ...(tab?.id === undefined ? {} : { id: tab.id }),
        ...(tab?.url === undefined ? {} : { url: tab.url }),
      };
    },
    hasFilePermission: (origins) => browser.permissions.contains({ origins }),
    requestFilePermission: (origins) => browser.permissions.request({ origins }),
    async injectSelector(tabId, files) {
      await browser.scripting.executeScript({ target: { tabId }, files });
    },
    async sendMessage(tabId, message: ExtensionMessage) {
      await browser.tabs.sendMessage(tabId, message);
    },
    async setBadge(tabId, text, color) {
      await browser.action.setBadgeText({ tabId, text });
      if (color) await browser.action.setBadgeBackgroundColor({ tabId, color });
    },
    setTitle: (tabId, title) => browser.action.setTitle({ tabId, title }),
  };
}

export default defineBackground(() => {
  const i18n = browser.i18n as unknown as { getMessage(key: string): string };
  const controller = createBackgroundController(adaptBrowser(), () => i18n.getMessage("unsupportedPage"));
  browser.action.onClicked.addListener(() => void controller.toggle());
  browser.commands.onCommand.addListener((command) => void controller.handleCommand(command));
});
