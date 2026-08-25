export type UrlAccess = "web" | "file" | "unsupported";

export function getUrlAccess(url: string | undefined): UrlAccess {
  if (!url) return "unsupported";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.hostname === "addons.mozilla.org" ? "unsupported" : "web";
    }
    return parsed.protocol === "file:" ? "file" : "unsupported";
  } catch {
    return "unsupported";
  }
}
