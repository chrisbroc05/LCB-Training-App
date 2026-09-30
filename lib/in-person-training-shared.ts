export type InPersonTrainingInfo = {
  trainsInPerson: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  medicalNotes: string | null;
  inPersonInfoUpdatedAt: string | null;
};

export type InPersonTrainingInput = {
  trainsInPerson: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes: string;
};

export function serializeInPersonTrainingInfo(user: {
  trainsInPerson: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  medicalNotes: string | null;
  inPersonInfoUpdatedAt: Date | null;
}): InPersonTrainingInfo {
  return {
    trainsInPerson: user.trainsInPerson,
    emergencyContactName: user.emergencyContactName,
    emergencyContactPhone: user.emergencyContactPhone,
    medicalNotes: user.medicalNotes,
    inPersonInfoUpdatedAt: user.inPersonInfoUpdatedAt?.toISOString() ?? null,
  };
}

export function needsInPersonEmergencyContactReminder(info: {
  trainsInPerson: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}) {
  return (
    info.trainsInPerson &&
    (!info.emergencyContactName?.trim() || !info.emergencyContactPhone?.trim())
  );
}

export function validateInPersonTrainingInput(input: InPersonTrainingInput) {
  if (!input.trainsInPerson) {
    return null;
  }

  if (!input.emergencyContactName.trim() || !input.emergencyContactPhone.trim()) {
    return "Emergency contact name and phone are required for in-person training.";
  }

  return null;
}
