import "server-only";

import type { CoachSignupAlertMode } from "@prisma/client";
import { getPublicAppUrl } from "@/lib/email-layout";
import {
  buildCoachSignupAlertEmailContent,
  buildCoachSignupAlertSnapshotFromUserRow,
  buildCoachSignupPushMessage,
  type CoachSignupAlertSnapshot,
} from "@/lib/coach-signup-alert-shared";
import { getAdminUsersWithAlertSettings } from "@/lib/coach-alert-settings";
import { sendCoachSignupAlertPushForMode } from "@/lib/coach-push-send";
import { sendCoachNotificationEmail } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getChicagoDayEnd, getChicagoDayStart } from "@/lib/program-email-chicago";

const signupUserSelect = {
  id: true,
  email: true,
  accountRole: true,
  accountHolderName: true,
  playerFirstName: true,
  playerLastName: true,
  playerAge: true,
  parentConsentName: true,
  parentConsentEmail: true,
  parentConsentConfirmedAt: true,
  organizationId: true,
  orgTeamId: true,
  pendingCheckoutLevel: true,
  membershipTier: true,
  createdAt: true,
  isTestAccount: true,
  orgTeam: { select: { name: true } },
  organization: {
    select: {
      name: true,
      active: true,
      trialStartsAt: true,
      trialEndsAt: true,
    },
  },
  linkedLeads: {
    select: { source: true, firstResourceSlug: true },
    orderBy: { createdAt: "asc" as const },
    take: 1,
  },
} as const;

export async function loadCoachSignupAlertSnapshot(
  userId: string,
  extras?: { signupSource?: string | null },
): Promise<CoachSignupAlertSnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: signupUserSelect,
  });

  if (!user) {
    return null;
  }

  return buildCoachSignupAlertSnapshotFromUserRow(user, extras);
}

export async function loadCoachSignupAlertSnapshotsForDateKey(dateKey: string) {
  const dayStart = getChicagoDayStart(dateKey);
  const dayEnd = getChicagoDayEnd(dateKey);

  const users = await prisma.user.findMany({
    where: {
      isTestAccount: false,
      createdAt: { gte: dayStart, lt: dayEnd },
    },
    select: signupUserSelect,
    orderBy: { createdAt: "asc" },
  });

  return users.map((user) => buildCoachSignupAlertSnapshotFromUserRow(user));
}

async function anyAdminSignupMode(mode: CoachSignupAlertMode) {
  const admins = await getAdminUsersWithAlertSettings();
  return admins.some((admin) => admin.settings.newSignupAlertMode === mode);
}

export async function handleCoachSignupAlerts(params: {
  userId: string;
  signupSource?: string | null;
}) {
  const snapshot = await loadCoachSignupAlertSnapshot(params.userId, {
    signupSource: params.signupSource,
  });

  if (!snapshot || snapshot.isTestAccount) {
    return { skipped: true as const, reason: "no_snapshot" as const };
  }

  const instantEnabled = await anyAdminSignupMode("INSTANT");
  if (!instantEnabled) {
    return { skipped: true as const, reason: "not_instant_mode" as const };
  }

  const appBaseUrl = getPublicAppUrl();
  const dedupeKey = `coach:COACH_NEW_SIGNUP:${snapshot.userId}`;

  const { subject, text } = buildCoachSignupAlertEmailContent(snapshot, appBaseUrl);
  await sendCoachNotificationEmail({ subject, text });

  const pushMessage = buildCoachSignupPushMessage(snapshot, appBaseUrl);
  await sendCoachSignupAlertPushForMode({
    mode: "INSTANT",
    type: "COACH_NEW_SIGNUP",
    dedupeKey,
    message: pushMessage,
  });

  return { skipped: false as const };
}
