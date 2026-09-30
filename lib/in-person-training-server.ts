import "server-only";

import { prisma } from "@/lib/prisma";
import {
  serializeInPersonTrainingInfo,
  type InPersonTrainingInput,
} from "@/lib/in-person-training-shared";

export const inPersonTrainingUserSelect = {
  trainsInPerson: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  medicalNotes: true,
  inPersonInfoUpdatedAt: true,
} as const;

export async function getInPersonTrainingInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: inPersonTrainingUserSelect,
  });

  if (!user) {
    return null;
  }

  return serializeInPersonTrainingInfo(user);
}

export async function saveInPersonTrainingInfo(userId: string, input: InPersonTrainingInput) {
  const now = new Date();

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      trainsInPerson: input.trainsInPerson,
      emergencyContactName: input.trainsInPerson ? input.emergencyContactName.trim() : null,
      emergencyContactPhone: input.trainsInPerson ? input.emergencyContactPhone.trim() : null,
      medicalNotes: input.medicalNotes.trim() || null,
      inPersonInfoUpdatedAt: now,
    },
    select: inPersonTrainingUserSelect,
  });

  return serializeInPersonTrainingInfo(user);
}
