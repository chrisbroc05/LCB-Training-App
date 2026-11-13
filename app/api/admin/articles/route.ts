import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-api-auth";
import { createAdminArticle, listAdminArticles } from "@/lib/articles-server";

export async function GET() {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const articles = await listAdminArticles();
  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await createAdminArticle({
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
