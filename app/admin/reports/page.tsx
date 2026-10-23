import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminReportsRedirectPage() {
  redirect(ADMIN_ROUTES.coaching.reports);
}
