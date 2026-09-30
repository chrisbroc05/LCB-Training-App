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
export const WAIVER_MAX_PLAYERS = 6;

export type WaiverPlayerEntry = {
  id: string;
  playerFirstName: string;
  playerLastName: string;
  playerAge: string;
  medicalNotes: string;
};

export type WaiverSignFormValues = {
  players: WaiverPlayerEntry[];
  teamName: string;
  signupType: WaiverSignupType | "";
  signerFullName: string;
  signerEmail: string;
  signerPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  termsAccepted: boolean;
  mediaConsent: boolean;
  typedSignature: string;
  website: string;
};

export type WaiverSignPlayerInput = {
  playerFirstName: string;
  playerLastName: string;
  playerAge: number;
  medicalNotes: string | null;
};

export type WaiverSignSharedInput = {
  teamName: string | null;
  teamSlug: string | null;
  signupType: WaiverSignupType;
  signerFullName: string;
  signerEmail: string;
  signerPhone: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  mediaConsent: boolean;
  typedSignature: string;
  version: string;
};

let nextPlayerEntryId = 0;

export function createWaiverPlayerEntry(): WaiverPlayerEntry {
  nextPlayerEntryId += 1;
  return {
    id: `player-${nextPlayerEntryId}`,
    playerFirstName: "",
    playerLastName: "",
    playerAge: "",
    medicalNotes: "",
  };
}

export function createEmptyWaiverSignFormValues(teamName = ""): WaiverSignFormValues {
  return {
    players: [createWaiverPlayerEntry()],
    teamName,
    signupType: "",
    signerFullName: "",
    signerEmail: "",
    signerPhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
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

export function parsePlayerAge(value: string) {
  return Number.parseInt(value, 10);
}

export function isValidPlayerAge(playerAge: number) {
  return (
    Number.isInteger(playerAge) &&
    playerAge >= WAIVER_PLAYER_MIN_AGE &&
    playerAge <= WAIVER_PLAYER_MAX_AGE
  );
}

export function isAdultSelfSignMode(players: WaiverPlayerEntry[]) {
  if (players.length !== 1) {
    return false;
  }

  const playerAge = parsePlayerAge(players[0]?.playerAge ?? "");
  return isValidPlayerAge(playerAge) && playerAge >= WAIVER_ADULT_AGE;
}

function validateWaiverPlayer(entry: WaiverPlayerEntry, index: number) {
  const playerFirstName = entry.playerFirstName.trim();
  const playerLastName = entry.playerLastName.trim();
  if (!playerFirstName || !playerLastName) {
    return `Enter player ${index + 1}'s first and last name.`;
  }

  const playerAge = parsePlayerAge(entry.playerAge);
  if (!isValidPlayerAge(playerAge)) {
    return `Enter player ${index + 1}'s age (${WAIVER_PLAYER_MIN_AGE}-${WAIVER_PLAYER_MAX_AGE}).`;
  }

  return null;
}

export function validateWaiverSignForm(values: WaiverSignFormValues, teamLocked: boolean) {
  if (values.website.trim()) {
    return null;
  }

  if (values.players.length === 0) {
    return "Add at least one player.";
  }

  if (values.players.length > WAIVER_MAX_PLAYERS) {
    return `You can sign for up to ${WAIVER_MAX_PLAYERS} players at a time.`;
  }

  for (let index = 0; index < values.players.length; index += 1) {
    const playerError = validateWaiverPlayer(values.players[index], index);
    if (playerError) {
      return playerError;
    }
  }

  const adultSelfSign = isAdultSelfSignMode(values.players);
  if (!adultSelfSign && values.players.length > 1) {
    for (const player of values.players) {
      const playerAge = parsePlayerAge(player.playerAge);
      if (playerAge >= WAIVER_ADULT_AGE) {
        return "Adult players must sign for themselves on a separate form.";
      }
    }
  }

  if (adultSelfSign && values.players.length > 1) {
    return "Adult self-sign is limited to one player.";
  }

  if (!values.signupType) {
    return "Select what they are signing up for.";
  }

  const primaryPlayerAge = parsePlayerAge(values.players[0].playerAge);
  const signerFullName = values.signerFullName.trim();
  if (!signerFullName) {
    return primaryPlayerAge >= WAIVER_ADULT_AGE
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

  const teamName = values.teamName.trim();
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

  const players: WaiverSignPlayerInput[] = values.players.map((player) => ({
    playerFirstName: player.playerFirstName.trim(),
    playerLastName: player.playerLastName.trim(),
    playerAge: parsePlayerAge(player.playerAge),
    medicalNotes: player.medicalNotes.trim() || null,
  }));

  const shared: WaiverSignSharedInput = {
    teamName: teamName || null,
    teamSlug: teamName ? normalizeTeamSlug(teamName) : null,
    signupType: values.signupType as WaiverSignupType,
    signerFullName: values.signerFullName.trim(),
    signerEmail: values.signerEmail.trim().toLowerCase(),
    signerPhone: values.signerPhone.trim() || null,
    emergencyContactName: values.emergencyContactName.trim(),
    emergencyContactPhone: values.emergencyContactPhone.trim(),
    mediaConsent: values.mediaConsent,
    typedSignature: values.typedSignature.trim(),
    version: LEGAL_DOCS_VERSION,
  };

  return {
    ok: true as const,
    honeypot: false as const,
    shared,
    players,
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

export function formatWaiverPlayerNameList(playerNames: string[]) {
  if (playerNames.length === 0) {
    return "";
  }

  if (playerNames.length === 1) {
    return playerNames[0];
  }

  if (playerNames.length === 2) {
    return `${playerNames[0]} and ${playerNames[1]}`;
  }

  return `${playerNames.slice(0, -1).join(", ")}, and ${playerNames[playerNames.length - 1]}`;
}
