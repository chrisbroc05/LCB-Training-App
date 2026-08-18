import { NextResponse } from "next/server";
import { requirePlaybookMember } from "@/lib/playbook-api";
import { ensurePlaybookProgress } from "@/lib/playbook";
import { generatePlaybookMemberPdf } from "@/lib/playbook-pdf";
import { PLAYBOOK_PDF_FILENAME } from "@/lib/playbook-branding";

export async function GET() {
  const access = await requirePlaybookMember();
  if (access.error) {
    return access.error;
  }

  const progress = await ensurePlaybookProgress(access.user.id);

  if (!progress.overallComplete) {
    return NextResponse.json(
      { error: "Complete all chapters to download your playbook PDF." },
      { status: 403 },
    );
  }

  try {
    const pdfBuffer = await generatePlaybookMemberPdf(
      access.user.name?.trim() || "Member",
      progress,
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${PLAYBOOK_PDF_FILENAME}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to generate playbook PDF right now." },
      { status: 500 },
    );
  }
}
