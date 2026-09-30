import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { markCoachVideoViewed } from "@/lib/coach-video-server";

export { dynamic, revalidate } from "@/lib/api-no-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const viewedAt = await markCoachVideoViewed(session.user.id, id);
  if (!viewedAt) {
    return jsonNoStore({ error: "Video not found." }, { status: 404 });
  }

  return jsonNoStore({ viewedAt: viewedAt.toISOString() });
}
