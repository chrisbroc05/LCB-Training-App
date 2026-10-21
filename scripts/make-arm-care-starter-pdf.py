#!/usr/bin/env python3
"""4-week Arm Care starter PDF (matches program-tracks arm_care weeks1to4)."""

from __future__ import annotations

import sys
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(SCRIPTS_DIR))

from create_bio import GREEN, LIGHT_GREEN, NAVY, WHITE, get_logo_or_fallback  # noqa: E402
from starter_pdf_appendix import build_starter_appendix_pdf  # noqa: E402

LIGHT_GRAY = colors.HexColor("#F5F5F5")
TEXT_DARK = colors.HexColor("#0A1628")
OUTPUT = PROJECT_ROOT / "private" / "resources" / "starters" / "LCB_Arm_Care_4Week_Starter.pdf"

MEDICAL_DISCLAIMER = (
    "This is not medical advice. If you have arm pain, stop and see a doctor or "
    "physical therapist before continuing."
)

SAFETY_NOTE = (
    "Stop if anything feels sharp or pinchy. Soreness is okay, pain is not. "
    "Never throw max effort through soreness. If you have had shoulder issues, "
    "check with your PT or doctor before starting."
)

EQUIPMENT = "Resistance band, wall, light weight (water bottle)"

EQUIPMENT_NOTE = (
    "Best with a light band with handles (we recommend Jaeger Sports J-Bands, adult). "
    "A heavy loop band is fine for rows and pull-aparts, but skip the shoulder rotations "
    "until you have a light band."
)

# lib/program-tracks.ts arm_care.phases.weeks1to4
ARM_CARE_WEEKS1TO4 = [
    (
        "Band pull-aparts",
        "2x15",
        "Stand tall, pull the band to your chest with straight wrists and squeeze your shoulder blades.",
    ),
    (
        "Band external rotation at side (elbow 90, towel under arm)",
        "2x12 each arm",
        "Keep your elbow pinned at your side and rotate your forearm out without shrugging.",
    ),
    (
        "Band internal rotation at side",
        "2x12 each arm",
        "Same setup as external rotation; rotate your forearm in with control, no trunk twist.",
    ),
    (
        "Band rows",
        "2x15",
        "Pull your elbows back like starting a lawn mower; pause when your hands reach your ribs.",
    ),
    (
        "Wall slides",
        "2x10",
        "Forearms on the wall, slide up and down while keeping your lower back flat to the wall.",
    ),
    (
        "Open-book thoracic rotation",
        "1x8 each side",
        "On your side, open your top arm like a book and follow your hand with your eyes.",
    ),
    (
        "Wrist curls with water bottle",
        "1x15",
        "Forearm on your knee, curl the bottle up using only your wrist, slow on the way down.",
    ),
    (
        "Wrist extensions with water bottle",
        "1x15",
        "Same setup, raise the back of your hand toward the ceiling with a controlled tempo.",
    ),
    (
        "Forearm rotations with water bottle",
        "1x15 each direction",
        "Hold the bottle vertical and rotate your forearm palm up and palm down without moving your elbow.",
    ),
]

SCHEDULE_DAYS = ("Mon", "Wed", "Fri", "Sat")


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(esc(text), style)


def draw_cover_background(canvas, _doc) -> None:
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
    canvas.restoreState()


def draw_content_page_frame(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(WHITE)
    canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
    bar_h = 0.42 * inch
    top = letter[1] - 0.38 * inch
    canvas.setFillColor(NAVY)
    canvas.rect(0.55 * inch, top - bar_h, letter[0] - 1.1 * inch, bar_h, fill=1, stroke=0)
    canvas.setFillColor(LIGHT_GREEN)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(0.7 * inch, top - bar_h + 11, "LCB TRAINING")
    canvas.setFillColor(colors.HexColor("#D1D5DB"))
    canvas.setFont("Helvetica-Oblique", 8)
    canvas.drawRightString(letter[0] - 0.7 * inch, top - bar_h + 11, "Work Hard. Be Memorable.")
    canvas.restoreState()


def styles() -> dict[str, ParagraphStyle]:
    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            alignment=TA_CENTER,
            textColor=WHITE,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            fontName="Helvetica",
            fontSize=12,
            leading=15,
            alignment=TA_CENTER,
            textColor=LIGHT_GREEN,
        ),
        "cover_disclaimer": ParagraphStyle(
            "cover_disclaimer",
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#E5E7EB"),
            spaceBefore=6,
        ),
        "cover_meta": ParagraphStyle(
            "cover_meta",
            fontName="Helvetica",
            fontSize=11,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#E5E7EB"),
        ),
        "page_title": ParagraphStyle(
            "page_title",
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=19,
            textColor=NAVY,
            spaceAfter=8,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="Helvetica",
            fontSize=9.5,
            leading=12.5,
            textColor=TEXT_DARK,
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            fontName="Helvetica",
            fontSize=9.5,
            leading=12.5,
            textColor=TEXT_DARK,
            leftIndent=10,
            bulletIndent=0,
            spaceAfter=4,
        ),
        "warn_title": ParagraphStyle(
            "warn_title",
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            textColor=NAVY,
            spaceAfter=4,
        ),
        "table_head": ParagraphStyle(
            "table_head",
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9.5,
            textColor=WHITE,
        ),
        "table_cell": ParagraphStyle(
            "table_cell",
            fontName="Helvetica",
            fontSize=7,
            leading=9,
            textColor=TEXT_DARK,
        ),
    }


