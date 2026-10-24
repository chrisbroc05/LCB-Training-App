import AdminSectionHub from "@/app/admin/components/AdminSectionHub";
import { loadContentHubCards } from "@/lib/admin-hub-stats-server";

export default async function AdminContentHubPage() {
  const cards = await loadContentHubCards();

  return (
    <AdminSectionHub
      title="Content"
      description="Drills, quiz, resources, program focuses, Fix-It, and marketing assets."
      cards={cards}
    />
  );
}
