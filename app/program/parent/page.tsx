import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ProgramParentForm from "@/app/program/parent/ProgramParentForm";
import { authOptions } from "@/lib/auth";
import { assertUserCanAccessProgram } from "@/lib/program-membership-gate-server";
import { prisma } from "@/lib/prisma";

export default async function ProgramParentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth?redirect=%2Fprogram%2Fparent");
  }

  const accessResult = await assertUserCanAccessProgram(session.user.id);
  if (!accessResult) {
    redirect("/program");
  }

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId: session.user.id },
    select: { onboardingCompletedAt: true },
  });

  if (!enrollment?.onboardingCompletedAt) {
    redirect("/program/start");
  }

  return <ProgramParentForm />;
}
