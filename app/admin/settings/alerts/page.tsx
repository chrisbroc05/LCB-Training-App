import AdminProgramCoachAlerts from "@/app/admin/program/AdminProgramCoachAlerts";

export default function AdminSettingsAlertsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Coach alerts</h1>
        <p className="mt-2 text-sm text-zinc-400">Push notification tests and subscription info.</p>
      </header>
      <AdminProgramCoachAlerts />
    </div>
  );
}
