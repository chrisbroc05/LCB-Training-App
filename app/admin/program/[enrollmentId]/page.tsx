import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AdminProgramPlayerProfile from "@/app/admin/program/[enrollmentId]/AdminProgramPlayerProfile";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

type AdminProgramPlayerPageProps = {
  params: Promise<{ enrollmentId: string }>;
};

export default async function AdminProgramPlayerPage({ params }: AdminProgramPlayerPageProps) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect("/dashboard");
  }

  const { enrollmentId } = await params;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 sm:max-w-2xl sm:px-6 sm:py-8">
      <AdminProgramPlayerProfile enrollmentId={enrollmentId} />
    </div>
  );
}
