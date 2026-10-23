import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminOrganizationsRedirectPage() {
  redirect(ADMIN_ROUTES.players.organizations);
}
