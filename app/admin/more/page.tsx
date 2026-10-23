import Link from "next/link";
import AdminViewToggleInline from "@/app/AdminViewToggleInline";
import { ADMIN_NAV_SECTIONS } from "@/lib/admin-nav-shared";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminMorePage() {
  const business = ADMIN_NAV_SECTIONS.find((section) => section.id === "business");
  const settings = ADMIN_NAV_SECTIONS.find((section) => section.id === "settings");

  return (
    <div className="space-y-8 pb-4">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">More</h1>
        <p className="mt-2 text-sm text-zinc-400">Business, settings, and view switching.</p>
      </header>

      {business ? (
        <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Business</h2>
          <nav className="mt-3 space-y-1">
            {business.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200 hover:bg-[#1a253a] hover:text-[#9df3bd]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </section>
      ) : null}

      {settings ? (
        <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Settings</h2>
          <nav className="mt-3 space-y-1">
            {settings.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200 hover:bg-[#1a253a] hover:text-[#9df3bd]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">View</h2>
        <div className="mt-3">
          <AdminViewToggleInline />
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Member view uses the normal app navigation. Admin view uses the admin tabs below.
        </p>
        <Link
          href={ADMIN_ROUTES.today}
          className="mt-4 inline-flex text-sm font-semibold text-[#52B788]"
        >
          Back to Today
        </Link>
      </section>
    </div>
  );
}
