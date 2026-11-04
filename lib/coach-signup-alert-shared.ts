import { formatDate, formatWeekdayDateTime } from "@/lib/format-date";
import { isUnder13PlayerAge } from "@/lib/legal-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { formatMembershipLevelLabel, isMembershipLevelKey } from "@/lib/membership-levels-shared";
import type { DatabaseTier } from "@/lib/membership";
import { getResourceDefinition } from "@/lib/resources-shared";
import { buildAdminMemberUrl } from "@/lib/admin-routes-shared";
import { isOrgTrialWindowActive } from "@/lib/org-shared";

export type CoachSignupAlertMode = "INSTANT" | "DAILY" | "OFF";

export type CoachSignupAlertSnapshot = {
  userId: string;
  playerFirstName: string;
  playerLastName: string;
  playerAge: number | null;
  accountRole: "PLAYER" | "PARENT";
  accountEmail: string;
  accountHolderName: string | null;
  parentConsentName: string | null;
  parentConsentEmail: string | null;
  parentConsentConfirmedAt: Date | null;
  organizationId: string | null;
  organizationName: string | null;
  orgTrialEndsAt: Date | null;
  orgTrialActive: boolean;
  orgTeamName: string | null;
  pendingCheckoutLevel: MembershipLevelKey | null;
  signupSource: string | null;
  membershipTier: DatabaseTier;
  leadSource: string | null;
  leadFirstResourceSlug: string | null;
  signedUpAt: Date;
  isTestAccount: boolean;
};

export function coachSignupPlayerDisplayName(snapshot: CoachSignupAlertSnapshot) {
  const first = snapshot.playerFirstName.trim();
  const last = snapshot.playerLastName.trim();
  const combined = `${first} ${last}`.trim();
  return combined || snapshot.accountEmail;
}

export function formatCoachSignupLeadSourceLabel(params: {
  leadSource: string | null;
  leadFirstResourceSlug: string | null;
}) {
  const slug = params.leadFirstResourceSlug?.trim();
  if (slug) {
    const resource = getResourceDefinition(slug);
    if (resource?.slug === "player-iq-quiz") {
      return "quiz";
    }
    if (resource?.slug === "fix-it-hitting-plans" || slug.includes("fix-it")) {
      return "Fix-It";
    }
    if (resource?.slug === "free-swing-analysis") {
      return "free swing analysis";
    }
    if (resource?.title) {
      return resource.title;
    }
  }

  const source = params.leadSource?.trim().toLowerCase() ?? "";
  if (source === "quiz") {
    return "quiz";
  }
  if (source === "fix-it" || source === "fixit") {
    return "Fix-It";
  }
  if (source.includes("swing")) {
    return "free swing analysis";
  }
  if (source === "resources" || source.length > 0) {
    return "resources";
  }

  return null;
}

export function formatCoachSignupSourceLine(snapshot: CoachSignupAlertSnapshot) {
  if (snapshot.organizationId && snapshot.organizationName) {
    return `Club: ${snapshot.organizationName}`;
  }

  const leadLabel = formatCoachSignupLeadSourceLabel({
    leadSource: snapshot.leadSource,
    leadFirstResourceSlug: snapshot.leadFirstResourceSlug,
  });
  if (leadLabel) {
    return `Lead from: ${leadLabel}`;
  }

  return "Free account";
}

export function formatCoachSignupSubjectSource(snapshot: CoachSignupAlertSnapshot) {
  if (snapshot.organizationName) {
    return snapshot.organizationName;
  }
  if (formatCoachSignupLeadSourceLabel({
    leadSource: snapshot.leadSource,
    leadFirstResourceSlug: snapshot.leadFirstResourceSlug,
  })) {
    return "Lead";
  }
  return "Free account";
}

export function formatCoachSignupAccessLabel(snapshot: CoachSignupAlertSnapshot) {
  if (snapshot.pendingCheckoutLevel) {
    return formatMembershipLevelLabel(snapshot.pendingCheckoutLevel);
  }

  const source = snapshot.signupSource?.trim().toLowerCase() ?? "";
  if (source === "program" || snapshot.membershipTier === "TWELVE_WEEK") {
    return "12-Week";
  }
  if (source === "playbook" || snapshot.membershipTier === "BASIC") {
    return "Playbook";
  }

  if (snapshot.orgTrialActive && snapshot.orgTrialEndsAt) {
    const through = formatDate(snapshot.orgTrialEndsAt);
    return through ? `Free trial (through ${through})` : "Free trial";
  }

  return "Free";
}

