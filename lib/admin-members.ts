import type { MembershipTier, SubscriptionStatus } from "@prisma/client";
import { getCoachingSubmissionAvailability } from "@/lib/coaching-submissions";
import {
  isDatabaseTier,
  type DatabaseTier,
  validDatabaseTiers,
} from "@/lib/membership";
import { memberProfileSelect, serializeMemberProfile } from "@/lib/player-profile";

export const adminMemberListSelect = {
  id: true,
  name: true,
  email: true,
  membershipTier: true,
  signupDate: true,
  assessmentCallBooked: true,
  assessmentCallDate: true,
  freeSubmissionUsed: true,
  coachingSubmissionsUsedThisMonth: true,
  coachingSubmissionPeriod: true,
  eliteRolloverCredits: true,
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
  email: string;
  membershipTier: MembershipTier;
  signupDate: Date;
  assessmentCallBooked: boolean;
  assessmentCallDate: Date | null;
  freeSubmissionUsed: boolean;
  coachingSubmissionsUsedThisMonth: number;
  coachingSubmissionPeriod: string | null;
  eliteRolloverCredits: number;
  _count: {
    swingAnalysisSubmissions: number;
    mentalGameSubmissions: number;
  };
};

export function buildManualTierUpdateData(tier: DatabaseTier) {
  return {
    membershipTier: tier,
    subscriptionStatus: "NONE" as SubscriptionStatus,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    subscriptionCurrentPeriodEnd: null,
    subscriptionCancelAtPeriodEnd: false,
  };
}

export function serializeAdminMemberSummary(user: AdminMemberListRecord) {
  const submissionCount =
    user._count.swingAnalysisSubmissions + user._count.mentalGameSubmissions;
  const availability = getCoachingSubmissionAvailability({
    membershipTier: user.membershipTier,
    freeSubmissionUsed: user.freeSubmissionUsed,
    coachingSubmissionsUsedThisMonth: user.coachingSubmissionsUsedThisMonth,
    coachingSubmissionPeriod: user.coachingSubmissionPeriod,
    eliteRolloverCredits: user.eliteRolloverCredits,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    membershipTier: user.membershipTier,
    signupDate: user.signupDate.toISOString(),
    lastActiveAt: null,
    submissionCount,
    assessmentCallBooked: user.assessmentCallBooked,
    assessmentCallDate: user.assessmentCallDate?.toISOString() ?? null,
    monthlySubmissionsRemaining:
      user.membershipTier === "MEMORABLE" || user.membershipTier === "ELITE"
        ? availability.remaining
        : null,
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
  email: true,
  membershipTier: true,
  signupDate: true,
  assessmentCallBooked: true,
  assessmentCallDate: true,
  adminNotes: true,
  freeSubmissionUsed: true,
  coachingSubmissionsUsedThisMonth: true,
  coachingSubmissionPeriod: true,
  eliteRolloverCredits: true,
  stripeSubscriptionId: true,
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
  _count: {
    select: {
      swingAnalysisSubmissions: true,
      mentalGameSubmissions: true,
    },
  },
} as const;

type AdminMemberDetailRecord = {
  id: string;
  name: string | null;
  email: string;
  membershipTier: MembershipTier;
  signupDate: Date;
  assessmentCallBooked: boolean;
  assessmentCallDate: Date | null;
  adminNotes: string | null;
  freeSubmissionUsed: boolean;
  coachingSubmissionsUsedThisMonth: number;
  coachingSubmissionPeriod: string | null;
  eliteRolloverCredits: number;
  stripeSubscriptionId: string | null;
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
  _count: {
    swingAnalysisSubmissions: number;
    mentalGameSubmissions: number;
  };
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

export function serializeAdminMemberDetail(user: AdminMemberDetailRecord) {
  const summary = serializeAdminMemberSummary(user);

  return {
    ...summary,
    adminNotes: user.adminNotes,
    hasStripeSubscription: Boolean(user.stripeSubscriptionId),
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
  };
}

export { validDatabaseTiers };
