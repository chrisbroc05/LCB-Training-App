import Link from "next/link";
import { notFound } from "next/navigation";
import ClinicSpotsLines from "@/components/ClinicSpotsLines";
import { getPublicClinicBySlug } from "@/lib/clinics-public-server";
import ClinicSignupForm from "@/app/clinics/[slug]/ClinicSignupForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkout?: string }>;
};

export default async function ClinicDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const clinic = await getPublicClinicBySlug(slug);
  if (!clinic) {
    notFound();
  }

  const checkoutCancelled = resolvedSearch.checkout === "cancelled";

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
          checkoutCancelled={checkoutCancelled}
        />
      </div>
    </div>
  );
}
