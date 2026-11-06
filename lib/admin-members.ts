import type { MembershipTier, SubscriptionStatus } from "@prisma/client";
import {
  getCoachingSubmissionAvailability,
  PLAYBOOK_LIFETIME_SUBMISSION_LIMIT,
} from "@/lib/coaching-submissions";
import {
  buildMemberProductAccessSummary,
  formatMemberProductAccessCompact,
} from "@/lib/admin-product-access-shared";
import {
  formatDatabaseTierLabel,
  isDatabaseTier,
  type DatabaseTier,
  validDatabaseTiers,
} from "@/lib/membership";
import { memberProfileSelect, serializeMemberProfile } from "@/lib/player-profile";
import { formatDateTime } from "@/lib/format-date";
import {
  resolveMediaDisplayStatus,
  type MediaDisplayStatus,
} from "@/lib/media-consent-shared";
import {
  formatLegalAgreementRole,
  formatMediaConsentLabel,
} from "@/lib/legal-shared";
import { serializeInPersonTrainingInfo } from "@/lib/in-person-training-shared";
import { getTwelveWeekProgramEndDate } from "@/lib/twelve-week-program";

import { formatAccountRoleLabel, formatSignedUpBy, getPlayerFullName } from "@/lib/account-shared";
import { formatCommissionEligibilityLabel } from "@/lib/commission-eligibility-shared";
import {
  formatAdminMemberPlanBadgeLabel,
  formatAdminMemberPlanLabel,
  formatAdminMembershipLevelExpiry,
} from "@/lib/member-plan-labels-shared";
import { mergeOrgIntoAccessFields } from "@/lib/org-server";
import { formatAdminBaseTierLabel } from "@/lib/member-plan-labels-shared";
import type { MembershipBillingIntervalKey } from "@/lib/membership-billing-shared";
import type { MembershipLevelKey } from "@/lib/membership-levels-shared";
import { formatMembershipLevelLabel } from "@/lib/membership-levels-shared";
import { formatDateWithYear } from "@/lib/format-date";
import {
  buildAdminAnnualMembershipRefundSummary,
  buildAdminMembershipBillingLine,
  buildAdminMembershipFoundingDiscountLine,
  buildAdminMembershipPendingChangeNotices,
  buildAdminMembershipSubscriptionStatusLabel,
  buildMembershipSubscriptionEndedLabels,
} from "@/lib/admin-membership-subscription-shared";

export const adminMemberListSelect = {
  id: true,
  name: true,
  playerFirstName: true,
  playerLastName: true,
  accountRole: true,
  accountHolderName: true,
  email: true,
  membershipTier: true,
  membershipLevel: true,
  membershipLevelExpiresAt: true,
  playbookLegacyAccess: true,
  organizationId: true,
  orgTrialQuickReportUsed: true,
  coreQuickReportNextEligibleAt: true,
  clubReportExcluded: true,
  organization: {
    select: {
      id: true,
      name: true,
      active: true,
      billingMode: true,
      coveredLevel: true,
      trialStartsAt: true,
      trialEndsAt: true,
    },
  },
  signupDate: true,
  assessmentCallBooked: true,
  assessmentCallDate: true,
  twelveWeekCallBooked: true,
  twelveWeekCallScheduledAt: true,
  freeSubmissionUsed: true,
  playbookSubmissionsUsed: true,
  coachingSubmissionsUsedThisMonth: true,
  coachingSubmissionPeriod: true,
  eliteRolloverCredits: true,
  mediaConsent: true,
  mediaOptOutAll: true,
  _count: {
    select: {
      swingAnalysisSubmissions: true,
      mentalGameSubmissions: true,
    },
  },
} as const;

