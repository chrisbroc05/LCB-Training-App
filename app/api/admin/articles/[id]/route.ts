import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api-auth";
import {
  getAdminArticleById,
  unpublishAdminArticle,
  updateAdminArticle,
} from "@/lib/articles-server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const article = await getAdminArticleById(id);
  if (!article) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }
  return NextResponse.json({ article });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action === "unpublish") {
    const result = await unpublishAdminArticle(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ article: result.article });
  }

  const result = await updateAdminArticle(id, {
    title: String(body.title ?? ""),
    slug: typeof body.slug === "string" ? body.slug : null,
    metaDescription: String(body.metaDescription ?? ""),
    contentMarkdown: String(body.contentMarkdown ?? ""),
    coverImageUrl: typeof body.coverImageUrl === "string" ? body.coverImageUrl : null,
    authorName: typeof body.authorName === "string" ? body.authorName : null,
    published: Boolean(body.published),
    publishedAt: typeof body.publishedAt === "string" ? body.publishedAt : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ article: result.article });
}
