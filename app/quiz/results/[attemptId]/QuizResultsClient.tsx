"use client";

import Link from "next/link";
import { useState } from "react";
import {
  buildResultsTitle,
  buildShareMessage,
  formatCategoryBreakdown,
  getPlayerIqCta,
  getPlayerIqLevelMessage,
  PLAYER_IQ_CATEGORY_TIPS,
  PLAYER_IQ_LEVEL_DISPLAY,
  type PlayerIqCategoryScores,
  type PlayerIqLevel,
} from "@/lib/player-iq-quiz-shared";
import type { LeadRoleValue } from "@/lib/resources-shared";
import { buildCalendlyUrlWithLead } from "@/lib/resources-lead-shared";
import { buildSwingAnalysisSignupUrl } from "@/lib/resources-lead-shared";
import { getPublicAppUrl } from "@/lib/public-app-url";

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
};

function resolveCtaHref(
  hrefKey: string,
  params: { firstName: string; email: string; role: LeadRoleValue },
) {
  const base = getPublicAppUrl();
  if (hrefKey === "calendly") {
    return buildCalendlyUrlWithLead(params.firstName, params.email);
  }
  if (hrefKey === "free-swing-analysis") {
    return `${base}${buildSwingAnalysisSignupUrl(params)}`;
  }
  if (hrefKey.startsWith("/")) {
    return `${base}${hrefKey}`;
  }
  return `${base}/${hrefKey}`;
}

export default function QuizResultsClient(props: QuizResultsClientProps) {
  const [copied, setCopied] = useState(false);
  const title = buildResultsTitle(props.firstName, props.score, props.level);
  const levelLabel = PLAYER_IQ_LEVEL_DISPLAY[props.level];
  const message = getPlayerIqLevelMessage(props.level, props.role);
  const cta = getPlayerIqCta(props.level, props.role);
  const ctaHref = resolveCtaHref(cta.primaryHref, {
    firstName: props.firstName,
    email: props.email,
    role: props.role,
  });
  const shareUrl = `${getPublicAppUrl()}/quiz`;
  const shareText = buildShareMessage(props.score);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Player IQ Quiz",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">Your results</p>
      <h1 className="mt-3 text-2xl font-semibold leading-snug text-white sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-zinc-400">{levelLabel}</p>

      <p className="mt-6 text-base text-zinc-200">
        {formatCategoryBreakdown(props.categoryScores)}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-zinc-300">{message}</p>
      <p className="mt-3 text-sm text-zinc-400">
        Tip: {PLAYER_IQ_CATEGORY_TIPS[props.lowestCategory]}
      </p>

      <Link
        href={ctaHref}
        className="mt-8 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#2D6A4F] px-4 py-3.5 text-center text-base font-semibold text-white hover:bg-[#52B788]"
      >
        {cta.primaryLabel}
      </Link>
      {cta.secondaryLine ? (
        <p className="mt-3 text-center text-sm text-zinc-400">{cta.secondaryLine}</p>
      ) : null}

      <button
        type="button"
        onClick={() => void handleShare()}
        className="mt-4 min-h-[48px] w-full rounded-full border border-[#2b3650] py-3 text-sm font-semibold text-zinc-200 hover:border-[#52B788]/50"
      >
        {copied ? "Link copied" : "Challenge a teammate"}
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
