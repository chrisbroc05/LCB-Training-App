import assert from "node:assert/strict";
import {
  decodeResourceDownloadTokenPayload,
  encodeResourceDownloadTokenPayload,
} from "../lib/resource-download-token-shared";
import { verifyResourceDownloadToken, createResourceDownloadToken } from "../lib/resource-download-token";
import { formatLeadResourceCheckoutStatus } from "../lib/lead-checkout-status-shared";
import {
  getResourceDefinition,
  getResourcesBySection,
  getPaidDownloadResourceSlugs,
} from "../lib/resources-shared";
import { getResourceLeadSubmitLabel } from "../lib/resources-lead-shared";
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

  const startHere = getResourcesBySection("START_HERE");
  const slugs = startHere.map((item) => item.slug);
  assert.ok(slugs.indexOf("parent-guide") < slugs.indexOf("nutrition-guide"));
  assert.ok(slugs.indexOf("nutrition-guide") < slugs.indexOf("starter-arm-care"));
  assert.ok(slugs.indexOf("starter-arm-care") < slugs.indexOf("rotational-sample"));

  const paidSlugs = getPaidDownloadResourceSlugs();
  assert.ok(paidSlugs.includes("starter-bundle"));
  assert.ok(!paidSlugs.includes("nutrition-guide"));
  assert.equal(getResourceDefinition("starter-bundle")?.stripePriceEnvVar, "STRIPE_PRICE_RES_STARTER_BUNDLE");

  const backArm = getResourceDefinition("starter-back-arm");
  assert.ok(backArm);
  assert.equal(backArm.section, "PROGRAMS_AND_GUIDES");
  assert.equal(backArm.stripePriceEnvVar, "STRIPE_PRICE_RES_BACK_ARM");
  assert.deepEqual(backArm.downloadFileKeys, [
    "resources/starters/LCB_Back_and_Arm_4Week_Starter.pdf",
  ]);

  const armCare = getResourceDefinition("starter-arm-care");
  assert.ok(armCare);
  assert.equal(armCare.tag, "FREE");
  assert.equal(armCare.type, "FREE_DOWNLOAD");
  assert.equal(armCare.section, "START_HERE");
  assert.ok(!paidSlugs.includes("starter-arm-care"));
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

function run() {
  testNormalizeLeadEmail();
  testResourceDownloadTokenRoundTrip();
  testResourceDownloadTokenTamper();
  testResourceCatalog();
  testCheckoutStartedStatus();
  testSubmitLabels();
  console.log("test:resources passed");
}

run();
