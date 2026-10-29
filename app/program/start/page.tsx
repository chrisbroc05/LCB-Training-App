import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ProgramStartWizard from "@/app/program/start/ProgramStartWizard";
import { authOptions } from "@/lib/auth";
import { toAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { canAccessProgramDashboard } from "@/lib/program-access-shared";
import { ensureProgramEnrollmentForUser, serializeProgramEnrollment } from "@/lib/program-enrollment";
import { serializeInPersonTrainingInfo } from "@/lib/in-person-training-shared";
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
    select: {
      ...userAccessSelect,
      name: true,
      email: true,
      acceptedAsParent: true,
      playerAge: true,
      trainsInPerson: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      medicalNotes: true,
      inPersonInfoUpdatedAt: true,
    },
  });

  if (!user || !canAccessProgramDashboard(toAccessUserFields(user))) {
    redirect("/program");
  }

  let enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
  });

  if (!enrollment) {
    enrollment = await ensureProgramEnrollmentForUser(session.user.id);
  }

  if (enrollment.onboardingCompletedAt) {
    redirect("/dashboard/today");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const checkoutParam = resolvedSearchParams.checkout;
  const checkoutSuccess =
    checkoutParam === "success" || checkoutParam === "membership-success";

  return (
    <ProgramStartWizard
      firstName={getFirstName(user.name, user.email)}
      initialEnrollment={serializeProgramEnrollment(enrollment)}
      checkoutSuccess={checkoutSuccess}
      initialAcceptedAsParent={user.acceptedAsParent}
      initialPlayerAge={user.playerAge}
      initialInPersonTraining={serializeInPersonTrainingInfo(user)}
    />
  );
}
