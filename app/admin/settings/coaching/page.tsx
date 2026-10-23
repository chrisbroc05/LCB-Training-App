import AdminFreeSwingResponseSetting from "@/app/admin/AdminFreeSwingResponseSetting";

export default function AdminSettingsCoachingPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Coaching settings</h1>
        <p className="mt-2 text-sm text-zinc-400">Free swing analysis response routing.</p>
      </header>
      <AdminFreeSwingResponseSetting />
    </div>
  );
}