type AdminMemberListRecord = {
  id: string;
  name: string | null;
  playerFirstName: string | null;
  playerLastName: string | null;
  accountRole: "PLAYER" | "PARENT";
  accountHolderName: string | null;
  email: string;
  membershipTier: MembershipTier;
  membershipLevel: import("@prisma/client").MembershipLevel | null;
  membershipLevelExpiresAt: Date | null;
  playbookLegacyAccess: boolean;
  organizationId: string | null;
  orgTrialQuickReportUsed: boolean;
  coreQuickReportNextEligibleAt: Date | null;
  clubReportExcluded: boolean;
  organization: {
    id?: string;
    name?: string;
    active: boolean;
    billingMode: "FAMILY_PAY" | "CLUB_PAY";
    coveredLevel: "CORE" | "PLUS" | "ALL_ACCESS" | null;
    trialStartsAt: Date | null;
    trialEndsAt: Date | null;
    commissionRate?: number;
  } | null;
  signupDate: Date;
  assessmentCallBooked: boolean;
  assessmentCallDate: Date | null;
  twelveWeekCallBooked: boolean;
  twelveWeekCallScheduledAt: Date | null;
  freeSubmissionUsed: boolean;
  playbookSubmissionsUsed: number;
  coachingSubmissionsUsedThisMonth: number;
  coachingSubmissionPeriod: string | null;
  eliteRolloverCredits: number;
  mediaConsent: boolean;
  mediaOptOutAll: boolean;
  _count: {
    swingAnalysisSubmissions: number;
    mentalGameSubmissions: number;
  };
};

export function buildManualTierUpdateData(tier: DatabaseTier) {
  const baseUpdate = {
    membershipTier: tier,
    subscriptionStatus: "NONE" as SubscriptionStatus,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    subscriptionCurrentPeriodEnd: null,
    subscriptionCancelAtPeriodEnd: false,
  };

  if (tier === "TWELVE_WEEK") {
    const startedAt = new Date();
    return {
      ...baseUpdate,
      twelveWeekProgramStartedAt: startedAt,
      twelveWeekProgramEndsAt: getTwelveWeekProgramEndDate(startedAt),
    };
  }

  if (tier === "BASIC") {
    return {
      ...baseUpdate,
      twelveWeekProgramStartedAt: null,
      twelveWeekProgramEndsAt: null,
      twelveWeekCallBooked: false,
      twelveWeekCallScheduledAt: null,
      playbookSubmissionsUsed: 0,
    };
  }

  return {
    ...baseUpdate,
    twelveWeekProgramStartedAt: null,
    twelveWeekProgramEndsAt: null,
    twelveWeekCallBooked: false,
    twelveWeekCallScheduledAt: null,
  };
}

