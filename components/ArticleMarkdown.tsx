import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  extractArticleH2Headings,
  type ArticleTocItem,
} from "@/lib/articles-shared";

type ArticleMarkdownProps = {
  markdown: string;
  /** Prefer full-document heading ids when content is split around the TOC. */
  headingIds?: ArticleTocItem[];
};

function childrenToPlainText(children: ReactNode): string {
  if (children == null || typeof children === "boolean") {
    return "";
  }
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map((child) => childrenToPlainText(child)).join("");
  }
  if (typeof children === "object" && "props" in children) {
    return childrenToPlainText(
      (children as { props?: { children?: ReactNode } }).props?.children,
    );
  }
  return "";
}

export default function ArticleMarkdown({ markdown, headingIds }: ArticleMarkdownProps) {
  const resolvedHeadingIds = headingIds ?? extractArticleH2Headings(markdown);
  let h2Index = 0;

  return (
    <div className="article-prose max-w-[70ch]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = childrenToPlainText(children).trim();
            const matched = resolvedHeadingIds[h2Index];
            const id =
              matched && matched.title === text
                ? matched.id
                : resolvedHeadingIds.find((item) => item.title === text)?.id;
            if (matched && matched.title === text) {
              h2Index += 1;
            } else if (id) {
              const foundIndex = resolvedHeadingIds.findIndex((item) => item.id === id);
              if (foundIndex >= 0) {
                h2Index = foundIndex + 1;
              }
            }
            return (
              <h2
                id={id}
                className="scroll-mt-site-header mt-10 border-b border-[#52B788]/55 pb-2 font-[family-name:var(--font-article-display)] text-[28px] font-bold tracking-wide text-white first:mt-0 sm:mt-12 sm:text-[34px]"
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => (
            <h3 className="scroll-mt-site-header mt-8 text-[20px] font-semibold text-zinc-200 sm:mt-9 sm:text-[22px]">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mt-5 text-[17px] leading-[1.7] text-zinc-300 sm:text-lg sm:leading-[1.7]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mt-5 list-disc space-y-3 pl-5 text-[17px] leading-[1.7] text-zinc-300 marker:text-[#52B788] sm:text-lg">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-5 list-decimal space-y-3 pl-5 text-[17px] leading-[1.7] text-zinc-300 marker:text-[#52B788] sm:text-lg">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1 [&>p]:mt-0">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-semibold text-[#52B788] no-underline hover:underline hover:decoration-[#52B788]/70 hover:underline-offset-2"
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              target={href?.startsWith("http") ? "_blank" : undefined}
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="mt-6 -mx-1 overflow-x-auto sm:mx-0">
              <table className="min-w-full border-collapse border border-[#18243a] text-left text-sm text-zinc-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[#0b1324] text-zinc-200">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-[#18243a] px-3 py-2 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-[#18243a] px-3 py-2 align-top">{children}</td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-6 border-l-4 border-[#52B788] bg-[#0b1324]/70 px-4 py-3 text-[17px] leading-[1.7] text-zinc-300">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-10 border-[#18243a]" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">{children}</strong>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
