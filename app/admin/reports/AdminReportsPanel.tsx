"use client";

import { useState } from "react";
import AdminReportsPendingPanel from "@/app/admin/reports/AdminReportsPendingPanel";
import AdminReportsSentPanel from "@/app/admin/reports/AdminReportsSentPanel";

type ReportsTab = "pending" | "sent";

export default function AdminReportsPanel() {
  const [tab, setTab] = useState<ReportsTab>("pending");

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2 border-b border-[#2b3650] pb-3">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "pending"
              ? "bg-[#22c55e] text-black"
              : "border border-[#2b3650] text-zinc-300 hover:border-[#3c4a68]"
          }`}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "sent"
              ? "bg-[#22c55e] text-black"
              : "border border-[#2b3650] text-zinc-300 hover:border-[#3c4a68]"
          }`}
        >
          Sent
        </button>
      </div>

      {tab === "pending" ? <AdminReportsPendingPanel /> : null}
      {tab === "sent" ? <AdminReportsSentPanel /> : null}
    </div>
  );
}
