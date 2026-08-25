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
});
