import "server-only";

import type { LeadRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeLeadEmail } from "@/lib/leads-server";
import { upsertLeadForResourceDownload } from "@/lib/leads-server";
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
export type QuizAccessContext = {
  leadId: string | null;
  userId: string | null;
  firstName: string;
  email: string;
  role: LeadRoleValue;
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
  };
}

export async function resolveQuizAccessReadonly(params: {
  leadIdFromCookie?: string | null;
}): Promise<QuizAccessContext | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id && session.user.email) {
    return readAccessForUser(session.user.id, session.user.email);
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
      };
    }
  }

  return null;
}

export async function ensureQuizAccessForStart(params: {
  leadIdFromCookie?: string | null;
}): Promise<QuizAccessContext | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id && session.user.email) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
        playerFirstName: true,
        accountRole: true,
        accountHolderName: true,
      },
    });
    const email = normalizeLeadEmail(session.user.email);
    const firstName =
      user?.playerFirstName?.trim() ||
      user?.accountHolderName?.trim()?.split(/\s+/)[0] ||
      user?.name?.trim()?.split(/\s+/)[0] ||
      "Player";
    const role: LeadRoleValue = user?.accountRole === "PARENT" ? "PARENT" : "PLAYER";

    const { lead } = await upsertLeadForResourceDownload({
      email,
      firstName,
      role,
      resourceSlug: PLAYER_IQ_QUIZ_RESOURCE_SLUG,
    });

    return {
      leadId: lead.id,
      userId: session.user.id,
      firstName,
      email,
      role,
    };
  }

  const readonly = await resolveQuizAccessReadonly(params);
  if (!readonly?.leadId) {
    return null;
  }

  await prisma.leadResource.create({
    data: {
      leadId: readonly.leadId,
      resourceSlug: PLAYER_IQ_QUIZ_RESOURCE_SLUG,
    },
  });

  return readonly;
}

export async function resolveQuizAccess(params: {
  leadIdFromCookie?: string | null;
}): Promise<QuizAccessContext | null> {
  return resolveQuizAccessReadonly(params);
}

export async function createQuizAttemptForAccess(access: QuizAccessContext) {
  const created = await prisma.quizAttempt.create({
    data: {
      leadId: access.leadId,
      userId: access.userId,
      role: access.role as LeadRole,
      optionOrder: {},
      answers: {},
    },
    select: { id: true },
  });

  const optionOrder = buildOptionOrderForAttempt(created.id);

  const attempt = await prisma.quizAttempt.update({
    where: { id: created.id },
    data: { optionOrder },
    select: { id: true, optionOrder: true, role: true },
  });

  return attempt;
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

  return { ok: false as const, error: "UNAUTHORIZED" };
}

export async function completeQuizAttempt(params: {
  attemptId: string;
  answers: PlayerIqAnswers;
  access: QuizAccessContext;
}) {
  const gate = await assertCanAccessAttempt(params.attemptId, params.access);
  if (!gate.ok) {
    return gate;
  }

  const attempt = gate.attempt;
  if (attempt.completedAt) {
    return { ok: false as const, error: "ALREADY_COMPLETED" };
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

  return {
    ok: true as const,
    attempt: updated,
    score,
    categoryScores: categoryScores as PlayerIqCategoryScores,
    level: level as PlayerIqLevel,
    lowestCategory,
  };
}

export async function ensureLeadFromQuizForm(params: {
  firstName: string;
  email: string;
  role: LeadRoleValue;
}) {
  const { lead } = await upsertLeadForResourceDownload({
    email: params.email,
    firstName: params.firstName,
    role: params.role,
    resourceSlug: PLAYER_IQ_QUIZ_RESOURCE_SLUG,
  });
  return lead;
}
