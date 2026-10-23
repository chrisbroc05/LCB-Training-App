import AdminProgramCuesPanel from "@/app/admin/program/cues/AdminProgramCuesPanel";

export default function AdminContentProgramCuesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Program hitting focuses</h1>
        <p className="mt-2 text-sm text-zinc-400">My Hitting Focuses library for the 12-week program.</p>
      </header>
      <AdminProgramCuesPanel />
    </div>
  );
}
