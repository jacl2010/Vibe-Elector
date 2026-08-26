import { buildSelectionPacket, formatSelectionPacket } from "./selection-packet";
import { mountSelectorUI, type SelectorUI } from "./selector-ui";
import type { ExtensionReply, PageContext, SelectorState } from "./types";

export interface ClipboardAdapter {
  writeText(value: string): Promise<void>;
}

export interface SelectorSessionOptions {
  clipboard?: ClipboardAdapter;
}

function pageContext(document: Document): PageContext {
  const view = document.defaultView;
  return {
    url: document.location.href,
    title: document.title,
    viewport: { width: view?.innerWidth ?? 0, height: view?.innerHeight ?? 0 },
    scroll: { x: view?.scrollX ?? 0, y: view?.scrollY ?? 0 },
  };
}

function defaultClipboard(document: Document): ClipboardAdapter {
  return {
    writeText: async (value) => {
      const clipboard = document.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error("Clipboard API unavailable");
      await clipboard.writeText(value);
    },
  };
}

function message(key: string, fallback: string): string {
  const browser = (globalThis as typeof globalThis & {
    browser?: { i18n?: { getMessage(name: string): string } };
  }).browser;
  return browser?.i18n?.getMessage(key) || fallback;
}

/** A per-document state machine that owns hit testing, isolated UI, and clipboard writes. */
export class SelectorSession {
  private readonly clipboard: ClipboardAdapter;
  private ui: SelectorUI | undefined;
  private hovered: Element | undefined;
  private locked: Element | undefined;
  private lockedPacket: string | undefined;
  private pendingRender = false;
  private _state: SelectorState = "inactive";
  private lastCopyReply: ExtensionReply = { ok: true, state: "inactive" };

  constructor(
    private readonly document: Document,
    options: SelectorSessionOptions = {},
  ) {
    this.clipboard = options.clipboard ?? defaultClipboard(document);
  }

  get state(): SelectorState {
    return this._state;
  }

  get copyReply(): ExtensionReply {
    return this.lastCopyReply;
  }

  start(): void {
    if (this._state !== "inactive") return;
    this.ui = mountSelectorUI(this.document);
    this._state = "hovering";
    this.document.addEventListener("pointermove", this.onPointerMove, true);
    this.document.addEventListener("click", this.onClick, true);
    this.document.addEventListener("keydown", this.onKeydown, true);
    const view = this.document.defaultView;
    view?.addEventListener("scroll", this.onViewportChange, true);
    view?.addEventListener("resize", this.onViewportChange);
    this.ui.onCopy(() => void this.copy());
    this.ui.onClose(() => this.stop());
  }

  lock(element: Element): void {
    if (this._state === "inactive" || this.isExtensionUi(element)) return;
    this.locked = element;
    this.hovered = element;
    this.lockedPacket = formatSelectionPacket(buildSelectionPacket(element, pageContext(this.document)));
    this._state = "locked";
    this.renderNow();
  }

  unlock(): void {
    if (this._state !== "locked") return;
    this.locked = undefined;
    this.lockedPacket = undefined;
    this._state = "hovering";
    if (this.hovered?.isConnected) this.renderNow();
    else this.ui?.clearTarget();
  }

  async copy(): Promise<void> {
    if (!this.locked) {
      this.lastCopyReply = { ok: false, code: "NO_LOCKED_ELEMENT" };
      this.ui?.showToast(message("selectFirst", "Click an element first"), true);
      return;
    }
    if (!this.locked.isConnected || !this.document.documentElement.contains(this.locked)) {
      this.locked = undefined;
      this.lockedPacket = undefined;
      this._state = "hovering";
      this.ui?.clearTarget();
      this.ui?.showToast(message("staleElement", "Element changed. Select it again"), true);
      this.lastCopyReply = { ok: false, code: "STALE_ELEMENT" };
      return;
    }
    try {
      const text = this.lockedPacket ?? formatSelectionPacket(buildSelectionPacket(this.locked, pageContext(this.document)));
      await this.clipboard.writeText(text);
      this.ui?.showToast(message("copySuccess", "Copied"));
      this.unlock();
      this.lastCopyReply = { ok: true, state: this._state };
    } catch {
      this.ui?.showToast(message("copyFailed", "Copy failed. Try again"), true);
      this.lastCopyReply = { ok: false, code: "CLIPBOARD_WRITE_FAILED" };
    }
  }

  stop(): void {
    if (this._state === "inactive") return;
    this.document.removeEventListener("pointermove", this.onPointerMove, true);
    this.document.removeEventListener("click", this.onClick, true);
    this.document.removeEventListener("keydown", this.onKeydown, true);
    const view = this.document.defaultView;
    view?.removeEventListener("scroll", this.onViewportChange, true);
    view?.removeEventListener("resize", this.onViewportChange);
    this.ui?.destroy();
    this.ui = undefined;
    this.hovered = undefined;
    this.locked = undefined;
    this.lockedPacket = undefined;
    this.pendingRender = false;
    this._state = "inactive";
    this.lastCopyReply = { ok: true, state: "inactive" };
  }

  private onPointerMove = (event: Event): void => {
    if (this._state === "inactive") return;
    const target = this.hitTarget(event);
    if (!target) return;
    this.hovered = target;
    if (this._state === "hovering") this.scheduleRender();
  };

  private onClick = (event: Event): void => {
    if (this._state === "inactive") return;
    const target = this.hitTarget(event);
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.lock(target);
  };

  private onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || this._state === "inactive") return;
    event.preventDefault();
    if (this._state === "locked") this.unlock();
    else this.stop();
  };

  private onViewportChange = (): void => this.scheduleRender();

  private hitTarget(event: Event): Element | undefined {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    const pathElement = path.find((node): node is Element => node instanceof Element);
    const mouse = event as MouseEvent;
    const fromPoint = this.document.elementFromPoint?.(mouse.clientX, mouse.clientY) ?? undefined;
    const candidate = pathElement && !this.isExtensionUi(pathElement) ? pathElement : fromPoint;
    return candidate instanceof Element && !this.isExtensionUi(candidate) && candidate.isConnected
      ? candidate
      : undefined;
  }

  private isExtensionUi(node: Node): boolean {
    return this.ui?.contains(node) ?? false;
  }

  private scheduleRender(): void {
    if (this.pendingRender || this._state === "inactive") return;
    this.pendingRender = true;
    const render = () => {
      this.pendingRender = false;
      this.renderNow();
    };
    const raf = this.document.defaultView?.requestAnimationFrame;
    if (raf) raf.call(this.document.defaultView, render);
    else render();
  }

  private renderNow(): void {
    const target = this.locked ?? this.hovered;
    if (!target?.isConnected) {
      this.ui?.clearTarget();
      return;
    }
    this.ui?.setTarget(target, this._state === "locked", this.lockedPacket);
  }
}
