import AdminSectionHub from "@/app/admin/components/AdminSectionHub";
import { loadPlayersHubCards } from "@/lib/admin-hub-stats-server";

export default async function AdminPlayersHubPage() {
  const cards = await loadPlayersHubCards();

  return (
    <AdminSectionHub
      title="Players"
      description="Members, free accounts, organizations, waivers, and team testing."
      cards={cards}
    />
  );
}
