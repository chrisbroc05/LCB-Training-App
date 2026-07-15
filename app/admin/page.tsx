import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminPanel from "@/app/admin/AdminPanel";
import FreeMembersSection from "@/app/admin/FreeMembersSection";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }
  const cloudinaryUploadEnabled =
    process.env.CLOUDINARY_ADMIN_RESPONSE_UPLOAD_ENABLED?.toLowerCase() === "true";

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
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 md:py-20">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
        <h1 className="text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">Admin Submissions Inbox</h1>
        <p className="mt-2 text-zinc-300">
          Review coaching submissions, then send video or written responses.
        </p>
        <AdminPanel cloudinaryUploadEnabled={cloudinaryUploadEnabled} />
      </section>

      <FreeMembersSection
        initialMembers={freeMembers.map((member) => ({
          ...member,
          signupDate: member.signupDate.toISOString(),
          assessmentCallDate: member.assessmentCallDate?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
