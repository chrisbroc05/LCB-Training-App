import { NextResponse } from "next/server";
import { requirePlaybookMember } from "@/lib/playbook-api";
import { ensurePlaybookProgress, serializePlaybookProgress } from "@/lib/playbook";

export async function GET() {
  try {
    const access = await requirePlaybookMember();
    if (access.error) {
      return access.error;
    }

    const progress = await ensurePlaybookProgress(access.user.id);
    const serialized = serializePlaybookProgress(progress);

    return NextResponse.json({ progress: serialized });
  } catch (error) {
    console.error("Failed to load playbook progress:", error);
    return NextResponse.json(
      { error: "Unable to load playbook progress right now." },
      { status: 500 },
    );
  }
}
