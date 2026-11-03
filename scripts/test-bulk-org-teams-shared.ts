import assert from "node:assert/strict";
import {
  formatBulkOrgTeamResultSummary,
  parseBulkOrgTeamNameLines,
  planBulkOrgTeamUpserts,
} from "../lib/bulk-org-teams-shared";

assert.deepEqual(parseBulkOrgTeamNameLines("  Alpha \n\nBeta\nalpha\n  "), ["Alpha", "Beta"]);

const plan = planBulkOrgTeamUpserts(
  ["Varsity", "new team", "jv", "Freshman"],
  [
    { id: "1", name: "Varsity", sortOrder: 1, active: true },
    { id: "2", name: "JV", sortOrder: 2, active: false },
  ],
);

assert.equal(plan.added, 2);
assert.equal(plan.reactivated, 1);
assert.equal(plan.skipped, 1);
assert.deepEqual(
  plan.actions.map((action) => action.kind),
  ["skip", "create", "reactivate", "create"],
);

const reactivate = plan.actions.find((action) => action.kind === "reactivate");
assert.ok(reactivate && reactivate.kind === "reactivate");
assert.equal(reactivate.sortOrder, 4);
assert.equal(reactivate.teamId, "2");
assert.equal(reactivate.name, "jv");

const creates = plan.actions.filter((action) => action.kind === "create");
assert.equal(creates[0]?.sortOrder, 3);
assert.equal(creates[1]?.sortOrder, 5);

assert.equal(
  formatBulkOrgTeamResultSummary({ added: 2, reactivated: 1, skipped: 1 }),
  "Added 2, reactivated 1, skipped 1 (already active)",
);

console.log("test-bulk-org-teams-shared: all passed");
