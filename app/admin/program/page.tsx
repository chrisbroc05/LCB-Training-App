import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminProgramRedirectPage() {
  redirect(ADMIN_ROUTES.coaching.program);
}
