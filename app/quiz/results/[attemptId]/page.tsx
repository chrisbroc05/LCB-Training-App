import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import QuizResultsClient, {
  type ReviewItem,
} from "@/app/quiz/results/[attemptId]/QuizResultsClient";
import {
  assertCanAccessAttempt,
  resolveQuizAccessReadonly,
} from "@/lib/player-iq-quiz-server";
import {
  getAnswerFeedback,
  getLowestPlayerIqCategory,
  getOptionsForQuestionInOrder,
  getOptionText,
  PLAYER_IQ_QUESTIONS,
  type PlayerIqAnswers,
  type PlayerIqCategoryScores,
  type PlayerIqLevel,
} from "@/lib/player-iq-quiz-shared";
import type { LeadRoleValue } from "@/lib/resources-shared";
import { LEAD_COOKIE_NAME } from "@/lib/resources-lead-shared";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ attemptId: string }> };

export default async function QuizResultsPage({ params }: PageProps) {
  const { attemptId } = await params;
  const cookieStore = await cookies();
  const leadIdFromCookie = cookieStore.get(LEAD_COOKIE_NAME)?.value ?? null;
  const access = await resolveQuizAccessReadonly({ leadIdFromCookie });
  const gate = await assertCanAccessAttempt(attemptId, access);

  if (!gate.ok) {
    redirect("/quiz");
  }

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      lead: { select: { firstName: true, email: true } },
      user: { select: { name: true, email: true, playerFirstName: true, accountHolderName: true } },
    },
  });

  if (!attempt?.completedAt || attempt.score === null || !attempt.level) {
    redirect("/quiz");
  }

  const firstName =
    attempt.lead?.firstName ??
    attempt.user?.playerFirstName?.trim() ??
    attempt.user?.accountHolderName?.trim()?.split(/\s+/)[0] ??
    attempt.user?.name?.trim()?.split(/\s+/)[0] ??
    "Player";
  const email = attempt.lead?.email ?? attempt.user?.email ?? "";
  const answers = attempt.answers as PlayerIqAnswers;
  const optionOrder = attempt.optionOrder as Record<string, string[]>;
  const categoryScores = attempt.categoryScores as PlayerIqCategoryScores;

  const review: ReviewItem[] = PLAYER_IQ_QUESTIONS.map((question) => {
    const selectedId = answers[question.id] ?? "";
    const feedback = getAnswerFeedback(question.id, selectedId);
    const options = getOptionsForQuestionInOrder(question, optionOrder);
    const selectedText =
      options.find((option) => option.id === selectedId)?.text ??
      getOptionText(question.id, selectedId);
    return {
      order: question.order,
      prompt: question.prompt,
      selectedText,
      correctText: feedback?.correctOptionText ?? "",
      correct: Boolean(feedback?.correct),
      why: question.why,
      sourceUrl: question.sourceUrl,
    };
  });

  return (
    <div className="min-h-screen bg-black">
      <QuizResultsClient
        attemptId={attemptId}
        firstName={firstName}
        email={email}
        role={attempt.role as LeadRoleValue}
        score={attempt.score}
        level={attempt.level as PlayerIqLevel}
        categoryScores={categoryScores}
        lowestCategory={getLowestPlayerIqCategory(categoryScores)}
        review={review}
      />
    </div>
  );
}
