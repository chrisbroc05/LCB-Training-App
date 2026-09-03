#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from create_bio import (
    GREEN,
    LIGHT_GRAY,
    LIGHT_GREEN,
    NAVY,
    WHITE,
    build_aligned_row,
    build_section_cell,
    get_logo_or_fallback,
)


def build_bullet_list(items: list[str], style: ParagraphStyle) -> Paragraph:
    bullets = "<br/>".join(f"&bull; {item}" for item in items)
    return Paragraph(bullets, style)


def main() -> None:
    project_root = Path(__file__).resolve().parent
    output_dir = project_root / "public" / "player-evaluations"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "LCB_Eval_Kurey.pdf"

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch,
        title="Player Evaluation - Jonathan Kurey",
        author="LCB Training",
    )

    full_width = 6.8 * inch
    two_col_widths = [3.4 * inch, 3.4 * inch]

    title_style = ParagraphStyle(
        "eval-title",
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=23,
        alignment=TA_CENTER,
        textColor=NAVY,
    )
    tagline_style = ParagraphStyle(
        "tagline",
        fontName="Helvetica-BoldOblique",
        fontSize=12,
        leading=14,
        alignment=TA_CENTER,
        textColor=GREEN,
    )
    meta_style = ParagraphStyle(
        "meta",
        fontName="Helvetica",
        fontSize=10,
        leading=12,
        alignment=TA_CENTER,
        textColor=NAVY,
    )
    section_header_style = ParagraphStyle(
        "section-header",
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=14,
        textColor=WHITE,
    )
    body_style = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        textColor=NAVY,
    )
    list_style = ParagraphStyle(
        "list",
        fontName="Helvetica",
        fontSize=9.5,
        leading=12,
        textColor=NAVY,
        leftIndent=4,
    )
    note_style = ParagraphStyle(
        "note",
        fontName="Helvetica-Oblique",
        fontSize=10,
        leading=13,
        textColor=NAVY,
    )
    callout_style = ParagraphStyle(
        "callout",
        fontName="Helvetica-BoldOblique",
        fontSize=11,
        leading=14,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    contact_style = ParagraphStyle(
        "contact",
        fontName="Helvetica",
        fontSize=9.5,
        leading=12,
        alignment=TA_CENTER,
        textColor=WHITE,
    )

    strengths = [
        "Exceptional lower half movement with great balance behind the front foot",
        "Stacked and connected posture through the swing with no hip drift",
        "Strong power for his age and stage",
        "Good barrel accuracy",
    ]
    areas_to_improve = [
        "Front shoulder tends to fly out during the swing",
        "Hands are long with a casting motion similar to a golf swing, causing his head to pull off the ball",
        "Focus on creating a quicker, more connected upper half",
    ]
    recommended_drills = [
        "Low-and-away tee drill focused on driving the ball to the opposite field to train a closed front shoulder and strong posture over the plate",
        "Top-hand-only swing drill with the lead arm held up to build connection and shorten the swing path",
    ]

    closing_note = (
        "Jonathan has a lot to be excited about. His athleticism and coachability stood out right away, "
        "and he is already building habits that will serve him well as he keeps growing. The areas noted "
        "above are very workable, and with consistent reps on the recommended drills, he can make meaningful "
        "progress quickly. Thank you to the Kurey family for trusting LCB Training with Jonathan's development "
        "-- and to his coaches for the support around him. We would love to keep training together and help "
        "him take the next step. Please reach out anytime."
    )
    platform_note = (
        "Between sessions, Jonathan can keep developing with <b>The Next Level Playbook</b> and the full "
        "LCB Training online platform -- video drills, workout programs, and coaching tools built to "
        "support his progress.<br/><br/>Visit <b>lcbtraining.com</b> to learn more."
    )

    story = []

    story.append(get_logo_or_fallback(project_root))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Player Evaluation Report", title_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph('"Work Hard. Be Memorable."', tagline_style))
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "<b>Jonathan Kurey</b> &nbsp;|&nbsp; Northwest Travelers 12U &nbsp;|&nbsp; August 26, 2026",
            meta_style,
        )
    )
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.1, color=LIGHT_GREEN, lineCap="round"))
    story.append(Spacer(1, 6))

    strengths_cell = build_section_cell(
        "Strengths",
        build_bullet_list(strengths, list_style),
        two_col_widths[0],
        section_header_style,
    )
    improve_cell = build_section_cell(
        "Areas to Improve",
        build_bullet_list(areas_to_improve, list_style),
        two_col_widths[1],
        section_header_style,
    )
    story.append(build_aligned_row(strengths_cell, improve_cell, two_col_widths))
    story.append(Spacer(1, 5))

    drills_cell = build_section_cell(
        "Recommended Drills",
        build_bullet_list(recommended_drills, list_style),
        full_width,
        section_header_style,
    )
    story.append(drills_cell)
    story.append(Spacer(1, 5))

    coach_note_cell = build_section_cell(
        "Note from Coach Broc",
        Paragraph(closing_note, note_style),
        full_width,
        section_header_style,
    )
    story.append(coach_note_cell)
    story.append(Spacer(1, 5))

    platform_table = Table(
        [[Paragraph(platform_note, callout_style)]],
        colWidths=[full_width],
    )
    platform_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    story.append(platform_table)
    story.append(Spacer(1, 5))

    left_contact = Paragraph(
        "Coach Broccolino<br/>Email: chrisbroc05@gmail.com<br/>Phone: 847-208-9661",
        contact_style,
    )
    right_contact = Paragraph(
        "LCB Training<br/>Website: lcbtraining.com<br/>Instagram: @lcbtraining | TikTok: @cbroc05",
        contact_style,
    )
    contact_table = Table([[left_contact, right_contact]], colWidths=two_col_widths)
    contact_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(contact_table)

    doc.build(story)

    try:
        from pypdf import PdfReader

        page_count = len(PdfReader(str(output_path)).pages)
        print(f"Created {output_path} ({page_count} page{'s' if page_count != 1 else ''})")
    except Exception:
        print(f"Created {output_path}")


if __name__ == "__main__":
    main()
