/** HttpOnly cookie binding an anonymous browser session to an in-progress quiz attempt (no PII). */
export const QUIZ_ATTEMPT_COOKIE_NAME = "lcb_quiz_attempt_id";
export const QUIZ_ATTEMPT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 4;

/** Optional referral e.g. challenge share (?ref=challenge) - stored on the attempt when quiz starts. */
export const QUIZ_REFERRAL_COOKIE_NAME = "lcb_quiz_referral";
export const QUIZ_REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 4;

export const QUIZ_REFERRAL_CHALLENGE = "challenge";
