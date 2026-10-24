import AdminPageHeader from "@/app/admin/AdminPageHeader";
import FreeMembersSection from "@/app/admin/FreeMembersSection";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";
import { prisma } from "@/lib/prisma";

export default async function AdminPlayersFreePage() {
  const freeMembers = await prisma.user.findMany({
    where: { membershipTier: "FREE" },
    select: {
      id: true,
      name: true,
      email: true,
      signupDate: true,
      assessmentCallBooked: true,
      assessmentCallDate: true,
    },
    orderBy: { signupDate: "desc" },
  });

  return (
    <section className="admin-page-section">
      <AdminPageHeader
        title="Free accounts"
        description="Assessment call scheduling for free signups."
        backHref={ADMIN_ROUTES.players.hub}
        backLabel="Players"
      />
      <FreeMembersSection
        initialMembers={freeMembers.map((member) => ({
          ...member,
          signupDate: member.signupDate.toISOString(),
          assessmentCallDate: member.assessmentCallDate?.toISOString() ?? null,
        }))}
      />
    </section>
  );
}
