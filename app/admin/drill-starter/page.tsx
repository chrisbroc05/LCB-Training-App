import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminDrillStarterRedirectPage() {
  redirect(ADMIN_ROUTES.content.drillLibrary);
}
