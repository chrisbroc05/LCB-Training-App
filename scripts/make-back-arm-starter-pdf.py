#!/usr/bin/env python3
"""4-week Back and Arm starter PDF for the resources hub."""

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
OUTPUT = PROJECT_ROOT / "private" / "resources" / "starters" / "LCB_Back_and_Arm_4Week_Starter.pdf"


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
            fontSize=24,
            leading=28,
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
        "box_title": ParagraphStyle(
            "box_title",
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            textColor=NAVY,
            spaceAfter=4,
        ),
        "table_head": ParagraphStyle(
            "table_head",
            fontName="Helvetica-Bold",
            fontSize=7,
            leading=9,
            textColor=WHITE,
        ),
        "table_cell": ParagraphStyle(
            "table_cell",
            fontName="Helvetica",
            fontSize=6.8,
            leading=8.5,
            textColor=TEXT_DARK,
        ),
    }


def bullet_block(items: list[str], bullet_style: ParagraphStyle) -> list:
    return [Paragraph(f"&bull; {esc(item)}", bullet_style) for item in items]


def equipment_box(st: dict[str, ParagraphStyle], width: float) -> Table:
    text = (
        "Light dumbbells, a pull-up bar, a resistance band, and a medicine ball. "
        "At the school gym, use the School gym option column on each exercise."
    )
    inner = [[p(text, st["body"])]]
    table = Table(inner, colWidths=[width])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 1, GREEN),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def workout_table(
    rows: list[tuple[str, str, str, str, str]],
    st: dict[str, ParagraphStyle],
    col_widths: list[float],
) -> Table:
    header = [
        p("Exercise", st["table_head"]),
        p("Sets x Reps", st["table_head"]),
        p("Rest", st["table_head"]),
        p("Coaching cue", st["table_head"]),
        p("School gym option", st["table_head"]),
    ]
    data = [header]
    for ex, sxr, rest, cue, gym in rows:
        data.append(
            [
                p(ex, st["table_cell"]),
                p(sxr, st["table_cell"]),
                p(rest, st["table_cell"]),
                p(cue, st["table_cell"]),
                p(gym, st["table_cell"]),
            ]
        )
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, LIGHT_GREEN),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return table


