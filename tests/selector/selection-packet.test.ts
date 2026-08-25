import { describe, expect, it } from "vitest";

import {
  buildSelectionPacket,
  formatSelectionPacket,
} from "../../src/selector/selection-packet";

function pageContext() {
  return {
    url: "http://localhost:3000/checkout",
    title: "Checkout",
    viewport: { width: 1440, height: 900 },
    scroll: { x: 0, y: 120 },
  };
}

describe("buildSelectionPacket", () => {
  it("uses a unique test id as the shortest selector and formats fixed fields", () => {
    document.body.innerHTML =
      '<main><button data-testid="submit-order" type="submit">提交订单</button></main>';
    const button = document.querySelector("button")!;
    Object.defineProperty(button, "getBoundingClientRect", {
      value: () => ({ x: 1080.4, y: 720.6, width: 127.6, height: 40.2 }),
    });

    const packet = buildSelectionPacket(button, pageContext());

    expect(packet.target).toMatchObject({
      summary: 'button "提交订单"',
      selector: 'button[data-testid="submit-order"]',
      selectorKind: "css",
      domPath: "main > button",
      rect: { x: 1080, y: 721, width: 128, height: 40 },
      htmlSignature:
        '<button data-testid="submit-order" type="submit">提交订单</button>',
    });
    expect(formatSelectionPacket(packet)).toBe(
      [
        "[Vibe Elector v1]",
        "URL: http://localhost:3000/checkout",
        "Title: Checkout",
        'Target: button "提交订单"',
        'Selector: button[data-testid="submit-order"]',
        "Path: main > button",
        "Rect: x=1080, y=721, width=128, height=40",
        "HTML: <button data-testid=\"submit-order\" type=\"submit\">提交订单</button>",
      ].join("\n"),
    );
  });

  it("adds an ancestor path before falling back to positional CSS and XPath", () => {
    document.body.innerHTML = `
      <section class="catalog"><button class="buy">Buy</button></section>
      <section class="catalog"><button class="buy">Buy</button><button class="buy">Buy</button></section>`;
    const target = document.querySelectorAll("button")[2]!;

    const packet = buildSelectionPacket(target, pageContext());

    expect(packet.target.selector).toContain("section.catalog");
    expect(packet.target.selector).toContain(":nth-of-type(2)");
    expect(packet.target.xpath).toBeDefined();
  });

  it("creates a segmented selector for an open shadow root and omits XPath", () => {
    const host = document.createElement("user-card");
    document.body.append(host);
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = '<button data-testid="edit">Edit</button>';
    const target = shadow.querySelector("button")!;

    const packet = buildSelectionPacket(target, pageContext());

    expect(packet.target.selector).toBe(
      'user-card >>> button[data-testid="edit"]',
    );
    expect(packet.target.selectorKind).toBe("shadow-css");
    expect(packet.target.xpath).toBeUndefined();
  });

  it("does not include live form values or sensitive attributes in a signature", () => {
    document.body.innerHTML =
      '<input aria-label="Password" type="password" value="super-secret" nonce="token" style="color:red" onclick="steal()" srcdoc="bad">';
    const input = document.querySelector("input")!;

    const packet = buildSelectionPacket(input, pageContext());

    expect(packet.target.summary).toBe('input "Password"');
    expect(packet.target.selector).not.toContain("value");
    expect(packet.target.htmlSignature).not.toContain("super-secret");
    expect(packet.target.htmlSignature).not.toContain("nonce");
    expect(packet.target.htmlSignature).not.toContain("style");
    expect(packet.target.htmlSignature).not.toContain("onclick");
    expect(packet.target.htmlSignature).not.toContain("srcdoc");
  });
});
