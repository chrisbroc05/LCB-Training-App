/**
 * Manual Bing IndexNow ping for public URLs.
 * Not wired into Render startup. Run with:
 *   INDEXNOW_FORCE=1 npm run seo:indexnow
 */
import { buildIndexNowPayload } from "../lib/indexnow-shared";

async function main() {
  if (process.env.INDEXNOW_DISABLED === "1") {
    console.log("IndexNow skipped (INDEXNOW_DISABLED=1).");
    return;
  }

  if (process.env.INDEXNOW_FORCE !== "1" && process.env.RENDER !== "true") {
    console.log("IndexNow skipped (set INDEXNOW_FORCE=1 to run).");
    return;
  }

  const payload = await buildIndexNowPayload();
  console.log(`Pinging IndexNow with ${payload.urlList.length} URLs...`);

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`IndexNow failed (${response.status}): ${body.slice(0, 300)}`);
  }

  console.log(`IndexNow ok (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
