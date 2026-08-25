import { afterEach, describe, expect, it, vi } from "vitest";

import { mountSelectorUI } from "../../src/selector/selector-ui";

describe("mountSelectorUI", () => {
  afterEach(() => {
    document.querySelector("[data-vibe-elector-root]")?.remove();
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
});
