import assert from "node:assert/strict";
import {
  classifyPaidResourceDownload,
  PURCHASE_LINK_RECOVERY_CONFIRMATION,
  RESOURCE_DOWNLOAD_INVALID_HEADLINE,
  RESOURCE_DOWNLOAD_REFUNDED_HEADLINE,
  shouldAuthorizePaidDownloadViaTokenEmail,
} from "../lib/resource-download-access-shared";
import { createResourceDownloadToken, verifyResourceDownloadToken } from "../lib/resource-download-token";

process.env.NEXTAUTH_SECRET = "test-resource-download-gate-secret";

const samplePayload = {
  fileKey: "resources/fix-it/LCB_FixIt_Stay_Closed.pdf",
  email: "buyer@example.com",
  exp: Math.floor(Date.now() / 1000) + 3600,
  resourceSlug: "fixit-stay-closed",
};

function testValidTokenSurvivesDifferentSessionScenario() {
  const token = createResourceDownloadToken({
    fileKey: samplePayload.fileKey,
    email: samplePayload.email,
    resourceSlug: samplePayload.resourceSlug,
  });
  const payload = verifyResourceDownloadToken(token);
  assert.ok(payload);
  assert.equal(
    shouldAuthorizePaidDownloadViaTokenEmail({
      tokenEmail: payload.email,
      tokenEmailHasActivePurchase: true,
    }),
    true,
  );
}

function testRefundedPurchaseClassification() {
  assert.equal(
    classifyPaidResourceDownload({
      payload: samplePayload,
      tokenAccepted: true,
      purchaseRefunded: true,
      purchaseActive: false,
    }),
    "refunded",
  );
}

function testInvalidTokenClassification() {
  assert.equal(
    classifyPaidResourceDownload({
      payload: null,
      tokenAccepted: false,
      purchaseRefunded: false,
      purchaseActive: false,
    }),
    "invalid",
  );
}

function testFriendlyPageCopyIsAscii() {
  for (const line of [
    RESOURCE_DOWNLOAD_REFUNDED_HEADLINE,
    RESOURCE_DOWNLOAD_INVALID_HEADLINE,
    PURCHASE_LINK_RECOVERY_CONFIRMATION,
  ]) {
    assert.match(line, /^[\x20-\x7E]+$/);
  }
  assert.match(RESOURCE_DOWNLOAD_REFUNDED_HEADLINE, /refunded/i);
  assert.match(RESOURCE_DOWNLOAD_INVALID_HEADLINE, /expired/i);
}

function run() {
  testValidTokenSurvivesDifferentSessionScenario();
  testRefundedPurchaseClassification();
  testInvalidTokenClassification();
  testFriendlyPageCopyIsAscii();
  console.log("test-resource-download-gate: ok");
}

run();
