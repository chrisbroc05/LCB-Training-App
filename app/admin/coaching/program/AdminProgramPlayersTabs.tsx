"use client";

import { useState } from "react";
import AdminProgramOverview from "@/app/admin/program/AdminProgramOverview";
import MembersPanel from "@/app/admin/MembersPanel";
import TwelveWeekPlayersSection from "@/app/admin/TwelveWeekPlayersSection";

export default function AdminProgramPlayersTabs() {
  const [tab, setTab] = useState<"twelve-week" | "all-access-plus">("twelve-week");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Program players</h1>
        <p className="mt-2 text-sm text-zinc-400">
          12-week roster and All-Access / Plus members in one place.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("twelve-week")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "twelve-week"
              ? "bg-[#22c55e] text-black"
              : "border border-[#2b3650] text-zinc-200"
          }`}
        >
          12-Week
        </button>
        <button
          type="button"
          onClick={() => setTab("all-access-plus")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "all-access-plus"
              ? "bg-[#22c55e] text-black"
              : "border border-[#2b3650] text-zinc-200"
          }`}
        >
          All-Access / Plus
        </button>
      </div>

      {tab === "twelve-week" ? (
        <div className="space-y-8">
          <AdminProgramOverview />
          <TwelveWeekPlayersSection />
        </div>
      ) : (
        <MembersPanel listFilter="all-access-plus" />
      )}
    </div>
  );
}
