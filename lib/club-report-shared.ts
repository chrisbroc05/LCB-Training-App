import type { EffectiveAccessLevel } from "@/lib/access-shared";
import { resolveEffectiveLevel, type AccessUserFields } from "@/lib/access-shared";
import type { DatabaseTier } from "@/lib/membership";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { isClubReportMember } from "@/lib/club-report-member-shared";
import { isOrgTrialWindowActive } from "@/lib/org-shared";

export type ClubReportLevelBucket = "TRIAL" | "CORE" | "PLUS" | "ALL_ACCESS";

export type ClubReportSignupPoint = {
  dateKey: string;
  shortLabel: string;
  count: number;
};

export type ClubReportTeamRow = {
  teamKey: string;
  teamName: string;
  signUps: number;
  activeLast7Days: number;
  reportsCompleted: number;
};

export type ClubReportLevelCounts = Record<ClubReportLevelBucket, number>;

export type ClubReportPayload = {
  orgId: string;
  orgName: string;
  logoUrl: string | null;
  trialStartsLabel: string | null;
  trialEndsLabel: string | null;
  reportDateLabel: string;
  totals: {
    totalSignUps: number;
    signUpsThisWeek: number;
    activeLast7Days: number;
    swingReportsRequested: number;
    swingReportsCompleted: number;
    weeklyFocusWeeksPublished: number;
  };
  teams: ClubReportTeamRow[];
  signUpsByDay: ClubReportSignupPoint[];
  showLevelBreakdown: boolean;
  levelCounts: ClubReportLevelCounts;
};

export type ClubReportMemberInput = {
  id: string;
  orgTeamId: string | null;
  signupDate: Date;
  orgJoinedAt: Date | null;
  isTestAccount: boolean;
  clubReportExcluded: boolean;
  membershipTier: DatabaseTier | string;
  membershipLevel: MembershipLevelKey | null;
  membershipLevelExpiresAt: Date | null;
  playbookLegacyAccess: boolean;
  organizationId: string | null;
  orgTrialQuickReportUsed: boolean;
  coreQuickReportNextEligibleAt: Date | null;
  organization: {
    active: boolean;
    billingMode: "FAMILY_PAY" | "CLUB_PAY";
    coveredLevel: MembershipLevelKey | null;
    trialStartsAt: Date | null;
    trialEndsAt: Date | null;
  } | null;
};

export function resolveClubReportLevelBucket(
  effective: EffectiveAccessLevel,
): ClubReportLevelBucket | null {
  if (effective === "ORG_TRIAL") {
    return "TRIAL";
  }
  if (effective === "CORE") {
    return "CORE";
  }
  if (effective === "PLUS") {
    return "PLUS";
  }
  if (effective === "ALL_ACCESS") {
    return "ALL_ACCESS";
  }
  return null;
}

export function buildClubReportAccessFields(member: ClubReportMemberInput): AccessUserFields {
  const org = member.organization;
  const trialActive =
    Boolean(org?.active && member.organizationId) &&
    isOrgTrialWindowActive(org?.trialStartsAt ?? null, org?.trialEndsAt ?? null);

  return {
    membershipTier: member.membershipTier as DatabaseTier,
    membershipLevel: member.membershipLevel,
    membershipLevelExpiresAt: member.membershipLevelExpiresAt,
    playbookLegacyAccess: member.playbookLegacyAccess,
    organizationId: member.organizationId,
    orgName: null,
    orgLogoUrl: null,
    orgTrialLockedCopy: null,
    orgTrialEndsAt: org?.trialEndsAt ?? null,
    orgBillingMode: org?.billingMode ?? null,
    orgCoveredLevel: org?.coveredLevel ?? null,
    orgTrialActive: trialActive,
    orgTrialQuickReportUsed: member.orgTrialQuickReportUsed,
    coreQuickReportNextEligibleAt: member.coreQuickReportNextEligibleAt,
    orgTeamId: member.orgTeamId,
    orgTeamName: null,
    orgTeamActive: null,
  };
}

export function memberSignupInstant(member: ClubReportMemberInput): Date {
  return member.orgJoinedAt ?? member.signupDate;
}

export function filterClubReportMembers(members: ClubReportMemberInput[]): ClubReportMemberInput[] {
  return members.filter((member) =>
    isClubReportMember({
      isTestAccount: member.isTestAccount,
      clubReportExcluded: member.clubReportExcluded,
    }),
  );
}

export function buildClubReportLevelCounts(
  members: ClubReportMemberInput[],
  now: Date,
): { counts: ClubReportLevelCounts; showLevelBreakdown: boolean } {
  const counts: ClubReportLevelCounts = {
    TRIAL: 0,
    CORE: 0,
    PLUS: 0,
    ALL_ACCESS: 0,
  };

  for (const member of members) {
    const access = buildClubReportAccessFields(member);
    const bucket = resolveClubReportLevelBucket(resolveEffectiveLevel(access, now));
    if (bucket) {
      counts[bucket] += 1;
    }
  }

  const total = members.length;
  const showLevelBreakdown = total > 0 && counts.TRIAL < total;

  return { counts, showLevelBreakdown };
}

export function sortClubReportTeams(rows: ClubReportTeamRow[]): ClubReportTeamRow[] {
  return [...rows].sort((left, right) => {
    if (right.signUps !== left.signUps) {
      return right.signUps - left.signUps;
    }
    return left.teamName.localeCompare(right.teamName);
  });
}

export const CLUB_REPORT_NO_TEAM_KEY = "__no_team__";
export const CLUB_REPORT_NO_TEAM_LABEL = "No team yet";
