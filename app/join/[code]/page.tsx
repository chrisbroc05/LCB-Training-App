import Link from "next/link";
import { redirect } from "next/navigation";
import JoinOrganizationForm from "@/app/join/JoinOrganizationForm";
import { getRequestServerSession } from "@/lib/auth-server-session";
import { buildOrgJoinWelcomePath } from "@/lib/org-join-auth-shared";
import { findOrganizationByJoinCode } from "@/lib/org-server";
import { prisma } from "@/lib/prisma";

type JoinPageProps = {
  params: Promise<{ code: string }>;
};

export const dynamic = "force-dynamic";

export default async function JoinOrganizationPage({ params }: JoinPageProps) {
  const { code: codeParam } = await params;
  const session = await getRequestServerSession();
  const match = await findOrganizationByJoinCode(codeParam);

  if (!match) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-100">Invalid organization code</h1>
          <p className="mt-3 text-sm text-zinc-400">
            That code is not active. Check with your coach or organization admin.
          </p>
          <Link href="/dashboard" className="mt-6 inline-flex text-sm font-semibold text-[#52B788]">
            Back to dashboard
          </Link>
        </section>
      </div>
    );
  }

  const org = match.organization;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    if (user?.organizationId === org.id) {
      redirect(buildOrgJoinWelcomePath(match.code));
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <section className="rounded-3xl border border-[#18243a] bg-[#0b1324]/80 p-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Join {org.name}</h1>
        <p className="mt-3 text-sm text-zinc-300">
          Connect your LCB Training account to your team or organization.
        </p>
        <JoinOrganizationForm
          code={match.code}
          organizationName={org.name}
          teams={org.teams.map((team) => ({ id: team.id, name: team.name }))}
          isLoggedIn={Boolean(session?.user?.id)}
        />
      </section>
    </div>
  );
}
