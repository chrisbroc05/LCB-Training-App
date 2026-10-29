import "server-only";

import { prisma } from "@/lib/prisma";

/** Parent/guardian email for transactional copies (distinct from the account email). */
export async function resolveParentCopyEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      parentConsentEmail: true,
      programEnrollment: {
        select: {
          parentEmail: true,
          parentEmailsEnabled: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

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
