import AdminReportsPanel from "@/app/admin/reports/AdminReportsPanel";

export default function AdminCoachingReportsPage() {
  return (
    <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
      <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Written reports</h1>
      <p className="mt-2 text-sm text-zinc-300">
        Quick written evaluations for Core, org trial, and free swing submissions.
      </p>
      <AdminReportsPanel />
    </section>
  );
}
