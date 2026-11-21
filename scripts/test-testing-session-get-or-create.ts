import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  formatTestSessionDateKey,
  normalizeTestSessionDateKey,
  testSessionDateValue,
} from "../lib/testing-shared";
import {
  applyTestDatabaseUrl,
  resolveTestDatabaseIntegration,
} from "./test-db-guard";

/** Scripts may import server-only modules outside Next. */
function allowServerOnlyImports() {
  const require = createRequire(import.meta.url);
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  } as NodeModule;
}

function testNormalizeSessionDateKey() {
  const fixedNow = new Date("2026-11-21T04:30:00.000Z");
  assert.equal(normalizeTestSessionDateKey("2026-11-20"), "2026-11-20");
  assert.equal(normalizeTestSessionDateKey(" 2026-03-15 "), "2026-03-15");
  assert.equal(normalizeTestSessionDateKey("not-a-date", fixedNow), "2026-11-20");
  assert.equal(normalizeTestSessionDateKey(null, fixedNow), "2026-11-20");
  assert.equal(
    normalizeTestSessionDateKey("", new Date("2026-11-21T06:30:00.000Z")),
    "2026-11-21",
  );
}

function testSessionDateValueRoundTrip() {
  const key = "2026-11-20";
  const value = testSessionDateValue(key);
  assert.equal(value.toISOString(), "2026-11-20T12:00:00.000Z");
  assert.equal(formatTestSessionDateKey(value), key);
}

async function testConcurrentGetOrCreateReturnsSameSession() {
  const decision = resolveTestDatabaseIntegration();
  if (decision.warning) {
    console.warn(decision.warning);
  }
  if (!decision.run || !decision.databaseUrl) {
    console.log("skip integration: no safe TEST_DATABASE_URL / DATABASE_URL for writes");
    return;
  }

  applyTestDatabaseUrl(decision.databaseUrl);
  allowServerOnlyImports();
  const { getOrCreateSessionForDate } = await import("../lib/testing-server");
  const { prisma } = await import("../lib/prisma");

  const stamp = Date.now();
  const team = await prisma.testTeam.create({
    data: {
      name: `Concurrent Session Test ${stamp}`,
      teamSlug: `concurrent-session-${stamp}`,
    },
  });
  const dateKey = normalizeTestSessionDateKey("2026-11-20");

  try {
    const [first, second] = await Promise.all([
      getOrCreateSessionForDate(team.id, dateKey),
      getOrCreateSessionForDate(team.id, dateKey),
    ]);

    assert.equal(first.id, second.id);
    assert.equal(first.date, dateKey);
    assert.equal(second.date, dateKey);

    const count = await prisma.testSession.count({
      where: { teamId: team.id, date: testSessionDateValue(dateKey) },
    });
    assert.equal(count, 1);

    const individualDate = "2026-11-21";
    const [indA, indB] = await Promise.all([
      getOrCreateSessionForDate(null, individualDate),
      getOrCreateSessionForDate(null, individualDate),
    ]);
    assert.equal(indA.id, indB.id);
    assert.equal(indA.teamId, null);
    assert.equal(indB.date, individualDate);
    await prisma.testSession.deleteMany({
      where: { id: indA.id },
    });
  } finally {
    await prisma.testSession.deleteMany({ where: { teamId: team.id } });
    await prisma.testTeam.delete({ where: { id: team.id } });
    await prisma.$disconnect();
  }
}

async function main() {
  testNormalizeSessionDateKey();
  testSessionDateValueRoundTrip();
  await testConcurrentGetOrCreateReturnsSameSession();
  console.log("test-testing-session-get-or-create: all passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
