"use client";

import { useEffect, useState } from "react";
import { GoalItemCategoryBadge } from "@/app/goal-setting/GoalTrackerList";
import MemberProfileCard from "@/app/admin/MemberProfileCard";
import type { SerializedGoalItem } from "@/lib/goal-check-in-constants";

type GoalCheckinListItem = {
  id: number;
  playerName: string;
  userEmail: string;
  focusArea: string;
  createdAt: string;
  badgeStatus: "PENDING" | "RESPONDED";
};

type GoalCheckinDetail = GoalCheckinListItem & {
  monthlyFocus: string;
  lastMonthReview: string;
  focusAreaLabel: string;
  additionalNotes: string | null;
  coachResponse: string | null;
  respondedAt: string | null;
  goals: SerializedGoalItem[];
  memberProfile?: {
    hasProfile: boolean;
    position: string | null;
    age: number | null;
    graduationYear: number | null;
    currentTeam: string | null;
    level: string | null;
    playerBio: string | null;
  };
};

function formatResponseDateTime(value: string | null | undefined) {
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

export default function GoalCheckinsPanel() {
  const [items, setItems] = useState<GoalCheckinListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<GoalCheckinDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [coachResponse, setCoachResponse] = useState("");
  const [sendError, setSendError] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseSummary, setResponseSummary] = useState("");

  useEffect(() => {
    const loadList = async () => {
      setLoadingList(true);
      const response = await fetch("/api/admin/goal-checkins");
      setLoadingList(false);
      if (!response.ok) {
        setItems([]);
        return;
      }

      const data = (await response.json()) as { submissions: GoalCheckinListItem[] };
      setItems(data.submissions);
      setSelectedId(null);
      setDetail(null);
      setCoachResponse("");
      setSendError("");
      setShowResponseModal(false);
      setResponseSummary("");
    };

    void loadList();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const loadDetail = async () => {
      setLoadingDetail(true);
      const response = await fetch(`/api/admin/goal-checkins/${selectedId}`);
      setLoadingDetail(false);
      if (!response.ok) {
        setDetail(null);
        return;
      }

      const data = (await response.json()) as { submission: GoalCheckinDetail };
      setDetail(data.submission);
      setCoachResponse("");
      setSendError("");
      setShowResponseModal(false);
      setResponseSummary("");
    };

    void loadDetail();
  }, [selectedId]);

  const handleSendResponse = async () => {
    if (!detail) {
      return;
    }

    setSendError("");
    const trimmedResponse = coachResponse.trim();
    if (!trimmedResponse) {
      setSendError("Please provide a written response.");
      return;
    }

    const response = await fetch(`/api/admin/goal-checkins/${detail.id}/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ coachResponse: trimmedResponse }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setSendError(data.error ?? "Unable to send response.");
      return;
    }

    setResponseSummary(
      `Written response sent: "${trimmedResponse.slice(0, 180)}${trimmedResponse.length > 180 ? "..." : ""}"`,
    );
    setShowResponseModal(true);

    const refreshed = await fetch(`/api/admin/goal-checkins/${detail.id}`);
    if (refreshed.ok) {
      const data = (await refreshed.json()) as { submission: GoalCheckinDetail };
      setDetail(data.submission);
    }

    setItems((previous) =>
      previous.map((item) =>
        item.id === detail.id
          ? {
              ...item,
              badgeStatus: "RESPONDED",
            }
          : item,
      ),
    );
  };

  return (
    <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="rounded-2xl border border-[#18243a] bg-black/30 p-3 sm:p-4">
        <div className="mt-4 space-y-3">
          {loadingList && <p className="text-sm text-zinc-400">Loading goal check-ins...</p>}
          {!loadingList && items.length === 0 && (
            <p className="text-sm text-zinc-400">No goal check-ins yet.</p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selectedId === item.id
                  ? "border-[#22c55e]/70 bg-[#22c55e]/10"
                  : "border-[#2b3650] bg-[#0b1324]/80 hover:border-[#7f9434]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-100">{item.playerName}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    item.badgeStatus === "PENDING"
                      ? "bg-yellow-500/20 text-yellow-200"
                      : "bg-[#22c55e]/20 text-[#9df3bd]"
                  }`}
                >
                  {item.badgeStatus === "PENDING" ? "Pending" : "Responded"}
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">{item.focusArea}</p>
              <p className="mt-2 text-xs text-zinc-400">{item.userEmail}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border border-[#18243a] bg-black/30 p-4 sm:p-5">
        {!selectedId && <p className="text-zinc-400">Select a goal check-in to view details.</p>}
        {loadingDetail && <p className="text-zinc-400">Loading goal check-in details...</p>}
        {!loadingDetail && detail && (
          <div className="space-y-4 sm:space-y-5">
            <div>
              <h2 className="break-words text-xl font-semibold leading-tight text-zinc-100 sm:text-2xl">
                {detail.playerName}
              </h2>
              <p className="mt-1 text-sm text-zinc-300">Submitted by {detail.userEmail}</p>
              <p className="mt-1 text-sm text-zinc-400">
                {new Date(detail.createdAt).toLocaleString()} -{" "}
                {detail.badgeStatus === "PENDING" ? "Pending" : "Responded"}
              </p>
            </div>

            {detail.memberProfile ? (
              <MemberProfileCard profile={detail.memberProfile} />
            ) : null}

            <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4 text-sm text-zinc-200">
              <div className="space-y-3">
                <p className="whitespace-pre-wrap">
                  <span className="font-semibold text-zinc-100">Main focus this month:</span>{" "}
                  {detail.monthlyFocus}
                </p>
                <p className="whitespace-pre-wrap">
                  <span className="font-semibold text-zinc-100">Last month review:</span>{" "}
                  {detail.lastMonthReview}
                </p>
                <p>
                  <span className="font-semibold text-zinc-100">Focus area:</span>{" "}
                  {detail.focusAreaLabel}
                </p>
                {detail.additionalNotes ? (
                  <p className="whitespace-pre-wrap">
                    <span className="font-semibold text-zinc-100">Additional notes:</span>{" "}
                    {detail.additionalNotes}
                  </p>
                ) : null}
              </div>
            </div>

            {detail.goals.length > 0 ? (
              <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
                <h3 className="text-lg font-semibold text-zinc-100">Monthly Goal Tracker</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Trackable goals the member set for this month and their completion progress.
                </p>
                <div className="mt-4 space-y-3">
                  {detail.goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="rounded-xl border border-[#2b3650] bg-black/30 p-4 text-sm text-zinc-200"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <GoalItemCategoryBadge
                          label={goal.categoryLabel}
                          badgeClassName={goal.badgeClassName}
                        />
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                            goal.completed
                              ? "bg-[#22c55e]/20 text-[#9df3bd]"
                              : "bg-[#24314a] text-zinc-200"
                          }`}
                        >
                          {goal.completed ? "Completed" : "In Progress"}
                        </span>
                      </div>
                      <p className="mt-3 text-zinc-100">{goal.description}</p>
                      {goal.targetValue ? (
                        <p className="mt-1 text-xs text-zinc-400">Target: {goal.targetValue}</p>
                      ) : null}
                      {goal.completed && goal.completedAt ? (
                        <p className="mt-2 text-xs text-[#9df3bd]">
                          Completed {formatResponseDateTime(goal.completedAt)}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {detail.badgeStatus === "RESPONDED" ? (
              <div className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[#9df3bd]">Your Response</h3>
                  <span className="rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9df3bd]">
                    Responded
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Sent {formatResponseDateTime(detail.respondedAt)}
                </p>
                <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-200">
                  {detail.coachResponse}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#2b3650] bg-[#0b1324]/70 p-4">
                <h3 className="text-lg font-semibold text-zinc-100">Send Response</h3>
                <textarea
                  rows={6}
                  value={coachResponse}
                  onChange={(event) => setCoachResponse(event.target.value)}
                  placeholder="Write your personal response here..."
                  className="mt-4 w-full rounded-lg border border-[#2b3650] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-[#22c55e]"
                />
                {sendError ? <p className="mt-3 text-sm text-red-300">{sendError}</p> : null}
                <button
                  type="button"
                  onClick={() => void handleSendResponse()}
                  className="mt-4 rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#35db72]"
                >
                  Send Response
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {showResponseModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#22c55e]/40 bg-[#0b1324] p-6 shadow-2xl shadow-black/50">
            <h3 className="text-lg font-semibold text-[#9df3bd]">Response Sent</h3>
            <p className="mt-3 text-sm text-zinc-300">{responseSummary}</p>
            <button
              type="button"
              onClick={() => setShowResponseModal(false)}
              className="mt-5 rounded-full bg-[#22c55e] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#35db72]"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
