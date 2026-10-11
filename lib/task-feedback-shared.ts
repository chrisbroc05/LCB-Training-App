export const TASK_FEEDBACK_COMMENT_MAX_LENGTH = 500;

export function validateTaskFeedbackComment(comment: string | null | undefined) {
  if (comment == null || comment === "") {
    return { ok: true as const, comment: null as string | null };
  }

  const trimmed = comment.trim();
  if (!trimmed) {
    return { ok: true as const, comment: null as string | null };
  }

  if (trimmed.length > TASK_FEEDBACK_COMMENT_MAX_LENGTH) {
    return {
      ok: false as const,
      error: `Comment must be ${TASK_FEEDBACK_COMMENT_MAX_LENGTH} characters or less.`,
    };
  }

  return { ok: true as const, comment: trimmed };
}
