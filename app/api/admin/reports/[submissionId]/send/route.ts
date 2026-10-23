import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { parseWrittenReportPaste } from "@/lib/written-report-parse-shared";
import { parseReportRecommendedFixItSlug } from "@/lib/player-evaluation-cta-shared";
import {
  parseWrittenReportLibraryDrillIds,
  sendQuickWrittenReportForSubmission,
} from "@/lib/written-report-send-server";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { submissionId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const paste = typeof record?.paste === "string" ? record.paste : "";
  const sectionsInput = record?.sections;

  let sectionsResult = parseWrittenReportPaste(paste);
  if (!sectionsResult.ok && sectionsInput && typeof sectionsInput === "object") {
    const sectionsRecord = sectionsInput as Record<string, unknown>;
    const strengths = Array.isArray(sectionsRecord.strengths)
      ? sectionsRecord.strengths.map(String).map((line) => line.trim()).filter(Boolean)
      : [];
    const areasToImprove = Array.isArray(sectionsRecord.areasToImprove)
      ? sectionsRecord.areasToImprove.map(String).map((line) => line.trim()).filter(Boolean)
      : [];
    const recommendedDrills = Array.isArray(sectionsRecord.recommendedDrills)
      ? sectionsRecord.recommendedDrills.map(String).map((line) => line.trim()).filter(Boolean)
      : [];
    const noteFromCoach =
      typeof sectionsRecord.noteFromCoach === "string" ? sectionsRecord.noteFromCoach.trim() : "";

    if (
      strengths.length > 0 &&
      areasToImprove.length > 0 &&
      recommendedDrills.length > 0 &&
      noteFromCoach
    ) {
      sectionsResult = {
        ok: true,
        sections: { strengths, areasToImprove, recommendedDrills, noteFromCoach },
      };
    }
  }

  if (!sectionsResult.ok) {
    return NextResponse.json({ error: sectionsResult.error }, { status: 400 });
  }

  const drillParse = parseWrittenReportLibraryDrillIds(record?.libraryDrillIds ?? []);
  if (!drillParse.ok) {
    return NextResponse.json({ error: drillParse.error }, { status: 400 });
  }

  if (drillParse.ids.length > 2) {
    return NextResponse.json({ error: "Select up to 2 library drills." }, { status: 400 });
  }

  const fixItParse = parseReportRecommendedFixItSlug(record?.recommendedFixItSlug);
  if (!fixItParse.ok) {
    return NextResponse.json({ error: fixItParse.error }, { status: 400 });
  }

  const result = await sendQuickWrittenReportForSubmission({
    submissionId,
    sections: sectionsResult.sections,
    libraryDrillIds: drillParse.ids,
    recommendedFixItSlug: fixItParse.slug,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, submissionId: result.submissionId });
}
