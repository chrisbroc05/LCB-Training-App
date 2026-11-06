import "server-only";

import type { LeadRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeLeadCaptureInput } from "@/lib/lead-capture-shared";
import { normalizeLeadEmail, upsertLeadForResourceDownload } from "@/lib/leads-server";
import {
  buildOptionOrderForAttempt,
  PLAYER_IQ_QUIZ_RESOURCE_SLUG,
  PLAYER_IQ_QUESTIONS,
  scorePlayerIqQuiz,
  type PlayerIqAnswers,
  type PlayerIqCategoryScores,
  type PlayerIqLevel,
  getOptionsForQuestionInOrder,
} from "@/lib/player-iq-quiz-shared";
import { prisma } from "@/lib/prisma";
import type { LeadRoleValue } from "@/lib/resources-shared";
import { QUIZ_REFERRAL_CHALLENGE } from "@/lib/quiz-session-cookies";

export const QUIZ_LEAD_SOURCE = "quiz";

export type QuizAccessContext = {
  leadId: string | null;
  userId: string | null;
  firstName: string;
  email: string;
  role: LeadRoleValue;
  /** Anonymous in-progress attempt bound via httpOnly cookie (no lead yet). */
  boundAnonymousAttemptId: string | null;
};

async function readAccessForUser(userId: string, email: string): Promise<QuizAccessContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      playerFirstName: true,
      accountRole: true,
      accountHolderName: true,
    },
  });
  const normalizedEmail = normalizeLeadEmail(email);
  const firstName =
    user?.playerFirstName?.trim() ||
    user?.accountHolderName?.trim()?.split(/\s+/)[0] ||
    user?.name?.trim()?.split(/\s+/)[0] ||
    "Player";
  const role: LeadRoleValue = user?.accountRole === "PARENT" ? "PARENT" : "PLAYER";

  const lead = await prisma.lead.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, unsubscribedAt: true },
  });

  return {
    leadId: lead && !lead.unsubscribedAt ? lead.id : null,
    userId,
    firstName,
    email: normalizedEmail,
    role,
    boundAnonymousAttemptId: null,
  };
}

/**
 * For /quiz page session UX: only logged-in users get a personalized greeting.
 * Do not use lcb_lead_id here - it would show another visitor's name from a prior device capture.
 */
export async function resolveQuizSessionForPage(): Promise<
  QuizAccessContext | null
> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id && session.user.email) {
    return readAccessForUser(session.user.id, session.user.email);
  }
  return null;
}

type ResolveQuizAccessParams = {
  leadIdFromCookie?: string | null;
  quizAttemptIdFromCookie?: string | null;
};

/**
 * For completing attempts and viewing results: session, lead cookie (after capture), or anonymous attempt cookie.
 */
export async function resolveQuizAccessReadonly(
  params: ResolveQuizAccessParams,
): Promise<QuizAccessContext | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id && session.user.email) {
    return readAccessForUser(session.user.id, session.user.email);
  }

  const attemptIdCookie = params.quizAttemptIdFromCookie?.trim();
  if (attemptIdCookie) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptIdCookie },
      select: { id: true, leadId: true, userId: true },
    });
    if (attempt && attempt.leadId === null && attempt.userId === null) {
      return {
        leadId: null,
        userId: null,
        firstName: "Player",
        email: "",
        role: "PLAYER",
        boundAnonymousAttemptId: attempt.id,
      };
    }
  }

  if (params.leadIdFromCookie) {
    const lead = await prisma.lead.findUnique({
      where: { id: params.leadIdFromCookie },
      select: {
        id: true,
        email: true,
        firstName: true,
        role: true,
        unsubscribedAt: true,
        userId: true,
      },
    });
    if (lead && !lead.unsubscribedAt) {
      return {
        leadId: lead.id,
        userId: lead.userId,
        firstName: lead.firstName,
        email: lead.email,
        role: lead.role as LeadRoleValue,
        boundAnonymousAttemptId: null,
      };
    }
  }

  return null;
}

