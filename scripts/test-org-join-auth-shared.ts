import assert from "node:assert/strict";
import {
  buildOrgJoinAuthSignupHref,
  buildOrgJoinWelcomePath,
  parseOrgJoinRedirectPath,
  resolveOrgJoinPostAuthPath,
} from "../lib/org-join-auth-shared";

assert.equal(buildOrgJoinWelcomePath("TESTNWT"), "/join/TESTNWT/welcome");

const signupHref = buildOrgJoinAuthSignupHref("TESTNWT");
assert.match(signupHref, /mode=signup/);
assert.match(signupHref, /orgCode=TESTNWT/);
assert.match(signupHref, /redirect=%2Fjoin%2FTESTNWT%2Fwelcome/);

assert.equal(parseOrgJoinRedirectPath("/join/TESTNWT"), "TESTNWT");
assert.equal(parseOrgJoinRedirectPath("/join/TESTNWT/welcome"), "TESTNWT");

assert.equal(
  resolveOrgJoinPostAuthPath({
    redirectPath: "/join/TESTNWT",
    orgCodeFromQuery: null,
    userAlreadyJoinedOrg: true,
  }),
  "/join/TESTNWT/welcome",
);

assert.equal(
  resolveOrgJoinPostAuthPath({
    redirectPath: "/join/TESTNWT",
    orgCodeFromQuery: null,
    userAlreadyJoinedOrg: false,
  }),
  "/join/TESTNWT",
);

console.log("test-org-join-auth-shared: ok");
