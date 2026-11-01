import { assertDevOnlyScript } from "../lib/dev-script-guard-shared";
import { prisma } from "../lib/prisma";

async function main() {
  assertDevOnlyScript("scripts/verify-commission-net-migration-dev.ts");
  const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'OrgCommissionLedgerEntry'
      AND column_name IN ('amountPaidCents','processingFeeCents','netCents','commissionFeePending')
    ORDER BY column_name`;
  console.log("OrgCommissionLedgerEntry columns:", cols.map((c) => c.column_name));

  const paymentCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'MembershipSubscriptionPayment'
      AND column_name IN ('amountPaidCents','processingFeeCents','netCents','commissionFeePending')
    ORDER BY column_name`;
  console.log("MembershipSubscriptionPayment columns:", paymentCols.map((c) => c.column_name));

  const mig = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date }>>`
    SELECT migration_name, finished_at FROM "_prisma_migrations"
    WHERE migration_name LIKE '%commission_net%'
    ORDER BY finished_at DESC LIMIT 3`;
  console.log("migrations:", mig);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