export function formatCoachSignupSignedUpByLine(snapshot: CoachSignupAlertSnapshot) {
  if (snapshot.accountRole === "PARENT") {
    const parentName = snapshot.accountHolderName?.trim() || snapshot.parentConsentName?.trim();
    return parentName ? `Parent (${parentName})` : "Parent";
  }
  return "Player";
}

export function formatCoachSignupUnder13Line(snapshot: CoachSignupAlertSnapshot) {
  if (!isUnder13PlayerAge(snapshot.playerAge)) {
    return null;
  }
  if (snapshot.parentConsentConfirmedAt) {
    return "Yes, confirmed";
  }
  return "Yes, waiting on parent confirmation";
}

export function formatCoachSignupEmailLines(
  snapshot: CoachSignupAlertSnapshot,
  appBaseUrl: string,
): string[] {
  const lines: string[] = [];
  const playerName = coachSignupPlayerDisplayName(snapshot);
  const agePart =
    snapshot.playerAge != null ? `, age ${snapshot.playerAge}` : "";
  lines.push(`Player: ${playerName}${agePart}`);

  lines.push(`Signed up by: ${formatCoachSignupSignedUpByLine(snapshot)}`);

  const parentEmail = snapshot.parentConsentEmail?.trim().toLowerCase();
  const accountEmail = snapshot.accountEmail.trim();
  if (parentEmail && parentEmail !== accountEmail.toLowerCase()) {
    lines.push(`Email: ${accountEmail} (parent: ${parentEmail})`);
  } else {
    lines.push(`Email: ${accountEmail}`);
  }

  lines.push(`Source: ${formatCoachSignupSourceLine(snapshot)}`);

  if (snapshot.organizationId) {
    const team =
      snapshot.orgTeamName?.trim() || "Not picked yet";
    lines.push(`Team: ${team}`);
  }

  lines.push(`Access: ${formatCoachSignupAccessLabel(snapshot)}`);

  const under13 = formatCoachSignupUnder13Line(snapshot);
  if (under13) {
    lines.push(`Under 13: ${under13}`);
  }

  const signedUpLabel = formatWeekdayDateTime(snapshot.signedUpAt);
  if (signedUpLabel) {
    lines.push(`Signed up: ${signedUpLabel} Chicago`);
  }

  lines.push(`View in admin: ${buildAdminMemberUrl(snapshot.userId, appBaseUrl)}`);

  return lines;
}

export function buildCoachSignupAlertEmailContent(
  snapshot: CoachSignupAlertSnapshot,
  appBaseUrl: string,
) {
  const playerName = coachSignupPlayerDisplayName(snapshot);
  const source = formatCoachSignupSubjectSource(snapshot);
  const subject = `New sign-up: ${playerName} (${source})`;
  const text = `${formatCoachSignupEmailLines(snapshot, appBaseUrl).join("\n")}\n`;
  return { subject, text };
}

export type CoachSignupPushKind = "club" | "free" | "paid";

export function resolveCoachSignupPushKind(snapshot: CoachSignupAlertSnapshot): CoachSignupPushKind {
  if (snapshot.organizationId) {
    return "club";
  }

  const access = formatCoachSignupAccessLabel(snapshot);
  if (access === "Free") {
    return "free";
  }

  return "paid";
}

export function buildCoachSignupPushMessage(snapshot: CoachSignupAlertSnapshot, appBaseUrl: string) {
  const playerName = coachSignupPlayerDisplayName(snapshot);
  const url = buildAdminMemberUrl(snapshot.userId, appBaseUrl);
  const kind = resolveCoachSignupPushKind(snapshot);
  const access = formatCoachSignupAccessLabel(snapshot);

  if (kind === "club") {
    const orgLabel = snapshot.organizationName?.trim() || "Club";
    const team = snapshot.orgTeamName?.trim() || "No team yet";
    const accessShort =
      snapshot.orgTrialActive ? "Free trial" : access.replace(/\s*\(through.*\)/i, "");
    return {
      title: `New ${orgLabel} sign-up: ${playerName}`,
      body: `${team} - ${accessShort}`,
      url,
    };
  }

  if (kind === "free") {
    return {
      title: `New free sign-up: ${playerName}`,
      body: "Open member in admin",
      url,
    };
  }

  return {
    title: `New ${access} sign-up: ${playerName}`,
    body: "Open member in admin",
    url,
  };
}

