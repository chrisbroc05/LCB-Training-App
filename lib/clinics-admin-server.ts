import "server-only";

import { prisma } from "@/lib/prisma";
import {
  CLINIC_DEFAULT_REFUND_POLICY,
  clinicDateKey,
  formatClinicDayLabel,
  formatClinicMoney,
  formatClinicSportLabel,
  slugifyClinicName,
  type ClinicSportKey,
} from "@/lib/clinics-shared";
import { loadClinicDayAvailability } from "@/lib/clinics-capacity-server";
import { markClinicRegistrationRefunded } from "@/lib/clinics-fulfill-server";

function parseDateKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export type AdminClinicCreateInput = {
  name: string;
  slug?: string | null;
  location: string;
  agesSportsText: string;
  description: string;
  whatToBring: string;
  refundPolicyText?: string | null;
  startTimeLocal: string;
  endTimeLocal: string;
  pricePerDayCents: number;
  allDaysPriceCents: number;
  capacityPerDay: number;
  active?: boolean;
  closed?: boolean;
  dayDateKeys: string[];
};

export async function listAdminClinics() {
  const clinics = await prisma.clinic.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      days: { orderBy: [{ sortOrder: "asc" }, { date: "asc" }] },
      _count: { select: { registrations: true } },
    },
  });

  const rows = [];
  for (const clinic of clinics) {
    const availability = await loadClinicDayAvailability({
      clinicId: clinic.id,
      capacityPerDay: clinic.capacityPerDay,
    });
    rows.push({
      id: clinic.id,
      slug: clinic.slug,
      name: clinic.name,
      location: clinic.location,
      active: clinic.active,
      closed: clinic.closed,
      pricePerDayLabel: formatClinicMoney(clinic.pricePerDayCents),
      allDaysPriceLabel: formatClinicMoney(clinic.allDaysPriceCents),
      capacityPerDay: clinic.capacityPerDay,
      registrationCount: clinic._count.registrations,
      dayLabels: clinic.days.map((day) => formatClinicDayLabel(day.date)),
      availability,
    });
  }
  return rows;
}

export async function getAdminClinicDetail(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      days: { orderBy: [{ sortOrder: "asc" }, { date: "asc" }] },
      registrations: {
        orderBy: { createdAt: "desc" },
        include: {
          days: {
            include: { clinicDay: true },
            orderBy: { clinicDay: { sortOrder: "asc" } },
          },
        },
      },
    },
  });
  if (!clinic) {
    return null;
  }

  const availability = await loadClinicDayAvailability({
    clinicId: clinic.id,
    capacityPerDay: clinic.capacityPerDay,
  });

  return {
    id: clinic.id,
    slug: clinic.slug,
    name: clinic.name,
    location: clinic.location,
    agesSportsText: clinic.agesSportsText,
    description: clinic.description,
    whatToBring: clinic.whatToBring,
    refundPolicyText: clinic.refundPolicyText,
    startTimeLocal: clinic.startTimeLocal,
    endTimeLocal: clinic.endTimeLocal,
    pricePerDayCents: clinic.pricePerDayCents,
    allDaysPriceCents: clinic.allDaysPriceCents,
    capacityPerDay: clinic.capacityPerDay,
    active: clinic.active,
    closed: clinic.closed,
    dayDateKeys: clinic.days.map((day) => clinicDateKey(day.date)),
    dayLabels: clinic.days.map((day) => formatClinicDayLabel(day.date)),
    availability,
    registrations: clinic.registrations.map((reg) => ({
      id: reg.id,
      status: reg.status,
      playerName: reg.playerName,
      playerAge: reg.playerAge,
      sport: reg.sport as ClinicSportKey,
      sportLabel: formatClinicSportLabel(reg.sport as ClinicSportKey),
      position: reg.position,
      parentName: reg.parentName,
      parentEmail: reg.parentEmail,
      parentPhone: reg.parentPhone,
      emergencyContactName: reg.emergencyContactName,
      emergencyContactPhone: reg.emergencyContactPhone,
      mediaConsent: reg.mediaConsent,
      amountCents: reg.amountCents,
      amountLabel: formatClinicMoney(reg.amountCents),
      isAllDaysBundle: reg.isAllDaysBundle,
      paidAt: reg.paidAt?.toISOString() ?? null,
      refundedAt: reg.refundedAt?.toISOString() ?? null,
      dayLabels: reg.days.map((row) => formatClinicDayLabel(row.clinicDay.date)),
    })),
  };
}

