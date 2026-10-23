import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminSocialAppHighlightRedirectPage() {
  redirect(ADMIN_ROUTES.content.appHighlight);
}