export function serializeAdminMemberSummary(user: AdminMemberListRecord) {
  const submissionCount =
    user._count.swingAnalysisSubmissions + user._count.mentalGameSubmissions;
  const tierLabel = formatDatabaseTierLabel(user.membershipTier);
  const accessFields = mergeOrgIntoAccessFields({
    membershipTier: user.membershipTier,
    membershipLevel: user.membershipLevel,
    membershipLevelExpiresAt: user.membershipLevelExpiresAt,
    playbookLegacyAccess: user.playbookLegacyAccess,
    organizationId: user.organizationId,
    orgTrialQuickReportUsed: user.orgTrialQuickReportUsed,
    coreQuickReportNextEligibleAt: user.coreQuickReportNextEligibleAt,
    organization: user.organization,
  });

  const availability = getCoachingSubmissionAvailability({
    ...accessFields,
    freeSubmissionUsed: user.freeSubmissionUsed,
    playbookSubmissionsUsed: user.playbookSubmissionsUsed,
    coachingSubmissionsUsedThisMonth: user.coachingSubmissionsUsedThisMonth,
    coachingSubmissionPeriod: user.coachingSubmissionPeriod,
    eliteRolloverCredits: user.eliteRolloverCredits,
  });

  return {
    id: user.id,
    name: getPlayerFullName(user),
    accountRole: user.accountRole,
    accountHolderName: user.accountHolderName,
    accountRoleLabel: formatAccountRoleLabel(user.accountRole),
    signedUpBy: formatSignedUpBy(user.accountRole, user.accountHolderName),
    email: user.email,
    membershipTier: user.membershipTier,
    membershipLevel: user.membershipLevel as import("@/lib/membership-levels-shared").MembershipLevelKey | null,
    membershipLevelExpiresAt: user.membershipLevelExpiresAt?.toISOString() ?? null,
    planDisplayLabel: formatAdminMemberPlanLabel(accessFields),
    planBadgeLabel: formatAdminMemberPlanBadgeLabel(accessFields),
    planExpiryLabel: formatAdminMembershipLevelExpiry(user.membershipLevelExpiresAt),
    baseTierLabel: formatAdminBaseTierLabel(user.membershipTier),
    productAccessCompact: formatMemberProductAccessCompact(
      user.membershipTier,
      user.playbookLegacyAccess,
    ),
    productAccess: buildMemberProductAccessSummary(
      user.membershipTier,
      tierLabel,
      user.playbookLegacyAccess,
    ),
    signupDate: user.signupDate.toISOString(),
    lastActiveAt: null,
    submissionCount,
    assessmentCallBooked: user.assessmentCallBooked,
    assessmentCallDate: user.assessmentCallDate?.toISOString() ?? null,
    twelveWeekCallBooked: user.twelveWeekCallBooked,
    twelveWeekCallScheduledAt: user.twelveWeekCallScheduledAt?.toISOString() ?? null,
    monthlySubmissionsRemaining:
      user.membershipTier === "MEMORABLE" || user.membershipTier === "ELITE"
        ? availability.remaining
        : null,
    playbookSubmissionsRemaining:
      user.membershipTier === "BASIC" ? availability.remaining : null,
    playbookSubmissionsLimit:
      user.membershipTier === "BASIC" ? (availability.lifetimeLimit ?? PLAYBOOK_LIFETIME_SUBMISSION_LIMIT) : null,
    organizationId: user.organizationId,
    organizationName: user.organization?.name ?? null,
    orgTrialQuickReportUsed: user.orgTrialQuickReportUsed,
    coreQuickReportNextEligibleAt: user.coreQuickReportNextEligibleAt?.toISOString() ?? null,
    clubReportExcluded: user.clubReportExcluded,
    playbookLegacyAccess: user.playbookLegacyAccess,
    organization: user.organization
      ? {
          active: user.organization.active,
          billingMode: user.organization.billingMode,
          coveredLevel: user.organization.coveredLevel,
          trialStartsAt: user.organization.trialStartsAt?.toISOString() ?? null,
          trialEndsAt: user.organization.trialEndsAt?.toISOString() ?? null,
        }
      : null,
    mediaConsent: user.mediaConsent,
    mediaOptOutAll: user.mediaOptOutAll,
    mediaDisplayStatus: resolveMediaDisplayStatus({
      mediaConsent: user.mediaConsent,
      mediaOptOutAll: user.mediaOptOutAll,
    }) satisfies MediaDisplayStatus,
  };
}

export function parseAdminMembershipTier(value: unknown): DatabaseTier | null {
  if (typeof value !== "string" || !isDatabaseTier(value)) {
    return null;
  }

  return value;
}

export function parseAdminNotes(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  return value;
}

export const adminMemberDetailSelect = {
  id: true,
  name: true,
  playerFirstName: true,
  playerLastName: true,
  accountRole: true,
  accountHolderName: true,
  email: true,
  membershipTier: true,
  membershipLevel: true,
  membershipLevelExpiresAt: true,
  playbookLegacyAccess: true,
  organizationId: true,
  orgTrialQuickReportUsed: true,
  coreQuickReportNextEligibleAt: true,
  clubReportExcluded: true,
  commissionEligible: true,
  commissionIneligibleReason: true,
  commissionEligibleAdminOverride: true,
  commissionOverrideNote: true,
  commissionAttributionOrgId: true,
  organization: {
    select: {
      id: true,
      name: true,
      active: true,
      billingMode: true,
      coveredLevel: true,
      trialStartsAt: true,
      trialEndsAt: true,
      commissionRate: true,
    },
  },
  commissionAttributionOrg: {
    select: {
      id: true,
      name: true,
      commissionRate: true,
    },
  },
  signupDate: true,
  assessmentCallBooked: true,
  assessmentCallDate: true,
  twelveWeekCallBooked: true,
  twelveWeekCallScheduledAt: true,
  adminNotes: true,
  freeSubmissionUsed: true,
  playbookSubmissionsUsed: true,
  coachingSubmissionsUsedThisMonth: true,
  coachingSubmissionPeriod: true,
  eliteRolloverCredits: true,
  stripeSubscriptionId: true,
  stripeCustomerId: true,
  membershipSubscription: {
    select: {
      id: true,
      level: true,
      status: true,
      billingInterval: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      pendingLevel: true,
      pendingBillingInterval: true,
      foundingDiscountEndsAt: true,
      startedAt: true,
      accessEndedAt: true,
      stripeSubscriptionId: true,
    },
  },
  termsVersion: true,
  termsAcceptedAt: true,
  acceptedByName: true,
  acceptedAsParent: true,
  mediaConsent: true,
  mediaOptOutAll: true,
  trainsInPerson: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  medicalNotes: true,
  inPersonInfoUpdatedAt: true,
  ...memberProfileSelect,
  swingAnalysisSubmissions: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      playerName: true,
      createdAt: true,
      status: true,
    },
  },
  mentalGameSubmissions: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      playerName: true,
      topic: true,
      createdAt: true,
      status: true,
    },
  },
  goalCheckins: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      monthlyFocus: true,
      createdAt: true,
      status: true,
    },
  },
  playbookProgress: {
    select: {
      overallComplete: true,
      completedAt: true,
      coachNotes: true,
      chapters: {
        orderBy: { chapterNumber: "asc" as const },
        select: {
          chapterNumber: true,
          chapterTitle: true,
          completed: true,
          completedAt: true,
          reflections: {
            where: { sharedWithCoach: true },
            orderBy: { questionNumber: "asc" as const },
            select: {
              questionNumber: true,
              questionText: true,
              answer: true,
              sharedAt: true,
            },
          },
        },
      },
    },
  },
  _count: {
    select: {
      swingAnalysisSubmissions: true,
      mentalGameSubmissions: true,
    },
  },
} as const;