export async function createAnonymousQuizAttempt(params?: {
  quizReferralSource?: string | null;
}): Promise<{
  attemptId: string;
  questions: ReturnType<typeof buildQuizQuestionsPayload>;
}> {
  const created = await prisma.quizAttempt.create({
    data: {
      leadId: null,
      userId: null,
      role: "PLAYER" as LeadRole,
      optionOrder: {},
      answers: {},
      ...(params?.quizReferralSource
        ? { quizReferralSource: params.quizReferralSource }
        : {}),
    },
    select: { id: true },
  });

  const optionOrder = buildOptionOrderForAttempt(created.id);
  const attempt = await prisma.quizAttempt.update({
    where: { id: created.id },
    data: { optionOrder },
    select: { id: true, optionOrder: true },
  });

  const order = attempt.optionOrder as Record<string, string[]>;
  return {
    attemptId: attempt.id,
    questions: buildQuizQuestionsPayload(order),
  };
}

export async function createQuizAttemptForLoggedInUser(
  access: QuizAccessContext,
  options?: { quizReferralSource?: string | null },
): Promise<{
  attemptId: string;
  questions: ReturnType<typeof buildQuizQuestionsPayload>;
  firstName: string;
  role: LeadRoleValue;
}> {
  const created = await prisma.quizAttempt.create({
    data: {
      leadId: access.leadId,
      userId: access.userId,
      role: access.role as LeadRole,
      optionOrder: {},
      answers: {},
      ...(options?.quizReferralSource
        ? { quizReferralSource: options.quizReferralSource }
        : {}),
    },
    select: { id: true },
  });

  const optionOrder = buildOptionOrderForAttempt(created.id);
  const attempt = await prisma.quizAttempt.update({
    where: { id: created.id },
    data: { optionOrder },
    select: { id: true, optionOrder: true },
  });

  const order = attempt.optionOrder as Record<string, string[]>;
  return {
    attemptId: attempt.id,
    questions: buildQuizQuestionsPayload(order),
    firstName: access.firstName,
    role: access.role,
  };
}

export async function resolveQuizAccess(params: ResolveQuizAccessParams): Promise<QuizAccessContext | null> {
  return resolveQuizAccessReadonly(params);
}

export function buildQuizQuestionsPayload(optionOrder: Record<string, string[]>) {
  return PLAYER_IQ_QUESTIONS.map((question) => ({
    id: question.id,
    order: question.order,
    categoryLabel: question.categoryLabel,
    prompt: question.prompt,
    options: getOptionsForQuestionInOrder(question, optionOrder).map((option) => ({
      id: option.id,
      text: option.text,
    })),
  }));
}

export async function assertCanAccessAttempt(
  attemptId: string,
  access: QuizAccessContext | null,
) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      lead: { select: { email: true, firstName: true } },
    },
  });

  if (!attempt) {
    return { ok: false as const, error: "NOT_FOUND" };
  }

  if (!access) {
    return { ok: false as const, error: "UNAUTHORIZED" };
  }

  if (attempt.userId && access.userId && attempt.userId === access.userId) {
    return { ok: true as const, attempt };
  }

  if (attempt.leadId && access.leadId && attempt.leadId === access.leadId) {
    return { ok: true as const, attempt };
  }

  if (
    access.boundAnonymousAttemptId &&
    attempt.id === access.boundAnonymousAttemptId &&
    attempt.leadId === null &&
    attempt.userId === null
  ) {
    return { ok: true as const, attempt };
  }

  return { ok: false as const, error: "UNAUTHORIZED" };
}

type CompleteQuizLeadFields = {
  firstName: string;
  email: string;
  role: LeadRoleValue;
  playerAge13Plus?: boolean | null;
  parentEmail?: string | null;
};

