import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ProgramStartWizard from "@/app/program/start/ProgramStartWizard";
import { authOptions } from "@/lib/auth";
import { ensureProgramEnrollmentForUser, serializeProgramEnrollment } from "@/lib/program-enrollment";
import { prisma } from "@/lib/prisma";

type ProgramStartPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstName(name: string | null | undefined, email: string | null | undefined) {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName.split(/\s+/)[0];
  }

  return email?.split("@")[0] ?? "";
}

export default async function ProgramStartPage({ searchParams }: ProgramStartPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth?redirect=%2Fprogram%2Fstart");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true, name: true, email: true },
  });

  if (!user || user.membershipTier !== "TWELVE_WEEK") {
    redirect("/program");
  }

  let enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!enrollment) {
    enrollment = await ensureProgramEnrollmentForUser(session.user.id);
  }

  if (enrollment.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const checkoutSuccess = resolvedSearchParams.checkout === "success";

  return (
    <ProgramStartWizard
      firstName={getFirstName(user.name, user.email)}
      initialEnrollment={serializeProgramEnrollment(enrollment)}
      checkoutSuccess={checkoutSuccess}
    />
  );
}
