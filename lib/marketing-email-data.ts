import "server-only";

import type { MarketingEmailTypeValue } from "@/lib/marketing-email-shared";
import {
  FOLLOWUP_DAY_OFFSETS,
  isMarketingEmailInWindow,
} from "@/lib/marketing-email-shared";
import type { FollowupSubmissionContext } from "@/lib/marketing-email-templates";
import { prisma } from "@/lib/prisma";

export type MarketingFollowupAnchor = {
  userId: string;
  email: string;
  firstName: string;
  ownsPlaybook: boolean;
  notifyAnnouncements: boolean;
  submission: FollowupSubmissionContext;
};

function getFirstName(name: string | null | undefined, email: string) {
  const trimmed = name?.trim();
  if (trimmed) {
    return trimmed.split(/\s+/)[0] ?? "there";
  }

  return email.split("@")[0] || "there";
}

function truncateResponseSummary(value: string | null | undefined, maxLength = 220) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return "your latest breakdown";
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}...`;
}

function isEligibleForFollowupTier(membershipTier: string) {
  return membershipTier === "FREE" || membershipTier === "BASIC";
}

export async function loadMarketingFollowupAnchors(_now = new Date()) {
  const users = await prisma.user.findMany({
    where: {
      membershipTier: { in: ["FREE", "BASIC"] },
      notifyAnnouncements: true,
      marketingEmailsSuppressed: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      membershipTier: true,
      swingAnalysisSubmissions: {
        where: { respondedAt: { not: null } },
        orderBy: { respondedAt: "asc" },
        take: 1,
        select: {
          id: true,
          respondedAt: true,
          responseText: true,
          recommendedDrills: true,
        },
      },
      mentalGameSubmissions: {
        where: { respondedAt: { not: null } },
        orderBy: { respondedAt: "asc" },
        take: 1,
        select: {
          id: true,
          respondedAt: true,
          responseText: true,
          recommendedDrills: true,
        },
      },
    },
    take: 500,
  });

  const anchors: MarketingFollowupAnchor[] = [];

  for (const user of users) {
    if (!isEligibleForFollowupTier(user.membershipTier)) {
      continue;
    }

    const swing = user.swingAnalysisSubmissions[0];
    const mental = user.mentalGameSubmissions[0];

    let submission: FollowupSubmissionContext | null = null;

    if (swing?.respondedAt && mental?.respondedAt) {
      const useSwing = swing.respondedAt.getTime() <= mental.respondedAt.getTime();
      submission = useSwing
        ? {
            submissionId: swing.id,
            submissionType: "SWING",
            responseSummary: truncateResponseSummary(swing.responseText),
            respondedAt: swing.respondedAt,
            recommendedDrillIds: swing.recommendedDrills,
          }
        : {
            submissionId: mental.id,
            submissionType: "MENTAL",
            responseSummary: truncateResponseSummary(mental.responseText),
            respondedAt: mental.respondedAt,
            recommendedDrillIds: mental.recommendedDrills,
          };
    } else if (swing?.respondedAt) {
      submission = {
        submissionId: swing.id,
        submissionType: "SWING",
        responseSummary: truncateResponseSummary(swing.responseText),
        respondedAt: swing.respondedAt,
        recommendedDrillIds: swing.recommendedDrills,
      };
    } else if (mental?.respondedAt) {
      submission = {
        submissionId: mental.id,
        submissionType: "MENTAL",
        responseSummary: truncateResponseSummary(mental.responseText),
        respondedAt: mental.respondedAt,
        recommendedDrillIds: mental.recommendedDrills,
      };
    }

    if (!submission) {
      continue;
    }

    anchors.push({
      userId: user.id,
      email: user.email,
      firstName: getFirstName(user.name, user.email),
      ownsPlaybook: user.membershipTier === "BASIC",
      notifyAnnouncements: true,
      submission,
    });
  }

  return anchors;
}

export async function loadFreeSubmissionReminderCandidates(now = new Date()) {
  const users = await prisma.user.findMany({
    where: {
      membershipTier: "FREE",
      notifyAnnouncements: true,
      marketingEmailsSuppressed: false,
      swingAnalysisSubmissions: { none: {} },
      mentalGameSubmissions: { none: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
      signupDate: true,
    },
    take: 200,
  });

  return users
    .filter((user) => isMarketingEmailInWindow("FREE_SUBMISSION_REMINDER", user.signupDate, now))
    .map((user) => ({
      userId: user.id,
      email: user.email,
      firstName: getFirstName(user.name, user.email),
      ownsPlaybook: false,
      signupDate: user.signupDate,
    }));
}

export function getDueFollowupTypes(
  respondedAt: Date,
  now = new Date(),
): MarketingEmailTypeValue[] {
  return (Object.keys(FOLLOWUP_DAY_OFFSETS) as MarketingEmailTypeValue[]).filter((type) =>
    isMarketingEmailInWindow(type, respondedAt, now),
  );
}

export async function loadUserMarketingRecipient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      membershipTier: true,
      marketingEmailsSuppressed: true,
    },
  });

  if (!user || user.marketingEmailsSuppressed) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    firstName: getFirstName(user.name, user.email),
    ownsPlaybook: user.membershipTier === "BASIC" || user.membershipTier === "TWELVE_WEEK",
  };
}
