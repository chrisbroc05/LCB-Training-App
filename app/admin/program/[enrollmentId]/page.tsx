import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AdminProgramPlayerPanel from "@/app/admin/program/[enrollmentId]/AdminProgramPlayerPanel";
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
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <AdminProgramPlayerPanel enrollmentId={enrollmentId} />
    </div>
  );
}