type AdminMemberDetailRecord = AdminMemberListRecord & {
  commissionEligible: boolean;
  commissionIneligibleReason: string | null;
  commissionEligibleAdminOverride: boolean;
  commissionOverrideNote: string | null;
  commissionAttributionOrgId: string | null;
  commissionAttributionOrg: {
    id: string;
    name: string;
    commissionRate: number;
  } | null;
  adminNotes: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  membershipSubscription: {
    id: string;
    level: "CORE" | "PLUS" | "ALL_ACCESS";
    status: string;
    billingInterval: "MONTHLY" | "ANNUAL";
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    pendingLevel: "CORE" | "PLUS" | "ALL_ACCESS" | null;
    pendingBillingInterval: "MONTHLY" | "ANNUAL" | null;
    foundingDiscountEndsAt: Date | null;
    startedAt: Date;
    accessEndedAt: Date | null;
    stripeSubscriptionId: string;
  } | null;
  termsVersion: string | null;
  termsAcceptedAt: Date | null;
  acceptedByName: string | null;
  acceptedAsParent: boolean;
  mediaConsent: boolean;
  trainsInPerson: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  medicalNotes: string | null;
  inPersonInfoUpdatedAt: Date | null;
  position: string | null;
  age: number | null;
  graduationYear: number | null;
  currentTeam: string | null;
  level: string | null;
  playerBio: string | null;
  swingAnalysisSubmissions: Array<{
    id: string;
    playerName: string;
    createdAt: Date;
    status: string;
  }>;
  mentalGameSubmissions: Array<{
    id: string;
    playerName: string;
    topic: string;
    createdAt: Date;
    status: string;
  }>;
  goalCheckins: Array<{
    id: number;
    monthlyFocus: string;
    createdAt: Date;
    status: string;
  }>;
  playbookProgress: {
    overallComplete: boolean;
    completedAt: Date | null;
    coachNotes: string | null;
    chapters: Array<{
      chapterNumber: number;
      chapterTitle: string;
      completed: boolean;
      completedAt: Date | null;
      reflections: Array<{
        questionNumber: number;
        questionText: string;
        answer: string | null;
        sharedAt: Date | null;
      }>;
    }>;
  } | null;
};

function formatSubmissionStatus(status: string) {
  if (status === "COMPLETED" || status === "completed") {
    return "Responded";
  }

  if (status === "REVIEWING" || status === "reviewing") {
    return "Reviewing";
  }

  return "Pending";
}

function adminMemberDisplayName(user: AdminMemberDetailRecord) {
  const holder = user.accountHolderName?.trim();
  if (holder) {
    return holder;
  }
  return getPlayerFullName(user);
}

