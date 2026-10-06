import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const SLIDE_COUNT = 11;
const HTML_PATH = path.join(process.cwd(), "marketing", "app-highlight-slides.html");
const OUTPUT_DIR = path.join(process.cwd(), "marketing", "social-graphics-pdf");

async function main() {
  await fs.access(HTML_PATH);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });

  try {
    await page.goto(pathToFileURL(HTML_PATH).href, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-slide]");

    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    for (let index = 1; index <= SLIDE_COUNT; index += 1) {
      const selector = `[data-slide="${String(index).padStart(2, "0")}"]`;
      const slide = page.locator(selector);
      await slide.scrollIntoViewIfNeeded();
      const outputPath = path.join(OUTPUT_DIR, `${String(index).padStart(2, "0")}.png`);
      await slide.screenshot({ path: outputPath });
      console.log(`Saved ${outputPath}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
