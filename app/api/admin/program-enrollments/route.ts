import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  PROGRAM_AGE_GROUP_LABELS,
  PROGRAM_EQUIPMENT_LABELS,
  PROGRAM_FOCUS_AREA_LABELS,
  PROGRAM_SEASON_MODE_LABELS,
  PROGRAM_STATUS_LABELS,
  type ProgramEquipmentOption,
  type ProgramFocusArea,
} from "@/lib/program-enrollment-shared";
import { getProgramDay } from "@/lib/program-schedule";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format-date";
import {
  formatLegalAgreementRole,
  formatMediaConsentLabel,
} from "@/lib/legal-shared";
import { formatRefundLabel } from "@/lib/stripe-refund-shared";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enrollments = await prisma.programEnrollment.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          termsVersion: true,
          termsAcceptedAt: true,
          acceptedByName: true,
          acceptedAsParent: true,
          mediaConsent: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    enrollments: enrollments.map((enrollment) => {
      const schedule = getProgramDay({ startDate: enrollment.startDate });
      return {
        id: enrollment.id,
        userId: enrollment.userId,
        name: enrollment.user.name,
        email: enrollment.user.email,
        status: enrollment.status,
        statusLabel: PROGRAM_STATUS_LABELS[enrollment.status],
        refundedAt: enrollment.refundedAt?.toISOString() ?? null,
        refundAmountCents: enrollment.refundAmountCents,
        refundLabel:
          enrollment.refundedAt && enrollment.refundAmountCents != null
            ? formatRefundLabel(enrollment.refundedAt, enrollment.refundAmountCents)
            : null,
        startDate: enrollment.startDate?.toISOString().slice(0, 10) ?? null,
        currentWeek: schedule.weekNumber,
        currentProgramDay: schedule.programDay,
        phase: schedule.phase,
        ageGroup: enrollment.ageGroup,
        ageGroupLabel: enrollment.ageGroup ? PROGRAM_AGE_GROUP_LABELS[enrollment.ageGroup] : null,
        position: enrollment.position,
        focusAreas: enrollment.focusAreas,
        focusAreaLabels: enrollment.focusAreas.map(
          (area) => PROGRAM_FOCUS_AREA_LABELS[area as ProgramFocusArea] ?? area,
        ),
        equipment: enrollment.equipment,
        equipmentLabels: enrollment.equipment.map(
          (item) => PROGRAM_EQUIPMENT_LABELS[item as ProgramEquipmentOption] ?? item,
        ),
        seasonMode: enrollment.seasonMode,
        seasonModeLabel: enrollment.seasonMode
          ? PROGRAM_SEASON_MODE_LABELS[enrollment.seasonMode]
          : null,
        knownFor: enrollment.knownFor,
        setupComplete: Boolean(enrollment.onboardingCompletedAt),
        onboardingCompletedAt: enrollment.onboardingCompletedAt?.toISOString() ?? null,
        legalAcceptance: {
          termsVersion: enrollment.user.termsVersion,
          termsAcceptedAtLabel: enrollment.user.termsAcceptedAt
            ? formatDateTime(enrollment.user.termsAcceptedAt)
            : "Not accepted",
          acceptedByName: enrollment.user.acceptedByName,
          agreementRoleLabel: formatLegalAgreementRole(enrollment.user.acceptedAsParent),
          mediaConsentLabel: formatMediaConsentLabel(enrollment.user.mediaConsent),
        },
        createdAt: enrollment.createdAt.toISOString(),
      };
    }),
  });
}
