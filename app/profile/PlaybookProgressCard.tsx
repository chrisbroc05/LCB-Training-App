"use client";

import Link from "next/link";
import ProfileCard from "@/app/profile/ProfileCard";
import {
  profileBodyTextClass,
  profileMutedTextClass,
  profilePrimaryButtonClass,
} from "@/app/profile/profile-styles";

type PlaybookChapter = {
  chapterNumber: number;
  chapterTitle: string;
  completed: boolean;
  completedAt: string | null;
  status: "not_started" | "in_progress" | "complete";
};

type PlaybookProgressCardProps = {
  progress: {
    overallComplete: boolean;
    percentComplete: number;
    completedCount: number;
    totalCount: number;
    currentChapterNumber: number;
    chapters: PlaybookChapter[];
  };
};

function formatCompletedDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function ChapterStatusIcon({ completed, inProgress }: { completed: boolean; inProgress: boolean }) {
  if (completed) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#52B788]/20 text-[#52B788]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    );
  }

  if (inProgress) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#52B788] bg-[#52B788]/15">
        <span className="h-2.5 w-2.5 rounded-full bg-[#52B788]" />
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-500 bg-zinc-700/30">
      <span className="h-2 w-2 rounded-full bg-zinc-500" />
    </span>
  );
}

export default function PlaybookProgressCard({ progress }: PlaybookProgressCardProps) {
  const hasStarted = progress.chapters.some(
    (chapter) => chapter.status === "in_progress" || chapter.status === "complete",
  );
  const continueLabel = hasStarted ? "Continue Reading" : "Start Reading";

  const handleDownload = async () => {
    const response = await fetch("/api/playbook/download");
    if (!response.ok) {
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "LCB_Training_Playbook.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <ProfileCard title="Your Playbook">
      <div>
        <div className="flex items-center justify-between text-sm text-zinc-300">
          <span>
            {progress.completedCount} of {progress.totalCount} chapters complete
          </span>
          <span>{progress.percentComplete}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#0A1628]">
          <div
            className="h-full rounded-full bg-[#52B788] transition-all"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {progress.chapters.map((chapter) => {
          const completedDate = formatCompletedDate(chapter.completedAt);
          return (
            <div
              key={chapter.chapterNumber}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#2b3650] bg-black/30 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <ChapterStatusIcon
                  completed={chapter.completed}
                  inProgress={chapter.status === "in_progress"}
                />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    Chapter {chapter.chapterNumber}: {chapter.chapterTitle}
                  </p>
                  {completedDate ? (
                    <p className="mt-0.5 text-xs text-zinc-400">Completed {completedDate}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {progress.overallComplete ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-[#9df3bd]">Playbook Complete</p>
          <button type="button" onClick={handleDownload} className={profilePrimaryButtonClass}>
            Download Your Playbook PDF
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {!hasStarted ? (
            <p className={profileBodyTextClass}>
              Your playbook is waiting. Start Chapter 1 today.
            </p>
          ) : null}
          <Link href="/playbook" className={profilePrimaryButtonClass}>
            {continueLabel}
          </Link>
        </div>
      )}
    </ProfileCard>
  );
}
