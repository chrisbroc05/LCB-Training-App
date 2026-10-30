import assert from "node:assert/strict";
import { normalizeLeadCaptureInput } from "../lib/lead-capture-shared";

function main() {
  const parentPath = normalizeLeadCaptureInput({
    firstName: "Alex",
    email: "child@example.com",
    role: "PLAYER",
    playerAge13Plus: false,
    parentEmail: "parent@example.com",
  });
  assert.equal(parentPath.ok, true);
  if (parentPath.ok) {
    assert.equal(parentPath.value.email, "parent@example.com");
    assert.equal(parentPath.value.emailProvidedByParent, true);
  }

  const playerPath = normalizeLeadCaptureInput({
    firstName: "Sam",
    email: "sam@example.com",
    role: "PLAYER",
    playerAge13Plus: true,
  });
  assert.equal(playerPath.ok, true);
  if (playerPath.ok) {
    assert.equal(playerPath.value.emailProvidedByParent, false);
  }

  assert.equal(
    normalizeLeadCaptureInput({
      firstName: "Sam",
      email: "sam@example.com",
      role: "PLAYER",
    }).ok,
    false,
  );

  console.log("test-lead-capture-shared: all passed");
}

main();