export async function completeQuizAttempt(params: {
  attemptId: string;
  answers: PlayerIqAnswers;
  access: QuizAccessContext;
  /** Required when finishing an anonymous attempt (creates lead + links attempt). */
  leadFields?: CompleteQuizLeadFields | null;
}) {
  const gate = await assertCanAccessAttempt(params.attemptId, params.access);
  if (!gate.ok) {
    return gate;
  }

  const lockedAttempt = gate.attempt;
  if (lockedAttempt.completedAt) {
    return { ok: false as const, error: "ALREADY_COMPLETED" };
  }

  let access = params.access;

  const attemptReferral = await prisma.quizAttempt.findUnique({
    where: { id: params.attemptId },
    select: { quizReferralSource: true },
  });
  const quizChallengeRefForLead =
    attemptReferral?.quizReferralSource === QUIZ_REFERRAL_CHALLENGE
      ? QUIZ_REFERRAL_CHALLENGE
      : null;

  if (!access.userId && access.boundAnonymousAttemptId) {
    const raw = params.leadFields;
    if (!raw) {
      return { ok: false as const, error: "LEAD_FIELDS_REQUIRED" };
    }
    const normalized = normalizeLeadCaptureInput({
      firstName: raw.firstName,
      email: raw.email,
      role: raw.role,
      playerAge13Plus: raw.playerAge13Plus,
      parentEmail: raw.parentEmail,
    });
    if (!normalized.ok) {
      return { ok: false as const, error: "LEAD_INVALID", message: normalized.error };
    }

    const { lead } = await upsertLeadForResourceDownload({
      email: normalized.value.email,
      firstName: normalized.value.firstName,
      role: normalized.value.role,
      resourceSlug: PLAYER_IQ_QUIZ_RESOURCE_SLUG,
      source: QUIZ_LEAD_SOURCE,
      emailProvidedByParent: normalized.value.emailProvidedByParent,
      ...(quizChallengeRefForLead ? { quizChallengeRef: quizChallengeRefForLead } : {}),
    });

    const existingResource = await prisma.leadResource.findFirst({
      where: { leadId: lead.id, resourceSlug: PLAYER_IQ_QUIZ_RESOURCE_SLUG },
      select: { id: true },
    });
    if (!existingResource) {
      await prisma.leadResource.create({
        data: { leadId: lead.id, resourceSlug: PLAYER_IQ_QUIZ_RESOURCE_SLUG },
      });
    }

    await prisma.quizAttempt.update({
      where: { id: params.attemptId },
      data: {
        leadId: lead.id,
        role: normalized.value.role as LeadRole,
      },
    });

    access = {
      leadId: lead.id,
      userId: null,
      firstName: normalized.value.firstName,
      email: normalizeLeadEmail(normalized.value.email),
      role: normalized.value.role,
      boundAnonymousAttemptId: null,
    };
  } else if (access.userId) {
    await upsertLeadForResourceDownload({
      email: access.email,
      firstName: access.firstName,
      role: access.role,
      resourceSlug: PLAYER_IQ_QUIZ_RESOURCE_SLUG,
      source: QUIZ_LEAD_SOURCE,
      ...(quizChallengeRefForLead ? { quizChallengeRef: quizChallengeRefForLead } : {}),
    });
    const leadRow = await prisma.lead.findUnique({
      where: { email: access.email },
      select: { id: true },
    });
    if (leadRow) {
      await prisma.quizAttempt.update({
        where: { id: params.attemptId },
        data: { leadId: leadRow.id },
      });
      access = { ...access, leadId: leadRow.id };
    }
  }

  const { score, categoryScores, level, lowestCategory } = scorePlayerIqQuiz(params.answers);

  const updated = await prisma.quizAttempt.update({
    where: { id: params.attemptId },
    data: {
      answers: params.answers,
      score,
      categoryScores,
      level,
      completedAt: new Date(),
    },
  });

  if (access.userId) {
    await prisma.user.update({
      where: { id: access.userId },
      data: {
        lastPlayerIqQuizScore: score,
        lastPlayerIqQuizLevel: level,
        lastPlayerIqQuizCompletedAt: new Date(),
      },
    });
  }

  return {
    ok: true as const,
    attempt: updated,
    score,
    categoryScores: categoryScores as PlayerIqCategoryScores,
    level: level as PlayerIqLevel,
    lowestCategory,
    access,
  };
}
