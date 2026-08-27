import { afterEach, describe, expect, it, vi } from "vitest";

import { mountSelectorUI } from "../../src/selector/selector-ui";

describe("mountSelectorUI", () => {
  afterEach(() => {
    document.querySelector("[data-vibe-selector-root]")?.remove();
    vi.restoreAllMocks();
  });

  it("mounts its UI without assigning HTML strings to the Shadow DOM", () => {
    const setInnerHTML = vi.spyOn(ShadowRoot.prototype, "innerHTML", "set");

    const ui = mountSelectorUI(document);

    expect(ui.host.shadowRoot?.querySelector("[data-selector-overlay]")).not.toBeNull();
    expect(setInnerHTML).not.toHaveBeenCalled();
  });

  it("shows element dimensions beside its name while hovering and locked", () => {
    const target = document.createElement("button");
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () => ({ left: 10, top: 20, width: 123.6, height: 45.4 }),
    });
    document.body.append(target);
    const ui = mountSelectorUI(document);

    const shadow = ui.host.shadowRoot!;
    ui.setTarget(target, false);

    expect(shadow.querySelector("[data-selector-label-name]")?.textContent).toBe("button");
    expect(shadow.querySelector("[data-selector-label-size]")?.textContent).toBe("124 × 45");

    ui.setTarget(target, true);

    expect(shadow.querySelector("[data-selector-label-name]")?.textContent).toBe("button");
    expect(shadow.querySelector("[data-selector-label-size]")?.textContent).toBe("124 × 45");
  });

  it("shows the locked packet in a bounded scrollable panel", () => {
    const target = document.createElement("button");
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () => ({ left: 10, top: 20, width: 123, height: 45, right: 133 }),
    });
    document.body.append(target);
    const ui = mountSelectorUI(document);
    const packet = "[Vibe Selector v1]\\nTarget: button \\\"Long content\\\"\\n".repeat(30);

    ui.setTarget(target, true, packet);

    const shadow = ui.host.shadowRoot!;
    const panel = shadow.querySelector("#panel")!;
    const packetElement = shadow.querySelector<HTMLElement>("[data-selection-packet]")!;
    expect(panel.hasAttribute("data-locked")).toBe(true);
    expect(packetElement.textContent).toBe(packet);
    expect(getComputedStyle(packetElement).overflowY).toBe("auto");
  });

  it("keeps the panel at its default position and omits the copy shortcut", () => {
    const target = document.createElement("button");
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () => ({ left: 10, top: 20, width: 123, height: 45, right: 133 }),
    });
    document.body.append(target);
    const ui = mountSelectorUI(document);

    ui.setTarget(target, true);

    const shadow = ui.host.shadowRoot!;
    const panel = shadow.querySelector<HTMLElement>("#panel")!;
    expect(panel.style.left).toBe("");
    expect(panel.style.top).toBe("");
    expect(shadow.textContent).not.toContain("Alt+Shift+C to copy");
  });
});
