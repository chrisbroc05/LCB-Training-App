"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_FETCH_COULD_NOT_LOAD_JSON,
  adminFetchJson,
} from "@/lib/admin-fetch-shared";
import { ARTICLE_AUTHOR_DEFAULT, slugifyArticleTitle } from "@/lib/articles-shared";

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  coverImageUrl: string | null;
  authorName: string;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
  contentMarkdown?: string;
};

const emptyDraft = {
  id: "",
  title: "",
  slug: "",
  metaDescription: "",
  contentMarkdown: "",
  coverImageUrl: "",
  authorName: ARTICLE_AUTHOR_DEFAULT,
  published: false,
  publishedAt: "",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-[#2b3650] bg-black px-3 py-2 text-sm text-zinc-100";

function toDateInputValue(iso: string | null | undefined) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

export default function AdminArticlesPanel() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const res = await adminFetchJson<{ articles?: ArticleRow[]; error?: string }>(
      "/api/admin/articles",
      { cache: "no-store" },
      {
        context: "admin-articles-list",
        okUserMessage: "Couldn't load articles.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    if (!res.ok) {
      setError(res.userMessage || "Couldn't load articles.");
      return;
    }
    setArticles(res.data.articles ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const editArticle = async (id: string) => {
    setError("");
    setMessage("");
    const res = await adminFetchJson<{ article?: ArticleRow; error?: string }>(
      `/api/admin/articles/${encodeURIComponent(id)}`,
      { cache: "no-store" },
      {
        context: "admin-article-detail",
        okUserMessage: "Couldn't load article.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    if (!res.ok) {
      setError(res.userMessage || "Couldn't load article.");
      return;
    }
    if (!res.data.article) {
      setError("Couldn't load article.");
      return;
    }
    const article = res.data.article;
    setDraft({
      id: article.id,
      title: article.title,
      slug: article.slug,
      metaDescription: article.metaDescription,
      contentMarkdown: article.contentMarkdown ?? "",
      coverImageUrl: article.coverImageUrl ?? "",
      authorName: article.authorName || ARTICLE_AUTHOR_DEFAULT,
      published: article.published,
      publishedAt: toDateInputValue(article.publishedAt),
    });
  };

  const resetDraft = () => {
    setDraft(emptyDraft);
    setMessage("");
    setError("");
  };

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const payload = {
      title: draft.title,
      slug: draft.slug.trim() || slugifyArticleTitle(draft.title),
      metaDescription: draft.metaDescription,
      contentMarkdown: draft.contentMarkdown,
      coverImageUrl: draft.coverImageUrl,
      authorName: draft.authorName,
      published: draft.published,
      publishedAt: draft.publishedAt || null,
    };

    const res = draft.id
      ? await adminFetchJson<{ article?: ArticleRow; error?: string }>(
          `/api/admin/articles/${encodeURIComponent(draft.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
          {
            context: "admin-article-update",
            okUserMessage: "Couldn't save article.",
            notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
          },
        )
      : await adminFetchJson<{ article?: ArticleRow; error?: string }>(
          "/api/admin/articles",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
          {
            context: "admin-article-create",
            okUserMessage: "Couldn't create article.",
            notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
          },
        );

    setBusy(false);
    if (!res.ok) {
      setError(res.userMessage || "Couldn't save article.");
      return;
    }
    if (!res.data.article) {
      setError(res.data.error || "Couldn't save article.");
      return;
    }

    const saved = res.data.article;
    setMessage(draft.id ? "Article saved." : "Article created.");
    setDraft({
      id: saved.id,
      title: saved.title,
      slug: saved.slug,
      metaDescription: saved.metaDescription,
      contentMarkdown: saved.contentMarkdown ?? draft.contentMarkdown,
      coverImageUrl: saved.coverImageUrl ?? "",
      authorName: saved.authorName,
      published: saved.published,
      publishedAt: toDateInputValue(saved.publishedAt),
    });
    await load();
  };

  const onUnpublish = async (id: string) => {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await adminFetchJson<{ article?: ArticleRow; error?: string }>(
      `/api/admin/articles/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unpublish" }),
      },
      {
        context: "admin-article-unpublish",
        okUserMessage: "Couldn't unpublish article.",
        notJsonUserMessage: ADMIN_FETCH_COULD_NOT_LOAD_JSON,
      },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.userMessage || "Couldn't unpublish article.");
      return;
    }
    setMessage("Article unpublished.");
    if (draft.id === id) {
      setDraft((current) => ({ ...current, published: false, publishedAt: "" }));
    }
    await load();
  };

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-[#9df3bd]">{message}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-[#18243a]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#0b1324] text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} className="border-t border-[#18243a] text-zinc-300">
                <td className="px-3 py-2 align-top">
                  <p className="font-medium text-zinc-100">{article.title}</p>
                  <p className="text-xs text-zinc-500">/{article.slug}</p>
                </td>
                <td className="px-3 py-2 align-top">
                  {article.published ? (
                    <span className="text-[#9df3bd]">Published</span>
                  ) : (
                    <span className="text-zinc-500">Draft</span>
                  )}
                </td>
                <td className="px-3 py-2 align-top text-xs text-zinc-500">
                  {new Date(article.updatedAt).toLocaleString()}
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => void editArticle(article.id)}
                      className="text-left text-xs font-semibold text-[#52B788] hover:underline"
                    >
                      Edit
                    </button>
                    {article.published ? (
                      <>
                        <Link
                          href={`/articles/${article.slug}`}
                          className="text-xs font-semibold text-zinc-400 hover:underline"
                          target="_blank"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void onUnpublish(article.id)}
                          className="text-left text-xs font-semibold text-amber-300 hover:underline disabled:opacity-60"
                        >
                          Unpublish
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-zinc-500">
                  No articles yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={onSave}
        className="space-y-4 rounded-2xl border border-[#18243a] bg-[#0b1324]/60 p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">
            {draft.id ? "Edit article" : "New article"}
          </h2>
          {draft.id ? (
            <button
              type="button"
              onClick={resetDraft}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200"
            >
              New blank article
            </button>
          ) : null}
        </div>

        <label className="block text-sm text-zinc-300">
          Title
          <input
            className={inputClass}
            value={draft.title}
            onChange={(event) => {
              const title = event.target.value;
              setDraft((current) => ({
                ...current,
                title,
                slug: current.id ? current.slug : slugifyArticleTitle(title),
              }));
            }}
            required
          />
        </label>

        <label className="block text-sm text-zinc-300">
          Slug
          <input
            className={inputClass}
            value={draft.slug}
            onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
            required
          />
        </label>

        <label className="block text-sm text-zinc-300">
          Meta description ({draft.metaDescription.trim().length}/160)
          <textarea
            className={`${inputClass} min-h-[88px]`}
            value={draft.metaDescription}
            onChange={(event) =>
              setDraft((current) => ({ ...current, metaDescription: event.target.value }))
            }
            required
          />
          <span className="mt-1 block text-xs text-zinc-500">110-160 characters.</span>
        </label>

        <label className="block text-sm text-zinc-300">
          Author
          <input
            className={inputClass}
            value={draft.authorName}
            onChange={(event) =>
              setDraft((current) => ({ ...current, authorName: event.target.value }))
            }
          />
        </label>

        <label className="block text-sm text-zinc-300">
          Cover image URL (optional)
          <input
            className={inputClass}
            value={draft.coverImageUrl}
            onChange={(event) =>
              setDraft((current) => ({ ...current, coverImageUrl: event.target.value }))
            }
            placeholder="/images/... or https://..."
          />
        </label>

        <label className="block text-sm text-zinc-300">
          Publish date
          <input
            type="date"
            className={inputClass}
            value={draft.publishedAt}
            onChange={(event) =>
              setDraft((current) => ({ ...current, publishedAt: event.target.value }))
            }
          />
        </label>

        <label className="flex items-center gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(event) =>
              setDraft((current) => ({ ...current, published: event.target.checked }))
            }
          />
          Published
        </label>

        <label className="block text-sm text-zinc-300">
          Markdown content
          <textarea
            className={`${inputClass} min-h-[320px] font-mono text-xs sm:text-sm`}
            value={draft.contentMarkdown}
            onChange={(event) =>
              setDraft((current) => ({ ...current, contentMarkdown: event.target.value }))
            }
            placeholder={"## Section\n\nParagraph...\n\n## FAQ\n\n### Question?\nAnswer paragraph."}
            required
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
        >
          {busy ? "Saving..." : draft.id ? "Save article" : "Create article"}
        </button>
      </form>
    </div>
  );
}
