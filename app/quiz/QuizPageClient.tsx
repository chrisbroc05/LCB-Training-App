"use client";

import { useCallback, useEffect, useState } from "react";
import ResourceLeadModal from "@/app/resources/ResourceLeadModal";
import QuizRunner, { type QuizQuestionPayload } from "@/app/quiz/QuizRunner";
import { getResourceDefinition } from "@/lib/resources-shared";
import type { ResourceLeadActionResult } from "@/lib/resources-lead-shared";
import {
  PLAYER_IQ_QUIZ_CARD_DESCRIPTION,
  PLAYER_IQ_QUIZ_CARD_TITLE,
  PLAYER_IQ_QUIZ_LANDING_SUBLINE,
  PLAYER_IQ_QUIZ_RESOURCE_SLUG,
} from "@/lib/player-iq-quiz-shared";

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "ready"; firstName: string };

type ActiveQuiz = {
  attemptId: string;
  questions: QuizQuestionPayload[];
};

export default function QuizPageClient() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [error, setError] = useState("");

  const quizResource = getResourceDefinition(PLAYER_IQ_QUIZ_RESOURCE_SLUG);

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/quiz/session", { credentials: "include" });
    const data = (await response.json()) as {
      hasAccess?: boolean;
      firstName?: string;
    };
    if (data.hasAccess && data.firstName) {
      setSession({ status: "ready", firstName: data.firstName });
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
    const response = await fetch("/api/quiz/attempt/start", {
      method: "POST",
      credentials: "include",
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

  const handleLeadSuccess = (_result: ResourceLeadActionResult) => {
    void refreshSession().then(() => {
      void startQuiz();
    });
  };

  if (activeQuiz) {
    return (
      <QuizRunner attemptId={activeQuiz.attemptId} questions={activeQuiz.questions} />
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

      {session.status === "ready" ? (
        <p className="mt-6 text-sm text-zinc-400">Hi {session.firstName}. Ready when you are.</p>
      ) : null}

      <button
        type="button"
        disabled={starting}
        onClick={() => {
          if (session.status === "guest") {
            setLeadModalOpen(true);
            return;
          }
          void startQuiz();
        }}
        className="mt-8 min-h-[52px] w-full rounded-full bg-[#2D6A4F] py-3.5 text-base font-semibold text-white hover:bg-[#52B788] disabled:opacity-60"
      >
        {starting ? "Starting..." : "Start"}
      </button>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      {leadModalOpen && quizResource ? (
        <ResourceLeadModal
          resource={quizResource}
          onClose={() => setLeadModalOpen(false)}
          onSuccess={handleLeadSuccess}
        />
      ) : null}
    </div>
  );
}
