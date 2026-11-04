import { redirect } from "next/navigation";
import { buildAdminMemberUrl } from "@/lib/admin-routes-shared";

type AdminMemberRedirectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMemberRedirectPage({ params }: AdminMemberRedirectPageProps) {
  const { id } = await params;
  redirect(buildAdminMemberUrl(id));
}
