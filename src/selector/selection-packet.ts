import {
  buildDomPath,
  buildSelectorPath,
  buildXPath,
} from "./selector-path";
import type { PageContext, SelectionPacket } from "./types";

const SAFE_ATTRIBUTES = new Set([
  "id",
  "class",
  "data-testid",
  "data-test",
  "data-cy",
  "name",
  "type",
  "role",
  "placeholder",
  "href",
  "src",
  "alt",
  "title",
]);

function normalizedText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function semanticText(element: Element): string {
  const aria = element.getAttribute("aria-label");
  if (aria) return normalizedText(aria);
  if (element instanceof HTMLImageElement && element.alt) return normalizedText(element.alt);
  if (element.getAttribute("title")) return normalizedText(element.getAttribute("title"));
  const directText = Array.from(element.childNodes)
    .filter((node): node is Text => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.data)
    .join(" ");
  return normalizedText(directText || element.textContent);
}

function htmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function signature(element: Element, text: string): string {
  const attributes = Array.from(element.attributes)
    .filter((attribute) => {
      const name = attribute.name.toLowerCase();
      return SAFE_ATTRIBUTES.has(name) || name.startsWith("aria-");
    })
    .map((attribute) => ` ${attribute.name}="${htmlEscape(attribute.value)}"`)
    .join("");
  const tag = element.localName.toLowerCase();
  const isFormControl = /^(input|textarea|select)$/i.test(tag);
  const safeText = element.getAttribute("type")?.toLowerCase() === "password" ? "" : text;
  return isFormControl || !safeText
    ? `<${tag}${attributes}>`
    : `<${tag}${attributes}>${htmlEscape(safeText)}</${tag}>`;
}

function roundRect(element: Element) {
  const rect = element.getBoundingClientRect();
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

/** Creates the privacy-filtered, human-readable packet copied to an agent chat. */
export function buildSelectionPacket(
  element: Element,
  pageContext: PageContext,
): SelectionPacket {
  const { selector, selectorKind } = buildSelectorPath(element);
  const text = semanticText(element);
  const target: SelectionPacket["target"] = {
    summary: `${element.localName.toLowerCase()}${text ? ` "${text}"` : ""}`,
    selector,
    selectorKind,
    domPath: buildDomPath(element),
    rect: roundRect(element),
    htmlSignature: signature(element, text),
  };

  if (selectorKind === "css" && selector.includes(":nth-of-type(")) {
    target.xpath = buildXPath(element);
  }

  return { version: "Vibe Selector v1", page: pageContext, target };
}

/** Formats packet fields in the stable clipboard protocol order. */
export function formatSelectionPacket(packet: SelectionPacket): string {
  const { page, target } = packet;
  const lines = [
    `[${packet.version}]`,
    `URL: ${page.url}`,
    `Title: ${page.title}`,
    `Target: ${target.summary}`,
    `Selector: ${target.selector}`,
    `Path: ${target.domPath}`,
    `Rect: x=${target.rect.x}, y=${target.rect.y}, width=${target.rect.width}, height=${target.rect.height}`,
    `HTML: ${target.htmlSignature}`,
  ];
  if (target.xpath) lines.push(`XPath: ${target.xpath}`);
  if (target.contextHints?.length) lines.push(`Context: ${target.contextHints.join("; ")}`);
  return lines.join("\n");
}
