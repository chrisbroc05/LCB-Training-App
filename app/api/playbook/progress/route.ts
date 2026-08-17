import { NextResponse } from "next/server";
import { requirePlaybookMember } from "@/lib/playbook-api";
import { ensurePlaybookProgress, serializePlaybookProgress } from "@/lib/playbook";

export async function GET() {
  const access = await requirePlaybookMember();
  if (access.error) {
    return access.error;
  }

  const progress = await ensurePlaybookProgress(access.user.id);
  return NextResponse.json(serializePlaybookProgress(progress));
}
