import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  buildQuizAttemptsCsv,
  loadQuizAdminDashboard,
} from "@/lib/player-iq-quiz-admin-server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const dashboard = await loadQuizAdminDashboard();
  const csv = buildQuizAttemptsCsv(dashboard.rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="player-iq-quiz-attempts.csv"',
    },
  });
}
