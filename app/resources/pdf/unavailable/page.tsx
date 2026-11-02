import Link from "next/link";
import PublicPageShell from "@/components/PublicPageShell";
import {
  memberPdfUnavailableMessage,
  type MemberPdfUnavailableCode,
} from "@/lib/member-pdf-unavailable-shared";

type PageProps = {
  searchParams: Promise<{ code?: string }>;
};

function readCode(value: string | undefined): MemberPdfUnavailableCode {
  if (
    value === "sign-in" ||
    value === "forbidden" ||
    value === "invalid" ||
    value === "expired" ||
    value === "missing" ||
    value === "error"
  ) {
    return value;
  }
  return "error";
}

export default async function MemberPdfUnavailablePage({ searchParams }: PageProps) {
  const { code: rawCode } = await searchParams;
  const code = readCode(rawCode);
  const message = memberPdfUnavailableMessage(code);

  return (
    <PublicPageShell isLoggedIn={code !== "sign-in"}>
      <div className="mx-auto w-full max-w-lg px-4 py-14 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#52B788]">PDF</p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
          Could not open PDF
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">{message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/resources?tab=mine"
            className="inline-flex min-h-[48px] items-center rounded-full bg-[#2D6A4F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#52B788]"
          >
            Back to Resources
          </Link>
          {code === "sign-in" ? (
            <Link
              href="/auth?redirect=/resources"
              className="inline-flex min-h-[48px] items-center rounded-full border border-[#2b3650] px-5 py-3 text-sm font-semibold text-zinc-200"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </PublicPageShell>
  );
}
