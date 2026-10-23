import AdminGenerateVideoPostersPanel from "@/app/admin/AdminGenerateVideoPostersPanel";

export default function AdminSettingsVideoPostersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Video posters</h1>
        <p className="mt-2 text-sm text-zinc-400">Batch-generate JPEG posters for older R2 videos.</p>
      </header>
      <AdminGenerateVideoPostersPanel />
    </div>
  );
}
