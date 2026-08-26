export type {
  ExtensionMessage,
  ExtensionReply,
  SelectorState,
} from "./types";

export interface ExtensionApi {
  runtime?: {
    onMessage?: {
      addListener(listener: (message: unknown) => Promise<import("./types").ExtensionReply>): void;
    };
  };
  i18n?: { getMessage(key: string): string };
}

export function getExtensionApi(): ExtensionApi | undefined {
  const extensionGlobals = globalThis as typeof globalThis & {
    browser?: ExtensionApi;
    chrome?: ExtensionApi;
  };
  return extensionGlobals.browser ?? extensionGlobals.chrome;
}

export function getMessage(key: string, fallback: string): string {
  return getExtensionApi()?.i18n?.getMessage(key) || fallback;
}
