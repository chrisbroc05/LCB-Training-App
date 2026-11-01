import assert from "node:assert/strict";
import {
  SIGNUP_EMAIL_EXISTS_API_MESSAGE,
  SIGNUP_EMAIL_EXISTS_FRIENDLY_MESSAGE,
  buildPostAuthRedirectQueryString,
  isSignupEmailAlreadyExistsError,
} from "../lib/signup-auth-shared";

assert.equal(isSignupEmailAlreadyExistsError(SIGNUP_EMAIL_EXISTS_API_MESSAGE), true);
assert.equal(
  isSignupEmailAlreadyExistsError(SIGNUP_EMAIL_EXISTS_FRIENDLY_MESSAGE),
  false,
);

const orgJoinQuery = buildPostAuthRedirectQueryString({
  redirectParam: null,
  callbackUrlParam: null,
  orgCodeFromQuery: "TESTCENTRAL",
});
assert.match(orgJoinQuery, /redirect=%2Fjoin%2FTESTCENTRAL%2Fwelcome/);

const explicitRedirect = buildPostAuthRedirectQueryString({
  redirectParam: "/join/TESTNWT/welcome",
  callbackUrlParam: "/join/TESTNWT",
  orgCodeFromQuery: "TESTNWT",
});
assert.match(explicitRedirect, /redirect=%2Fjoin%2FTESTNWT%2Fwelcome/);
assert.match(explicitRedirect, /callbackUrl=%2Fjoin%2FTESTNWT/);

console.log("test-signup-auth-shared: ok");
