import assert from "node:assert/strict";
import { canDownloadGuideFilename } from "../lib/access-shared";
import { existsSync } from "node:fs";
import path from "node:path";
import { resolveMemberGuidePrivateFileKey } from "../lib/member-pdf-file-shared";
import {
  createMemberPdfOpenToken,
  verifyMemberPdfOpenToken,
} from "../lib/member-pdf-open-token-shared";
import {
  buildMemberPdfGoPath,
  buildMemberPdfHandoffHref,
  buildMemberPdfOpenHref,
  memberPdfHrefMustNotContainLocalhost,
} from "../lib/member-pdf-open-shared";
import { getRequestBaseUrl } from "../lib/request-base-url-shared";

const token = createMemberPdfOpenToken({
  uid: "user-1",
  kind: "guide",
  file: "LCB_PreGame_Warmup.pdf",
  download: false,
});

const payload = verifyMemberPdfOpenToken(token);
assert.ok(payload);
assert.equal(payload?.uid, "user-1");
assert.equal(payload?.kind, "guide");
assert.equal(payload?.file, "LCB_PreGame_Warmup.pdf");
assert.equal(payload?.download, false);

const handoffHref = buildMemberPdfHandoffHref({
  kind: "guide",
  file: "LCB_PreGame_Warmup.pdf",
});
assert.equal(
  handoffHref,
  "/resources/pdf/handoff?kind=guide&file=LCB_PreGame_Warmup.pdf",
);
assert.equal(buildMemberPdfOpenHref({ kind: "guide", file: "LCB_PreGame_Warmup.pdf" }), handoffHref);
assert.ok(handoffHref.startsWith("/"), "handoff href must be relative");
memberPdfHrefMustNotContainLocalhost(handoffHref);

const goPath = buildMemberPdfGoPath(token);
assert.ok(goPath.startsWith("/api/member/pdf/go?token="));
memberPdfHrefMustNotContainLocalhost(goPath);

const downloadHandoff = buildMemberPdfHandoffHref({
  kind: "guide",
  file: "LCB_PreGame_Warmup.pdf",
  download: true,
});
memberPdfHrefMustNotContainLocalhost(downloadHandoff);
assert.ok(downloadHandoff.includes("download=1"));

assert.equal(
  resolveMemberGuidePrivateFileKey("LCB_PreGame_Warmup.pdf"),
  "guides/LCB_PreGame_Warmup.pdf",
);
assert.equal(
  resolveMemberGuidePrivateFileKey("LCB_Arm_Care_4Week_Starter.pdf"),
  "resources/starters/LCB_Arm_Care_4Week_Starter.pdf",
);

const orgTrialAccess = {
  membershipTier: "FREE" as const,
  membershipLevel: null,
  membershipLevelExpiresAt: null,
  playbookLegacyAccess: false,
  organizationId: "org-trial-test",
  orgBillingMode: null,
  orgCoveredLevel: null,
  orgTrialActive: true,
  orgTrialLockedCopy: null,
  orgTrialQuickReportUsed: false,
};
assert.equal(canDownloadGuideFilename(orgTrialAccess, "LCB_PreGame_Warmup.pdf"), true);
const orgTrialGuideKey = resolveMemberGuidePrivateFileKey("LCB_PreGame_Warmup.pdf");
assert.ok(orgTrialGuideKey);
assert.equal(
  existsSync(path.join(process.cwd(), "private", orgTrialGuideKey)),
  true,
  "ORG_TRIAL warmup guide must exist on disk in repo",
);

assert.equal(
  getRequestBaseUrl(
    new Request("http://127.0.0.1:10000/api/member/pdf/open", {
      headers: {
        host: "www.lcbtraining.com",
        "x-forwarded-proto": "https",
      },
    }),
  ),
  "https://www.lcbtraining.com",
);

console.log("test-member-pdf-open-token: ok");
