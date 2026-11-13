import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CLINIC_HOLD_MS,
  type ClinicDayAvailability,
  clinicDateKey,
  formatClinicDayLabel,
} from "@/lib/clinics-shared";

/** PAID always counts; PENDING only while holdExpiresAt is still in the future. */
export function clinicCapacityHoldingWhere(now = new Date()): Prisma.ClinicRegistrationWhereInput {
  return {
    OR: [
      { status: "PAID" },
      {
        status: "PENDING",
        holdExpiresAt: { gt: now },
      },
    ],
  };
}

export async function expireStaleClinicHolds(now = new Date()) {
  const result = await prisma.clinicRegistration.updateMany({
    where: {
      status: "PENDING",
      holdExpiresAt: { lt: now },
    },
    data: {
      status: "EXPIRED",
      holdExpiresAt: null,
      updatedAt: now,
    },
  });
  return result.count;
}

export async function countTakenSpotsForClinicDay(params: {
  clinicDayId: string;
  now?: Date;
  excludeRegistrationId?: string | null;
}) {
  const now = params.now ?? new Date();
  await expireStaleClinicHolds(now);

  return prisma.clinicRegistrationDay.count({
    where: {
      clinicDayId: params.clinicDayId,
      ...(params.excludeRegistrationId
        ? { registrationId: { not: params.excludeRegistrationId } }
        : {}),
      registration: clinicCapacityHoldingWhere(now),
    },
  });
}

export async function loadClinicDayAvailability(params: {
  clinicId: string;
  capacityPerDay: number;
  now?: Date;
}): Promise<ClinicDayAvailability[]> {
  const now = params.now ?? new Date();
  await expireStaleClinicHolds(now);

  const days = await prisma.clinicDay.findMany({
    where: { clinicId: params.clinicId },
    orderBy: [{ sortOrder: "asc" }, { date: "asc" }],
    select: { id: true, date: true },
  });

  const availability: ClinicDayAvailability[] = [];
  for (const day of days) {
    const taken = await countTakenSpotsForClinicDay({
      clinicDayId: day.id,
      now,
    });
    const spotsLeft = Math.max(0, params.capacityPerDay - taken);
    const dateKey = clinicDateKey(day.date);
    availability.push({
      dayId: day.id,
      dateKey,
      dateLabel: formatClinicDayLabel(day.date),
      capacity: params.capacityPerDay,
      taken,
      spotsLeft,
      soldOut: spotsLeft <= 0,
    });
  }
  return availability;
}

export function clinicHoldExpiresAt(now = new Date()) {
  return new Date(now.getTime() + CLINIC_HOLD_MS);
}

export async function assertClinicDaysHaveCapacity(params: {
  clinicDayIds: string[];
  capacityPerDay: number;
  now?: Date;
  excludeRegistrationId?: string | null;
}) {
  const now = params.now ?? new Date();
  const soldOutLabels: string[] = [];

  for (const clinicDayId of params.clinicDayIds) {
    const day = await prisma.clinicDay.findUnique({
      where: { id: clinicDayId },
      select: { id: true, date: true },
    });
    if (!day) {
      soldOutLabels.push("Unknown day");
      continue;
    }
    const taken = await countTakenSpotsForClinicDay({
      clinicDayId,
      now,
      excludeRegistrationId: params.excludeRegistrationId,
    });
    if (taken >= params.capacityPerDay) {
      soldOutLabels.push(formatClinicDayLabel(day.date));
    }
  }

  return soldOutLabels;
}
