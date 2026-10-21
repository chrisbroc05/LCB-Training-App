import Link from "next/link";
import { getServerSession } from "next-auth";
import PurchaseLinkRecoveryForm from "@/app/resources/PurchaseLinkRecoveryForm";
import PublicPageShell from "@/components/PublicPageShell";
import { authOptions } from "@/lib/auth";
import { isFixItResourceSlug } from "@/lib/fix-it-plans-shared";
import {
  PURCHASE_LINK_RECOVERY_CONFIRMATION,
  RESOURCE_DOWNLOAD_INVALID_HEADLINE,
} from "@/lib/resource-download-access-shared";
import { getResourceDefinition } from "@/lib/resources-shared";

type RecoverDownloadPageProps = {
  searchParams: Promise<{ resource?: string }>;
};

export default async function RecoverDownloadPage({ searchParams }: RecoverDownloadPageProps) {
  const session = await getServerSession(authOptions);
  const { resource: resourceSlug } = await searchParams;
  const resource = resourceSlug ? getResourceDefinition(resourceSlug) : null;
  const isFixIt = resourceSlug ? isFixItResourceSlug(resourceSlug) : false;
  const apiPath = isFixIt ? "/api/fix-it/request-plan-link" : "/api/resources/request-download-link";
  const submitLabel = isFixIt ? "Email my plan link" : "Email my download link";

  return (
    <PublicPageShell isLoggedIn={Boolean(session?.user?.id)}>
      <div className="mx-auto w-full max-w-lg px-4 py-14 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">Download</p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">Get a new link</h1>
        {resource ? (
          <p className="mt-2 text-base text-zinc-400">{resource.title}</p>
        ) : null}

        <div className="mt-10 rounded-2xl border border-[#18243a] bg-[#0b1324]/90 p-6">
          <p className="text-sm leading-relaxed text-zinc-300">{RESOURCE_DOWNLOAD_INVALID_HEADLINE}</p>
          <p className="mt-3 text-sm text-zinc-400">Enter the email you used and we&apos;ll send you a new one.</p>

          {resourceSlug && resource ? (
            <PurchaseLinkRecoveryForm
              resourceSlug={resourceSlug}
              apiPath={apiPath}
              submitLabel={submitLabel}
              confirmationMessage={PURCHASE_LINK_RECOVERY_CONFIRMATION}
            />
          ) : (
            <p className="mt-6 text-sm text-zinc-400">
              <Link href="/resources" className="font-semibold text-[#52B788] hover:underline">
                Browse resources
              </Link>{" "}
              to find your purchase.
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-zinc-400">
          <Link href="/resources" className="font-semibold text-[#52B788] underline-offset-2 hover:underline">
            Back to resources
          </Link>
        </p>
      </div>
    </PublicPageShell>
  );
}
