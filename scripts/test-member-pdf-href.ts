import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { canDownloadGuideFilename } from "../lib/access-shared";
import { resolveMemberGuidePrivateFileKey } from "../lib/member-pdf-file-shared";
import { buildMemberPdfHref } from "../lib/member-pdf-href-shared";

const openHref = buildMemberPdfHref({ kind: "guide", file: "LCB_PreGame_Warmup.pdf" });
assert.equal(openHref, "/resources/pdf?kind=guide&file=LCB_PreGame_Warmup.pdf");
assert.ok(openHref.startsWith("/resources/pdf?"));
assert.ok(!/localhost/i.test(openHref));

const downloadHref = buildMemberPdfHref({
  kind: "guide",
  file: "LCB_PreGame_Warmup.pdf",
  download: true,
});
assert.ok(downloadHref.includes("download=1"));
assert.ok(!/localhost/i.test(downloadHref));

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
const guideKey = resolveMemberGuidePrivateFileKey("LCB_PreGame_Warmup.pdf");
assert.ok(guideKey);
assert.equal(existsSync(path.join(process.cwd(), "private", guideKey)), true);

console.log("test-member-pdf-href: ok");
