import assert from "node:assert/strict";
import {
  createMemberPdfOpenToken,
  verifyMemberPdfOpenToken,
} from "../lib/member-pdf-open-token-shared";
import { buildMemberPdfOpenHref } from "../lib/member-pdf-open-shared";

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

assert.equal(
  buildMemberPdfOpenHref({ kind: "guide", file: "LCB_PreGame_Warmup.pdf" }),
  "/api/member/pdf/open?kind=guide&file=LCB_PreGame_Warmup.pdf",
);

console.log("test-member-pdf-open-token: ok");