def disclaimer_box(text: str, st: dict[str, ParagraphStyle], width: float) -> Table:
    inner = [[p(text, st["body"])]]
    table = Table(inner, colWidths=[width])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#D97706")),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def routine_table(st: dict[str, ParagraphStyle], width: float) -> Table:
    header = [
        p("Exercise", st["table_head"]),
        p("Sets x Reps", st["table_head"]),
        p("Coaching cue", st["table_head"]),
    ]
    data = [header]
    for name, rx, cue in ARM_CARE_WEEKS1TO4:
        data.append(
            [
                p(name, st["table_cell"]),
                p(rx, st["table_cell"]),
                p(cue, st["table_cell"]),
            ]
        )
    col_widths = [width * 0.28, width * 0.14, width * 0.58]
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, LIGHT_GREEN),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def checklist_table(st: dict[str, ParagraphStyle], width: float) -> Table:
    cell = ParagraphStyle(
        "chk",
        parent=st["table_cell"],
        fontSize=7.5,
        leading=9,
        alignment=TA_CENTER,
    )
    cell_left = ParagraphStyle("chk_l", parent=cell, alignment=TA_LEFT)
    sub = ParagraphStyle("sub", parent=st["table_head"], fontSize=7, alignment=TA_CENTER)

    header = [p("Week", st["table_head"])] + [p(day, sub) for day in SCHEDULE_DAYS]
    data = [header]
    for week in range(1, 5):
        row = [p(f"Week {week}", cell_left)] + [p("[ ]", cell) for _ in SCHEDULE_DAYS]
        data.append(row)
    col = width / 5
    table = Table(data, colWidths=[col * 0.9] + [col * 1.025] * 4)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN),
                ("BACKGROUND", (0, 1), (0, -1), LIGHT_GRAY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("ALIGN", (0, 1), (0, -1), "LEFT"),
                ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREEN),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def build_main_pdf(st: dict[str, ParagraphStyle], content_width: float) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.55 * inch,
        title="Arm Care Routine 4-Week Starter",
        author="LCB Training",
    )

    def on_page(canvas, doc_obj) -> None:
        if doc_obj.page == 1:
            draw_cover_background(canvas, doc_obj)
        else:
            draw_content_page_frame(canvas, doc_obj)

    story: list = []
    story.append(Spacer(1, 0.5 * inch))
    story.append(get_logo_or_fallback(PROJECT_ROOT, target_w=2.4 * inch, target_h=1.0 * inch))
    story.append(Spacer(1, 0.4 * inch))
    story.append(p("Arm Care Routine: 4-Week Starter", st["cover_title"]))
    story.append(Spacer(1, 0.2 * inch))
    story.append(p("Mon, Wed, Fri, Sat | 10-12 min", st["cover_sub"]))
    story.append(Spacer(1, 0.35 * inch))
    story.append(p(MEDICAL_DISCLAIMER, st["cover_disclaimer"]))
    story.append(Spacer(1, 0.25 * inch))
    story.append(p("Prepared by Coach Broc - LCB Training", st["cover_meta"]))
    story.append(PageBreak())

    story.append(Spacer(1, 0.35 * inch))
    story.append(p("How to Use This Routine", st["page_title"]))
    story.append(disclaimer_box(MEDICAL_DISCLAIMER, st, content_width))
    story.append(Spacer(1, 0.1 * inch))
    story.append(p("Safety", st["warn_title"]))
    story.append(disclaimer_box(SAFETY_NOTE, st, content_width))
    story.append(Spacer(1, 0.12 * inch))
    how_to = [
        f"Do this routine on {', '.join(SCHEDULE_DAYS)} each week (4 days per week), on top of practice. Skip on game days if you are sore.",
        f"Equipment: {EQUIPMENT}.",
        EQUIPMENT_NOTE,
        "Weeks 1-4 (this phase): Same exercises and prescriptions every session. Focus on clean form and finishing every rep with control.",
        "Check off each session on the 4-week tracker at the end of this PDF.",
    ]
    story.extend([Paragraph(f"&bull; {esc(line)}", st["bullet"]) for line in how_to])
    story.append(PageBreak())

    story.append(Spacer(1, 0.35 * inch))
    story.append(p("Your Routine (Weeks 1-4)", st["page_title"]))
    story.append(routine_table(st, content_width))
    story.append(PageBreak())

    story.append(Spacer(1, 0.35 * inch))
    story.append(p("4-Week Session Tracker", st["page_title"]))
    story.append(
        p("Mark [ ] when you complete the full routine that day.", st["body"])
    )
    story.append(Spacer(1, 0.08 * inch))
    story.append(checklist_table(st, content_width))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    return buffer.getvalue()


def main() -> int:
    st = styles()
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
    )
    content_width = doc.width
    main_bytes = build_main_pdf(st, content_width)

    writer = PdfWriter()
    for page in PdfReader(BytesIO(main_bytes)).pages:
        writer.add_page(page)
    appendix = build_starter_appendix_pdf(
        "Arm Care Routine",
        weeks_waiting_title="What comes next",
        weeks_waiting_body=(
            "Weeks 5-12 add more advanced arm care work (Y-T-W, 90/90, long toss progression). "
            "Keep building in the LCB app."
        ),
    )
    for page in PdfReader(BytesIO(appendix)).pages:
        writer.add_page(page)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("wb") as handle:
        writer.write(handle)
    print(f"Built {OUTPUT.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
