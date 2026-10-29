import assert from "node:assert/strict";
import { createOrFindOnUniqueViolation } from "../lib/prisma-get-or-create-shared";

async function testReturnsCreateResult() {
  const value = await createOrFindOnUniqueViolation(
    async () => "created",
    async () => null,
  );
  assert.equal(value, "created");
}

async function testFallsBackOnP2002() {
  const value = await createOrFindOnUniqueViolation(
    async () => {
      const error = new Error("unique") as Error & { code: string };
      error.code = "P2002";
      throw error;
    },
    async () => "existing",
  );
  assert.equal(value, "existing");
}

async function main() {
  await testReturnsCreateResult();
  await testFallsBackOnP2002();
  console.log("test-prisma-get-or-create: all passed");
}

main();
