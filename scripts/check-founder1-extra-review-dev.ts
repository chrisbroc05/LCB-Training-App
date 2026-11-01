import { assertDevOnlyScript } from "../lib/dev-script-guard-shared";
import { prisma } from "../lib/prisma";

async function main() {
  assertDevOnlyScript("scripts/check-founder1-extra-review-dev.ts");
  const user = await prisma.user.findFirst({
    where: { email: "founder1@dev.lcbtraining.test" },
    select: {
      id: true,
      email: true,
      extraReviewCredits: {
        select: {
          id: true,
          usedAt: true,
          expiresAt: true,
          stripeCheckoutSessionId: true,
          purchasedAt: true,
        },
        orderBy: { purchasedAt: "desc" },
      },
    },
  });
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
