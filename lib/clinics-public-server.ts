import "server-only";

import { prisma } from "@/lib/prisma";
import {
  clinicOverallSoldOut,
  formatClinicDayLabel,
  formatClinicDaysList,
  formatClinicPricingLine,
  formatClinicSpotsLines,
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
  pricingLine: string;
  dayLabels: string[];
  daysListLabel: string;
  spotsLines: string[];
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

function spotsLinesForClinic(params: {
  closed: boolean;
  days: ClinicDayAvailability[];
}) {
  if (params.closed) {
    return ["Closed"];
  }
  if (params.days.length === 0) {
    return ["No dates scheduled"];
  }
  return formatClinicSpotsLines(params.days);
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
    const dayDates = clinic.days.map((day) => day.date);
    summaries.push({
      id: clinic.id,
      slug: clinic.slug,
      name: clinic.name,
      location: clinic.location,
      agesSportsText: clinic.agesSportsText,
      startTimeLocal: clinic.startTimeLocal,
      endTimeLocal: clinic.endTimeLocal,
      timeRangeLabel: formatClinicTimeRange(clinic.startTimeLocal, clinic.endTimeLocal),
      pricingLine: formatClinicPricingLine({
        pricePerDayCents: clinic.pricePerDayCents,
        allDaysPriceCents: clinic.allDaysPriceCents,
        dayCount: clinic.days.length,
      }),
      dayLabels: dayDates.map((date) => formatClinicDayLabel(date)),
      daysListLabel: formatClinicDaysList(dayDates),
      spotsLines: spotsLinesForClinic({ closed: clinic.closed, days: availability }),
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
  const dayDates = clinic.days.map((day) => day.date);

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
    pricingLine: formatClinicPricingLine({
      pricePerDayCents: clinic.pricePerDayCents,
      allDaysPriceCents: clinic.allDaysPriceCents,
      dayCount: clinic.days.length,
    }),
    capacityPerDay: clinic.capacityPerDay,
    active: clinic.active,
    closed: clinic.closed,
    dayLabels: dayDates.map((date) => formatClinicDayLabel(date)),
    daysListLabel: formatClinicDaysList(dayDates),
    days: availability,
    spotsLines: spotsLinesForClinic({ closed: clinic.closed, days: availability }),
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
