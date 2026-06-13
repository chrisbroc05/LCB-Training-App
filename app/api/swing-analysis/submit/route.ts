import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendSwingSubmissionNotification } from "@/lib/notifications";

type SwingSubmissionBody = {
  videoUrl?: string;
  videoFileName?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as SwingSubmissionBody;
    const submittedVideo = body.videoUrl?.trim() || body.videoFileName?.trim() || "";

    if (!submittedVideo) {
      return NextResponse.json({ error: "Please provide a video URL or file." }, { status: 400 });
    }

    await sendSwingSubmissionNotification({
      userEmail: session.user.email,
      submittedVideo,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to submit swing analysis right now." }, { status: 500 });
  }
}
