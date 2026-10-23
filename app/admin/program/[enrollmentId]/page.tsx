import { redirect } from "next/navigation";
import { buildAdminProgramPlayerUrl } from "@/lib/admin-routes-shared";

type AdminProgramPlayerRedirectProps = {
  params: Promise<{ enrollmentId: string }>;
};

export default async function AdminProgramPlayerRedirectPage({
  params,
}: AdminProgramPlayerRedirectProps) {
  const { enrollmentId } = await params;
  redirect(buildAdminProgramPlayerUrl(enrollmentId));
}
