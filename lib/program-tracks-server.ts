import "server-only";

import { getProgramTrackDefinition, listProgramTrackDefinitions } from "@/lib/program-tracks";
import { prisma } from "@/lib/prisma";

export function serializeEnrollmentTracks(
  tracks: Array<{
    id: string;
    trackKey: string;
    active: boolean;
    startedAt: Date;
    note: string | null;
  }>,
) {
  return listProgramTrackDefinitions().map((definition) => {
    const row = tracks.find((track) => track.trackKey === definition.key);
    return {
      trackKey: definition.key,
      label: definition.label,
      description: definition.description,
      minutesLabel: definition.minutesLabel,
      active: row?.active ?? false,
      startedAt: row?.startedAt?.toISOString() ?? null,
      note: row?.note ?? "",
      enrollmentTrackId: row?.id ?? null,
    };
  });
}

export async function upsertEnrollmentTrack(params: {
  enrollmentId: string;
  trackKey: string;
  active: boolean;
  note?: string | null;
  now?: Date;
}) {
  const definition = getProgramTrackDefinition(params.trackKey);
  if (!definition) {
    return { ok: false as const, error: "Unknown track key." };
  }

  const trimmedNote =
    params.note === undefined || params.note === null ? undefined : params.note.trim().slice(0, 500);

  if (!params.active) {
    await prisma.enrollmentTrack.upsert({
      where: {
        enrollmentId_trackKey: {
          enrollmentId: params.enrollmentId,
          trackKey: params.trackKey,
        },
      },
      create: {
        enrollmentId: params.enrollmentId,
        trackKey: params.trackKey,
        active: false,
        startedAt: params.now ?? new Date(),
        note: trimmedNote ?? null,
      },
      update: {
        active: false,
        ...(trimmedNote !== undefined ? { note: trimmedNote || null } : {}),
      },
    });
    return { ok: true as const };
  }

  const now = params.now ?? new Date();
  await prisma.enrollmentTrack.upsert({
    where: {
      enrollmentId_trackKey: {
        enrollmentId: params.enrollmentId,
        trackKey: params.trackKey,
      },
    },
    create: {
      enrollmentId: params.enrollmentId,
      trackKey: params.trackKey,
      active: true,
      startedAt: now,
      note: trimmedNote ?? null,
    },
    update: {
      active: true,
      startedAt: now,
      ...(trimmedNote !== undefined ? { note: trimmedNote || null } : {}),
    },
  });

  return { ok: true as const };
}
