"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import QuizRunner, { type QuizQuestionPayload } from "@/app/quiz/QuizRunner";
import {
  PLAYER_IQ_QUIZ_CARD_DESCRIPTION,
  PLAYER_IQ_QUIZ_CARD_TITLE,
  PLAYER_IQ_QUIZ_LANDING_SUBLINE,
} from "@/lib/player-iq-quiz-shared";
import { QUIZ_REFERRAL_CHALLENGE } from "@/lib/quiz-session-cookies";

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "loggedIn"; firstName: string };

type ActiveQuiz = {
  attemptId: string;
  questions: QuizQuestionPayload[];
};

export default function QuizPageClient() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [starting, setStarting] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [error, setError] = useState("");

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/quiz/session", { credentials: "include" });
    const data = (await response.json()) as {
      hasAccess?: boolean;
      loggedIn?: boolean;
      firstName?: string;
    };
    if (data.loggedIn && data.firstName) {
      setSession({ status: "loggedIn", firstName: data.firstName });
      return;
    }
    setSession({ status: "guest" });
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const startQuiz = async () => {
    setStarting(true);
    setError("");
    const refParam = searchParams.get("ref")?.trim().toLowerCase();
    const refBody = refParam === QUIZ_REFERRAL_CHALLENGE ? QUIZ_REFERRAL_CHALLENGE : undefined;

    const response = await fetch("/api/quiz/attempt/start", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refBody ? { ref: refBody } : {}),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      attemptId?: string;
      questions?: QuizQuestionPayload[];
    };
    setStarting(false);

    if (!response.ok || !data.attemptId || !data.questions) {
      setError(data.error ?? "Unable to start the quiz.");
      return;
    }

    setActiveQuiz({ attemptId: data.attemptId, questions: data.questions });
  };

  if (activeQuiz) {
    return (
      <QuizRunner
        attemptId={activeQuiz.attemptId}
        questions={activeQuiz.questions}
        isLoggedIn={session.status === "loggedIn"}
      />
    );
  }

  if (session.status === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-400">Loading...</div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">Free quiz</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">{PLAYER_IQ_QUIZ_CARD_TITLE}</h1>
      <p className="mt-4 text-base leading-relaxed text-zinc-300">
        {PLAYER_IQ_QUIZ_CARD_DESCRIPTION}
      </p>
      <p className="mt-3 text-sm font-medium text-zinc-400">{PLAYER_IQ_QUIZ_LANDING_SUBLINE}</p>

      {session.status === "loggedIn" ? (
        <p className="mt-6 text-sm text-zinc-400">
          Hi {session.firstName}. Ready when you are.
        </p>
      ) : null}

      <button
        type="button"
        disabled={starting}
        onClick={() => void startQuiz()}
        className="mt-8 min-h-[52px] w-full rounded-full bg-[#2D6A4F] py-3.5 text-base font-semibold text-white hover:bg-[#52B788] disabled:opacity-60"
      >
        {starting ? "Starting..." : "Start"}
      </button>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
