import assert from "node:assert/strict";
import { isTestAccountEmail } from "../lib/test-account-shared";

assert.equal(isTestAccountEmail("player+test@example.com"), true);
assert.equal(isTestAccountEmail("joinflow1730310000@example.com"), true);
assert.equal(isTestAccountEmail("joinflow@example.com"), true);
assert.equal(isTestAccountEmail("real.user@gmail.com"), false);

console.log("test-test-account-shared: ok");
