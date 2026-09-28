import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ProgramParentForm from "@/app/program/parent/ProgramParentForm";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProgramParentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth?redirect=%2Fprogram%2Fparent");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true },
  });

  if (!user || user.membershipTier !== "TWELVE_WEEK") {
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
