import { isValidEmailFormat } from "@/lib/second-email-shared";
import type { LeadRoleValue } from "@/lib/resources-shared";

export type LeadCaptureClientFields = {
  playerAge13Plus?: boolean | null;
  parentEmail?: string | null;
};

export type NormalizedLeadCapture = {
  email: string;
  firstName: string;
  role: LeadRoleValue;
  emailProvidedByParent: boolean;
};

export function normalizeLeadCaptureInput(params: {
  firstName: string;
  email: string;
  role: LeadRoleValue;
  playerAge13Plus?: boolean | null;
  parentEmail?: string | null;
}): { ok: true; value: NormalizedLeadCapture } | { ok: false; error: string } {
  const firstName = params.firstName.trim();
  if (!firstName) {
    return { ok: false, error: "Enter a first name." };
  }

  if (params.role === "PLAYER") {
    if (params.playerAge13Plus !== true && params.playerAge13Plus !== false) {
      return { ok: false, error: "Tell us if you are 13 or older." };
    }

    if (params.playerAge13Plus === false) {
      const parentEmail = params.parentEmail?.trim().toLowerCase() ?? "";
      if (!parentEmail || !isValidEmailFormat(parentEmail)) {
        return { ok: false, error: "Enter a parent or guardian email." };
      }
      return {
        ok: true,
        value: {
          firstName,
          email: parentEmail,
          role: params.role,
          emailProvidedByParent: true,
        },
      };
    }

    const email = params.email.trim().toLowerCase();
    if (!email || !isValidEmailFormat(email)) {
      return { ok: false, error: "Enter a valid email." };
    }
    return {
      ok: true,
      value: {
        firstName,
        email,
        role: params.role,
        emailProvidedByParent: false,
      },
    };
  }

  const email = params.email.trim().toLowerCase();
  if (!email || !isValidEmailFormat(email)) {
    return { ok: false, error: "Enter a valid email." };
  }

  return {
    ok: true,
    value: {
      firstName,
      email,
      role: params.role,
      emailProvidedByParent: false,
    },
  };
}
