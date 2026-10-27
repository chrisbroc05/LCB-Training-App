import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MembershipLevelCheckoutButton from "@/app/components/MembershipLevelCheckoutButton";
import MembershipLevelSignupLink from "@/app/components/MembershipLevelSignupLink";
import { listPublicMembershipLevelDefinitions } from "@/lib/membership-levels-shared";
import { isAllAccessCheckoutAvailable } from "@/lib/membership-subscription-server";

export default async function PublicMembershipLevelsSection() {
  const levels = listPublicMembershipLevelDefinitions();
  if (levels.length === 0) {
    return null;
  }

  const session = await getServerSession(authOptions);
  const allAccessAvailable = await isAllAccessCheckoutAvailable();

  return (
    <section className="mt-14">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Membership levels</h2>
        <p className="mt-2 text-zinc-300">Core, Plus, and All-Access. Billed monthly in the app.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {levels.map((level) => (
          <article
            key={level.key}
            className="rounded-2xl border border-[#18243a] bg-[#0b1324]/80 p-6 shadow-lg shadow-black/40"
          >
            <h3 className="text-xl font-semibold text-zinc-100">{level.displayName}</h3>
            <p className="mt-1 text-sm font-medium text-[#52B788]">{level.tagline}</p>
            <p className="mt-3 text-2xl font-bold text-[#98b144]">{level.priceDisplay}</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{level.shortDescription}</p>
            <div className="mt-5">
              {session?.user?.id ? (
                <MembershipLevelCheckoutButton
                  level={level.key}
                  capFullWaitlist={level.key === "ALL_ACCESS" && !allAccessAvailable}
                />
              ) : (
                <MembershipLevelSignupLink level={level.key} />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
