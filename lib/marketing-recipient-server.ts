import "server-only";

import { prisma } from "@/lib/prisma";

export type UserMarketingDelivery = {
  toEmail: string;
  skipped: false;
} | {
  skipped: true;
  reason: string;
};

function resolveParentMarketingEmail(user: {
  email: string;
  parentConsentEmail: string | null;
  programEnrollment: {
    parentEmail: string | null;
    parentEmailsEnabled: boolean;
  } | null;
}): string | null {
  const accountEmail = user.email.trim().toLowerCase();

  if (
    user.programEnrollment?.parentEmailsEnabled &&
    user.programEnrollment.parentEmail?.trim()
  ) {
    const parentEmail = user.programEnrollment.parentEmail.trim().toLowerCase();
    if (parentEmail !== accountEmail) {
      return user.programEnrollment.parentEmail.trim();
    }
  }

  const consentEmail = user.parentConsentEmail?.trim().toLowerCase();
  if (consentEmail && consentEmail !== accountEmail) {
    return user.parentConsentEmail!.trim();
  }

  return null;
}

/** Users under 18 receive marketing at a parent email when one is on file. */
export async function resolveUserMarketingDeliveryEmail(
  userId: string,
): Promise<UserMarketingDelivery> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      playerAge: true,
      parentConsentEmail: true,
      programEnrollment: {
        select: {
          parentEmail: true,
          parentEmailsEnabled: true,
        },
      },
    },
  });

  if (!user?.email) {
    return { skipped: true, reason: "user_not_found" };
  }

  const age = user.playerAge;
  if (age == null || age >= 18) {
    return { skipped: false, toEmail: user.email };
  }

  const parentEmail = resolveParentMarketingEmail(user);
  if (!parentEmail) {
    console.warn(
      `[marketing-recipient] Skipping marketing for minor user ${userId} (age ${age}): no parent email on file.`,
    );
    return { skipped: true, reason: "minor_no_parent_email" };
  }

  return { skipped: false, toEmail: parentEmail };
}
