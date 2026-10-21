"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAnswerFeedback, type PlayerIqAnswers } from "@/lib/player-iq-quiz-shared";

export type QuizQuestionPayload = {
  id: string;
  order: number;
  categoryLabel: string;
  prompt: string;
  options: { id: string; text: string }[];
};

type QuizRunnerProps = {
  attemptId: string;
  questions: QuizQuestionPayload[];
};

type Step = "question" | "feedback";

export default function QuizRunner({ attemptId, questions }: QuizRunnerProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("question");
  const [answers, setAnswers] = useState<PlayerIqAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const question = questions[index];
  const progress = question ? question.order : 0;

  const feedback = useMemo(() => {
    if (!question || step !== "feedback") {
      return null;
    }
    const selected = answers[question.id];
    if (!selected) {
      return null;
    }
    return getAnswerFeedback(question.id, selected);
  }, [answers, question, step]);

  if (!question) {
    return null;
  }

  const handleSelect = (optionId: string) => {
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
    setStep("feedback");
  };

  const handleNext = async () => {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      setStep("question");
      return;
    }

    setSubmitting(true);
    setError("");
    const response = await fetch(`/api/quiz/attempt/${attemptId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ answers: { ...answers, [question.id]: answers[question.id] } }),
    });
    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Unable to save results.");
      return;
    }

    router.push(`/quiz/results/${attemptId}`);
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm font-medium text-zinc-400">
          <span>Question {progress} of {questions.length}</span>
          <span className="text-[#52B788]">{question.categoryLabel}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#18243a]">
          <div
            className="h-full rounded-full bg-[#52B788] transition-all"
            style={{ width: `${(progress / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-xl font-semibold leading-snug text-white sm:text-2xl">
        {question.prompt}
      </h2>

      {step === "question" ? (
        <div className="mt-8 space-y-3">
          {question.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className="min-h-[56px] w-full rounded-2xl border border-[#2b3650] bg-[#0A1628] px-4 py-4 text-left text-base font-medium text-zinc-100 transition hover:border-[#52B788]/60 hover:bg-[#0d1c31]"
            >
              {option.text}
            </button>
          ))}
        </div>
      ) : null}

      {step === "feedback" && feedback ? (
        <div className="mt-8 space-y-4">
          <p
            className={`text-lg font-semibold ${feedback.correct ? "text-[#9df3bd]" : "text-amber-300"}`}
          >
            {feedback.correct ? "Correct" : "Not quite"}
          </p>
          {!feedback.correct ? (
            <p className="text-sm text-zinc-300">
              Correct answer: <span className="font-medium text-white">{feedback.correctOptionText}</span>
            </p>
          ) : null}
          <p className="text-sm leading-relaxed text-zinc-300">{feedback.why}</p>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleNext()}
            className="min-h-[52px] w-full rounded-full bg-[#2D6A4F] py-3.5 text-base font-semibold text-white hover:bg-[#52B788] disabled:opacity-60"
          >
            {submitting
              ? "Saving..."
              : index < questions.length - 1
                ? "Next"
                : "See my results"}
          </button>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
