import assert from "node:assert/strict";
import { buildQuizSessionJson } from "../lib/quiz-session-response-shared";

function main() {
  const anonymous = buildQuizSessionJson(null);
  assert.deepEqual(anonymous, { hasAccess: true, loggedIn: false });
  assert.equal(
    "firstName" in anonymous && anonymous.firstName !== undefined,
    false,
    "anonymous response must not include firstName",
  );

  const guestNoUser = buildQuizSessionJson({
    userId: null,
    firstName: "Wrong",
    role: "PLAYER",
  });
  assert.deepEqual(guestNoUser, { hasAccess: true, loggedIn: false });
  assert.equal("firstName" in guestNoUser, false);

  const loggedIn = buildQuizSessionJson({
    userId: "user-1",
    firstName: "Sam",
    role: "PLAYER",
  });
  assert.equal(loggedIn.loggedIn, true);
  if (loggedIn.loggedIn) {
    assert.equal(loggedIn.firstName, "Sam");
    assert.equal(loggedIn.role, "PLAYER");
  }

  console.log("test-quiz-session-response-shared: all passed");
}

main();
