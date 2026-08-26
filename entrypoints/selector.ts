import { defineUnlistedScript } from "wxt/utils/define-unlisted-script";

import { getExtensionApi } from "../src/selector/messages";
import { SelectorSession } from "../src/selector/selector-session";
import type { ExtensionMessage, ExtensionReply } from "../src/selector/types";

declare global {
  interface Window {
    __vibeElectorSession__?: SelectorSession;
    __vibeElectorMessageListenerInstalled__?: boolean;
  }
}

export default defineUnlistedScript(() => {
const extensionApi = getExtensionApi();

const session = (window.__vibeElectorSession__ ??= new SelectorSession(document));

async function handleMessage(message: ExtensionMessage): Promise<ExtensionReply> {
  if (message.type === "TOGGLE_SESSION") {
    if (session.state === "inactive") session.start();
    else session.stop();
    return { ok: true, state: session.state };
  }
  if (message.type === "COPY_SELECTION") {
    await session.copy();
    return session.copyReply;
  }
  return { ok: false, code: "INJECTION_FAILED" };
}

if (!window.__vibeElectorMessageListenerInstalled__) {
  window.__vibeElectorMessageListenerInstalled__ = true;
  extensionApi?.runtime?.onMessage?.addListener((message: unknown) =>
    handleMessage(message as ExtensionMessage),
  );
}
});
