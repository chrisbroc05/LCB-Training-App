import "server-only";

import type { MembershipTier } from "@prisma/client";
import type { DatabaseTier } from "@/lib/membership";
import { getPlaybookSubmissionResetData } from "@/lib/coaching-submissions";
import { activateTwelveWeekProgramAccess } from "@/lib/program-enrollment";
import { prisma } from "@/lib/prisma";
import { sendCoachNewProgramPlayerPushForUser } from "@/lib/coach-push-instant";
import {
  sendPlaybookPurchaseConfirmationEmail,
  sendRemoteSessionPurchaseConfirmationEmail,
} from "@/lib/notifications";
import type { AdminGrantProduct } from "@/lib/admin-product-access-shared";
import { getAdminGrantProductLabel } from "@/lib/admin-product-access-shared";
import { formatDateWithYear } from "@/lib/format-date";

export type AdminProductAccessAction = "grant" | "remove";

export type ApplyAdminProductAccessParams = {
  userId: string;
  product: AdminGrantProduct;
  action: AdminProductAccessAction;
  adminEmail: string;
  stripePaidOn?: string | null;
  skipEmail?: boolean;
  /** When granting Playbook: comp full legacy bundle (full drills, workouts, 2 submissions). */
  playbookLegacyAccess?: boolean;
};

function parseStripePaidOnDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) {
    return null;
  }
  const parsed = new Date(`${value.trim()}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatGrantNoteDate(stripePaidOn: string | null | undefined): string {
  const parsed = parseStripePaidOnDate(stripePaidOn);
  if (parsed) {
    return formatDateWithYear(parsed);
  }
  return formatDateWithYear(new Date());
}

function getRestoredMembershipTierAfterProgramRemoval(
  currentTier: MembershipTier,
  beforeProgramTier: MembershipTier | null,
): DatabaseTier {
  if (currentTier !== "TWELVE_WEEK") {
    return currentTier as DatabaseTier;
  }

  if (beforeProgramTier && beforeProgramTier !== "TWELVE_WEEK") {
    return beforeProgramTier as DatabaseTier;
  }

  return "FREE";
}

export function appendAdminAccessAuditNote(params: {
  existingNotes: string | null;
  product: AdminGrantProduct;
  action: AdminProductAccessAction;
  adminEmail: string;
  stripePaidOn?: string | null;
}): string {
  const productLabel = getAdminGrantProductLabel(params.product);
  const when = formatGrantNoteDate(params.stripePaidOn);
  const timestamp = new Date().toISOString();

  let line: string;
  if (params.action === "grant") {
    line = `Manual grant - ${productLabel} - paid in Stripe on ${when} (by ${params.adminEmail} at ${timestamp})`;
  } else {
    line = `Manual remove - ${productLabel} access (by ${params.adminEmail} at ${timestamp})`;
  }

  if (params.existingNotes?.trim()) {
    return `${params.existingNotes.trim()}\n\n${line}`;
  }
  return line;
}

async function grantPlaybook(
  userId: string,
  note: string,
  skipEmail: boolean,
  playbookLegacyAccess: boolean,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, membershipTier: true },
  });
  if (!user) {
    return { ok: false as const, error: "Member not found." };
  }

  if (user.membershipTier === "TWELVE_WEEK") {
    await prisma.user.update({
      where: { id: userId },
      data: { adminNotes: note },
    });
    return {
      ok: true as const,
      message: "Member already has Playbook access through the 12-Week Program. Audit note saved.",
    };
  }

  if (user.membershipTier === "BASIC") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        adminNotes: note,
        playbookLegacyAccess,
        ...getPlaybookSubmissionResetData(),
      },
    });
    return {
      ok: true as const,
      message: playbookLegacyAccess
        ? "Playbook refreshed with full legacy access and 2 coaching submissions. Audit note saved."
        : "Playbook access refreshed. Audit note saved.",
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      membershipTier: "BASIC",
      pendingCheckoutTier: null,
      subscriptionStatus: "NONE",
      stripeSubscriptionId: null,
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID ?? null,
      subscriptionCurrentPeriodEnd: null,
      subscriptionCancelAtPeriodEnd: false,
      adminNotes: note,
      playbookLegacyAccess,
      ...getPlaybookSubmissionResetData(),
    },
  });

  if (!skipEmail) {
    const firstName = user.name?.trim().split(/\s+/)[0] || "there";
    await sendPlaybookPurchaseConfirmationEmail({
      toEmail: user.email,
      firstName,
    });
  }

  return { ok: true as const, message: "Playbook access granted." };
}

async function removePlaybook(userId: string, note: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipTier: true, membershipTierBeforeProgram: true },
  });
  if (!user) {
    return { ok: false as const, error: "Member not found." };
  }

  if (user.membershipTier === "TWELVE_WEEK") {
    return {
      ok: false as const,
      error: "Playbook is included in the 12-Week Program. Remove 12-Week access instead.",
    };
  }

  if (user.membershipTier !== "BASIC") {
    await prisma.user.update({
      where: { id: userId },
      data: { adminNotes: note },
    });
    return { ok: true as const, message: "No Playbook tier to remove. Audit note saved." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      membershipTier: "FREE",
      stripePriceId: null,
      pendingCheckoutTier: null,
      adminNotes: note,
    },
  });

  return { ok: true as const, message: "Playbook access removed." };
}

async function grantTwelveWeek(userId: string, note: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!existing) {
    return { ok: false as const, error: "Member not found." };
  }

  await activateTwelveWeekProgramAccess(userId);
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripePriceId: process.env.TWELVE_WEEK_PROGRAM_PRICE_ID ?? null,
      adminNotes: note,
    },
  });
  void sendCoachNewProgramPlayerPushForUser(userId);
  return { ok: true as const, message: "12-Week Program access granted." };
}

async function removeTwelveWeek(userId: string, note: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      membershipTier: true,
      membershipTierBeforeProgram: true,
      programEnrollment: { select: { id: true } },
    },
  });
  if (!user) {
    return { ok: false as const, error: "Member not found." };
  }

  if (user.membershipTier !== "TWELVE_WEEK") {
    await prisma.user.update({
      where: { id: userId },
      data: { adminNotes: note },
    });
    return { ok: true as const, message: "Member is not on 12-Week tier. Audit note saved." };
  }

  const restoredTier = getRestoredMembershipTierAfterProgramRemoval(
    user.membershipTier,
    user.membershipTierBeforeProgram,
  );

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        membershipTier: restoredTier,
        membershipTierBeforeProgram: null,
        twelveWeekProgramStartedAt: null,
        twelveWeekProgramEndsAt: null,
        twelveWeekCallBooked: false,
        twelveWeekCallScheduledAt: null,
        stripePriceId: null,
        pendingCheckoutTier: null,
        adminNotes: note,
      },
    });

    if (user.programEnrollment) {
      await tx.programEnrollment.update({
        where: { id: user.programEnrollment.id },
        data: {
          status: "PAUSED",
          dailyRoutineEmailsEnabled: false,
          parentEmailsEnabled: false,
        },
      });
    }
  });

  return { ok: true as const, message: "12-Week Program access removed." };
}

async function grantRemoteSession(userId: string, note: string, skipEmail: boolean) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) {
    return { ok: false as const, error: "Member not found." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { adminNotes: note },
  });

  if (!skipEmail) {
    const firstName = user.name?.trim().split(/\s+/)[0] || "there";
    await sendRemoteSessionPurchaseConfirmationEmail({
      toEmail: user.email,
      firstName,
    });
  }

  return { ok: true as const, message: "Remote session grant recorded and booking email sent." };
}

async function removeRemoteSession(userId: string, note: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { adminNotes: note },
  });
  return { ok: true as const, message: "Remote session removal noted in admin notes." };
}

export async function applyAdminProductAccess(params: ApplyAdminProductAccessParams) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { adminNotes: true },
  });

  if (!user) {
    return { ok: false as const, error: "Member not found." };
  }

  const note = appendAdminAccessAuditNote({
    existingNotes: user.adminNotes,
    product: params.product,
    action: params.action,
    adminEmail: params.adminEmail,
    stripePaidOn: params.stripePaidOn,
  });

  const skipEmail = params.skipEmail === true;

  if (params.action === "grant") {
    if (params.product === "playbook") {
      return grantPlaybook(
        params.userId,
        note,
        skipEmail,
        params.playbookLegacyAccess === true,
      );
    }
    if (params.product === "twelve_week_program") {
      return grantTwelveWeek(params.userId, note);
    }
    return grantRemoteSession(params.userId, note, skipEmail);
  }

  if (params.product === "playbook") {
    return removePlaybook(params.userId, note);
  }
  if (params.product === "twelve_week_program") {
    return removeTwelveWeek(params.userId, note);
  }
  return removeRemoteSession(params.userId, note);
}
