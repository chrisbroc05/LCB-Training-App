import { resolveEffectiveLevel, type AccessUserFields } from "@/lib/access-shared";
import type { DatabaseTier } from "@/lib/membership";

export const ADMIN_MEMBER_LEVEL_FILTERS = [
  "ALL",
  "FREE",
  "PLAYBOOK",
  "CORE",
  "PLUS",
  "ALL_ACCESS",
  "TWELVE_WEEK",
  "ORG_TRIAL",
] as const;

export type AdminMemberLevelFilter = (typeof ADMIN_MEMBER_LEVEL_FILTERS)[number];

export function adminMemberLevelFilterLabel(filter: AdminMemberLevelFilter) {
  switch (filter) {
    case "ALL":
      return "All levels";
    case "FREE":
      return "Free";
    case "PLAYBOOK":
      return "Playbook";
    case "CORE":
      return "Core";
    case "PLUS":
      return "Plus";
    case "ALL_ACCESS":
      return "All-Access";
    case "TWELVE_WEEK":
      return "12-Week";
    case "ORG_TRIAL":
      return "Org trial";
    default:
      return filter;
  }
}

export function memberMatchesAdminLevelFilter(
  access: AccessUserFields,
  filter: AdminMemberLevelFilter,
  now = new Date(),
) {
  if (filter === "ALL") {
    return true;
  }

  const effective = resolveEffectiveLevel(access, now);

  if (filter === "TWELVE_WEEK") {
    return access.membershipTier === "TWELVE_WEEK";
  }

  if (filter === "FREE") {
    return effective === "FREE";
  }

  if (filter === "PLAYBOOK") {
    return effective === "PLAYBOOK";
  }

  if (filter === "CORE") {
    return effective === "CORE";
  }

  if (filter === "PLUS") {
    return effective === "PLUS";
  }

  if (filter === "ALL_ACCESS") {
    return effective === "ALL_ACCESS";
  }

  if (filter === "ORG_TRIAL") {
    return effective === "ORG_TRIAL";
  }

  return true;
}

export function buildAdminMemberAccessFields(member: {
  membershipTier: DatabaseTier;
  membershipLevel: AccessUserFields["membershipLevel"];
  membershipLevelExpiresAt: string | null;
  playbookLegacyAccess: boolean;
  organizationId: string | null;
  organizationName: string | null;
  orgTrialQuickReportUsed: boolean;
  coreQuickReportNextEligibleAt: string | null;
  organization: {
    active: boolean;
    billingMode: "FAMILY_PAY" | "CLUB_PAY";
    coveredLevel: "CORE" | "PLUS" | "ALL_ACCESS" | null;
    trialStartsAt: string | null;
    trialEndsAt: string | null;
  } | null;
}): AccessUserFields {
  return {
    membershipTier: member.membershipTier,
    membershipLevel: member.membershipLevel,
    membershipLevelExpiresAt: member.membershipLevelExpiresAt,
    playbookLegacyAccess: member.playbookLegacyAccess,
    organizationId: member.organizationId,
    orgName: member.organizationName,
    orgTrialQuickReportUsed: member.orgTrialQuickReportUsed,
    coreQuickReportNextEligibleAt: member.coreQuickReportNextEligibleAt,
    orgBillingMode: member.organization?.billingMode ?? null,
    orgCoveredLevel: member.organization?.coveredLevel ?? null,
    orgTrialEndsAt: member.organization?.trialEndsAt ?? null,
    orgTrialActive: member.organization?.active ?? false,
  };
}
