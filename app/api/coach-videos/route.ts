import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { getUnwatchedCoachVideoCount, listPlayerVideos } from "@/lib/coach-video-server";

export { dynamic, revalidate } from "@/lib/api-no-store";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const [videos, unwatchedCount] = await Promise.all([
    listPlayerVideos(session.user.id),
    getUnwatchedCoachVideoCount(session.user.id),
  ]);

  return jsonNoStore({ videos, unwatchedCount });
}
