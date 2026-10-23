"use client";

import Link from "next/link";
import { FreeMemberWhileYouWaitSection } from "@/app/components/FreeMemberWhileYouWaitCards";
import type {
  SwingSubmissionConfirmationVariant,
} from "@/lib/coaching-submission-confirmation-shared";
import {
  COACH_PERSONAL_RESPONSE_WITHIN_FEW_DAYS,
  COACH_VIDEO_BREAKDOWN_WITHIN_FEW_DAYS,
  COACH_WRITTEN_REPORT_WITHIN_FEW_DAYS,
} from "@/lib/coaching-response-time-shared";

type CoachingSubmissionConfirmationProps = {
  variant: SwingSubmissionConfirmationVariant | "FREE" | "PREMIUM_VIDEO";
  summary?: React.ReactNode;
  onClose?: () => void;
  weeklyFocusTitle?: string | null;
};

function CoreOrgWhileYouWait(props: { weeklyFocusTitle?: string | null }) {
  return (
    <div className="mt-8 space-y-4 border-t border-[#2b3650] pt-8">
      <p className="text-sm font-medium text-zinc-200 sm:text-base">While you wait</p>
      <ul className="space-y-2 text-sm text-zinc-300">
        <li>
          <Link
            href="/drill-library"
            className="font-semibold text-[#52B788] underline-offset-2 hover:text-[#9df3bd] hover:underline"
          >
            Open your drills in Train
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard"
            className="font-semibold text-[#52B788] underline-offset-2 hover:text-[#9df3bd] hover:underline"
          >
            {props.weeklyFocusTitle
              ? `This week focus: ${props.weeklyFocusTitle}`
              : "View this week team focus on your dashboard"}
          </Link>
        </li>
      </ul>
      <p className="text-sm text-zinc-400">
        Want more from Coach Broc? Message him or email{" "}
        <a
          href="mailto:chrisbroc05@gmail.com"
          className="font-semibold text-[#52B788] underline-offset-2 hover:underline"
        >
          chrisbroc05@gmail.com
        </a>
        .
      </p>
    </div>
  );
}

export default function CoachingSubmissionConfirmation({
  variant,
  summary,
  onClose,
  weeklyFocusTitle,
}: CoachingSubmissionConfirmationProps) {
  const panelClassName =
    "max-h-[90vh] w-[94vw] max-w-3xl overflow-y-auto rounded-2xl border border-[#2b3650] bg-[#0b1324] p-5 shadow-2xl sm:p-6 md:p-8";

  if (variant === "WRITTEN_REPORT") {
    return (
      <div className={panelClassName}>
        <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">You are all set.</h2>
        <p className="mt-2 text-sm text-zinc-300 sm:text-base">{COACH_WRITTEN_REPORT_WITHIN_FEW_DAYS}</p>
        {summary ? <div className="mt-5">{summary}</div> : null}
        <CoreOrgWhileYouWait weeklyFocusTitle={weeklyFocusTitle} />
        {renderFooter(onClose)}
      </div>
    );
  }

  if (variant === "FREE") {
    return (
      <div className={panelClassName}>
        <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">You are all set.</h2>
        <p className="mt-2 text-sm text-zinc-300 sm:text-base">
          {COACH_PERSONAL_RESPONSE_WITHIN_FEW_DAYS}
        </p>
        {summary ? <div className="mt-5">{summary}</div> : null}
        <div className="mt-8 border-t border-[#2b3650] pt-8">
          <FreeMemberWhileYouWaitSection showDashboardFooter={false} />
        </div>
        {renderFooter(onClose)}
      </div>
    );
  }

  return (
    <div className={panelClassName}>
      <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Submission received</h2>
      <p className="mt-2 text-sm text-zinc-300 sm:text-base">{COACH_VIDEO_BREAKDOWN_WITHIN_FEW_DAYS}</p>
      {summary ? <div className="mt-5">{summary}</div> : null}
      {renderFooter(onClose)}
    </div>
  );
}

function renderFooter(onClose?: () => void) {
  return (
    <div className="mt-6 flex justify-end">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[#2b3650] bg-black/40 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-[#7f9434] hover:text-[#98b144]"
        >
          Close
        </button>
      ) : (
        <Link
          href="/dashboard"
          className="rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Go to Dashboard
        </Link>
      )}
    </div>
  );
}
