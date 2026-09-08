#!/usr/bin/env python3

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from create_bio import (
    GREEN,
    LIGHT_GREEN,
    NAVY,
    WHITE,
    build_aligned_row,
    build_section_cell,
    get_logo_or_fallback,
)


@dataclass(frozen=True)
class PlayerEvaluation:
    first_name: str
    last_name: str
    team: str
    eval_date: str
    strengths: list[str]
    areas_to_improve: list[str]
    recommended_drills: list[str]
    closing_note: str


def build_bullet_list(items: list[str], style: ParagraphStyle) -> Paragraph:
    bullets = "<br/>".join(f"&bull; {item}" for item in items)
    return Paragraph(bullets, style)


def build_player_eval_pdf(project_root: Path, evaluation: PlayerEvaluation, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch,
        title=f"Player Evaluation - {evaluation.first_name} {evaluation.last_name}",
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

    platform_note = (
        f"Between sessions, {evaluation.first_name} can keep developing with "
        f"<b>The Next Level Playbook</b> and the full LCB Training online platform -- video drills, "
        f"workout programs, and coaching tools built to support his progress.<br/><br/>"
        f"Visit <b>lcbtraining.com</b> to learn more."
    )

    story = [
        get_logo_or_fallback(project_root),
        Spacer(1, 4),
        Paragraph("Player Evaluation Report", title_style),
        Spacer(1, 3),
        Paragraph('"Work Hard. Be Memorable."', tagline_style),
        Spacer(1, 6),
        Paragraph(
            f"<b>{evaluation.first_name} {evaluation.last_name}</b> &nbsp;|&nbsp; "
            f"{evaluation.team} &nbsp;|&nbsp; {evaluation.eval_date}",
            meta_style,
        ),
        Spacer(1, 6),
        HRFlowable(width="100%", thickness=1.1, color=LIGHT_GREEN, lineCap="round"),
        Spacer(1, 6),
        build_aligned_row(
            build_section_cell(
                "Strengths",
                build_bullet_list(evaluation.strengths, list_style),
                two_col_widths[0],
                section_header_style,
            ),
            build_section_cell(
                "Areas to Improve",
                build_bullet_list(evaluation.areas_to_improve, list_style),
                two_col_widths[1],
                section_header_style,
            ),
            two_col_widths,
        ),
        Spacer(1, 5),
        build_section_cell(
            "Recommended Drills",
            build_bullet_list(evaluation.recommended_drills, list_style),
            full_width,
            section_header_style,
        ),
        Spacer(1, 5),
        build_section_cell(
            "Note from Coach Broc",
            Paragraph(evaluation.closing_note, note_style),
            full_width,
            section_header_style,
        ),
        Spacer(1, 5),
    ]

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
    story.extend([platform_table, Spacer(1, 5)])

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


def main() -> None:
    project_root = Path(__file__).resolve().parent
    evaluation = PlayerEvaluation(
        first_name="A J",
        last_name="Hellman",
        team="Northwest Travelers 12U White",
        eval_date="September 4, 2026",
        strengths=[
            "Excellent hand-eye coordination",
            "Strong and accurate contact on the baseball",
            "Naturally athletic frame carried over from football",
            "Great coachable attitude with genuine curiosity to learn",
        ],
        areas_to_improve=[
            "Loading into the knee instead of the hip, causing the hips to drift back and the knee to straighten and pop up during the swing",
            "Overly tall posture and a steep, choppy bat path that results in mostly hard ground balls rather than line drives",
            "Improving posture, with the chest staying forward over the plate, is the key focus",
        ],
        recommended_drills=[
            "Forty-five-degree angled tee drill, feet set toward third base, loading into the back hip and driving the ball up the middle to right-center",
            "Top-hand-only isolation drill working a low line drive to second base",
            "Low-and-outside tee drill to encourage better posture and opposite-field contact",
            "Bat-on-shoulders hinge drill to train a forward, hinged posture through the swing",
        ],
        closing_note=(
            "A J has a lot to be excited about. His hand-eye coordination and natural hitting ability stand out, "
            "and once his posture and swing angle click into place, his potential is very real. The areas noted "
            "above are very workable, and with consistent reps on the recommended drills, he can make meaningful "
            "progress quickly. Thank you to the Hellman family for trusting LCB Training with A J's development "
            "-- and to his coaches for the support around him. We would love to keep training together and help "
            "him take the next step. Please reach out anytime."
        ),
    )
    output_path = project_root / "public" / "player-evaluations" / "LCB_Eval_Hellman.pdf"
    build_player_eval_pdf(project_root, evaluation, output_path)

    try:
        from pypdf import PdfReader

        page_count = len(PdfReader(str(output_path)).pages)
        print(f"Created {output_path} ({page_count} page{'s' if page_count != 1 else ''})")
    except Exception:
        print(f"Created {output_path}")


if __name__ == "__main__":
    main()
