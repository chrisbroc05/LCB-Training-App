import type { AccountRole } from "@/lib/account-shared";
import { combinePlayerName, namesMatch } from "@/lib/account-shared";
import type { LegalAgreementValues } from "@/components/LegalAgreementFields";
import {
  LEGAL_ADULT_AGE,
  LEGAL_MAX_PLAYER_AGE,
  LEGAL_MIN_PLAYER_AGE,
  parseLegalPlayerAge,
  validateAcceptedByName,
  validateParentConsentEmail,
} from "@/lib/legal-shared";
import { isValidEmailFormat } from "@/lib/second-email-shared";

export type SignupWizardStep = 1 | 2 | 3 | 4 | 5;

export type SignupWizardState = {
  step: SignupWizardStep;
  accountRole: AccountRole | null;
  email: string;
  password: string;
  accountHolderName: string;
  playerFirstName: string;
  playerLastName: string;
  playerAge: string;
  legalAgreement: LegalAgreementValues;
};

export type SignupRequestPayload = {
  accountRole: AccountRole;
  accountHolderName: string | null;
  playerFirstName: string;
  playerLastName: string;
  email: string;
  password: string;
  legalAcceptance: {
    acceptedByName: string;
    acceptedAsParent: boolean;
    playerAge: number;
    parentConsentName: string | null;
    parentConsentEmail: string | null;
    mediaConsent: boolean;
  };
};

export function createInitialSignupWizardState(
  legalAgreement: LegalAgreementValues,
): SignupWizardState {
  return {
    step: 1,
    accountRole: null,
    email: "",
    password: "",
    accountHolderName: "",
    playerFirstName: "",
    playerLastName: "",
    playerAge: "",
    legalAgreement,
  };
}

export function validateSignupStep1(accountRole: AccountRole | null) {
  if (!accountRole) {
    return "Choose who is signing up.";
  }

  return null;
}

export function validateSignupStep2(params: {
  accountRole: AccountRole;
  email: string;
  password: string;
  accountHolderName: string;
}) {
  const email = params.email.trim();
  if (!email || !isValidEmailFormat(email)) {
    return "Enter a valid email.";
  }

  if (params.password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (params.accountRole === "PARENT") {
    const nameError = validateAcceptedByName(params.accountHolderName);
    if (nameError) {
      return "Enter your full name (first and last).";
    }
  }

  return null;
}

export function validateSignupStep3(playerFirstName: string, playerLastName: string) {
  if (!playerFirstName.trim()) {
    return "Enter the player's first name.";
  }

  if (!playerLastName.trim()) {
    return "Enter the player's last name.";
  }

  return null;
}

export function validateSignupStep4(playerAge: string) {
  const age = parseLegalPlayerAge(playerAge);
  if (age == null) {
    return `Enter the player's age (${LEGAL_MIN_PLAYER_AGE}-${LEGAL_MAX_PLAYER_AGE}).`;
  }

  return null;
}

export function validateSignupAgreementStep(params: {
  accountRole: AccountRole;
  accountHolderName: string;
  accountEmail: string;
  playerAge: string;
  legalAgreement: LegalAgreementValues;
}) {
  const playerAge = parseLegalPlayerAge(params.playerAge);
  if (playerAge == null) {
    return `Enter the player's age (${LEGAL_MIN_PLAYER_AGE}-${LEGAL_MAX_PLAYER_AGE}).`;
  }

  if (!params.legalAgreement.termsAccepted) {
    return "You must agree to the Terms of Service, Privacy Policy, and Waiver.";
  }

  if (params.accountRole === "PARENT") {
    const typedName = params.legalAgreement.acceptedByName.trim();
    const nameError = validateAcceptedByName(typedName);
    if (nameError) {
      return "Type your full name to agree.";
    }

    if (!namesMatch(typedName, params.accountHolderName)) {
      return "The name you type must match your full name from step 2.";
    }

    return null;
  }

  if (playerAge < LEGAL_ADULT_AGE) {
    const parentNameError = validateAcceptedByName(params.legalAgreement.parentConsentName);
    if (parentNameError) {
      return "Enter the parent or guardian full name (at least first and last).";
    }

    const parentEmailError = validateParentConsentEmail(params.legalAgreement.parentConsentEmail);
    if (parentEmailError) {
      return parentEmailError;
    }

    return null;
  }

  const nameError = validateAcceptedByName(params.legalAgreement.acceptedByName);
  if (nameError) {
    return nameError;
  }

  return null;
}

export function buildSignupRequestPayload(state: SignupWizardState): SignupRequestPayload | null {
  if (!state.accountRole) {
    return null;
  }

  const playerAge = parseLegalPlayerAge(state.playerAge);
  if (playerAge == null) {
    return null;
  }

  const email = state.email.trim().toLowerCase();
  const playerFirstName = state.playerFirstName.trim();
  const playerLastName = state.playerLastName.trim();
  const accountHolderName =
    state.accountRole === "PARENT" ? state.accountHolderName.trim() : null;

  if (state.accountRole === "PARENT") {
    const acceptedByName = state.legalAgreement.acceptedByName.trim();

    return {
      accountRole: state.accountRole,
      accountHolderName,
      playerFirstName,
      playerLastName,
      email,
      password: state.password,
      legalAcceptance: {
        acceptedByName,
        acceptedAsParent: true,
        playerAge,
        parentConsentName: accountHolderName,
        parentConsentEmail: email,
        mediaConsent: state.legalAgreement.mediaConsent,
      },
    };
  }

  if (playerAge < LEGAL_ADULT_AGE) {
    return {
      accountRole: state.accountRole,
      accountHolderName: null,
      playerFirstName,
      playerLastName,
      email,
      password: state.password,
      legalAcceptance: {
        acceptedByName: state.legalAgreement.parentConsentName.trim(),
        acceptedAsParent: true,
        playerAge,
        parentConsentName: state.legalAgreement.parentConsentName.trim(),
        parentConsentEmail: state.legalAgreement.parentConsentEmail.trim().toLowerCase(),
        mediaConsent: state.legalAgreement.mediaConsent,
      },
    };
  }

  return {
    accountRole: state.accountRole,
    accountHolderName: null,
    playerFirstName,
    playerLastName,
    email,
    password: state.password,
    legalAcceptance: {
      acceptedByName: state.legalAgreement.acceptedByName.trim(),
      acceptedAsParent: state.legalAgreement.agreementRole === "parent",
      playerAge,
      parentConsentName: null,
      parentConsentEmail: null,
      mediaConsent: state.legalAgreement.mediaConsent,
    },
  };
}

export function getSignupDisplayName(state: Pick<SignupWizardState, "playerFirstName" | "playerLastName">) {
  return combinePlayerName(state.playerFirstName, state.playerLastName);
}
