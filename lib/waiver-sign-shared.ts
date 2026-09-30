import { LEGAL_DOCS_VERSION, LEGAL_PAGE_PATHS } from "@/lib/legal-shared";

export type WaiverSignupType =
  | "PRIVATE_LESSONS"
  | "GROUP_LESSONS"
  | "TEAM_TRAINING"
  | "OTHER";

export const WAIVER_SIGNUP_TYPE_OPTIONS: Array<{ value: WaiverSignupType; label: string }> = [
  { value: "PRIVATE_LESSONS", label: "Private lessons" },
  { value: "GROUP_LESSONS", label: "Group lessons" },
  { value: "TEAM_TRAINING", label: "Team training" },
  { value: "OTHER", label: "Other" },
];

export const WAIVER_SIGN_INTRO =
  "Before we train together, a parent or guardian needs to review and sign the LCB Training Terms, Privacy Policy, and Waiver. Takes about 2 minutes.";

export const WAIVER_SIGN_KEY_TEXT = `Assumption of Risk and Release of Liability (summary)

This Waiver covers all LCB Training activities, including in-person lessons and group sessions, remote sessions, and training done on your own using LCB Training content.

Baseball and physical training involve risks of injury, including being hit by a ball or bat, sprains and strains, overuse injuries, falls, equipment-related injuries, heat-related illness, and in rare cases serious injury or death.

You confirm the participant is in good health and able to take part. You should consult a doctor before starting any training program and tell Coach Broc about any injury, condition, or medication that could affect training.

You voluntarily accept these risks. To the fullest extent allowed by law, you release LCB Training from claims for injury, illness, damage, or loss arising from the activities, except gross negligence or willful misconduct.

If the participant is under 18, a parent or legal guardian must agree for the participant and themselves.

In an emergency during an in-person activity, you authorize LCB Training to call emergency services and seek first aid or medical treatment if you cannot be reached.

This Waiver is governed by Illinois law. Your electronic agreement (checking the box and typing your name) has the same effect as a signature.

Read the full documents before signing:
Terms: ${LEGAL_PAGE_PATHS.terms}
Privacy: ${LEGAL_PAGE_PATHS.privacy}
Waiver: ${LEGAL_PAGE_PATHS.waiver}`;

export const WAIVER_SIGN_RATE_LIMIT_PER_HOUR = 30;
export const WAIVER_PLAYER_MIN_AGE = 5;
export const WAIVER_PLAYER_MAX_AGE = 19;
export const WAIVER_ADULT_AGE = 18;

export type WaiverSignFormValues = {
  playerFirstName: string;
  playerLastName: string;
  playerAge: string;
  teamName: string;
  signupType: WaiverSignupType | "";
  signerFullName: string;
  signerEmail: string;
  signerPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes: string;
  termsAccepted: boolean;
  mediaConsent: boolean;
  typedSignature: string;
  website: string;
};

export function createEmptyWaiverSignFormValues(teamName = ""): WaiverSignFormValues {
  return {
    playerFirstName: "",
    playerLastName: "",
    playerAge: "",
    teamName,
    signupType: "",
    signerFullName: "",
    signerEmail: "",
    signerPhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    medicalNotes: "",
    termsAccepted: false,
    mediaConsent: false,
    typedSignature: "",
    website: "",
  };
}

export function normalizeTeamSlug(teamName: string) {
  return teamName.trim().toLowerCase().replace(/\s+/g, "-");
}

export function normalizePersonName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildWaiverPlayerFullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function waiverPlayerNameMatches(
  playerFirstName: string,
  playerLastName: string,
  accountName: string | null | undefined,
) {
  const waiverName = normalizePersonName(buildWaiverPlayerFullName(playerFirstName, playerLastName));
  const userName = normalizePersonName(accountName ?? "");
  return waiverName.length > 0 && waiverName === userName;
}

