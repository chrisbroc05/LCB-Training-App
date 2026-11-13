import Link from "next/link";
import ClinicSpotsLines from "@/components/ClinicSpotsLines";
import { listPublicClinics } from "@/lib/clinics-public-server";

export const dynamic = "force-dynamic";

export default async function ClinicsIndexPage() {
  const clinics = await listPublicClinics();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-zinc-100">Clinics</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Sign up for upcoming LCB Training clinics. No account needed to register.
      </p>

      {clinics.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-[#18243a] bg-[#0b1324] px-5 py-8 text-sm text-zinc-400">
          No clinics are open for signup right now. Check back soon.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {clinics.map((clinic) => (
            <li key={clinic.id}>
              <Link
                href={`/clinics/${clinic.slug}`}
                className="block rounded-2xl border border-[#18243a] bg-[#0b1324] px-5 py-5 transition hover:border-[#22c55e]/40"
              >
                <h2 className="text-xl font-semibold text-zinc-100">{clinic.name}</h2>
                <p className="mt-1 text-sm text-zinc-400">{clinic.location}</p>
                <p className="mt-2 text-sm text-zinc-300">{clinic.daysListLabel}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {clinic.timeRangeLabel} | {clinic.agesSportsText}
                </p>
                <p className="mt-2 text-sm text-zinc-300">{clinic.pricingLine}</p>
                <ClinicSpotsLines
                  lines={clinic.spotsLines}
                  className={`mt-3 text-sm font-semibold ${
                    clinic.soldOut ? "text-zinc-400" : "text-[#9df3bd]"
                  }`}
                />
                <span
                  className={`mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold ${
                    clinic.soldOut
                      ? "border border-[#2b3650] text-zinc-300"
                      : "bg-[#22c55e] text-black"
                  }`}
                >
                  {clinic.soldOut ? "View clinic" : "Sign up"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
