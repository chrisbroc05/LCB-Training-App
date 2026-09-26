"use client";

import { useState, type ReactNode } from "react";
import ProgramTodayView from "@/app/dashboard/ProgramTodayView";

type ProgramDashboardTabsClientProps = {
  homeSlot: ReactNode;
  layout?: "desktop" | "mobile";
};

export default function ProgramDashboardTabsClient({
  homeSlot,
  layout = "desktop",
}: ProgramDashboardTabsClientProps) {
  const [activeTab, setActiveTab] = useState<"today" | "home">("today");
  const tabButtonClass = (tab: "today" | "home") =>
    `rounded-full px-5 py-3 text-sm font-semibold ${
      activeTab === tab
        ? "bg-[#2D6A4F] text-white"
        : "border border-[#D1D5DB] bg-white text-[#6B7280]"
    }`;

  return (
    <div className={layout === "mobile" ? "space-y-4" : "mt-8 space-y-6"}>
      <div className="flex gap-3">
        <button type="button" className={tabButtonClass("today")} onClick={() => setActiveTab("today")}>
          Today
        </button>
        <button type="button" className={tabButtonClass("home")} onClick={() => setActiveTab("home")}>
          Home
        </button>
      </div>

      {activeTab === "today" ? <ProgramTodayView /> : homeSlot}
    </div>
  );
}
