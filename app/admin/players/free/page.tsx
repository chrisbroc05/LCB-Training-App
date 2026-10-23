import { prisma } from "@/lib/prisma";
import FreeMembersSection from "@/app/admin/FreeMembersSection";

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
    <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
      <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Free accounts</h1>
      <p className="mt-2 text-sm text-zinc-300">Assessment call scheduling for free signups.</p>
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
