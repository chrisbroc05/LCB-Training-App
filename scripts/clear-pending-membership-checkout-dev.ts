/**
 * Clears stuck membership checkout intents (local dev).
 * Run: npx tsx scripts/clear-pending-membership-checkout-dev.ts [email-substring]
 */
import "dotenv/config";
import { assertDevOnlyScript } from "../lib/dev-script-guard-shared";
import { prisma } from "../lib/prisma";

async function main() {
  assertDevOnlyScript("scripts/clear-pending-membership-checkout-dev.ts");
  const filter = process.argv[2]?.trim();
  const result = await prisma.user.updateMany({
    where: {
      pendingCheckoutLevel: { not: null },
      ...(filter ? { email: { contains: filter, mode: "insensitive" } } : {}),
    },
    data: {
      pendingCheckoutLevel: null,
      pendingCheckoutBillingInterval: null,
      pendingCheckoutAt: null,
    },
  });
  console.log(`Cleared pending membership checkout on ${result.count} user(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
