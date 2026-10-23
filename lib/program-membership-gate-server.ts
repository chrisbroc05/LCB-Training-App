import "server-only";

import { canAccessProgramDashboard } from "@/lib/program-access-shared";
import { loadAccessUserFields, userAccessSelect } from "@/lib/access-server";
import { prisma } from "@/lib/prisma";

export async function getUserProgramAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userAccessSelect,
  });
  if (!user) {
    return null;
  }
  const access = await loadAccessUserFields(userId);
  if (!access) {
    return null;
  }
  return {
    user,
    access,
    canAccessProgram: canAccessProgramDashboard(access),
  };
}

export async function assertUserCanAccessProgram(userId: string) {
  const result = await getUserProgramAccess(userId);
  if (!result?.canAccessProgram) {
    return null;
  }
  return result;
}
