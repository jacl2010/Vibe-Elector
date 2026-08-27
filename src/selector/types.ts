export type SelectorState = "inactive" | "hovering" | "locked";

export interface PageContext {
  url: string;
  title: string;
  viewport: { width: number; height: number };
  scroll: { x: number; y: number };
}

export interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionPacket {
  version: "Vibe Selector v1";
  page: PageContext;
  target: {
    summary: string;
    selector: string;
    selectorKind: "css" | "shadow-css";
    domPath: string;
    rect: ElementRect;
    htmlSignature: string;
    xpath?: string;
    contextHints?: string[];
  };
}

export type ExtensionMessage =
  | { type: "TOGGLE_SESSION" }
  | { type: "COPY_SELECTION" };

export type ExtensionReply =
  | { ok: true; state: SelectorState }
  | {
      ok: false;
      code:
        | "UNSUPPORTED_URL"
        | "PERMISSION_DENIED"
        | "NO_LOCKED_ELEMENT"
        | "STALE_ELEMENT"
        | "CLIPBOARD_WRITE_FAILED"
        | "INJECTION_FAILED";
    };
