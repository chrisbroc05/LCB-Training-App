"use client";

export type AdminResponseVideoSubmissionType = "swing" | "mental";

export async function saveAdminSubmissionResponseVideo(params: {
  submissionId: string;
  submissionType: AdminResponseVideoSubmissionType;
  r2Key: string;
  responseVideoPosterR2Key?: string;
}): Promise<{ responseVideoUrl: string }> {
  const saveResponse = await fetch("/api/admin/upload-response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      submissionId: params.submissionId,
      submissionType: params.submissionType,
      r2Key: params.r2Key,
      responseVideoPosterR2Key: params.responseVideoPosterR2Key,
    }),
  });

  const savePayload = (await saveResponse.json().catch(() => ({}))) as {
    error?: string;
    responseVideoUrl?: string;
  };

  if (!saveResponse.ok) {
    throw new Error(savePayload.error ?? "Unable to save response video.");
  }

  if (!savePayload.responseVideoUrl) {
    throw new Error("Unable to save response video.");
  }

  return { responseVideoUrl: savePayload.responseVideoUrl };
}
