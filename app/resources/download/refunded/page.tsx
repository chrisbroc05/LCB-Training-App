import Link from "next/link";
import { getServerSession } from "next-auth";
import PublicPageShell from "@/components/PublicPageShell";
import { authOptions } from "@/lib/auth";
import { RESOURCE_DOWNLOAD_REFUNDED_HEADLINE } from "@/lib/resource-download-access-shared";
import { getResourceDefinition } from "@/lib/resources-shared";

type RefundedDownloadPageProps = {
  searchParams: Promise<{ resource?: string }>;
};

export default async function RefundedDownloadPage({ searchParams }: RefundedDownloadPageProps) {
  const session = await getServerSession(authOptions);
  const { resource: resourceSlug } = await searchParams;
  const resource = resourceSlug ? getResourceDefinition(resourceSlug) : null;

  return (
    <PublicPageShell isLoggedIn={Boolean(session?.user?.id)}>
      <div className="mx-auto w-full max-w-lg px-4 py-14 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">Download</p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">Not available</h1>
        {resource ? (
          <p className="mt-2 text-base text-zinc-400">{resource.title}</p>
        ) : null}

        <div className="mt-10 rounded-2xl border border-[#18243a] bg-[#0b1324]/90 p-6">
          <p className="text-sm leading-relaxed text-zinc-300">{RESOURCE_DOWNLOAD_REFUNDED_HEADLINE}</p>
          <p className="mt-4 text-sm text-zinc-400">
            Questions? Email{" "}
            <a href="mailto:chrisbroc05@gmail.com" className="font-semibold text-[#52B788] hover:underline">
              chrisbroc05@gmail.com
            </a>
            .
          </p>
          <Link
            href="/resources"
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#2D6A4F] px-6 py-3 text-sm font-semibold text-white hover:bg-[#52B788]"
          >
            Back to resources
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
