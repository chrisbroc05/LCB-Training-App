"use client";

import Link from "next/link";
import { useState } from "react";
import {
  buildQuizChallengeSharePayload,
  formatPlayerIqResultsGreeting,
  formatPlayerIqResultsHeadline,
  getCategoriesForResultsCards,
  getPlayerIqCta,
  getPlayerIqLevelMessage,
  PLAYER_IQ_CATEGORY_TIPS,
  type PlayerIqCategoryScores,
  type PlayerIqLevel,
} from "@/lib/player-iq-quiz-shared";
import type { LeadRoleValue } from "@/lib/resources-shared";
import { buildCalendlyUrlWithLead } from "@/lib/resources-lead-shared";

export type ReviewItem = {
  order: number;
  prompt: string;
  selectedText: string;
  correctText: string;
  correct: boolean;
  why: string;
  sourceUrl?: string;
};

type QuizResultsClientProps = {
  attemptId: string;
  firstName: string;
  email: string;
  role: LeadRoleValue;
  score: number;
  level: PlayerIqLevel;
  categoryScores: PlayerIqCategoryScores;
  lowestCategory: keyof typeof PLAYER_IQ_CATEGORY_TIPS;
  review: ReviewItem[];
  isLoggedIn: boolean;
};

function resolveSwingBreakdownHref(params: {
  isLoggedIn: boolean;
  role: LeadRoleValue;
  firstName: string;
  email: string;
  ctaKey: string;
}) {
  if (params.role === "COACH") {
    if (params.ctaKey === "calendly") {
      return buildCalendlyUrlWithLead(params.firstName, params.email);
    }
    return "/swing-analysis";
  }
  if (params.isLoggedIn) {
    return "/swing-analysis";
  }
  if (params.ctaKey === "free-swing-analysis") {
    return "/free-swing-breakdown";
  }
  if (params.ctaKey.startsWith("/")) {
    return params.ctaKey;
  }
  return `/${params.ctaKey}`;
}

export default function QuizResultsClient(props: QuizResultsClientProps) {
  const [copied, setCopied] = useState(false);
  const headline = formatPlayerIqResultsHeadline(props.score, props.level);
  const subline = formatPlayerIqResultsGreeting(props.firstName);
  const message = getPlayerIqLevelMessage(props.level, props.role);
  const cta = getPlayerIqCta(props.level, props.role);

  const isCoach = props.role === "COACH";
  const swingHref = isCoach
    ? resolveSwingBreakdownHref({
        isLoggedIn: props.isLoggedIn,
        role: props.role,
        firstName: props.firstName,
        email: props.email,
        ctaKey: cta.primaryHref,
      })
    : props.isLoggedIn
      ? "/swing-analysis"
      : "/free-swing-breakdown";

  const isExternalCoachCalendly = isCoach && cta.primaryHref === "calendly";
  const primaryButtonLabel = isCoach ? cta.primaryLabel : "Get Your Free Swing Breakdown";

  const categoryCards = getCategoriesForResultsCards(props.categoryScores);
  const tipCategory = categoryCards.find((c) => c.isFocus)?.key ?? props.lowestCategory;

  const { message: shareMessage, url: shareUrl, fullText: shareFullText } =
    buildQuizChallengeSharePayload(props.score);

  const handleChallenge = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Player IQ Quiz",
          text: shareMessage,
          url: shareUrl,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareFullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const swingButtonClass =
    "mt-8 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#22c55e] px-4 py-3.5 text-center text-base font-semibold text-black transition hover:bg-[#35db72]";

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">YOUR RESULTS</p>
      <h1 className="mt-3 text-2xl font-semibold leading-snug text-white sm:text-3xl">{headline}</h1>
      <p className="mt-3 text-base leading-relaxed text-zinc-300">{subline}</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {categoryCards.map((card) => (
          <div
            key={card.key}
            className={`rounded-2xl border border-[#18243a] bg-[#0b1324] p-3 ${
              card.isFocus ? "ring-1 ring-[#52B788]/40" : ""
            }`}
          >
            <div className="flex min-h-[22px] flex-wrap items-center gap-1">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{card.label}</p>
              {card.isFocus ? (
                <span className="rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9df3bd]">
                  Your focus
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-lg font-semibold text-white">
              {card.score}/{card.max}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#18243a]">
              <div
                className="h-full rounded-full bg-[#52B788] transition-all"
                style={{ width: `${(card.score / card.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm leading-relaxed text-zinc-300">{message}</p>
      <p className="mt-3 text-sm text-zinc-400">
        Tip: {PLAYER_IQ_CATEGORY_TIPS[tipCategory]}
      </p>

      {isExternalCoachCalendly ? (
        <a
          href={swingHref}
          className={swingButtonClass}
          target="_blank"
          rel="noopener noreferrer"
        >
          {primaryButtonLabel}
        </a>
      ) : (
        <Link href={swingHref} className={swingButtonClass}>
          {primaryButtonLabel}
        </Link>
      )}

      <p className="mt-8 text-center text-sm text-zinc-400">
        Think a teammate can beat your score?
      </p>
      <button
        type="button"
        onClick={() => void handleChallenge()}
        className="mt-2 min-h-[48px] w-full rounded-full border border-[#2b3650] py-3 text-sm font-semibold text-zinc-200 hover:border-[#52B788]/50"
      >
        {copied ? "Copied! Send it to a teammate." : "Challenge a Teammate"}
      </button>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">Review</h2>
        <ul className="mt-4 space-y-6">
          {props.review.map((item) => (
            <li
              key={item.order}
              className="rounded-2xl border border-[#18243a] bg-[#0b1324] p-4"
            >
              <p className="text-xs font-bold text-[#52B788]">Question {item.order}</p>
              <p className="mt-2 font-medium text-zinc-100">{item.prompt}</p>
              <p className="mt-2 text-sm text-zinc-300">
                Your answer:{" "}
                <span className={item.correct ? "text-[#9df3bd]" : "text-amber-200"}>
                  {item.selectedText}
                </span>
              </p>
              {!item.correct ? (
                <p className="mt-1 text-sm text-zinc-300">Correct: {item.correctText}</p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.why}</p>
              {item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-semibold text-[#52B788] underline"
                >
                  Source
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