type AdminMembershipSubscriptionPaymentRow = {
  id: string;
  billingInterval: "MONTHLY" | "ANNUAL" | null;
  amountPaidCents: number;
  paidAt: Date;
  annualRefundEligibleUntil: Date | null;
  refundedAt: Date | null;
  invoiceBillingReason?: string | null;
};

function serializeAdminMembershipSubscription(
  subscription: NonNullable<AdminMemberDetailRecord["membershipSubscription"]>,
  user: AdminMemberDetailRecord,
  payments: AdminMembershipSubscriptionPaymentRow[],
) {
  const level = subscription.level as MembershipLevelKey;
  const billingInterval = subscription.billingInterval as MembershipBillingIntervalKey;
  const pendingBillingInterval =
    (subscription.pendingBillingInterval as MembershipBillingIntervalKey | null) ?? null;
  const pendingLevel = (subscription.pendingLevel as MembershipLevelKey | null) ?? null;
  const currentPeriodEndLabel = formatDateWithYear(subscription.currentPeriodEnd);
  const memberDisplayName = adminMemberDisplayName(user);
  const now = new Date();

  const endedLabels = buildMembershipSubscriptionEndedLabels({
    status: subscription.status,
    accessEndedAt: subscription.accessEndedAt,
    now,
  });

  const annualRefund = buildAdminAnnualMembershipRefundSummary({
    subscriptionBillingInterval: billingInterval,
    subscriptionStatus: subscription.status,
    accessEndedAt: subscription.accessEndedAt,
    payments: payments.map((payment) => ({
      id: payment.id,
      billingInterval: payment.billingInterval,
      amountPaidCents: payment.amountPaidCents,
      paidAt: payment.paidAt,
      annualRefundEligibleUntil: payment.annualRefundEligibleUntil,
      refundedAt: payment.refundedAt,
      invoiceBillingReason: payment.invoiceBillingReason ?? null,
    })),
    memberDisplayName,
    now,
  });

  return {
    level,
    levelLabel: formatMembershipLevelLabel(level),
    status: subscription.status,
    statusLabel: buildAdminMembershipSubscriptionStatusLabel({
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      pendingLevel,
      currentPeriodEndLabel,
    }),
    billingInterval,
    billingLine: buildAdminMembershipBillingLine({
      level,
      billingInterval,
      foundingDiscountEndsAt: subscription.foundingDiscountEndsAt,
      now,
    }),
    foundingDiscountLine: buildAdminMembershipFoundingDiscountLine({
      level,
      billingInterval,
      foundingDiscountEndsAt: subscription.foundingDiscountEndsAt,
      now,
    }),
    pendingChangeNotices: buildAdminMembershipPendingChangeNotices({
      level,
      billingInterval,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      pendingLevel,
      pendingBillingInterval,
      currentPeriodEndLabel,
    }),
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    pendingLevel,
    pendingBillingInterval,
    startedAt: subscription.startedAt.toISOString(),
    showNextBilling: endedLabels.showNextBilling,
    canceledOnLabel: endedLabels.canceledOnLabel,
    annualRefund: annualRefund
      ? {
          canRefund: annualRefund.canRefund,
          refundWindowLabel: annualRefund.refundWindowLabel,
          refundLines: annualRefund.refundLines,
          totalRefundableCents: annualRefund.totalRefundableCents,
          confirmMessage: annualRefund.confirmMessage,
        }
      : null,
  };
}

function serializeAdminMemberCommission(user: AdminMemberDetailRecord) {
  const commissionOrg =
    user.commissionAttributionOrg && user.commissionAttributionOrg.commissionRate > 0
      ? user.commissionAttributionOrg
      : user.organization && (user.organization.commissionRate ?? 0) > 0
        ? user.organization
        : null;
  if (!commissionOrg) {
    return null;
  }
  const effectiveEligible =
    user.commissionEligibleAdminOverride || user.commissionEligible;
  const orgId = commissionOrg.id ?? user.commissionAttributionOrgId ?? user.organizationId;
  const orgName = commissionOrg.name ?? "Organization";
  if (!orgId) {
    return null;
  }

  return {
    orgId,
    orgName,
    commissionEligible: user.commissionEligible,
    commissionIneligibleReason: user.commissionIneligibleReason,
    commissionEligibleAdminOverride: user.commissionEligibleAdminOverride,
    commissionOverrideNote: user.commissionOverrideNote,
    eligibilityLabel: formatCommissionEligibilityLabel({
      eligible: effectiveEligible,
      reason: user.commissionIneligibleReason,
      adminOverride: user.commissionEligibleAdminOverride,
    }),
  };
}

