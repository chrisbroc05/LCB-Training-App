import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminLeadsRedirectPage() {
  redirect(ADMIN_ROUTES.business.leads);
}
