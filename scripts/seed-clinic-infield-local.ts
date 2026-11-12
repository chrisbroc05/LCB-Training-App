/**
 * Local-only seed for the first Infield Clinic.
 * Refuses production DATABASE_URL and NODE_ENV=production.
 *
 * Usage: npm run db:seed:clinic:local
 */
import "dotenv/config";
import { assertSafeDevDatabaseTarget } from "../lib/dev-environment-guard-shared";
import {
  CLINIC_DEFAULT_NAME,
  CLINIC_DEFAULT_REFUND_POLICY,
  CLINIC_DEFAULT_SLUG,
} from "../lib/clinics-shared";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required to seed the local clinic.`);
  }
  return value;
}

/** Store Chicago calendar dates as UTC noon date-only values. */
function chicagoDateOnly(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  assertSafeDevDatabaseTarget(databaseUrl, "db:seed:clinic:local");

  if (process.env.NODE_ENV === "production") {
    throw new Error("db:seed:clinic:local cannot run with NODE_ENV=production.");
  }

  const { prisma } = await import("../lib/prisma");

  const name = CLINIC_DEFAULT_NAME;
  const slug = CLINIC_DEFAULT_SLUG;
  const days = [
    chicagoDateOnly(2026, 11, 23),
    chicagoDateOnly(2026, 11, 24),
    chicagoDateOnly(2026, 11, 25),
  ];

  const existing = await prisma.clinic.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (existing) {
    if (existing.name !== name) {
      await prisma.clinic.update({
        where: { id: existing.id },
        data: { name },
      });
      console.log(`Updated clinic name to ${name} (${slug}, ${existing.id}).`);
    } else {
      console.log(`Clinic already exists: ${slug} (${existing.id}). Skipping create.`);
    }
    return;
  }

  const clinic = await prisma.clinic.create({
    data: {
      slug,
      name,
      location: "NWT facility",
      agesSportsText: "All ages, baseball and softball",
      description:
        "Infield clinic focused on footwork, glove work, and game-speed reps. Baseball and softball welcome.",
      whatToBring: "Glove, water, athletic shoes, and a positive attitude.",
      refundPolicyText: CLINIC_DEFAULT_REFUND_POLICY,
      startTimeLocal: "10:30",
      endTimeLocal: "12:00",
      pricePerDayCents: 2500,
      allDaysPriceCents: 6500,
      capacityPerDay: 20,
      active: true,
      closed: false,
      days: {
        create: days.map((date, index) => ({
          date,
          sortOrder: index,
        })),
      },
    },
    include: { days: true },
  });

  console.log(`Seeded clinic ${clinic.name} (${clinic.slug}) with ${clinic.days.length} days.`);
  console.log(`Open locally: /clinics/${clinic.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const { prisma } = await import("../lib/prisma");
      await prisma.$disconnect();
    } catch {
      // ignore disconnect errors when init failed
    }
  });
