import type { LeadRoleValue } from "@/lib/resources-shared";

/** Minimal fields needed to build GET /api/quiz/session JSON. */
export type QuizSessionAccessFields = {
  userId: string | null;
  firstName: string;
  role: LeadRoleValue;
};

export type QuizSessionJsonBody =
  | { hasAccess: true; loggedIn: false }
  | { hasAccess: true; loggedIn: true; firstName: string; role: LeadRoleValue };

/**
 * JSON body for GET /api/quiz/session. Anonymous callers never receive firstName (no PII from lead cookies).
 */
export function buildQuizSessionJson(access: QuizSessionAccessFields | null): QuizSessionJsonBody {
  if (!access?.userId) {
    return { hasAccess: true, loggedIn: false };
  }

  return {
    hasAccess: true,
    loggedIn: true,
    firstName: access.firstName,
    role: access.role,
  };
}
