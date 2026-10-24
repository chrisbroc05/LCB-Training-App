import AdminSectionHub from "@/app/admin/components/AdminSectionHub";
import { loadSettingsHubCards } from "@/lib/admin-hub-stats-server";

export default async function AdminSettingsHubPage() {
  const cards = await loadSettingsHubCards();

  return (
    <AdminSectionHub
      title="Settings"
      description="Coaching rules, alerts, program email, and video poster tools."
      cards={cards}
    />
  );
}
