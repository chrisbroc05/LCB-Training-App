import AdminSectionHub from "@/app/admin/components/AdminSectionHub";
import { loadBusinessHubCards } from "@/lib/admin-hub-stats-server";

export default async function AdminBusinessHubPage() {
  const cards = await loadBusinessHubCards();

  return (
    <AdminSectionHub
      title="Business"
      description="Leads, sales, and manual product grants."
      cards={cards}
    />
  );
}
