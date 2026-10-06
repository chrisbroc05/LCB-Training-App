import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.SOCIAL_EXPORT_BASE_URL ?? "http://127.0.0.1:3002";
const EXPORT_EMAIL = process.env.SOCIAL_EXPORT_EMAIL ?? process.env.ADMIN_EMAIL;
const EXPORT_PASSWORD = process.env.SOCIAL_EXPORT_PASSWORD;
const SLIDE_PATH = "/admin/social/app-highlight";
const SLIDE_COUNT = 11;

const OUTPUT_DIRS = [
  path.join(process.cwd(), "exports", "app-highlight"),
  path.join(process.cwd(), "marketing", "social-graphics-pdf"),
];

async function waitForServer(url: string, timeoutMs = 120_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404 || response.status === 307) {
        return;
      }
    } catch {
      // keep waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function startServer(): ChildProcess {
  return spawn("npm", ["run", "start", "--", "-p", "3002"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: "3002",
    },
  });
}

async function loginIfNeeded(page: import("playwright").Page) {
  await page.goto(`${BASE_URL}${SLIDE_PATH}`, { waitUntil: "networkidle" });

  if (!page.url().includes("/auth")) {
    return;
  }

  if (!EXPORT_EMAIL || !EXPORT_PASSWORD) {
    throw new Error(
      "Admin login required. Set SOCIAL_EXPORT_EMAIL and SOCIAL_EXPORT_PASSWORD (or ADMIN_EMAIL plus password).",
    );
  }

  await page.fill('input[type="email"]', EXPORT_EMAIL);
  await page.fill('input[type="password"]', EXPORT_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).first().click();
  await page.waitForURL(`**${SLIDE_PATH}`, { timeout: 30_000 });
}

async function exportSlides() {
  for (const dir of OUTPUT_DIRS) {
    await fs.mkdir(dir, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });

  try {
    await loginIfNeeded(page);
    await page.waitForSelector("[data-slide]", { timeout: 30_000 });

    for (let index = 1; index <= SLIDE_COUNT; index += 1) {
      const selector = `[data-slide="${String(index).padStart(2, "0")}"]`;
      const slide = page.locator(selector);
      await slide.scrollIntoViewIfNeeded();

      for (const dir of OUTPUT_DIRS) {
        const outputPath = path.join(dir, `${String(index).padStart(2, "0")}.png`);
        await slide.screenshot({ path: outputPath });
        console.log(`Saved ${outputPath}`);
      }
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    await fs.access(path.join(process.cwd(), ".next", "BUILD_ID"));
  } catch {
    throw new Error("Run npm run build before npm run export:app-highlight.");
  }

  const shouldStartServer = process.env.SOCIAL_EXPORT_SKIP_SERVER !== "1";
  let server: ChildProcess | null = null;

  if (shouldStartServer) {
    server = startServer();
    await waitForServer(`${BASE_URL}/auth`);
  } else {
    await waitForServer(`${BASE_URL}${SLIDE_PATH}`);
  }

  try {
    await exportSlides();
  } finally {
    if (server) {
      server.kill("SIGTERM");
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
