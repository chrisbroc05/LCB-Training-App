import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ArticleMarkdownProps = {
  markdown: string;
};

export default function ArticleMarkdown({ markdown }: ArticleMarkdownProps) {
  return (
    <div className="article-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="mt-10 font-[family-name:var(--font-article-display)] text-2xl font-semibold tracking-wide text-zinc-100 first:mt-0 sm:text-3xl">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 font-[family-name:var(--font-article-display)] text-xl font-semibold tracking-wide text-zinc-100 sm:text-2xl">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-[1.05rem] sm:leading-7">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-zinc-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-relaxed text-zinc-300">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-semibold text-[#52B788] underline decoration-[#52B788]/40 underline-offset-2 hover:text-[#9df3bd]"
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              target={href?.startsWith("http") ? "_blank" : undefined}
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="mt-6 overflow-x-auto rounded-xl border border-[#18243a]">
              <table className="min-w-full border-collapse text-left text-sm text-zinc-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[#0b1324] text-zinc-200">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-[#18243a] px-3 py-2 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-[#18243a] px-3 py-2 align-top">{children}</td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-6 border-l-4 border-[#52B788] bg-[#0b1324]/70 px-4 py-3 text-zinc-300">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-10 border-[#18243a]" />,
          strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
