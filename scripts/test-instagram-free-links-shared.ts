import assert from "node:assert/strict";
import {
  getInstagramFreeLink,
  INSTAGRAM_FREE_LINKS,
} from "../lib/instagram-free-links-shared";
import { PUBLIC_PDF_FREE_LANDING_REDIRECTS } from "../lib/public-pdf-redirects-shared";
import { getResourceDefinition } from "../lib/resources-shared";
import { RECRUITING_GUIDE_LOCK_HREF, RECRUITING_GUIDE_LOCK_LABEL } from "../lib/recruiting-guide-lock-copy-shared";

assert.equal(INSTAGRAM_FREE_LINKS.rotate.path, "/free/rotate");
assert.equal(INSTAGRAM_FREE_LINKS.rotate.leadSource, "ig-rotate");
assert.equal(INSTAGRAM_FREE_LINKS.mobility.path, "/free/mobility");
assert.equal(INSTAGRAM_FREE_LINKS.mobility.leadSource, "ig-mobility");

for (const link of Object.values(INSTAGRAM_FREE_LINKS)) {
  const resource = getResourceDefinition(link.resourceSlug);
  assert.ok(resource, link.resourceSlug);
  assert.equal(resource?.type, "FREE_DOWNLOAD");
  assert.equal(getInstagramFreeLink(link.keyword)?.resourceSlug, link.resourceSlug);
}

assert.ok(
  PUBLIC_PDF_FREE_LANDING_REDIRECTS.some(
    (row) => row.source.toLowerCase().includes("rotational") && row.destination === "/free/rotate",
  ),
);
assert.ok(
  PUBLIC_PDF_FREE_LANDING_REDIRECTS.some(
    (row) => row.source.toLowerCase().includes("mobility") && row.destination === "/free/mobility",
  ),
);

assert.equal(RECRUITING_GUIDE_LOCK_LABEL, "Included with All-Access or the 12-Week Program");
assert.equal(RECRUITING_GUIDE_LOCK_HREF, "/program");

console.log("test-instagram-free-links-shared: ok");
