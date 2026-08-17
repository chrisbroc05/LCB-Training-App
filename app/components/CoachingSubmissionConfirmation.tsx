"use client";

import Link from "next/link";
import { FreeMemberWhileYouWaitSection } from "@/app/components/FreeMemberWhileYouWaitCards";

type CoachingSubmissionConfirmationProps = {
  isFreeMember: boolean;
  summary?: React.ReactNode;
  onClose?: () => void;
};

export default function CoachingSubmissionConfirmation({
  isFreeMember,
  summary,
  onClose,
}: CoachingSubmissionConfirmationProps) {
  if (!isFreeMember) {
    return (
      <div className="w-[94vw] max-w-2xl rounded-2xl border border-[#2b3650] bg-[#0b1324] p-5 shadow-2xl sm:p-6 md:p-8">
        <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">Submission Received</h2>
        {summary ? <div className="mt-4">{summary}</div> : null}
        <p className="mt-4 text-sm text-[#9df3bd]">You will hear back within 48 hours.</p>
        <div className="mt-6 flex justify-end">
          <Link
            href="/dashboard"
            className="rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[90vh] w-[94vw] max-w-3xl overflow-y-auto rounded-2xl border border-[#2b3650] bg-[#0b1324] p-5 shadow-2xl sm:p-6 md:p-8">
      <h2 className="text-xl font-semibold text-zinc-100 sm:text-2xl">You are all set.</h2>
      <p className="mt-2 text-sm text-zinc-300 sm:text-base">
        Coach Broc will personally review your submission and get back to you within 48 hours.
      </p>

      {summary ? <div className="mt-5">{summary}</div> : null}

      <div className="mt-8 border-t border-[#2b3650] pt-8">
        <FreeMemberWhileYouWaitSection usePlaybookCheckout />
      </div>

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
    </div>
  );
}