export function serializeAdminMemberDetail(
  user: AdminMemberDetailRecord,
  membershipPayments: AdminMembershipSubscriptionPaymentRow[] = [],
) {
  const summary = serializeAdminMemberSummary(user);

  return {
    ...summary,
    commission: serializeAdminMemberCommission(user),
    adminNotes: user.adminNotes,
    legalAcceptance: {
      termsVersion: user.termsVersion,
      termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
      termsAcceptedAtLabel: user.termsAcceptedAt
        ? formatDateTime(user.termsAcceptedAt)
        : "Not accepted",
      acceptedByName: user.acceptedByName,
      acceptedAsParent: user.acceptedAsParent,
      agreementRoleLabel: formatLegalAgreementRole(user.acceptedAsParent),
      mediaConsent: user.mediaConsent,
      mediaOptOutAll: user.mediaOptOutAll,
      mediaConsentLabel: formatMediaConsentLabel(user.mediaConsent, user.mediaOptOutAll),
      mediaDisplayStatus: resolveMediaDisplayStatus({
        mediaConsent: user.mediaConsent,
        mediaOptOutAll: user.mediaOptOutAll,
      }),
    },
    inPersonTraining: serializeInPersonTrainingInfo(user),
    hasStripeSubscription: Boolean(user.stripeSubscriptionId),
    membershipSubscription: user.membershipSubscription
      ? serializeAdminMembershipSubscription(
          user.membershipSubscription,
          user,
          membershipPayments,
        )
      : null,
    stripeCustomerId: user.stripeCustomerId,
    memberProfile: serializeMemberProfile(user),
    coachingSubmissions: [
      ...user.swingAnalysisSubmissions.map((submission) => ({
        id: submission.id,
        type: "SWING" as const,
        title: submission.playerName,
        subtitle: "Swing Analysis",
        createdAt: submission.createdAt.toISOString(),
        status: formatSubmissionStatus(submission.status),
      })),
      ...user.mentalGameSubmissions.map((submission) => ({
        id: submission.id,
        type: "MENTAL" as const,
        title: submission.playerName,
        subtitle: submission.topic.replaceAll("_", " "),
        createdAt: submission.createdAt.toISOString(),
        status: formatSubmissionStatus(submission.status),
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    goalCheckins: user.goalCheckins.map((checkin) => ({
      id: checkin.id,
      monthlyFocus: checkin.monthlyFocus,
      createdAt: checkin.createdAt.toISOString(),
      status: formatSubmissionStatus(checkin.status),
    })),
    playbook: user.playbookProgress
      ? {
          overallComplete: user.playbookProgress.overallComplete,
          completedAt: user.playbookProgress.completedAt?.toISOString() ?? null,
          coachNotes: user.playbookProgress.coachNotes,
          percentComplete: Math.round(
            (user.playbookProgress.chapters.filter((chapter) => chapter.completed).length /
              user.playbookProgress.chapters.length) *
              100,
          ),
          chapters: user.playbookProgress.chapters.map((chapter) => ({
            chapterNumber: chapter.chapterNumber,
            chapterTitle: chapter.chapterTitle,
            completed: chapter.completed,
            completedAt: chapter.completedAt?.toISOString() ?? null,
            sharedReflections: chapter.reflections.map((reflection) => ({
              questionNumber: reflection.questionNumber,
              questionText: reflection.questionText,
              answer: reflection.answer,
              sharedAt: reflection.sharedAt?.toISOString() ?? null,
            })),
            sharedAt:
              chapter.reflections.reduce<string | null>((latest, reflection) => {
                const sharedAt = reflection.sharedAt?.toISOString() ?? null;
                if (!sharedAt) {
                  return latest;
                }
                if (!latest || sharedAt > latest) {
                  return sharedAt;
                }
                return latest;
              }, null),
          })),
        }
      : null,
  };
}

export { validDatabaseTiers };
