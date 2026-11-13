import AdminSectionHub from "@/app/admin/components/AdminSectionHub";
import { loadContentHubCards } from "@/lib/admin-hub-stats-server";

export default async function AdminContentHubPage() {
  const cards = await loadContentHubCards();

  return (
    <AdminSectionHub
      title="Content"
      description="Drills, daily challenges, quiz, resources, articles, program focuses, Fix-It, and marketing assets."
      cards={cards}
    />
  );
}
