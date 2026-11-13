import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClinicSpotsLines from "@/components/ClinicSpotsLines";
import { cancelClinicCheckoutOnReturn } from "@/lib/clinics-fulfill-server";
import { getPublicClinicBySlug } from "@/lib/clinics-public-server";
import ClinicSignupForm from "@/app/clinics/[slug]/ClinicSignupForm";
import { buildPublicPageMetadata, metadataForPublicPage } from "@/lib/public-seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const clinic = await getPublicClinicBySlug(slug);
  if (!clinic) {
    return metadataForPublicPage("clinics");
  }
  const title = `${clinic.name} | Clinics`.slice(0, 60);
  const description =
    `${clinic.name} at ${clinic.location}. ${clinic.daysListLabel}. ${clinic.pricingLine}`.slice(
      0,
      160,
    );
  return buildPublicPageMetadata({
    path: `/clinics/${clinic.slug}`,
    title: title.length >= 30 ? title : `${clinic.name} | LCB Clinics`,
    description:
      description.length >= 110
        ? description
        : `Sign up for ${clinic.name} with Coach Broc at LCB Training. Secure online registration and day selection.`,
  });
}

export default async function ClinicDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const checkoutCancelled = resolvedSearch.checkout === "cancelled";
  const cancelSessionId = resolvedSearch.session_id?.trim() || "";

  if (checkoutCancelled && cancelSessionId) {
    await cancelClinicCheckoutOnReturn(cancelSessionId);
  }

  const clinic = await getPublicClinicBySlug(slug);
  if (!clinic) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm text-zinc-500">
        <Link href="/clinics" className="text-[#52B788] hover:text-[#9df3bd]">
          Clinics
        </Link>
        <span className="mx-2">/</span>
        {clinic.name}
      </p>

      <header className="mt-4 space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-100">{clinic.name}</h1>
        <p className="text-sm text-zinc-400">
          {clinic.location} | {clinic.timeRangeLabel} | {clinic.agesSportsText}
        </p>
        <p className="text-sm text-zinc-300">{clinic.daysListLabel}</p>
        <ClinicSpotsLines
          lines={clinic.spotsLines}
          className={`text-sm font-semibold ${
            clinic.soldOut ? "text-zinc-400" : "text-[#9df3bd]"
          }`}
        />
      </header>

      <section className="mt-6 space-y-3 text-sm leading-6 text-zinc-300">
        <p>{clinic.description}</p>
        <p>
          <span className="font-semibold text-zinc-100">What to bring: </span>
          {clinic.whatToBring}
        </p>
        <p>
          <span className="font-semibold text-zinc-100">Pricing: </span>
          {clinic.pricingLine}
        </p>
      </section>

      <div className="mt-8">
        <ClinicSignupForm
          slug={clinic.slug}
          clinicName={clinic.name}
          closed={clinic.closed}
          soldOut={clinic.soldOut}
          days={clinic.days}
          pricePerDayCents={clinic.pricePerDayCents}
          allDaysPriceCents={clinic.allDaysPriceCents}
          refundPolicyText={clinic.refundPolicyText}
          startTimeLocal={clinic.startTimeLocal}
          endTimeLocal={clinic.endTimeLocal}
          checkoutCancelled={checkoutCancelled}
        />
      </div>
    </div>
  );
}
