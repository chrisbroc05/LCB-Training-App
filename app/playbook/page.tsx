import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PlaybookApp from "@/app/playbook/PlaybookApp";
import PlaybookFreePreview from "@/app/playbook/PlaybookFreePreview";
import { canAccessPlaybook, type DatabaseTier } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

export default async function PlaybookPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth?redirect=/playbook");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipTier: true, name: true },
  });
  const membershipTier = (user?.membershipTier ?? "FREE") as DatabaseTier;

  if (!canAccessPlaybook(membershipTier)) {
    return <PlaybookFreePreview />;
  }

  return <PlaybookApp />;
}
