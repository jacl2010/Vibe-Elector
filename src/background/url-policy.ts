export type UrlAccess = "web" | "file" | "unsupported";

const RESTRICTED_HOSTS = new Set([
  "addons.mozilla.org",
  "chrome.google.com",
  "chromewebstore.google.com",
]);

export function getUrlAccess(url: string | undefined): UrlAccess {
  if (!url) return "unsupported";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return RESTRICTED_HOSTS.has(parsed.hostname) ? "unsupported" : "web";
    }
    return parsed.protocol === "file:" ? "file" : "unsupported";
  } catch {
    return "unsupported";
  }
}
