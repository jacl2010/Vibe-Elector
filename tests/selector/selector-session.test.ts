import { afterEach, describe, expect, it, vi } from "vitest";

import { SelectorSession } from "../../src/selector/selector-session";

const sessions: SelectorSession[] = [];

function createSession(
  ...args: ConstructorParameters<typeof SelectorSession>
): SelectorSession {
  const session = new SelectorSession(...args);
  sessions.push(session);
  return session;
}

afterEach(() => {
  sessions.splice(0).forEach((session) => session.stop());
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function setHitTarget(element: Element) {
  vi.spyOn(document, "elementFromPoint").mockReturnValue(element);
}

function pointerMove(x: number, y: number) {
  const event = new Event("pointermove", { bubbles: true, cancelable: true });
  Object.defineProperties(event, { clientX: { value: x }, clientY: { value: y } });
  document.dispatchEvent(event);
}

function click(target: Element) {
  return target.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      composed: true,
    }),
  );
}

describe("SelectorSession", () => {
  it("starts in hovering state and mounts one isolated Shadow DOM UI", () => {
    const session = createSession(document);

    session.start();
    session.start();

    const host = document.querySelector("[data-vibe-elector-root]") as HTMLElement;
    expect(session.state).toBe("hovering");
    expect(document.querySelectorAll("[data-vibe-elector-root]")).toHaveLength(1);
    expect(host.shadowRoot).not.toBeNull();
    expect(host.shadowRoot!.querySelector("[data-selector-overlay]")).not.toBeNull();
    expect(host.shadowRoot!.textContent).toContain("Selecting page elements");
  });

  it("highlights the hit element without writing to the page element and locks on click", () => {
    document.body.innerHTML = '<a href="/next">Next</a>';
    const link = document.querySelector("a")!;
    setHitTarget(link);
    Object.defineProperty(link, "getBoundingClientRect", {
      value: () => ({ x: 10, y: 20, width: 100, height: 30 }),
    });
    const session = createSession(document);
    session.start();

    pointerMove(20, 30);
    click(link);

    expect(session.state).toBe("locked");
    expect(link.hasAttribute("data-vibe-elector-selected")).toBe(false);
    const ui = document.querySelector("[data-vibe-elector-root]")!.shadowRoot!;
    expect(ui.querySelector("[data-selector-overlay]")?.getAttribute("style")).toContain("#7C3AED");
    expect(ui.querySelector("[data-copy-selection]")).not.toBeNull();
  });

  it("replaces a locked target, copies successfully, and keeps the session active", async () => {
    document.body.innerHTML = "<button>First</button><button>Second</button>";
    const [first, second] = Array.from(document.querySelectorAll("button"));
    if (!first || !second) throw new Error("Expected two page buttons");
    const writeText = vi.fn().mockResolvedValue(undefined);
    const session = createSession(document, { clipboard: { writeText } });
    session.start();
    session.lock(first);
    session.lock(second);

    await session.copy();

    expect(writeText).toHaveBeenCalledOnce();
    expect(session.state).toBe("hovering");
    expect(document.querySelector("[data-vibe-elector-root]")!.shadowRoot!.textContent).toContain("Copied");
  });

  it("copies and unlocks when the Shadow DOM copy button is clicked", async () => {
    document.body.innerHTML = "<button>Target</button>";
    const writeText = vi.fn().mockResolvedValue(undefined);
    const session = createSession(document, { clipboard: { writeText } });
    session.start();
    session.lock(document.querySelector("button")!);
    const copyButton = document
      .querySelector("[data-vibe-elector-root]")!
      .shadowRoot!.querySelector<HTMLButtonElement>("[data-copy-selection]")!;

    copyButton.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        composed: true,
      }),
    );

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(session.state).toBe("hovering");
    expect(copyButton.style.display).toBe("none");
  });

  it("keeps the target locked when clipboard write fails", async () => {
    document.body.innerHTML = "<button>Copy</button>";
    const session = createSession(document, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    session.start();
    session.lock(document.querySelector("button")!);

    await session.copy();

    expect(session.state).toBe("locked");
    expect(document.querySelector("[data-vibe-elector-root]")!.shadowRoot!.textContent).toContain("Copy failed. Try again");
  });

  it("clears a stale locked element and handles Escape as unlock then stop", async () => {
    document.body.innerHTML = "<button>Copy</button>";
    const target = document.querySelector("button")!;
    const session = createSession(document, { clipboard: { writeText: vi.fn() } });
    session.start();
    session.lock(target);
    target.remove();

    await session.copy();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(session.state).toBe("inactive");
    expect(document.querySelector("[data-vibe-elector-root]")).toBeNull();
    expect(document.body.contains(target)).toBe(false);
  });

  it("does not hit-test its own Shadow DOM and removes all UI on stop", () => {
    document.body.innerHTML = "<button>Target</button>";
    const pageTarget = document.querySelector("button")!;
    const session = createSession(document);
    session.start();
    const uiTarget = document
      .querySelector("[data-vibe-elector-root]")!
      .shadowRoot!.querySelector("#panel")!;
    setHitTarget(uiTarget);

    pointerMove(0, 0);
    click(uiTarget);

    expect(session.state).toBe("hovering");
    session.stop();

    expect(session.state).toBe("inactive");
    expect(document.querySelector("[data-vibe-elector-root]")).toBeNull();
    expect(pageTarget.getAttribute("class")).toBeNull();
  });
});
