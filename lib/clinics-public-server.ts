import "server-only";

import { prisma } from "@/lib/prisma";
import {
  clinicOverallSoldOut,
  formatClinicDayLabel,
  formatClinicMoney,
  formatClinicTimeRange,
  type ClinicDayAvailability,
} from "@/lib/clinics-shared";
import { loadClinicDayAvailability } from "@/lib/clinics-capacity-server";

export type PublicClinicSummary = {
  id: string;
  slug: string;
  name: string;
  location: string;
  agesSportsText: string;
  startTimeLocal: string;
  endTimeLocal: string;
  timeRangeLabel: string;
  pricePerDayLabel: string;
  allDaysPriceLabel: string;
  dayLabels: string[];
  spotsSummary: string;
  soldOut: boolean;
  closed: boolean;
};

export type PublicClinicDetail = PublicClinicSummary & {
  description: string;
  whatToBring: string;
  refundPolicyText: string;
  pricePerDayCents: number;
  allDaysPriceCents: number;
  capacityPerDay: number;
  active: boolean;
  days: ClinicDayAvailability[];
};

function spotsSummaryFromDays(days: ClinicDayAvailability[]) {
  if (days.length === 0) {
    return "No dates scheduled";
  }
  if (clinicOverallSoldOut(days)) {
    return "Sold out";
  }
  const minLeft = Math.min(...days.map((day) => day.spotsLeft));
  return `${minLeft} spot${minLeft === 1 ? "" : "s"} left (best day)`;
}

export async function listPublicClinics(): Promise<PublicClinicSummary[]> {
  const clinics = await prisma.clinic.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    include: {
      days: { orderBy: [{ sortOrder: "asc" }, { date: "asc" }] },
    },
  });

  const summaries: PublicClinicSummary[] = [];
  for (const clinic of clinics) {
    const availability = await loadClinicDayAvailability({
      clinicId: clinic.id,
      capacityPerDay: clinic.capacityPerDay,
    });
    const soldOut = clinic.closed || clinicOverallSoldOut(availability);
    summaries.push({
      id: clinic.id,
      slug: clinic.slug,
      name: clinic.name,
      location: clinic.location,
      agesSportsText: clinic.agesSportsText,
      startTimeLocal: clinic.startTimeLocal,
      endTimeLocal: clinic.endTimeLocal,
      timeRangeLabel: formatClinicTimeRange(clinic.startTimeLocal, clinic.endTimeLocal),
      pricePerDayLabel: formatClinicMoney(clinic.pricePerDayCents),
      allDaysPriceLabel: formatClinicMoney(clinic.allDaysPriceCents),
      dayLabels: clinic.days.map((day) => formatClinicDayLabel(day.date)),
      spotsSummary: clinic.closed ? "Closed" : spotsSummaryFromDays(availability),
      soldOut,
      closed: clinic.closed,
    });
  }
  return summaries;
}

export async function getPublicClinicBySlug(slug: string): Promise<PublicClinicDetail | null> {
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    include: {
      days: { orderBy: [{ sortOrder: "asc" }, { date: "asc" }] },
    },
  });
  if (!clinic || !clinic.active) {
    return null;
  }

  const availability = await loadClinicDayAvailability({
    clinicId: clinic.id,
    capacityPerDay: clinic.capacityPerDay,
  });
  const soldOut = clinic.closed || clinicOverallSoldOut(availability);

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
    timeRangeLabel: formatClinicTimeRange(clinic.startTimeLocal, clinic.endTimeLocal),
    pricePerDayCents: clinic.pricePerDayCents,
    allDaysPriceCents: clinic.allDaysPriceCents,
    pricePerDayLabel: formatClinicMoney(clinic.pricePerDayCents),
    allDaysPriceLabel: formatClinicMoney(clinic.allDaysPriceCents),
    capacityPerDay: clinic.capacityPerDay,
    active: clinic.active,
    closed: clinic.closed,
    dayLabels: clinic.days.map((day) => formatClinicDayLabel(day.date)),
    days: availability,
    spotsSummary: clinic.closed ? "Closed" : spotsSummaryFromDays(availability),
    soldOut,
  };
}

export async function getClinicRegistrationForSuccess(sessionId: string) {
  if (!sessionId.trim()) {
    return null;
  }

  return prisma.clinicRegistration.findFirst({
    where: { stripeCheckoutSessionId: sessionId.trim() },
    include: {
      clinic: true,
      days: {
        include: { clinicDay: true },
        orderBy: { clinicDay: { sortOrder: "asc" } },
      },
    },
  });
}