export function formatWaiverSignupTypeLabel(signupType: WaiverSignupType) {
  return WAIVER_SIGNUP_TYPE_OPTIONS.find((option) => option.value === signupType)?.label ?? signupType;
}

export function getWaiverSignerLabel(playerAge: number) {
  return playerAge >= WAIVER_ADULT_AGE ? "Your full name" : "Parent or guardian full name";
}

export function validateWaiverSignForm(values: WaiverSignFormValues, teamLocked: boolean) {
  if (values.website.trim()) {
    return null;
  }

  const playerFirstName = values.playerFirstName.trim();
  const playerLastName = values.playerLastName.trim();
  if (!playerFirstName || !playerLastName) {
    return "Enter the player's first and last name.";
  }

  const playerAge = Number.parseInt(values.playerAge, 10);
  if (
    !Number.isInteger(playerAge) ||
    playerAge < WAIVER_PLAYER_MIN_AGE ||
    playerAge > WAIVER_PLAYER_MAX_AGE
  ) {
    return `Enter the player's age (${WAIVER_PLAYER_MIN_AGE}-${WAIVER_PLAYER_MAX_AGE}).`;
  }

  if (!values.signupType) {
    return "Select what they are signing up for.";
  }

  const signerFullName = values.signerFullName.trim();
  if (!signerFullName) {
    return playerAge >= WAIVER_ADULT_AGE
      ? "Enter your full name."
      : "Enter the parent or guardian full name.";
  }

  const signerEmail = values.signerEmail.trim().toLowerCase();
  if (!signerEmail || !signerEmail.includes("@")) {
    return "Enter a valid email address.";
  }

  const emergencyContactName = values.emergencyContactName.trim();
  const emergencyContactPhone = values.emergencyContactPhone.trim();
  if (!emergencyContactName || !emergencyContactPhone) {
    return "Emergency contact name and phone are required.";
  }

  if (!values.termsAccepted) {
    return "You must agree to the Terms of Service, Privacy Policy, and Waiver.";
  }

  const typedSignature = values.typedSignature.trim();
  if (!typedSignature) {
    return "Type your full name to sign.";
  }

  if (normalizePersonName(typedSignature) !== normalizePersonName(signerFullName)) {
    return "Typed signature must match the signer name.";
  }

  const teamName = teamLocked ? values.teamName.trim() : values.teamName.trim();
  if (teamLocked && !teamName) {
    return "Team name is missing from this link.";
  }

  return null;
}

export function parseWaiverSignPayload(values: WaiverSignFormValues, teamLocked: boolean) {
  const error = validateWaiverSignForm(values, teamLocked);
  if (error) {
    return { ok: false as const, error };
  }

  if (values.website.trim()) {
    return { ok: true as const, honeypot: true as const };
  }

  const teamName = values.teamName.trim();
  const playerAge = Number.parseInt(values.playerAge, 10);

  return {
    ok: true as const,
    honeypot: false as const,
    data: {
      playerFirstName: values.playerFirstName.trim(),
      playerLastName: values.playerLastName.trim(),
      playerAge,
      teamName: teamName || null,
      teamSlug: teamName ? normalizeTeamSlug(teamName) : null,
      signupType: values.signupType as WaiverSignupType,
      signerFullName: values.signerFullName.trim(),
      signerEmail: values.signerEmail.trim().toLowerCase(),
      signerPhone: values.signerPhone.trim() || null,
      emergencyContactName: values.emergencyContactName.trim(),
      emergencyContactPhone: values.emergencyContactPhone.trim(),
      medicalNotes: values.medicalNotes.trim() || null,
      mediaConsent: values.mediaConsent,
      typedSignature: values.typedSignature.trim(),
      version: LEGAL_DOCS_VERSION,
    },
  };
}

export function parseRosterNames(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function findUnsignedRosterNames(
  rosterNames: string[],
  signedNames: string[],
) {
  const signedSet = new Set(signedNames.map((name) => normalizePersonName(name)));

  return rosterNames.filter((name) => !signedSet.has(normalizePersonName(name)));
}
