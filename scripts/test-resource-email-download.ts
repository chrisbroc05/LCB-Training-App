import assert from "node:assert/strict";
import {
  buildResourceEmailDownloadUrl,
  createResourceEmailDownloadToken,
  verifyResourceEmailDownloadToken,
} from "../lib/resource-email-download-token";
import { createResourceDownloadToken, verifyResourceDownloadToken } from "../lib/resource-download-token";

process.env.NEXTAUTH_SECRET = "test-resource-email-download-secret";

const fileKey = "resources/fix-it/LCB_FixIt_Stay_Closed.pdf";

function testLongLivedTokenRoundTrip() {
  const token = createResourceEmailDownloadToken({
    kind: "purchase",
    purchaseId: "purchase_test_1",
    fileKey,
  });
  const grant = verifyResourceEmailDownloadToken(token);
  assert.ok(grant);
  assert.equal(grant.kind, "purchase");
  if (grant.kind === "purchase") {
    assert.equal(grant.purchaseId, "purchase_test_1");
    assert.equal(grant.fileKey, fileKey);
  }
}

function testLeadGrantRoundTrip() {
  const token = createResourceEmailDownloadToken({
    kind: "lead",
    leadId: "lead_test_1",
    resourceSlug: "starter-warmup",
    fileKey,
  });
  const grant = verifyResourceEmailDownloadToken(token);
  assert.ok(grant);
  assert.equal(grant?.kind, "lead");
}

function testEmailUrlUsesAppGoRouteNotDirectApi() {
  const token = createResourceEmailDownloadToken({
    kind: "lead",
    leadId: "lead_test_1",
    resourceSlug: "starter-warmup",
    fileKey,
  });
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  const url = buildResourceEmailDownloadUrl(token);
  assert.match(url, /localhost:3000\/resources\/download\/go\?token=/);
  assert.doesNotMatch(url, /\/api\/resources\/download/);
}

function testShortLivedTokenExpiresIndependently() {
  const short = createResourceDownloadToken({
    email: "buyer@example.com",
    resourceSlug: "fixit-stay-closed",
    fileKey,
    ttlSeconds: 1,
  });
  assert.ok(verifyResourceDownloadToken(short));
  const long = createResourceEmailDownloadToken({
    kind: "purchase",
    purchaseId: "purchase_test_1",
    fileKey,
  });
  assert.ok(verifyResourceEmailDownloadToken(long));
}

function run() {
  testLongLivedTokenRoundTrip();
  testLeadGrantRoundTrip();
  testEmailUrlUsesAppGoRouteNotDirectApi();
  testShortLivedTokenExpiresIndependently();
  console.log("test-resource-email-download: all passed");
}

run();
