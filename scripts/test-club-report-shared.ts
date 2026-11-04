import assert from "node:assert/strict";
import {
  buildClubReportLevelCounts,
  CLUB_REPORT_NO_TEAM_LABEL,
  filterClubReportMembers,
  memberSignupInstant,
  sortClubReportTeams,
} from "../lib/club-report-shared";
import { isClubReportMember } from "../lib/club-report-member-shared";

assert.equal(
  isClubReportMember({ isTestAccount: false, clubReportExcluded: false }),
  true,
);
assert.equal(
  isClubReportMember({ isTestAccount: true, clubReportExcluded: false }),
  false,
);
assert.equal(
  isClubReportMember({ isTestAccount: false, clubReportExcluded: true }),
  false,
);

const members = filterClubReportMembers([
  {
    id: "a",
    orgTeamId: null,
    signupDate: new Date("2026-01-01T12:00:00.000Z"),
    orgJoinedAt: new Date("2026-01-05T12:00:00.000Z"),
    isTestAccount: false,
    clubReportExcluded: false,
    membershipTier: "FREE",
    membershipLevel: null,
    membershipLevelExpiresAt: null,
    playbookLegacyAccess: false,
    organizationId: "org",
    orgTrialQuickReportUsed: false,
    coreQuickReportNextEligibleAt: null,
    organization: {
      active: true,
      billingMode: "FAMILY_PAY",
      coveredLevel: null,
      trialStartsAt: new Date("2026-01-01T06:00:00.000Z"),
      trialEndsAt: new Date("2026-12-01T06:00:00.000Z"),
    },
  },
  {
    id: "b",
    orgTeamId: null,
    signupDate: new Date("2026-01-01T12:00:00.000Z"),
    orgJoinedAt: null,
    isTestAccount: true,
    clubReportExcluded: false,
    membershipTier: "FREE",
    membershipLevel: null,
    membershipLevelExpiresAt: null,
    playbookLegacyAccess: false,
    organizationId: "org",
    orgTrialQuickReportUsed: false,
    coreQuickReportNextEligibleAt: null,
    organization: null,
  },
]);

assert.equal(members.length, 1);
assert.equal(memberSignupInstant(members[0]!).toISOString(), "2026-01-05T12:00:00.000Z");

const trialOnly = buildClubReportLevelCounts(members, new Date("2026-01-10T12:00:00.000Z"));
assert.equal(trialOnly.showLevelBreakdown, false);
assert.equal(trialOnly.counts.TRIAL, 1);

const sorted = sortClubReportTeams([
  {
    teamKey: "a",
    teamName: "B Team",
    signUps: 2,
    activeLast7Days: 0,
    reportsCompleted: 0,
  },
  {
    teamKey: "b",
    teamName: CLUB_REPORT_NO_TEAM_LABEL,
    signUps: 5,
    activeLast7Days: 1,
    reportsCompleted: 0,
  },
]);

assert.equal(sorted[0]?.teamName, CLUB_REPORT_NO_TEAM_LABEL);

console.log("test-club-report-shared: all passed");
