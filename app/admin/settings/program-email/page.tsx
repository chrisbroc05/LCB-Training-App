import AdminProgramEmailToolsSection from "@/app/admin/settings/program-email/AdminProgramEmailToolsSection";

export default function AdminSettingsProgramEmailPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Program email tools</h1>
        <p className="mt-2 text-sm text-zinc-400">Utilities for program-related email sends.</p>
      </header>
      <AdminProgramEmailToolsSection />
    </div>
  );
}
