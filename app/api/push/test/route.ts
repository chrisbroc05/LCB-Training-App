import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push-send";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendPushToUser(
    session.user.id,
    {
      title: "LCB Training test",
      body: "Push notifications are working.",
      url: "/dashboard/today",
    },
    {
      type: "TEST",
      dedupeKey: `${session.user.id}:TEST:${Date.now()}`,
      skipLog: true,
      skipDedupeCheck: true,
    },
  );

  if (result.sent === 0) {
    return NextResponse.json(
      { error: result.reason ?? "Unable to send test push." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
