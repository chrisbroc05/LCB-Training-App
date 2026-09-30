import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { jsonNoStore } from "@/lib/api-no-store";
import { getCoachUnreadCount } from "@/lib/direct-messaging-server";

export { dynamic, revalidate } from "@/lib/api-no-store";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return jsonNoStore({ error: "Forbidden" }, { status: 403 });
  }

  const unreadCount = await getCoachUnreadCount();
  return jsonNoStore({ unreadCount });
}
