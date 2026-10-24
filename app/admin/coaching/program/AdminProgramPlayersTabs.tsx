"use client";

import AdminPageHeader from "@/app/admin/AdminPageHeader";
import AdminProgramOverview from "@/app/admin/program/AdminProgramOverview";
import TwelveWeekPlayersSection from "@/app/admin/TwelveWeekPlayersSection";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminProgramPlayersTabs() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Program players"
        description="12-week roster, setup, and daily progress."
        backHref={ADMIN_ROUTES.coaching.hub}
        backLabel="Coaching"
      />

      <AdminProgramOverview />
      <TwelveWeekPlayersSection defaultCollapsed />
    </div>
  );
}
