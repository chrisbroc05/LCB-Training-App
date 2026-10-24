import AdminSectionHub from "@/app/admin/components/AdminSectionHub";
import { loadCoachingHubCards } from "@/lib/admin-hub-stats-server";

export default async function AdminCoachingHubPage() {
  const cards = await loadCoachingHubCards();

  return (
    <AdminSectionHub
      title="Coaching"
      description="Reviews, reports, messages, program players, and playbook reflections."
      cards={cards}
    />
  );
}