def warm_up_table(st: dict[str, ParagraphStyle], width: float) -> Table:
    rows = [
        ("Jog or jumping jacks", "1 minute"),
        ("Arm circles, small to big", "10 each direction"),
        ("Band pull-aparts", "1 x 15"),
        ("Inchworm", "5 reps"),
        ("Light push-ups", "1 x 8"),
    ]
    data = [[p("Exercise", st["table_head"]), p("Sets x Reps", st["table_head"])]]
    for ex, sxr in rows:
        data.append([p(ex, st["table_cell"]), p(sxr, st["table_cell"])])
    table = Table(data, colWidths=[width * 0.62, width * 0.38])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, LIGHT_GREEN),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def tracker_table(st: dict[str, ParagraphStyle], width: float) -> Table:
    sub_head = ParagraphStyle(
        "sub_head",
        parent=st["table_head"],
        fontSize=6.5,
        leading=8,
        alignment=TA_CENTER,
    )
    cell = ParagraphStyle("track_cell", parent=st["table_cell"], fontSize=7, leading=9, alignment=TA_CENTER)
    cell_left = ParagraphStyle("track_left", parent=cell, alignment=TA_LEFT)

    header_row1 = [
        p("Week", st["table_head"]),
        Paragraph(esc("Day A"), sub_head),
        "",
        "",
        Paragraph(esc("Day B"), sub_head),
        "",
        "",
    ]
    header_row2 = [
        "",
        p("Done", sub_head),
        p("Max pull-ups", sub_head),
        p("Row weight", sub_head),
        p("Done", sub_head),
        p("Max pull-ups", sub_head),
        p("Curl weight", sub_head),
    ]
    data = [header_row1, header_row2]
    for week in range(1, 5):
        data.append(
            [
                p(f"Week {week}", cell_left),
                p("[ ]", cell),
                p("____", cell),
                p("____", cell),
                p("[ ]", cell),
                p("____", cell),
                p("____", cell),
            ]
        )
    col = width / 7
    table = Table(data, colWidths=[col * 0.85] + [col * 1.02] * 6)
    table.setStyle(
        TableStyle(
            [
                ("SPAN", (1, 0), (3, 0)),
                ("SPAN", (4, 0), (6, 0)),
                ("BACKGROUND", (0, 0), (-1, 1), GREEN),
                ("BACKGROUND", (0, 2), (0, -1), LIGHT_GRAY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("ALIGN", (0, 2), (0, -1), "LEFT"),
                ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREEN),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
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
        title="LCB Back and Arm Strength 4-Week Starter",
        author="LCB Training",
    )

    def on_page(canvas, doc_obj) -> None:
        if doc_obj.page == 1:
            draw_cover_background(canvas, doc_obj)
        else:
            draw_content_page_frame(canvas, doc_obj)

    story: list = []
    story.append(Spacer(1, 0.55 * inch))
    story.append(get_logo_or_fallback(PROJECT_ROOT, target_w=2.4 * inch, target_h=1.0 * inch))
    story.append(Spacer(1, 0.45 * inch))
    story.append(p("Back and Arm Strength", st["cover_title"]))
    story.append(Spacer(1, 0.15 * inch))
    story.append(p("4-Week Starter", st["cover_sub"]))
    story.append(Spacer(1, 0.2 * inch))
    story.append(p("4 Weeks | 2 Days per Week", st["cover_sub"]))
    story.append(Spacer(1, 0.35 * inch))
    story.append(p("Prepared by Coach Broc - LCB Training", st["cover_meta"]))
    story.append(PageBreak())

    story.append(Spacer(1, 0.35 * inch))
    story.append(p("How to Use This Program", st["page_title"]))
    story.append(Spacer(1, 0.08 * inch))
    story.append(p("Equipment you need", st["box_title"]))
    story.append(equipment_box(st, content_width))
    story.append(Spacer(1, 0.12 * inch))
    how_to = [
        "Do Day A and Day B each week, with at least 1 rest day between them "
        "(example: Tuesday and Friday). Takes 30-40 minutes.",
        "Do it on top of your normal baseball practice, not instead of it. Skip it on game days.",
        "At home, use light dumbbells, a pull-up bar, a resistance band, and a medicine ball. "
        'At the school gym, use the "School gym option" column to go a little heavier.',
        "Light weights still work: move slow on the way down (3 seconds), pause 1 second at the top, "
        "and finish every set with 2 reps left in the tank. Never max out.",
        "Weeks 1-2: learn the movements. Weeks 3-4: add 1 set to each exercise or 2 reps per set.",
        "Safety: Stop any exercise that causes sharp pain (soreness is normal, pain is not). "
        "Have an adult or coach around when lifting at the gym. "
        "Do not train your arm hard the day before you pitch or throw a lot.",
    ]
    story.extend(bullet_block(how_to, st["bullet"]))
    story.append(PageBreak())

    story.append(Spacer(1, 0.35 * inch))
    story.append(p("Warm-Up (every session, 5 minutes)", st["page_title"]))
    story.append(warm_up_table(st, content_width))
    story.append(PageBreak())

    day_a_rows = [
        (
            "Pull-ups",
            "3 x as many good reps as possible (aim 5-8)",
            "90 sec",
            "Full hang to chin over bar, 3 seconds on the way down. "
            "If you cannot do 5, jump up and lower slowly (negatives)",
            "Lat pulldown 3 x 10",
        ),
        (
            "Single-arm dumbbell row (slow)",
            "3 x 15 each arm",
            "60 sec",
            "Flat back, elbow to your hip, pause and squeeze at the top, 3 seconds down",
            "Heavier dumbbell row 3 x 10",
        ),
        (
            "Band face pulls",
            "3 x 15",
            "45 sec",
            "Pull the band to your forehead, elbows high, squeeze shoulder blades",
            "Cable face pulls 3 x 15",
        ),
        (
            "Prone Y-T-W raises",
            "2 x 8 each letter",
            "45 sec",
            "Lie face down, thumbs up, slow and controlled, no weight or very light",
            "Same",
        ),
        (
            "Medicine ball slams",
            "3 x 8",
            "60 sec",
            "Reach tall, slam it down hard using your whole body",
            "Same",
        ),
        (
            "Dead hang from the bar",
            "3 x 20-30 sec",
            "45 sec",
            "Hang with straight arms, grip tight, shoulders active (not shrugged into your ears).",
            "Same",
        ),
        (
            "Superman hold",
            "2 x 20 sec",
            "30 sec",
            "Lift arms and legs, squeeze glutes and back",
            "Back extension machine 2 x 12",
        ),
    ]
    day_b_rows = [
        (
            "Push-ups",
            "3 x 10-15",
            "60 sec",
            "Straight line head to heels, chest to just above the floor. Knees down if needed",
            "Dumbbell bench press 3 x 10",
        ),
        (
            "Dumbbell biceps curl (slow)",
            "3 x 15",
            "45 sec",
            "Elbows pinned to your sides, no swinging, 3 seconds down",
            "Heavier curls 3 x 10",
        ),
        (
            "Hammer curl",
            "2 x 15",
            "45 sec",
            "Thumbs up the whole time, builds the forearm too",
            "Same, heavier",
        ),
        (
            "Overhead dumbbell triceps extension",
            "3 x 15",
            "45 sec",
            "Hold one dumbbell with both hands, elbows point up and stay close",
            "Cable triceps pushdown 3 x 12",
        ),
        (
            "Medicine ball chest pass",
            "3 x 8",
            "60 sec",
            "Explode the ball off your chest into a wall, catch and repeat",
            "Same",
        ),
        (
            "Medicine ball rotational throw",
            "2 x 6 each side",
            "60 sec",
            "Stand sideways to a wall, turn from your hips and throw it into the wall like a swing",
            "Same",
        ),
        (
            "Band external rotation",
            "2 x 12 each arm",
            "45 sec",
            "Elbow at your side at 90 degrees, rotate out slowly (protects the throwing shoulder)",
            "Cable external rotation 2 x 12",
        ),
        (
            "Wrist curls and reverse wrist curls",
            "2 x 20 each",
            "30 sec",
            "Forearm on your knee, move only the wrist",
            "Same",
        ),
        (
            "Plank",
            "2 x 30-45 sec",
            "30 sec",
            "Squeeze abs and glutes, straight line",
            "Same",
        ),
    ]
    col_widths = [
        content_width * 0.17,
        content_width * 0.15,
        content_width * 0.08,
        content_width * 0.35,
        content_width * 0.25,
    ]

    story.append(Spacer(1, 0.28 * inch))
    story.append(p("Day A: Back and Pull", st["page_title"]))
    story.append(workout_table(day_a_rows, st, col_widths))
    story.append(PageBreak())

    story.append(Spacer(1, 0.22 * inch))
    story.append(p("Day B: Arms and Grip", st["page_title"]))
    story.append(workout_table(day_b_rows, st, col_widths))
    story.append(PageBreak())

    story.append(Spacer(1, 0.35 * inch))
    story.append(p("4-Week Tracker", st["page_title"]))
    story.append(tracker_table(st, content_width))

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
    main_reader = PdfReader(BytesIO(main_bytes))
    for page in main_reader.pages:
        writer.add_page(page)
    appendix_reader = PdfReader(
        BytesIO(build_starter_appendix_pdf("Back and Arm Strength"))
    )
    for page in appendix_reader.pages:
        writer.add_page(page)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("wb") as handle:
        writer.write(handle)
    print(f"Built {OUTPUT.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
