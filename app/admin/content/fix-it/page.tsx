import Link from "next/link";
import { ADMIN_ROUTES } from "@/lib/admin-routes-shared";

export default function AdminContentFixItPage() {
  return (
    <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-5 sm:p-8">
      <h1 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Fix-It plans</h1>
      <p className="mt-3 text-sm text-zinc-300">
        There is no separate Fix-It catalog in admin. Fix-It access is granted per member from the
        Members CRM (product access panel on each profile).
      </p>
      <Link
        href={ADMIN_ROUTES.players.members}
        className="mt-6 inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-black"
      >
        Open Members
      </Link>
    </section>
  );
}