export async function createAdminClinic(input: AdminClinicCreateInput) {
  const name = input.name.trim();
  if (!name) {
    return { ok: false as const, error: "Name is required." };
  }

  const dayDates = input.dayDateKeys
    .map((key) => parseDateKey(key))
    .filter((value): value is Date => Boolean(value));
  if (dayDates.length === 0) {
    return { ok: false as const, error: "Add at least one clinic day (YYYY-MM-DD)." };
  }

  const slugBase = (input.slug?.trim() || slugifyClinicName(name)).toLowerCase();
  let slug = slugBase;
  let suffix = 2;
  while (await prisma.clinic.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  const clinic = await prisma.clinic.create({
    data: {
      name,
      slug,
      location: input.location.trim(),
      agesSportsText: input.agesSportsText.trim(),
      description: input.description.trim(),
      whatToBring: input.whatToBring.trim(),
      refundPolicyText: (input.refundPolicyText?.trim() || CLINIC_DEFAULT_REFUND_POLICY).trim(),
      startTimeLocal: input.startTimeLocal.trim(),
      endTimeLocal: input.endTimeLocal.trim(),
      pricePerDayCents: Math.round(input.pricePerDayCents),
      allDaysPriceCents: Math.round(input.allDaysPriceCents),
      capacityPerDay: Math.round(input.capacityPerDay),
      active: input.active ?? true,
      closed: input.closed ?? false,
      days: {
        create: dayDates.map((date, index) => ({ date, sortOrder: index })),
      },
    },
    select: { id: true, slug: true },
  });

  return { ok: true as const, clinic };
}

export async function updateAdminClinic(
  clinicId: string,
  input: Partial<AdminClinicCreateInput> & { active?: boolean; closed?: boolean },
) {
  const existing = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: { days: true },
  });
  if (!existing) {
    return { ok: false as const, error: "Clinic not found." };
  }

  const data: {
    name?: string;
    location?: string;
    agesSportsText?: string;
    description?: string;
    whatToBring?: string;
    refundPolicyText?: string;
    startTimeLocal?: string;
    endTimeLocal?: string;
    pricePerDayCents?: number;
    allDaysPriceCents?: number;
    capacityPerDay?: number;
    active?: boolean;
    closed?: boolean;
  } = {};

  if (typeof input.name === "string") data.name = input.name.trim();
  if (typeof input.location === "string") data.location = input.location.trim();
  if (typeof input.agesSportsText === "string") data.agesSportsText = input.agesSportsText.trim();
  if (typeof input.description === "string") data.description = input.description.trim();
  if (typeof input.whatToBring === "string") data.whatToBring = input.whatToBring.trim();
  if (typeof input.refundPolicyText === "string") {
    data.refundPolicyText = input.refundPolicyText.trim() || CLINIC_DEFAULT_REFUND_POLICY;
  }
  if (typeof input.startTimeLocal === "string") data.startTimeLocal = input.startTimeLocal.trim();
  if (typeof input.endTimeLocal === "string") data.endTimeLocal = input.endTimeLocal.trim();
  if (typeof input.pricePerDayCents === "number") {
    data.pricePerDayCents = Math.round(input.pricePerDayCents);
  }
  if (typeof input.allDaysPriceCents === "number") {
    data.allDaysPriceCents = Math.round(input.allDaysPriceCents);
  }
  if (typeof input.capacityPerDay === "number") {
    data.capacityPerDay = Math.round(input.capacityPerDay);
  }
  if (typeof input.active === "boolean") data.active = input.active;
  if (typeof input.closed === "boolean") data.closed = input.closed;

  await prisma.clinic.update({ where: { id: clinicId }, data });

  if (Array.isArray(input.dayDateKeys)) {
    const dayDates = input.dayDateKeys
      .map((key) => parseDateKey(key))
      .filter((value): value is Date => Boolean(value));
    if (dayDates.length === 0) {
      return { ok: false as const, error: "Keep at least one clinic day." };
    }

    const paidOrPendingDayIds = await prisma.clinicRegistrationDay.findMany({
      where: {
        clinicDay: { clinicId },
        registration: { status: { in: ["PAID", "PENDING"] } },
      },
      select: { clinicDayId: true },
    });
    const lockedDayIds = new Set(paidOrPendingDayIds.map((row) => row.clinicDayId));

    const existingByKey = new Map(
      existing.days.map((day) => [clinicDateKey(day.date), day]),
    );
    const nextKeys = new Set(dayDates.map((date) => clinicDateKey(date)));

    for (const day of existing.days) {
      const key = clinicDateKey(day.date);
      if (!nextKeys.has(key)) {
        if (lockedDayIds.has(day.id)) {
          return {
            ok: false as const,
            error: `Cannot remove ${formatClinicDayLabel(day.date)} while registrations exist.`,
          };
        }
        await prisma.clinicDay.delete({ where: { id: day.id } });
      }
    }

    let sortOrder = 0;
    for (const date of dayDates) {
      const key = clinicDateKey(date);
      const current = existingByKey.get(key);
      if (current) {
        await prisma.clinicDay.update({
          where: { id: current.id },
          data: { sortOrder },
        });
      } else {
        await prisma.clinicDay.create({
          data: { clinicId, date, sortOrder },
        });
      }
      sortOrder += 1;
    }
  }

  return { ok: true as const };
}

export async function buildClinicRosterCsv(clinicId: string) {
  const detail = await getAdminClinicDetail(clinicId);
  if (!detail) {
    return null;
  }

  const header = [
    "status",
    "playerName",
    "playerAge",
    "sport",
    "position",
    "parentName",
    "parentEmail",
    "parentPhone",
    "emergencyContactName",
    "emergencyContactPhone",
    "days",
    "amount",
    "mediaConsent",
    "paidAt",
    "refundedAt",
  ];

  const lines = [header.join(",")];
  for (const reg of detail.registrations) {
    lines.push(
      [
        reg.status,
        reg.playerName,
        String(reg.playerAge),
        reg.sportLabel,
        reg.position ?? "",
        reg.parentName,
        reg.parentEmail,
        reg.parentPhone ?? "",
        reg.emergencyContactName,
        reg.emergencyContactPhone,
        reg.dayLabels.join(" | "),
        reg.amountLabel,
        reg.mediaConsent ? "yes" : "group_only",
        reg.paidAt ?? "",
        reg.refundedAt ?? "",
      ]
        .map((value) => csvEscape(String(value)))
        .join(","),
    );
  }

  return {
    filename: `${detail.slug}-roster.csv`,
    csv: `${lines.join("\n")}\n`,
  };
}

export async function adminMarkClinicRegistrationRefunded(registrationId: string) {
  return markClinicRegistrationRefunded({ registrationId });
}
