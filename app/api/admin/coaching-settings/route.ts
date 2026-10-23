import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  getFreeSwingAnalysisResponseMode,
  parseFreeSwingAnalysisResponseModeRequest,
  setFreeSwingAnalysisResponseMode,
} from "@/lib/free-swing-analysis-response-server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const freeSwingAnalysisResponseMode = await getFreeSwingAnalysisResponseMode();
  return NextResponse.json({ freeSwingAnalysisResponseMode });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const parsed = parseFreeSwingAnalysisResponseModeRequest(record?.freeSwingAnalysisResponseMode);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await setFreeSwingAnalysisResponseMode(parsed.mode);
  return NextResponse.json({ freeSwingAnalysisResponseMode: parsed.mode });
}
