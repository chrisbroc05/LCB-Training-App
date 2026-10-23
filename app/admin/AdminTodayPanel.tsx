"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import type { AdminTodaySnapshot } from "@/lib/admin-today-shared";

function TodayCard(props: {
  title: string;
  count: number;
  href: string;
  detail?: string;
}) {
  return (
    <Link
      href={props.href}
      className="block rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4 transition hover:border-[#52B788]/40"
    >
      <p className="text-xs uppercase tracking-wide text-zinc-500">{props.title}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-100">{props.count}</p>
      {props.detail ? <p className="mt-2 text-sm text-zinc-400">{props.detail}</p> : null}
    </Link>
  );
}

export default function AdminTodayPanel() {
  const [data, setData] = useState<AdminTodaySnapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/today", { cache: "no-store" });
      setLoading(false);
      if (!response.ok) {
        setError("Unable to load Today summary.");
        return;
      }
      const snapshot = (await response.json()) as AdminTodaySnapshot;
      setData(snapshot);
    };
    void load();
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading Today...</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-300">{error || "Unable to load Today summary."}</p>;
  }

  const attentionDetailParts: string[] = [];
  if (data.attention.goneQuietCount > 0) {
    attentionDetailParts.push(`${data.attention.goneQuietCount} gone quiet`);
  }
  if (data.attention.waitingOnSetupCount > 0) {
    attentionDetailParts.push(`${data.attention.waitingOnSetupCount} waiting on setup`);
  }
  if (data.attention.pendingGoalCheckinsCount > 0) {
    attentionDetailParts.push(`${data.attention.pendingGoalCheckinsCount} goal check-ins`);
  }
  if (data.attention.unconfirmedMinorsCount > 0) {
    attentionDetailParts.push(`${data.attention.unconfirmedMinorsCount} parent confirmations`);
  }

  const attentionDetail =
    attentionDetailParts.length > 0 ? attentionDetailParts.join(" | ") : "All clear";

  const unconfirmedPreview =
    data.attention.unconfirmedMinorNames.length > 0
      ? data.attention.unconfirmedMinorNames.slice(0, 5).join(", ")
      : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Today</h1>
        <p className="mt-2 text-sm text-zinc-400">What needs your attention right now.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TodayCard
          title="Video reviews waiting"
          count={data.videoReviewsWaiting}
          href={ADMIN_ROUTES.coaching.reviews}
        />
        <TodayCard
          title="Written reports waiting"
          count={data.writtenReportsWaiting}
          href={ADMIN_ROUTES.coaching.reports}
        />
        <TodayCard
          title="Unread messages"
          count={data.unreadMessagesCount}
          href={ADMIN_ROUTES.messages}
        />
        <TodayCard
          title="Leads today"
          count={data.leadsTodayCount}
          href={ADMIN_ROUTES.business.leads}
        />
        <TodayCard
          title="Checkouts started, not finished"
          count={data.checkoutsStartedOpenCount}
          href={ADMIN_ROUTES.business.leads}
        />
        <TodayCard
          title="Sales today"
          count={data.salesTodayCount}
          href={ADMIN_ROUTES.business.sales}
        />
        <TodayCard
          title="Players needing attention"
          count={data.attention.total}
          href={ADMIN_ROUTES.coaching.program}
          detail={attentionDetail}
        />
      </div>

      {unconfirmedPreview ? (
        <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/60 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Unconfirmed minors (read-only)</p>
          <p className="mt-2 text-sm text-zinc-300">{unconfirmedPreview}</p>
        </section>
      ) : null}
    </div>
  );
}
