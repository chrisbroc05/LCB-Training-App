import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminWaiversRedirectPage() {
  redirect(ADMIN_ROUTES.players.waivers);
}
