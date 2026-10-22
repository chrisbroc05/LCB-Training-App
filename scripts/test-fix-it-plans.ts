import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  decodeFixItPlanAccessTokenPayload,
  encodeFixItPlanAccessTokenPayload,
} from "../lib/fix-it-plan-access-token-shared";
import { verifyFixItPlanAccessToken, createFixItPlanAccessToken } from "../lib/fix-it-plan-access-token";
import { FIX_IT_PLANS_CONTENT_HASH } from "../lib/fix-it-plans-data.generated";
import {
  FIX_IT_HUB_RESOURCE_SLUG,
  FIX_IT_PLANS,
  FIX_IT_RESOURCE_SLUGS,
  buildFixItPlanPath,
  getFixItPdfFileKey,
  isFixItResourceSlug,
  resolveFixItDrillVimeoId,
} from "../lib/fix-it-plans-shared";
import { getResourceDefinition, RESOURCES_HUB_ORDER_SLUGS } from "../lib/resources-shared";

process.env.NEXTAUTH_SECRET = "test-fix-it-plan-access-secret";

const ROOT = join(import.meta.dirname, "..");
const CONTENT_PATH = join(ROOT, "content", "fix-it-plans.md");

function testGeneratedDataMatchesMarkdown() {
  const markdown = readFileSync(CONTENT_PATH, "utf8");
  const hash = createHash("sha256").update(markdown).digest("hex");
  assert.equal(
    FIX_IT_PLANS_CONTENT_HASH,
    hash,
    "fix-it-plans-data.generated.ts is out of date. Run npm run build:fix-it-pdfs.",
  );
}

function testPlanCatalog() {
  assert.equal(FIX_IT_PLANS.length, 2);
  assert.deepEqual([...FIX_IT_RESOURCE_SLUGS], ["fixit-stay-closed", "fixit-hit-the-brakes"]);
  assert.ok(isFixItResourceSlug("fixit-stay-closed"));
  assert.equal(isFixItResourceSlug("starter-strength"), false);
  assert.equal(buildFixItPlanPath("fixit-stay-closed"), "/fix-it/fixit-stay-closed");
  assert.equal(
    getFixItPdfFileKey("fixit-stay-closed"),
    "resources/fix-it/LCB_FixIt_Stay_Closed.pdf",
  );
}

function testDrillVideoMapping() {
  assert.equal(resolveFixItDrillVimeoId("Lead Arm Flow Progression"), "1238102721");
  assert.equal(resolveFixItDrillVimeoId("Lead arm drill"), "1200422515");
  assert.equal(resolveFixItDrillVimeoId(""), null);
  assert.equal(resolveFixItDrillVimeoId("Hinge and Coil into the Back Hip"), "1238396050");
  assert.equal(resolveFixItDrillVimeoId("The Ground Provides the Power"), "1238395520");
}

function testHitTheBrakesBonusVideos() {
  const brakes = FIX_IT_PLANS.find((plan) => plan.resourceSlug === "fixit-hit-the-brakes");
  assert.ok(brakes);
  assert.equal(brakes.bonusVideos.length, 2);
  assert.equal(brakes.bonusVideos[0]?.title, "Hinge and Coil into the Back Hip");
  assert.match(brakes.bonusVideos[0]?.description ?? "", /back hip/i);
  assert.equal(brakes.bonusVideos[1]?.title, "The Ground Provides the Power");

  const stayClosed = FIX_IT_PLANS.find((plan) => plan.resourceSlug === "fixit-stay-closed");
  assert.ok(stayClosed);
  assert.equal(stayClosed.bonusVideos.length, 1);
  assert.equal(stayClosed.bonusVideos[0]?.title, "45 Degree Drill - Angled Out");
}

function testPlanAccessToken() {
  const token = createFixItPlanAccessToken({
    email: "Player@Example.com",
    resourceSlug: "fixit-stay-closed",
  });
  const payload = verifyFixItPlanAccessToken(token);
  assert.ok(payload);
  assert.equal(payload.email, "player@example.com");
  assert.equal(payload.resourceSlug, "fixit-stay-closed");

  const encoded = encodeFixItPlanAccessTokenPayload({
    email: "a@b.com",
    resourceSlug: "fixit-hit-the-brakes",
  });
  const decoded = decodeFixItPlanAccessTokenPayload(encoded);
  assert.deepEqual(decoded, {
    email: "a@b.com",
    resourceSlug: "fixit-hit-the-brakes",
  });
}

function testResourcesHubCard() {
  const hub = getResourceDefinition(FIX_IT_HUB_RESOURCE_SLUG);
  assert.ok(hub);
  assert.equal(hub.type, "LINK");
  assert.equal(hub.linkHref, "/fix-it");
  assert.equal(hub.priceDisplay, "$19 each");

  const shoulder = getResourceDefinition("fixit-stay-closed");
  assert.ok(shoulder);
  assert.equal(shoulder.stripePriceEnvVar, "STRIPE_PRICE_RES_FIXIT_SHOULDER");
  assert.equal(shoulder.hideFromResourcesHub, true);

  const orderIndex = RESOURCES_HUB_ORDER_SLUGS.indexOf(FIX_IT_HUB_RESOURCE_SLUG);
  const strengthIndex = RESOURCES_HUB_ORDER_SLUGS.indexOf("starter-strength");
  assert.ok(orderIndex > strengthIndex);
}

function testWeekTextMatchesScheduleRows() {
  execSync("python3 scripts/fix_it_week_text.py --verify", {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf8",
  });
}

function run() {
  testGeneratedDataMatchesMarkdown();
  testWeekTextMatchesScheduleRows();
  testPlanCatalog();
  testDrillVideoMapping();
  testHitTheBrakesBonusVideos();
  testPlanAccessToken();
  testResourcesHubCard();
  console.log("test-fix-it-plans: ok");
}

run();
