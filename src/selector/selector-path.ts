const STABLE_ATTRIBUTES = ["data-testid", "data-test", "data-cy"] as const;

type QueryRoot = Document | ShadowRoot;

function escapeIdentifier(value: string): string {
  const escape = globalThis.CSS?.escape;
  return escape ? escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, "\\\\$&");
}

function escapeAttributeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function tagName(element: Element): string {
  return element.localName.toLowerCase();
}

function isUnique(root: QueryRoot, selector: string): boolean {
  try {
    return root.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function attributeSelector(element: Element, attribute: string): string | undefined {
  const value = element.getAttribute(attribute);
  return value === null || value === ""
    ? undefined
    : `${tagName(element)}[${attribute}="${escapeAttributeValue(value)}"]`;
}

function directCandidate(element: Element, root: QueryRoot): string | undefined {
  for (const attribute of STABLE_ATTRIBUTES) {
    const candidate = attributeSelector(element, attribute);
    if (candidate && isUnique(root, candidate)) return candidate;
  }

  if (element.id) {
    const candidate = `#${escapeIdentifier(element.id)}`;
    if (isUnique(root, candidate)) return candidate;
  }

  for (const attribute of ["name", "aria-label"] as const) {
    const candidate = attributeSelector(element, attribute);
    if (candidate && isUnique(root, candidate)) return candidate;
  }

  const classes = Array.from(element.classList).filter(Boolean);
  if (classes.length) {
    let candidate = tagName(element);
    for (const className of classes) {
      candidate += `.${escapeIdentifier(className)}`;
      if (isUnique(root, candidate)) return candidate;
    }
  }

  if (isUnique(root, tagName(element))) return tagName(element);

  return undefined;
}

function readablePart(element: Element): string {
  const tag = tagName(element);
  if (element.id) return `${tag}#${escapeIdentifier(element.id)}`;
  const className = Array.from(element.classList).find(Boolean);
  return className ? `${tag}.${escapeIdentifier(className)}` : tag;
}

function nthPart(element: Element): string {
  const parent = element.parentElement;
  if (!parent) return readablePart(element);
  const sameTag = Array.from(parent.children).filter(
    (child) => child.localName === element.localName,
  );
  const index = sameTag.indexOf(element) + 1;
  return `${readablePart(element)}:nth-of-type(${index})`;
}

function ancestorPath(element: Element, root: QueryRoot, positional: boolean): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current) {
    parts.unshift(positional ? nthPart(current) : readablePart(current));
    const parent: Element | null = current.parentElement;
    if (!parent) break;
    current = parent;
    if (root instanceof ShadowRoot && current === root.host) break;
    if (root instanceof Document && current === root.documentElement) {
      parts.unshift(positional ? nthPart(current) : readablePart(current));
      break;
    }
  }
  return parts.join(" > ");
}

/** Produces the shortest practical unique selector inside a single DOM root. */
export function selectorForRoot(element: Element, root: QueryRoot): string {
  const direct = directCandidate(element, root);
  if (direct) return direct;

  const readable = ancestorPath(element, root, false);
  if (isUnique(root, readable)) return readable;

  return ancestorPath(element, root, true);
}

export function buildDomPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current) {
    if (current === current.ownerDocument.documentElement || current === current.ownerDocument.body) {
      break;
    }
    parts.unshift(readablePart(current));
    const root = current.getRootNode();
    if (root instanceof ShadowRoot) {
      parts.unshift(readablePart(root.host));
      current = root.host.parentElement;
    } else {
      current = current.parentElement;
    }
  }
  return parts.join(" > ");
}

/** Builds CSS-style segments from document host through every open ShadowRoot. */
export function buildSelectorPath(element: Element): {
  selector: string;
  selectorKind: "css" | "shadow-css";
} {
  const segments: string[] = [];
  let current = element;
  let root = current.getRootNode();

  while (root instanceof ShadowRoot) {
    segments.unshift(selectorForRoot(current, root));
    current = root.host;
    root = current.getRootNode();
  }
  segments.unshift(selectorForRoot(current, root as Document));

  return {
    selector: segments.join(" >>> "),
    selectorKind: segments.length > 1 ? "shadow-css" : "css",
  };
}

export function buildXPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.localName === current.localName) index += 1;
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(`${tagName(current)}[${index}]`);
    current = current.parentElement;
  }
  return `/${parts.join("/")}`;
}
