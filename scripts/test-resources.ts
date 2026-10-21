import assert from "node:assert/strict";
import {
  decodeResourceDownloadTokenPayload,
  encodeResourceDownloadTokenPayload,
} from "../lib/resource-download-token-shared";
import { verifyResourceDownloadToken, createResourceDownloadToken } from "../lib/resource-download-token";
import { formatLeadResourceCheckoutStatus } from "../lib/lead-checkout-status-shared";
import {
  DIGITAL_PRODUCT_SALES_FINAL_NOTICE,
  getResourceDefinition,
  getResourcesForHub,
  getPaidDownloadResourceSlugs,
  RESOURCES_HUB_ORDER_SLUGS,
} from "../lib/resources-shared";
import {
  buildPlaybookLinkUrl,
  buildProgramLinkUrl,
  getResourceLeadSubmitLabel,
} from "../lib/resources-lead-shared";
import { normalizeLeadEmail } from "../lib/leads-shared";

process.env.NEXTAUTH_SECRET = "test-resource-download-secret";

function testNormalizeLeadEmail() {
  assert.equal(normalizeLeadEmail("  Test@Example.COM "), "test@example.com");
}

function testResourceDownloadTokenRoundTrip() {
  const token = createResourceDownloadToken({
    email: "player@example.com",
    resourceSlug: "pregame-warmup",
    fileKey: "guides/LCB_PreGame_Warmup.pdf",
    ttlSeconds: 3600,
  });
  const payload = verifyResourceDownloadToken(token);
  assert.ok(payload);
  assert.equal(payload.email, "player@example.com");
  assert.equal(payload.resourceSlug, "pregame-warmup");
}

function testResourceDownloadTokenTamper() {
  const encoded = encodeResourceDownloadTokenPayload({
    fileKey: "guides/LCB_PreGame_Warmup.pdf",
    email: "a@b.com",
    exp: Math.floor(Date.now() / 1000) + 3600,
    resourceSlug: "pregame-warmup",
  });
  const bad = `${encoded}.bad-signature`;
  assert.equal(verifyResourceDownloadToken(bad), null);
  assert.equal(decodeResourceDownloadTokenPayload("not-valid"), null);
}

function testResourceCatalog() {
  const nutrition = getResourceDefinition("nutrition-guide");
  assert.ok(nutrition);
  assert.equal(nutrition.tag, "FREE");
  assert.equal(nutrition.type, "FREE_DOWNLOAD");

  const paidSlugs = getPaidDownloadResourceSlugs();
  assert.ok(paidSlugs.includes("starter-bundle"));
  assert.ok(paidSlugs.includes("fixit-stay-closed"));
  assert.ok(paidSlugs.includes("fixit-hit-the-brakes"));
  assert.ok(!paidSlugs.includes("fix-it-hitting-plans"));
  assert.equal(getResourceDefinition("fixit-stay-closed")?.stripePriceEnvVar, "STRIPE_PRICE_RES_FIXIT_SHOULDER");
  assert.equal(getResourceDefinition("fixit-hit-the-brakes")?.stripePriceEnvVar, "STRIPE_PRICE_RES_FIXIT_BRAKES");
  assert.ok(!paidSlugs.includes("nutrition-guide"));
  assert.equal(getResourceDefinition("starter-bundle")?.stripePriceEnvVar, "STRIPE_PRICE_RES_STARTER_BUNDLE");

  const backArm = getResourceDefinition("starter-back-arm");
  assert.ok(backArm);
  assert.equal(backArm.priceDisplay, "$10");

  const armCare = getResourceDefinition("starter-arm-care");
  assert.ok(armCare);
  assert.equal(armCare.tag, "FREE");
  assert.equal(armCare.type, "FREE_DOWNLOAD");
  assert.ok(!paidSlugs.includes("starter-arm-care"));

  const twelveWeek = getResourceDefinition("twelve-week-program");
  assert.ok(twelveWeek);
  assert.equal(twelveWeek.badge, "COACH'S PICK");
  assert.equal(twelveWeek.priceDisplay, undefined);

  const swing = getResourceDefinition("free-swing-analysis");
  assert.equal(swing?.badge, "START HERE");
}

function testResourcesHubOrder() {
  const expected = [
    "free-swing-analysis",
    "twelve-week-program",
    "player-iq-quiz",
    "starter-arm-care",
    "starter-strength",
    "fix-it-hitting-plans",
    "pregame-warmup",
    "starter-bundle",
    "parent-guide",
    "next-level-playbook",
    "starter-speed",
    "nutrition-guide",
    "starter-back-arm",
    "starter-mobility",
    "recruiting-guide",
    "rotational-sample",
    "mental-game-workbook",
    "lessons-program-bundle",
    "remote-session",
  ];
  assert.deepEqual(RESOURCES_HUB_ORDER_SLUGS, expected);
  assert.equal(getResourcesForHub().length, expected.length);
  assert.ok(!RESOURCES_HUB_ORDER_SLUGS.includes("book-a-call"));
}

function testCoachingLinkUrls() {
  const programUrl = buildProgramLinkUrl({ email: "Kid@Example.com", firstName: "Alex" });
  assert.ok(programUrl.startsWith("/program?"));
  assert.ok(programUrl.includes("email=kid%40example.com"));
  assert.ok(programUrl.includes("firstName=Alex"));
  assert.ok(!programUrl.includes("startCheckout"));

  const playbookUrl = buildPlaybookLinkUrl({ email: "a@b.com", firstName: "Sam" });
  assert.ok(playbookUrl.startsWith("/playbook?"));
  assert.ok(!playbookUrl.includes("startCheckout"));
}

function testCheckoutStartedStatus() {
  const now = new Date("2026-01-10T12:00:00Z");
  const status = formatLeadResourceCheckoutStatus({
    resourceSlug: "starter-strength",
    checkoutStartedAt: null,
    resourceCreatedAt: "2026-01-08T12:00:00Z",
    purchasedResourceSlugs: new Set(),
    now,
  });
  assert.equal(status, "Checkout started");

  const purchased = formatLeadResourceCheckoutStatus({
    resourceSlug: "starter-strength",
    checkoutStartedAt: "2026-01-09T12:00:00Z",
    resourceCreatedAt: "2026-01-09T12:00:00Z",
    purchasedResourceSlugs: new Set(["starter-strength"]),
    now,
  });
  assert.equal(purchased, "Purchased");
}

function testSubmitLabels() {
  const paid = getResourceDefinition("starter-strength");
  assert.ok(paid);
  assert.equal(getResourceLeadSubmitLabel(paid), "Continue to Checkout");
}

function testDigitalProductSalesFinalNotice() {
  assert.match(DIGITAL_PRODUCT_SALES_FINAL_NOTICE, /^[\x20-\x7E]+$/);
  assert.equal(DIGITAL_PRODUCT_SALES_FINAL_NOTICE, "Digital product. All sales are final.");
}

function run() {
  testNormalizeLeadEmail();
  testResourceDownloadTokenRoundTrip();
  testResourceDownloadTokenTamper();
  testResourceCatalog();
  testResourcesHubOrder();
  testCoachingLinkUrls();
  testCheckoutStartedStatus();
  testSubmitLabels();
  testDigitalProductSalesFinalNotice();
  console.log("test:resources passed");
}

run();
