import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonNoStore } from "@/lib/api-no-store";
import { getCoachVideoListItemForViewer } from "@/lib/coach-video-server";

export { dynamic, revalidate } from "@/lib/api-no-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const video = await getCoachVideoListItemForViewer({
    viewerUserId: session.user.id,
    viewerEmail: session.user.email,
    videoId: id,
  });

  if (!video) {
    return jsonNoStore({ error: "Video not found." }, { status: 404 });
  }

  return jsonNoStore({ video });
}
