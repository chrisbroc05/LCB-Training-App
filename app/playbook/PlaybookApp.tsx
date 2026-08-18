"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PLAYBOOK_CHAPTERS,
  type PlaybookSection,
} from "@/lib/playbook-content";
import { PLAYBOOK_LANDING_SUBHEADLINE, PLAYBOOK_NAME, PLAYBOOK_PDF_FILENAME } from "@/lib/playbook-branding";

type PlaybookReflection = {
  questionNumber: number;
  questionText: string;
  answer: string | null;
  sharedWithCoach: boolean;
  sharedAt: string | null;
};

type PlaybookChapterProgress = {
  chapterNumber: number;
  chapterTitle: string;
  completed: boolean;
  status: "not_started" | "in_progress" | "complete";
  reflections: PlaybookReflection[];
};

type PlaybookProgress = {
  overallComplete: boolean;
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  currentChapterNumber: number;
  chapters: PlaybookChapterProgress[];
};

type PlaybookView = "landing" | "chapter" | "complete";

function SectionContent({ section }: { section: PlaybookSection }) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-[#52B788]">{section.title}</h3>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-zinc-100">
          {paragraph}
        </p>
      ))}
      {section.pullQuote ? (
        <blockquote className="border-l-4 border-[#52B788] bg-[#52B788]/10 px-4 py-3 text-base italic text-zinc-100">
          {section.pullQuote}
        </blockquote>
      ) : null}
      {section.calloutTitle && section.calloutText ? (
        <div className="rounded-xl border border-[#2b3650] bg-black/30 p-4">
          <p className="font-semibold text-[#52B788]">{section.calloutTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-200">{section.calloutText}</p>
        </div>
      ) : null}
      {section.bulletList ? (
        <ul className="list-disc space-y-2 pl-5 text-zinc-100">
          {section.bulletList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function StatusIcon({ status }: { status: PlaybookChapterProgress["status"] }) {
  if (status === "complete") {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#52B788]/20 text-[#52B788]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    );
  }

  if (status === "in_progress") {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#52B788] bg-[#52B788]/15">
        <span className="h-3 w-3 rounded-full bg-[#52B788]" />
      </span>
    );
  }

  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-500 bg-zinc-700/30">
      <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
    </span>
  );
}

function chapterButtonLabel(status: PlaybookChapterProgress["status"]) {
  if (status === "complete") {
    return "Review";
  }

  if (status === "in_progress") {
    return "Continue";
  }

  return "Start Chapter";
}

export default function PlaybookApp() {
  const [progress, setProgress] = useState<PlaybookProgress | null>(null);
  const [view, setView] = useState<PlaybookView>("landing");
  const [activeChapter, setActiveChapter] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [hasSavedAnswers, setHasSavedAnswers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [completeMessage, setCompleteMessage] = useState("");
  const [shareAllMessage, setShareAllMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSharingAll, setIsSharingAll] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      const response = await fetch("/api/playbook/progress");
      console.log("Playbook API status:", response.status);

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as { error?: string };
        setProgress(null);
        setError(errorBody.error ?? "Unable to load playbook progress.");
        return null;
      }

      const data = (await response.json()) as {
        progress?: PlaybookProgress;
        error?: string;
      };
      console.log("Playbook API data:", data);

      const nextProgress = data.progress ?? null;
      if (!nextProgress || !Array.isArray(nextProgress.chapters)) {
        setProgress(null);
        setError("Playbook progress data was missing or invalid.");
        return null;
      }

      setError(null);
      setProgress(nextProgress);
      if (nextProgress.overallComplete) {
        setView((current) => (current === "chapter" ? current : "complete"));
      }
      return nextProgress;
    } catch (loadError) {
      console.error("Playbook progress fetch failed:", loadError);
      setProgress(null);
      setError("Something went wrong loading your playbook. Please refresh the page.");
      return null;
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      if (isActive) {
        setLoadTimedOut(true);
        setLoading(false);
        setError("Something went wrong. Please refresh the page.");
      }
    }, 8000);

    const init = async () => {
      setLoading(true);
      setLoadTimedOut(false);
      setError(null);
      await loadProgress();
      if (isActive) {
        setLoading(false);
        window.clearTimeout(timeoutId);
      }
    };

    void init();

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadProgress]);

  const chapterContent = useMemo(
    () => PLAYBOOK_CHAPTERS.find((chapter) => chapter.number === activeChapter),
    [activeChapter],
  );

  const chapterProgress = useMemo(
    () => progress?.chapters.find((chapter) => chapter.chapterNumber === activeChapter),
    [progress, activeChapter],
  );

  useEffect(() => {
    if (!chapterContent || !chapterProgress) {
      setAnswers({});
      setHasSavedAnswers(false);
      return;
    }

    const nextAnswers: Record<number, string> = {};
    chapterContent.reflectionQuestions.forEach((question, index) => {
      const saved = chapterProgress.reflections.find(
        (reflection) => reflection.questionNumber === index + 1,
      );
      nextAnswers[index + 1] = saved?.answer ?? "";
    });
    setAnswers(nextAnswers);
    setHasSavedAnswers(
      chapterProgress.reflections.some((reflection) => Boolean(reflection.answer?.trim())),
    );
    setSaveMessage("");
    setShareMessage("");
    setCompleteMessage("");
  }, [chapterContent, chapterProgress, activeChapter]);

  const openChapter = (chapterNumber: number) => {
    setActiveChapter(chapterNumber);
    setView("chapter");
  };

  const handleSaveAnswers = async () => {
    if (!chapterContent) {
      return;
    }

    setIsSaving(true);
    setSaveMessage("");
    setShareMessage("");
    setCompleteMessage("");

    try {
      for (let index = 0; index < chapterContent.reflectionQuestions.length; index += 1) {
        const questionNumber = index + 1;
        const response = await fetch("/api/playbook/reflection/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterNumber: activeChapter,
            questionNumber,
            questionText: chapterContent.reflectionQuestions[index],
            answer: answers[questionNumber] ?? "",
          }),
        });

        if (!response.ok) {
          setSaveMessage("Unable to save answers right now.");
          return;
        }
      }

      await loadProgress();
      setHasSavedAnswers(true);
      setSaveMessage("Answers saved");
    } catch {
      setSaveMessage("Unable to save answers right now.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareWithCoach = async () => {
    setIsSharing(true);
    setShareMessage("");

    try {
      const response = await fetch("/api/playbook/reflection/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterNumber: activeChapter }),
      });

      if (!response.ok) {
        setShareMessage("Unable to share answers right now.");
        return;
      }

      await loadProgress();
      setShareMessage(
        "Your answers have been shared with Coach Broc. He will review them before your next coaching session.",
      );
    } catch {
      setShareMessage("Unable to share answers right now.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleMarkComplete = async () => {
    setIsCompleting(true);
    setCompleteMessage("");

    try {
      const response = await fetch("/api/playbook/chapter/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterNumber: activeChapter }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        allComplete?: boolean;
      };

      if (!response.ok) {
        setCompleteMessage(data.error ?? "Unable to mark chapter complete.");
        return;
      }

      const updated = await loadProgress();
      setCompleteMessage(`Chapter ${activeChapter} complete. Keep going.`);

      if (data.allComplete || updated?.overallComplete) {
        setView("complete");
      }
    } catch {
      setCompleteMessage("Unable to mark chapter complete.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch("/api/playbook/download");
      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = PLAYBOOK_PDF_FILENAME;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareAll = async () => {
    setIsSharingAll(true);
    setShareAllMessage("");

    try {
      const response = await fetch("/api/playbook/reflection/share-all", {
        method: "POST",
      });

      if (!response.ok) {
        setShareAllMessage("Unable to share your progress right now.");
        return;
      }

      await loadProgress();
      setShareAllMessage(
        "Your answers have been shared with Coach Broc. He will review them before your next coaching session.",
      );
    } catch {
      setShareAllMessage("Unable to share your progress right now.");
    } finally {
      setIsSharingAll(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-20 text-center">
        <p className="text-zinc-300">
          {loadTimedOut
            ? "Something went wrong. Please refresh the page."
            : "Something went wrong loading your playbook. Please refresh the page."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-20 text-center text-zinc-400">
        Loading your playbook...
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-20 text-center">
        <p className="text-zinc-300">Unable to load playbook progress.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (view === "complete") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
        <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-6 text-center sm:p-10">
          <h1 className="text-3xl font-bold text-zinc-100 sm:text-4xl">You finished the playbook.</h1>
          <p className="mt-3 text-lg text-zinc-300">Now go do the work.</p>
          <blockquote className="mx-auto mt-8 max-w-xl border-l-4 border-[#52B788] bg-[#52B788]/10 px-4 py-3 text-left italic text-zinc-100">
            Consistency and discipline will take you further than talent ever will. -- Coach Broc
          </blockquote>

          <div className="mt-8 flex flex-col gap-3 sm:items-center">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex rounded-full bg-[#22c55e] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDownloading ? "Generating PDF..." : "Download Your Full Playbook + Reflections"}
            </button>
            <button
              type="button"
              onClick={handleShareAll}
              disabled={isSharingAll}
              className="inline-flex rounded-full border border-[#52B788] bg-transparent px-6 py-3 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSharingAll ? "Sharing..." : "Share Your Progress With Coach Broc"}
            </button>
            <Link
              href="/upgrade?reason=memorable-required"
              className="inline-flex rounded-full border border-[#2b3650] bg-[#0A1628] px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-[#52B788] hover:text-[#9df3bd]"
            >
              Upgrade to Memorable
            </Link>
          </div>

          {shareAllMessage ? <p className="mt-4 text-sm text-[#9df3bd]">{shareAllMessage}</p> : null}

          <button
            type="button"
            onClick={() => setView("landing")}
            className="mt-8 text-sm text-zinc-400 underline-offset-2 hover:text-[#9df3bd] hover:underline"
          >
            Back to chapter overview
          </button>
        </section>
      </div>
    );
  }

  if (view === "chapter" && chapterContent) {
    const nextChapter = activeChapter < PLAYBOOK_CHAPTERS.length ? activeChapter + 1 : null;
    const chapterShared = chapterProgress?.reflections.some((reflection) => reflection.sharedWithCoach);

    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
        <button
          type="button"
          onClick={() => setView("landing")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-300 transition hover:text-[#9df3bd]"
        >
          <span aria-hidden="true">&larr;</span>
          Back to Playbook
        </button>

        <header className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#52B788]">
            Chapter {activeChapter} of {PLAYBOOK_CHAPTERS.length}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-100 sm:text-3xl">
            Chapter {activeChapter}: {chapterContent.title}
          </h1>
          <p className="mt-2 text-zinc-300">{chapterContent.subtitle}</p>
        </header>

        <article className="mt-8 space-y-10 rounded-3xl border border-[#18243a] bg-[#0A1628] p-5 sm:p-8">
          {chapterContent.sections.map((section) => (
            <SectionContent key={section.title} section={section} />
          ))}
        </article>

        <section className="mt-8 rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-zinc-100">Your Reflections</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Take a few minutes to answer these honestly. Your answers save to your account and you
            can come back to them anytime.
          </p>

          <div className="mt-6 space-y-5">
            {chapterContent.reflectionQuestions.map((question, index) => {
              const questionNumber = index + 1;
              return (
                <label key={question} className="block text-sm text-zinc-200">
                  {question}
                  <textarea
                    value={answers[questionNumber] ?? ""}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [questionNumber]: event.target.value,
                      }))
                    }
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-[#2b3650] bg-black/40 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleSaveAnswers}
              disabled={isSaving}
              className="inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save My Answers"}
            </button>
            <button
              type="button"
              onClick={handleShareWithCoach}
              disabled={isSharing || !hasSavedAnswers}
              className="inline-flex rounded-full border border-[#52B788] bg-transparent px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSharing ? "Sharing..." : "Share With Coach Broc"}
            </button>
          </div>

          {saveMessage ? <p className="mt-3 text-sm text-[#9df3bd]">{saveMessage}</p> : null}
          {shareMessage || (chapterShared && !shareMessage) ? (
            <p className="mt-3 text-sm text-[#9df3bd]">
              {shareMessage ||
                "Your answers have been shared with Coach Broc. He will review them before your next coaching session."}
            </p>
          ) : null}

          {hasSavedAnswers ? (
            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={isCompleting || chapterProgress?.completed}
              className="mt-8 inline-flex rounded-full border border-[#52B788] bg-[#0A1628] px-5 py-2.5 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chapterProgress?.completed
                ? "Chapter Complete"
                : isCompleting
                  ? "Saving..."
                  : "Mark Chapter Complete"}
            </button>
          ) : null}

          {completeMessage ? <p className="mt-3 text-sm text-[#9df3bd]">{completeMessage}</p> : null}
        </section>

        {nextChapter ? (
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => openChapter(nextChapter)}
              className="inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
            >
              Next Chapter
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">{PLAYBOOK_NAME}</h1>
        <p className="mt-3 max-w-3xl text-zinc-300">{PLAYBOOK_LANDING_SUBHEADLINE}</p>

        <div className="mt-8">
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

        <button
          type="button"
          onClick={() => openChapter(progress.currentChapterNumber)}
          className="mt-6 inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
        >
          Continue Reading
        </button>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {PLAYBOOK_CHAPTERS.map((chapter) => {
          const chapterState = progress.chapters.find(
            (item) => item.chapterNumber === chapter.number,
          );
          const status = chapterState?.status ?? "not_started";

          return (
            <article
              key={chapter.number}
              className="flex flex-col rounded-2xl border border-[#18243a] bg-[#0A1628] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#52B788]">
                    Chapter {chapter.number}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-zinc-100">{chapter.title}</h2>
                  <p className="mt-2 text-sm text-zinc-400">{chapter.cardDescription}</p>
                </div>
                <StatusIcon status={status} />
              </div>
              <button
                type="button"
                onClick={() => openChapter(chapter.number)}
                className="mt-5 inline-flex w-full justify-center rounded-full border border-[#52B788] bg-transparent px-4 py-2 text-sm font-semibold text-[#52B788] transition hover:bg-[#52B788]/10 sm:w-auto sm:self-start"
              >
                {chapterButtonLabel(status)}
              </button>
            </article>
          );
        })}
      </div>

      <section className="mt-8 rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-6">
        {progress.overallComplete ? (
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? "Generating PDF..." : "Download Your Playbook"}
          </button>
        ) : (
          <div>
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed rounded-full bg-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-400 opacity-70"
            >
              Download Your Playbook
            </button>
            <p className="mt-3 text-sm text-zinc-400">
              Complete all chapters to unlock your PDF download
            </p>
          </div>
        )}
      </section>

      {progress.overallComplete ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setView("complete")}
            className="text-sm text-[#9df3bd] underline-offset-2 hover:underline"
          >
            View completion celebration
          </button>
        </div>
      ) : null}
    </div>
  );
}
