import AdminDrillLibraryPanel from "@/app/admin/content/drill-library/AdminDrillLibraryPanel";

export default function AdminContentDrillLibraryPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Drill library</h1>
        <p className="mt-2 text-sm text-zinc-400">Playbook starter drill toggles on the public catalog.</p>
      </header>
      <AdminDrillLibraryPanel />
    </div>
  );
}
