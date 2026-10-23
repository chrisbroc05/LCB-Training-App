import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  formatR2VideoReference,
  headR2Object,
  isAdminResponseVideoKey,
} from "@/lib/r2";
import { validateVideoPosterR2Key } from "@/lib/video-poster-server";

type UploadResponseRequestBody = {
  submissionId?: string;
  submissionType?: string;
  r2Key?: string;
  responseVideoPosterR2Key?: string;
};

function parseRequestBody(body: unknown): UploadResponseRequestBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  return {
    submissionId: typeof record.submissionId === "string" ? record.submissionId : undefined,
    submissionType: typeof record.submissionType === "string" ? record.submissionType : undefined,
    r2Key: typeof record.r2Key === "string" ? record.r2Key : undefined,
    responseVideoPosterR2Key:
      typeof record.responseVideoPosterR2Key === "string"
        ? record.responseVideoPosterR2Key
        : undefined,
  };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: UploadResponseRequestBody | null = null;
  try {
    body = parseRequestBody(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const submissionId = body?.submissionId?.trim() ?? "";
  const submissionType = (body?.submissionType ?? "swing").trim().toLowerCase();
  const r2Key = body?.r2Key?.trim() ?? "";
  const responseVideoPosterR2Key = body?.responseVideoPosterR2Key?.trim() ?? "";

  if (!submissionId || !r2Key) {
    return NextResponse.json({ error: "Missing submissionId or r2Key." }, { status: 400 });
  }

  if (submissionType !== "swing" && submissionType !== "mental") {
    return NextResponse.json({ error: "Invalid submission type." }, { status: 400 });
  }

  if (!isAdminResponseVideoKey(r2Key, submissionId)) {
    return NextResponse.json({ error: "Invalid response video key." }, { status: 400 });
  }

  try {
    await headR2Object(r2Key);
  } catch {
    return NextResponse.json(
      { error: "Uploaded video was not found. Please try uploading again." },
      { status: 400 },
    );
  }

  const responseVideoUrl = formatR2VideoReference(r2Key);

  if (responseVideoPosterR2Key) {
    const posterError = await validateVideoPosterR2Key(r2Key, responseVideoPosterR2Key);
    if (posterError) {
      return NextResponse.json({ error: posterError }, { status: 400 });
    }
  }

  try {
    if (submissionType === "mental") {
      const existing = await prisma.mentalGameSubmission.findUnique({
        where: { id: submissionId },
        select: { id: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Submission not found." }, { status: 404 });
      }

      await prisma.mentalGameSubmission.update({
        where: { id: submissionId },
        data: {
          responseVideoUrl,
          responseVideoPosterR2Key: responseVideoPosterR2Key || null,
        },
      });
    } else {
      const existing = await prisma.swingAnalysisSubmission.findUnique({
        where: { id: submissionId },
        select: { id: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Submission not found." }, { status: 404 });
      }

      await prisma.swingAnalysisSubmission.update({
        where: { id: submissionId },
        data: {
          responseVideoUrl,
          responseVideoPosterR2Key: responseVideoPosterR2Key || null,
        },
      });
    }

    return NextResponse.json({ success: true, key: r2Key, responseVideoUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save response video.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
