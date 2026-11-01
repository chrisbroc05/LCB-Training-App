import "server-only";

import type { WaiverSignupType } from "@prisma/client";
import {
  evaluateExistingFamilyCommissionEligibility,
  resolveCommissionEligibleOnOrgJoin,
  type CommissionExistingFamilyInput,
} from "@/lib/commission-eligibility-shared";
import { prisma } from "@/lib/prisma";

const LESSON_WAIVER_SIGNUP_TYPES: WaiverSignupType[] = ["PRIVATE_LESSONS", "GROUP_LESSONS"];

export async function loadExistingFamilyCommissionSignals(params: {
  userId: string;
  email: string;
  orgJoinedAt: Date;
}): Promise<CommissionExistingFamilyInput> {
  const joinedAt = params.orgJoinedAt;
  const email = params.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { signupDate: true, membershipTier: true },
  });

  const [
    priorMembershipPayment,
    priorResourcePurchase,
    priorProgramEnrollment,
    priorLessonWaiver,
    priorPlaybookOrProgramTier,
  ] = await Promise.all([
    prisma.membershipSubscriptionPayment.findFirst({
      where: {
        userId: params.userId,
        paidAt: { lt: joinedAt },
        refundedAt: null,
      },
      select: { id: true },
    }),
    prisma.resourcePurchase.findFirst({
      where: {
        OR: [{ userId: params.userId }, { email }],
        createdAt: { lt: joinedAt },
        refundedAt: null,
      },
      select: { id: true },
    }),
    prisma.programEnrollment.findFirst({
      where: {
        userId: params.userId,
        createdAt: { lt: joinedAt },
      },
      select: { id: true },
    }),
    prisma.waiverSignature.findFirst({
      where: {
        OR: [{ userId: params.userId }, { signerEmail: { equals: email, mode: "insensitive" } }],
        signedAt: { lt: joinedAt },
        signupType: { in: LESSON_WAIVER_SIGNUP_TYPES },
      },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: {
        id: params.userId,
        signupDate: { lt: joinedAt },
        membershipTier: { in: ["BASIC", "MEMORABLE", "ELITE", "TWELVE_WEEK"] },
      },
      select: { id: true },
    }),
  ]);

  const priorPayingMember = Boolean(
    priorMembershipPayment ||
      priorPlaybookOrProgramTier ||
      (user && user.signupDate < joinedAt && user.membershipTier !== "FREE"),
  );

  return {
    orgJoinedAt: joinedAt,
    priorPayingMember,
    priorPurchase: Boolean(priorResourcePurchase || priorProgramEnrollment),
    priorLessonWaiverBeforeJoin: Boolean(priorLessonWaiver),
  };
}

export async function resolveCommissionEligibilityForOrgJoin(params: {
  userId: string;
  email: string;
  orgJoinedAt: Date;
  orgBillingMode: "FAMILY_PAY" | "CLUB_PAY";
  orgCommissionRate: number;
}) {
  const existingFamily = await loadExistingFamilyCommissionSignals({
    userId: params.userId,
    email: params.email,
    orgJoinedAt: params.orgJoinedAt,
  });
  return resolveCommissionEligibleOnOrgJoin({
    orgBillingMode: params.orgBillingMode,
    orgCommissionRate: params.orgCommissionRate,
    existingFamily,
  });
}

export { evaluateExistingFamilyCommissionEligibility };
