import { Suspense } from "react";
import AdminPanel from "@/app/admin/AdminPanel";

export default function AdminGoalCheckinsPage() {
  return (
    <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
      <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Goal check-ins</h1>
      <p className="mt-2 text-sm text-zinc-300">Monthly goal check-ins from 12-week players.</p>
      <Suspense fallback={<p className="mt-6 text-zinc-400">Loading...</p>}>
        <AdminPanel mode="goal" />
      </Suspense>
    </section>
  );
}
