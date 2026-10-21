import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  ensureDrillLibraryCatalogSeeded,
  setDrillStarterFlag,
} from "@/lib/drill-library-catalog-server";
import {
  allDrillLibraryVideos,
  getDrillCategoryLabel,
  getDrillLibraryVideoId,
} from "@/lib/drill-library-videos";
import { prisma } from "@/lib/prisma";
import { fetchVimeoThumbnailMap } from "@/lib/vimeo-oembed";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureDrillLibraryCatalogSeeded();
  const catalogRows = await prisma.drillLibraryCatalog.findMany({
    select: { vimeoId: true, isStarterDrill: true },
  });
  const starterById = new Map(catalogRows.map((row) => [row.vimeoId, row.isStarterDrill]));

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
        isStarterDrill: id ? (starterById.get(id) ?? false) : false,
      };
    }),
  });
}

type PatchBody = {
  vimeoId?: string;
  isStarterDrill?: boolean;
};

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.vimeoId?.trim()) {
    return NextResponse.json({ error: "vimeoId is required." }, { status: 400 });
  }

  if (typeof body.isStarterDrill !== "boolean") {
    return NextResponse.json({ error: "isStarterDrill must be a boolean." }, { status: 400 });
  }

  await setDrillStarterFlag(body.vimeoId.trim(), body.isStarterDrill);

  return NextResponse.json({ success: true });
}
