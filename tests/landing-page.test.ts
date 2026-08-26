import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

async function pngDimensions(path: string): Promise<{ width: number; height: number }> {
  const image = await readFile(path);
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
}

async function topLeftPixelAlpha(path: string): Promise<number> {
  const image = await readFile(path);
  const chunks: Buffer[] = [];
  let offset = 8;
  while (offset < image.length) {
    const length = image.readUInt32BE(offset);
    const type = image.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") chunks.push(image.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const scanlines = inflateSync(Buffer.concat(chunks));
  return scanlines[4]!;
}

async function pngColorType(path: string): Promise<number> {
  const image = await readFile(path);
  return image[25]!;
}

describe("landing page assets", () => {
  it("uses a local Firefox icon for the install button", async () => {
    const page = await readFile(resolve(root, "index.html"), "utf8");

    expect(page).not.toContain("hg-edge.mozilla.org");
    expect(page).toContain('src="docs/images/firefox-logo.png"');
    await expect(access(resolve(root, "docs/images/firefox-logo.png"))).resolves.toBeUndefined();
  });

  it("does not show the browser availability message", async () => {
    const page = await readFile(resolve(root, "index.html"), "utf8");

    expect(page).not.toContain("Other browsers are still in the works.");
    expect(page).not.toContain("其他浏览器还在开发。");
  });

  it("shows a disabled Chrome coming-soon button with a local icon", async () => {
    const page = await readFile(resolve(root, "index.html"), "utf8");

    expect(page).toContain('<span class="install install-disabled" aria-disabled="true">');
    expect(page).toContain('src="docs/images/chrome-logo.png"');
    expect(page).toContain("Chrome 建设中");
    await expect(access(resolve(root, "docs/images/chrome-logo.png"))).resolves.toBeUndefined();
    await expect(pngDimensions(resolve(root, "docs/images/chrome-logo.png"))).resolves.toEqual({
      width: 256,
      height: 256,
    });
    await expect(pngColorType(resolve(root, "docs/images/chrome-logo.png"))).resolves.toBe(6);
    await expect(topLeftPixelAlpha(resolve(root, "docs/images/chrome-logo.png"))).resolves.toBe(0);
  });
});
