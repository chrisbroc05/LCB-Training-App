import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { resendQuickWrittenReportForSubmission } from "@/lib/written-report-send-server";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { submissionId } = await context.params;
  const result = await resendQuickWrittenReportForSubmission(submissionId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, submissionId: result.submissionId });
}
