import {
  CHICAGOLAND_BUNDLE_HEADING,
  CHICAGOLAND_BUNDLE_TEXT,
  getChicagolandBundleCalendlyUrl,
  getChicagolandBundleEmailUrl,
  getChicagolandBundleSmsUrl,
} from "@/lib/chicagoland-bundle";

const linkClassName =
  "inline-flex items-center justify-center rounded-full border border-[#2b3650] bg-[#0b1324]/80 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:border-[#52B788]/50 hover:text-[#52B788]";

export default function ChicagolandBundleCallout() {
  return (
    <aside className="mt-6 rounded-2xl border border-[#2b3650] bg-[#0A1628]/60 p-5 sm:p-6">
      <h3 className="text-base font-semibold text-zinc-200">{CHICAGOLAND_BUNDLE_HEADING}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{CHICAGOLAND_BUNDLE_TEXT}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={getChicagolandBundleCalendlyUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          Book a free call
        </a>
        <a href={getChicagolandBundleEmailUrl()} className={linkClassName}>
          Email me
        </a>
        <a href={getChicagolandBundleSmsUrl()} className={linkClassName}>
          Text me
        </a>
      </div>
    </aside>
  );
}
