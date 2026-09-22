import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  allDrillLibraryVideos,
  getDrillCategoryLabel,
  getDrillLibraryVideoId,
} from "@/lib/drill-library-videos";
import { fetchVimeoThumbnailMap } from "@/lib/vimeo-oembed";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thumbnailMap = await fetchVimeoThumbnailMap(allDrillLibraryVideos.map((video) => video.url));

  return NextResponse.json({
    videos: allDrillLibraryVideos.map((video) => {
      const id = getDrillLibraryVideoId(video);
      return {
        id,
        title: video.title,
        category: video.category,
        categoryLabel: getDrillCategoryLabel(video.category),
        url: video.url,
        thumbnailUrl: thumbnailMap[video.url] ?? null,
      };
    }),
  });
}
