import assert from "node:assert/strict";
import { formatOrgTeamPickNudgeSkipReason } from "../lib/org-team-pick-nudge-shared";
import {
  formatOrgMemberNoTeamStatus,
  ORG_TEAM_NOT_LISTED_VALUE,
  userNeedsOrgTeamPick,
} from "../lib/org-team-pick-shared";

assert.equal(
  userNeedsOrgTeamPick({
    organizationId: "org-1",
    orgTeamId: null,
    orgTeamNotListedAt: null,
    activeTeamCount: 2,
  }),
  true,
);

assert.equal(
  userNeedsOrgTeamPick({
    organizationId: "org-1",
    orgTeamId: "team-1",
    orgTeamNotListedAt: null,
    activeTeamCount: 2,
  }),
  false,
);

assert.equal(
  userNeedsOrgTeamPick({
    organizationId: "org-1",
    orgTeamId: null,
    orgTeamNotListedAt: new Date(),
    activeTeamCount: 2,
  }),
  false,
);

assert.equal(
  userNeedsOrgTeamPick({
    organizationId: "org-1",
    orgTeamId: null,
    orgTeamNotListedAt: null,
    activeTeamCount: 0,
  }),
  false,
);

assert.equal(formatOrgMemberNoTeamStatus({ orgTeamId: "t1" }), "has_team");
assert.equal(
  formatOrgMemberNoTeamStatus({ orgTeamId: null, orgTeamNotListedAt: new Date() }),
  "not_listed",
);
assert.equal(formatOrgMemberNoTeamStatus({ orgTeamId: null }), "not_picked");
assert.equal(ORG_TEAM_NOT_LISTED_VALUE, "__not_listed__");
assert.equal(formatOrgTeamPickNudgeSkipReason("already_nudged"), "Already nudged");
assert.equal(formatOrgTeamPickNudgeSkipReason("not_listed"), "Team not listed");
assert.equal(formatOrgTeamPickNudgeSkipReason("test_account"), "Test account");
assert.equal(formatOrgTeamPickNudgeSkipReason("no_contact"), "No push and no email");

console.log("test-org-team-pick-shared: ok");
