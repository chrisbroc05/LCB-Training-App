"use client";

import AdminProgramOverview from "@/app/admin/program/AdminProgramOverview";
import TwelveWeekPlayersSection from "@/app/admin/TwelveWeekPlayersSection";

export default function AdminProgramPlayersTabs() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Program players</h1>
        <p className="mt-2 text-sm text-zinc-400">12-week roster, setup, and daily progress.</p>
      </header>

      <AdminProgramOverview />
      <TwelveWeekPlayersSection defaultCollapsed />
    </div>
  );
}
