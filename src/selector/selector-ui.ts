const PURPLE = "#7C3AED";
import { getMessage } from "./messages";

export interface SelectorUI {
  readonly host: HTMLElement;
  contains(node: Node | null): boolean;
  setTarget(element: Element, locked: boolean, lockedPacket?: string): void;
  clearTarget(): void;
  showToast(message: string, isError?: boolean): void;
  onCopy(listener: () => void): void;
  onClose(listener: () => void): void;
  destroy(): void;
}

function elementLabel(element: Element): string {
  const className = Array.from(element.classList).find(Boolean);
  const id = element.id ? `#${element.id}` : "";
  return `${element.localName.toLowerCase()}${id}${className ? `.${className}` : ""}`;
}

function fixedStyle(rect: DOMRect | ClientRect): string {
  return [
    "display:block",
    "position:fixed",
    `left:${Math.round(rect.left)}px`,
    `top:${Math.round(rect.top)}px`,
    `width:${Math.max(0, Math.round(rect.width))}px`,
    `height:${Math.max(0, Math.round(rect.height))}px`,
    "border:2px solid #7C3AED",
    "background:rgba(124, 58, 237, 0.10)",
    "box-sizing:border-box",
  ].join(";");
}

/** Mounts all extension UI inside a single ShadowRoot so page styles cannot affect it. */
export function mountSelectorUI(document: Document): SelectorUI {
  const host = document.createElement("div");
  host.dataset.vibeSelectorRoot = "";
  host.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;";
  const shadow = host.attachShadow({ mode: "open" });
  const selecting = getMessage("statusSelecting", "Selecting page elements");
  const copyToChat = getMessage("copyToChat", "Copy to chat");
  const closeSelector = getMessage("closeSelector", "Close element selector");
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    #overlay { pointer-events:none; display:none; z-index:1; }
    #label { position:fixed; display:none; align-items:center; gap:6px; padding:2px 6px; color:#fff; background:${PURPLE}; border-radius:4px; font:12px/1.4 system-ui,sans-serif; z-index:2; }
    #label-size { color:#EDE9FE; }
    #panel { position:fixed; top:16px; right:16px; width:260px; padding:12px; box-sizing:border-box; pointer-events:auto; color:#1F2937; background:#fff; border:1px solid ${PURPLE}; border-radius:10px; box-shadow:0 12px 32px rgba(17,24,39,.18); font:13px/1.4 system-ui,sans-serif; }
    #panel[data-locked] { display:flex; flex-direction:column; width:min(320px, calc(100vw - 16px)); max-height:min(288px, calc(100vh - 16px)); padding:0; overflow:hidden; }
    #panel-header { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    #panel[data-locked] #panel-header { flex:none; padding:10px 12px; border-bottom:1px solid #EDE9FE; background:#FAF9FF; color:#5B21B6; }
    #close { border:0; background:transparent; cursor:pointer; color:#6B7280; font-size:18px; line-height:16px; }
    #packet { display:none; min-height:0; margin:0; padding:10px 12px; overflow-y:auto; overflow-wrap:anywhere; white-space:pre-wrap; color:#374151; font:11px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace; }
    #packet-actions { display:none; flex:none; justify-content:flex-end; padding:9px 12px 11px; border-top:1px solid #EDE9FE; }
    #panel[data-locked] #status { display:none; }
    #panel[data-locked] #packet { display:block; }
    #panel[data-locked] #packet-actions { display:flex; }
    #copy { pointer-events:auto; border:0; padding:7px 10px; border-radius:6px; color:#fff; background:${PURPLE}; cursor:pointer; font:13px/1 system-ui,sans-serif; }
    #toast { position:fixed; right:16px; bottom:16px; display:none; pointer-events:none; padding:8px 12px; border-radius:6px; color:#fff; background:#1F2937; font:13px/1.4 system-ui,sans-serif; }
  `;

  const overlay = document.createElement("div");
  overlay.id = "overlay";
  overlay.dataset.selectorOverlay = "";
  const label = document.createElement("div");
  label.id = "label";
  label.dataset.selectorLabel = "";
  const labelName = document.createElement("span");
  labelName.id = "label-name";
  labelName.dataset.selectorLabelName = "";
  const labelSize = document.createElement("span");
  labelSize.id = "label-size";
  labelSize.dataset.selectorLabelSize = "";
  label.append(labelName, labelSize);
  const panel = document.createElement("section");
  panel.id = "panel";
  panel.setAttribute("aria-label", "Vibe Selector");
  const header = document.createElement("div");
  header.id = "panel-header";
  const close = document.createElement("button");
  close.id = "close";
  close.type = "button";
  close.setAttribute("aria-label", closeSelector);
  close.textContent = "×";
  const title = document.createElement("strong");
  title.textContent = "Vibe Selector";
  header.append(title, close);
  const status = document.createElement("div");
  status.textContent = selecting;
  const packet = document.createElement("pre");
  packet.id = "packet";
  packet.dataset.selectionPacket = "";
  const copy = document.createElement("button");
  copy.id = "copy";
  copy.dataset.copySelection = "";
  copy.type = "button";
  copy.textContent = copyToChat;
  const packetActions = document.createElement("div");
  packetActions.id = "packet-actions";
  packetActions.append(copy);
  panel.append(header, status, packet, packetActions);
  const toast = document.createElement("div");
  toast.id = "toast";
  toast.setAttribute("role", "status");
  shadow.append(style, overlay, label, panel, toast);
  document.documentElement.append(host);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  return {
    host,
    contains: (node) => Boolean(node && (node === host || shadow.contains(node))),
    setTarget(element, locked, lockedPacket) {
      const rect = element.getBoundingClientRect();
      overlay.style.cssText = fixedStyle(rect);
      label.style.cssText = [
        "display:flex",
        "position:fixed",
        `left:${Math.round(rect.left)}px`,
        `top:${Math.max(0, Math.round(rect.top) - 20)}px`,
      ].join(";");
      labelName.textContent = elementLabel(element);
      labelSize.textContent = `${Math.max(0, Math.round(rect.width))} × ${Math.max(0, Math.round(rect.height))}`;
      if (locked) {
        panel.dataset.locked = "";
        packet.textContent = lockedPacket ?? "";
      } else {
        panel.removeAttribute("data-locked");
        packet.textContent = "";
      }
    },
    clearTarget() {
      overlay.style.display = "none";
      label.style.display = "none";
      panel.removeAttribute("data-locked");
      packet.textContent = "";
    },
    showToast(message, isError = false) {
      toast.textContent = message;
      toast.style.display = "block";
      toast.style.background = isError ? "#DC2626" : "#16A34A";
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.style.display = "none";
      }, isError ? 2500 : 1500);
    },
    onCopy(listener) {
      copy.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        listener();
      });
    },
    onClose(listener) {
      close.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        listener();
      });
    },
    destroy() {
      if (toastTimer) clearTimeout(toastTimer);
      host.remove();
    },
  };
}
