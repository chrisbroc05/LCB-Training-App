"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDatabaseTierLabel, type DatabaseTier } from "@/lib/membership";

type SharedReflection = {
  questionNumber: number;
  questionText: string;
  answer: string | null;
};

type SharedChapter = {
  chapterNumber: number;
  chapterTitle: string;
  sharedAt: string | null;
  reflections: SharedReflection[];
};

type PlaybookReflectionMember = {
  userId: string;
  memberName: string;
  memberEmail: string;
  membershipTier: DatabaseTier;
  latestSharedAt: string | null;
  chapters: SharedChapter[];
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PlaybookReflectionsPanel() {
  const [members, setMembers] = useState<PlaybookReflectionMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      setLoadingList(true);
      const response = await fetch("/api/admin/playbook-reflections");
      setLoadingList(false);

      if (!response.ok) {
        setMembers([]);
        return;
      }

      const data = (await response.json()) as { members: PlaybookReflectionMember[] };
      setMembers(data.members);
    };

    void loadMembers();
  }, []);

  const selectedMember = useMemo(
    () => members.find((member) => member.userId === selectedUserId) ?? null,
    [members, selectedUserId],
  );

  const listRows = useMemo(() => {
    const rows: Array<{
      key: string;
      userId: string;
      memberName: string;
      memberEmail: string;
      membershipTier: DatabaseTier;
      chapterNumber: number;
      chapterTitle: string;
      sharedAt: string | null;
    }> = [];

    for (const member of members) {
      for (const chapter of member.chapters) {
        if (chapter.reflections.length === 0) {
          continue;
        }

        rows.push({
          key: `${member.userId}-${chapter.chapterNumber}`,
          userId: member.userId,
          memberName: member.memberName,
          memberEmail: member.memberEmail,
          membershipTier: member.membershipTier,
          chapterNumber: chapter.chapterNumber,
          chapterTitle: chapter.chapterTitle,
          sharedAt: chapter.sharedAt,
        });
      }
    }

    return rows.sort((a, b) => {
      const aTime = a.sharedAt ? new Date(a.sharedAt).getTime() : 0;
      const bTime = b.sharedAt ? new Date(b.sharedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [members]);

  return (
    <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="rounded-2xl border border-[#18243a] bg-black/30 p-3 sm:p-4">
        <h2 className="text-lg font-semibold text-zinc-100">Playbook Reflections</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Members who shared chapter reflections with Coach Broc.
        </p>

        <div className="mt-4 space-y-3">
          {loadingList ? <p className="text-sm text-zinc-400">Loading reflections...</p> : null}
          {!loadingList && listRows.length === 0 ? (
            <p className="text-sm text-zinc-400">No shared reflections yet.</p>
          ) : null}
          {listRows.map((row) => {
            const isSelected = selectedUserId === row.userId;

            return (
              <button
                key={row.key}
                type="button"
                onClick={() => setSelectedUserId(row.userId)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  isSelected
                    ? "border-[#52B788] bg-[#52B788]/10"
                    : "border-[#2b3650] bg-[#0b1324]/70 hover:border-[#7f9434]"
                }`}
              >
                <p className="text-sm font-semibold text-zinc-100">{row.memberName}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Chapter {row.chapterNumber}: {row.chapterTitle}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{formatDateTime(row.sharedAt)}</p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="rounded-2xl border border-[#18243a] bg-black/30 p-4 sm:p-5">
        {!selectedMember ? (
          <p className="text-sm text-zinc-400">Select a member to view shared reflections.</p>
        ) : (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">{selectedMember.memberName}</h3>
              <p className="mt-1 text-sm text-zinc-300">{selectedMember.memberEmail}</p>
              <p className="mt-2 text-xs text-zinc-400">
                {formatDatabaseTierLabel(selectedMember.membershipTier)} member
              </p>
            </div>

            {selectedMember.chapters.map((chapter) => {
              if (chapter.reflections.length === 0) {
                return null;
              }

              return (
                <div
                  key={chapter.chapterNumber}
                  className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-100">
                      Chapter {chapter.chapterNumber}: {chapter.chapterTitle}
                    </p>
                    <p className="text-xs text-zinc-500">Shared {formatDateTime(chapter.sharedAt)}</p>
                  </div>
                  <div className="mt-4 space-y-4">
                    {chapter.reflections.map((reflection) => (
                      <div key={reflection.questionNumber} className="rounded-lg bg-black/30 p-3">
                        <p className="text-sm font-medium text-[#9df3bd]">
                          {reflection.questionText}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                          {reflection.answer?.trim() || "No answer provided."}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
