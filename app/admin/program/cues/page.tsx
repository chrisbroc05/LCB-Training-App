import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminProgramCuesRedirectPage() {
  redirect(ADMIN_ROUTES.content.programCues);
}
