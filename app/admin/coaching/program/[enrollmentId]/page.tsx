import AdminProgramPlayerProfile from "@/app/admin/program/[enrollmentId]/AdminProgramPlayerProfile";

type AdminCoachingProgramPlayerPageProps = {
  params: Promise<{ enrollmentId: string }>;
};

export default async function AdminCoachingProgramPlayerPage({
  params,
}: AdminCoachingProgramPlayerPageProps) {
  const { enrollmentId } = await params;

  return (
    <div className="mx-auto w-full max-w-lg sm:max-w-2xl">
      <AdminProgramPlayerProfile enrollmentId={enrollmentId} />
    </div>
  );
}
