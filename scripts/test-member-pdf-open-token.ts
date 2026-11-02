import assert from "node:assert/strict";
import {
  createMemberPdfOpenToken,
  verifyMemberPdfOpenToken,
} from "../lib/member-pdf-open-token-shared";
import {
  buildMemberPdfInlineRedirectPath,
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

const openHref = buildMemberPdfOpenHref({ kind: "guide", file: "LCB_PreGame_Warmup.pdf" });
assert.equal(openHref, "/api/member/pdf/open?kind=guide&file=LCB_PreGame_Warmup.pdf");
assert.ok(openHref.startsWith("/"), "open href must be relative");
memberPdfHrefMustNotContainLocalhost(openHref);

const inlineRedirect = buildMemberPdfInlineRedirectPath(token);
assert.ok(inlineRedirect.startsWith("/api/member/pdf/inline?token="));
memberPdfHrefMustNotContainLocalhost(inlineRedirect);

const downloadHref = buildMemberPdfOpenHref({
  kind: "guide",
  file: "LCB_PreGame_Warmup.pdf",
  download: true,
});
memberPdfHrefMustNotContainLocalhost(downloadHref);

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
assert.ok(
  !/localhost/i.test(
    getRequestBaseUrl(
      new Request("http://127.0.0.1:10000/api/member/pdf/open", {
        headers: { host: "www.lcbtraining.com", "x-forwarded-proto": "https" },
      }),
    ),
  ),
);

console.log("test-member-pdf-open-token: ok");