export type CoachSignupDailyRollupBucket = {
  key: string;
  label: string;
  count: number;
  names: string[];
};

export function buildCoachSignupDailyRollup(snapshots: CoachSignupAlertSnapshot[]) {
  const bucketMap = new Map<string, CoachSignupDailyRollupBucket>();

  for (const snapshot of snapshots) {
    const name = coachSignupPlayerDisplayName(snapshot);
    let key: string;
    let label: string;

    if (snapshot.organizationId && snapshot.organizationName) {
      key = `org:${snapshot.organizationId}`;
      label = snapshot.organizationName.trim();
    } else {
      const access = formatCoachSignupAccessLabel(snapshot);
      if (access === "Free") {
        key = "free";
        label = "free";
      } else {
        key = `paid:${access}`;
        label = access;
      }
    }

    const existing = bucketMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.names.push(name);
    } else {
      bucketMap.set(key, { key, label, count: 1, names: [name] });
    }
  }

  const buckets = [...bucketMap.values()];
  const total = snapshots.length;
  const breakdown = buckets.map((b) => `${b.count} ${b.label}`).join(", ");
  const title = `Today: ${total} new sign-up${total === 1 ? "" : "s"} (${breakdown})`;
  const body = snapshots.map((s) => coachSignupPlayerDisplayName(s)).join(", ");

  return { total, buckets, title, body: body || "New sign-ups today" };
}

export type CoachSignupAlertUserRow = {
  id: string;
  email: string;
  accountRole: "PLAYER" | "PARENT";
  accountHolderName: string | null;
  playerFirstName: string | null;
  playerLastName: string | null;
  playerAge: number | null;
  parentConsentName: string | null;
  parentConsentEmail: string | null;
  parentConsentConfirmedAt: Date | null;
  organizationId: string | null;
  pendingCheckoutLevel: string | null;
  membershipTier: DatabaseTier;
  createdAt: Date;
  isTestAccount: boolean;
  orgTeam: { name: string } | null;
  organization: {
    name: string;
    active: boolean;
    trialStartsAt: Date | null;
    trialEndsAt: Date | null;
  } | null;
  linkedLeads: Array<{ source: string; firstResourceSlug: string | null }>;
};

export function buildCoachSignupAlertSnapshotFromUserRow(
  user: CoachSignupAlertUserRow,
  extras?: { signupSource?: string | null },
): CoachSignupAlertSnapshot {
  const lead = user.linkedLeads[0];
  const org = user.organization;
  const orgTrialActive = mergeOrgTrialActive({
    organizationActive: org?.active ?? false,
    organizationId: user.organizationId,
    trialStartsAt: org?.trialStartsAt ?? null,
    trialEndsAt: org?.trialEndsAt ?? null,
  });

  return {
    userId: user.id,
    playerFirstName: user.playerFirstName?.trim() ?? "",
    playerLastName: user.playerLastName?.trim() ?? "",
    playerAge: user.playerAge,
    accountRole: user.accountRole,
    accountEmail: user.email,
    accountHolderName: user.accountHolderName,
    parentConsentName: user.parentConsentName,
    parentConsentEmail: user.parentConsentEmail,
    parentConsentConfirmedAt: user.parentConsentConfirmedAt,
    organizationId: user.organizationId,
    organizationName: org?.name ?? null,
    orgTrialEndsAt: org?.trialEndsAt ?? null,
    orgTrialActive,
    orgTeamName: user.orgTeam?.name ?? null,
    pendingCheckoutLevel:
      user.pendingCheckoutLevel && isMembershipLevelKey(user.pendingCheckoutLevel)
        ? user.pendingCheckoutLevel
        : null,
    signupSource: extras?.signupSource ?? null,
    membershipTier: user.membershipTier,
    leadSource: lead?.source ?? null,
    leadFirstResourceSlug: lead?.firstResourceSlug ?? null,
    signedUpAt: user.createdAt,
    isTestAccount: user.isTestAccount,
  };
}

export function mergeOrgTrialActive(params: {
  organizationActive: boolean;
  organizationId: string | null;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
}) {
  return (
    Boolean(params.organizationActive && params.organizationId) &&
    isOrgTrialWindowActive(params.trialStartsAt, params.trialEndsAt)
  );
}
