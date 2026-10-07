import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ teamId: string; sessionId: string }> };

export default async function AdminTestingEntryRedirectPage(_props: PageProps) {
  redirect("/admin/testing");
}
