import { assertDevOnlyScript } from "../lib/dev-script-guard-shared";
import { isTestAccountEmail } from "../lib/test-account-shared";
import { prisma } from "../lib/prisma";

async function main() {
  assertDevOnlyScript("scripts/mark-joinflow-test-accounts-dev.ts");
  const candidates = await prisma.user.findMany({
    where: {
      email: { contains: "joinflow", mode: "insensitive" },
    },
    select: { id: true, email: true, isTestAccount: true },
  });

  let updated = 0;
  for (const user of candidates) {
    if (!isTestAccountEmail(user.email)) {
      continue;
    }
    if (user.isTestAccount) {
      continue;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { isTestAccount: true },
    });
    updated += 1;
    console.log(`Marked test account: ${user.email}`);
  }

  console.log(`mark-joinflow-test-accounts-dev: updated ${updated} user(s)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
