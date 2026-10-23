import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { parseAdminWrittenReportRequestBody } from "@/lib/admin-written-report-request-server";
import { sendQuickWrittenReportForSubmission } from "@/lib/written-report-send-server";

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

  const parsed = parseAdminWrittenReportRequestBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await sendQuickWrittenReportForSubmission({
    submissionId,
    sections: parsed.sections,
    libraryDrillIds: parsed.libraryDrillIds,
    recommendedFixItSlug: parsed.recommendedFixItSlug,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, submissionId: result.submissionId });
}
