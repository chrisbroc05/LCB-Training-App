#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.platypus import HRFlowable, Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


NAVY = colors.HexColor("#0A1628")
GREEN = colors.HexColor("#2D6A4F")
LIGHT_GREEN = colors.HexColor("#52B788")
LIGHT_GRAY = colors.HexColor("#F5F5F5")
WHITE = colors.white


def find_logo_path(project_root: Path) -> Path | None:
    candidates = [
        project_root / "lcb training logo.png",
        project_root.parent / "lcb training logo.png",
        project_root / "public" / "logo" / "lcb-training-logo.png",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def get_logo_or_fallback(project_root: Path):
    logo_path = find_logo_path(project_root)
    target_w = 2.75 * inch
    target_h = 1.12 * inch
    if logo_path is not None:
        try:
            image = ImageReader(str(logo_path))
            src_w, src_h = image.getSize()
            ratio = min(target_w / float(src_w), target_h / float(src_h))
            flowable = Image(str(logo_path), width=src_w * ratio, height=src_h * ratio)
            flowable.hAlign = "CENTER"
            return flowable
        except Exception:
            pass

    fallback_style = ParagraphStyle(
        "fallback",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=15,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    fallback_table = Table(
        [[Paragraph("LCB TRAINING", fallback_style)]],
        colWidths=[6.5 * inch],
    )
    fallback_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    return fallback_table


def build_section_cell(
    title: str,
    body: Paragraph,
    width: float,
    header_style: ParagraphStyle,
) -> Table:
    title_para = Paragraph(title, header_style)
    section_table = Table([[title_para], [body]], colWidths=[width])
    section_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBEFORE", (0, 0), (0, -1), 4, GREEN),
                ("BOX", (0, 0), (-1, -1), 0.8, LIGHT_GREEN),
                ("BACKGROUND", (0, 0), (0, 0), NAVY),
                ("BACKGROUND", (0, 1), (0, 1), LIGHT_GRAY),
                ("TOPPADDING", (0, 0), (0, 0), 7),
                ("BOTTOMPADDING", (0, 0), (0, 0), 7),
                ("LEFTPADDING", (0, 0), (0, 0), 10),
                ("RIGHTPADDING", (0, 0), (0, 0), 10),
                ("TOPPADDING", (0, 1), (0, 1), 11),
                ("BOTTOMPADDING", (0, 1), (0, 1), 11),
                ("LEFTPADDING", (0, 1), (0, 1), 11),
                ("RIGHTPADDING", (0, 1), (0, 1), 11),
            ]
        )
    )
    return section_table


def stretch_section_cell_to_height(section_table: Table, width: float, target_height: float) -> None:
    """Increase body-row padding so a section cell reaches a fixed total height."""
    _, current_height = section_table.wrap(width, 10_000)
    if current_height >= target_height:
        return
    extra_padding = target_height - current_height
    section_table.setStyle(
        TableStyle(
            [
                ("BOTTOMPADDING", (0, 1), (0, 1), 11 + extra_padding),
            ]
        )
    )


def main() -> None:
    project_root = Path(__file__).resolve().parent
    output_path = project_root / "public" / "LCB_Coach_Bio.pdf"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=1 * inch,
        rightMargin=1 * inch,
        topMargin=0.45 * inch,
        bottomMargin=0.4 * inch,
        title="LCB Coach Bio - Chris Broccolino",
        author="LCB Training",
    )

    full_width = 6.5 * inch
    two_col_widths = [3.25 * inch, 3.25 * inch]

    name_style = ParagraphStyle(
        "name",
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=31,
        alignment=TA_CENTER,
        textColor=NAVY,
    )
    title_style = ParagraphStyle(
        "title",
        fontName="Helvetica",
        fontSize=14,
        leading=17,
        alignment=TA_CENTER,
        textColor=GREEN,
    )
    section_header_style = ParagraphStyle(
        "section-header",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=15.5,
        textColor=WHITE,
    )
    body_style = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=11,
        leading=14,
        textColor=NAVY,
    )
    list_style = ParagraphStyle(
        "list",
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        textColor=NAVY,
    )
    callout_style = ParagraphStyle(
        "callout",
        fontName="Helvetica-BoldOblique",
        fontSize=13,
        leading=15.5,
        alignment=TA_CENTER,
        textColor=NAVY,
    )
    quote_style = ParagraphStyle(
        "quote",
        fontName="Helvetica-BoldOblique",
        fontSize=16,
        leading=20,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    contact_style = ParagraphStyle(
        "contact",
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        textColor=WHITE,
    )

    story = []

    # 1. Header
    story.append(get_logo_or_fallback(project_root))
    story.append(Spacer(1, 7))
    story.append(Paragraph("Chris Broccolino", name_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Player Development Coach | LCB Training", title_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.2, color=LIGHT_GREEN, lineCap="round"))
    story.append(Spacer(1, 6))

    # 2. About Me (full width)
    about_text = (
        "I've spent 12+ years working with baseball players at every level - helping them not "
        "just become better athletes, but more confident people. As a current High School Varsity "
        "coach and longtime player development coach, my goal is simple: build confidence on and "
        "off the field. Every player I work with gets my full attention, honest feedback, and a "
        "plan built around their individual development."
    )
    about_table = build_section_cell(
        "About Me",
        Paragraph(about_text, body_style),
        4.75 * inch,
        section_header_style,
    )
    program_details_table = build_section_cell(
        "Program Details",
        Paragraph(
            "&bull; Hitting<br/>"
            "&bull; Fielding<br/>"
            "&bull; Speed &amp; agility<br/>"
            "&bull; Strength &amp; mobility",
            list_style,
        ),
        1.75 * inch,
        section_header_style,
    )
    _, about_h = about_table.wrap(4.75 * inch, 10_000)
    _, program_h = program_details_table.wrap(1.75 * inch, 10_000)
    about_program_height = max(about_h, program_h)
    stretch_section_cell_to_height(about_table, 4.75 * inch, about_program_height)
    stretch_section_cell_to_height(program_details_table, 1.75 * inch, about_program_height)
    about_program_table = Table(
        [[about_table, program_details_table]],
        colWidths=[4.75 * inch, 1.75 * inch],
        rowHeights=[about_program_height],
    )
    about_program_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(about_program_table)
    story.append(Spacer(1, 5))

    # 3. Experience & Accolades (two columns)
    experience_bullets_para = Paragraph(
        "&bull; 12+ years as a Player Development Coach<br/>"
        "&bull; Current High School Varsity Coach",
        list_style,
    )
    experience_callout_para = Paragraph("Trained 100+ athletes", callout_style)
    experience_para = Table(
        [[experience_bullets_para], [experience_callout_para]],
        colWidths=[two_col_widths[0] - 22],
    )
    experience_para.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 1), (0, 1), 18),
            ]
        )
    )
    accolades_para = Paragraph(
        "&bull; 2x All-Conference College Athlete<br/>"
        "&bull; Gold Glove Award<br/>"
        "&bull; Academic All-American<br/>"
        "&bull; NJCAA National Champion - Oakton Community College<br/>"
        "&bull; World Series All-Tournament Team",
        list_style,
    )
    experience_cell = build_section_cell(
        "Experience",
        experience_para,
        two_col_widths[0],
        section_header_style,
    )
    accolades_cell = build_section_cell(
        "Accolades",
        accolades_para,
        two_col_widths[1],
        section_header_style,
    )
    _, experience_cell_height = experience_cell.wrap(two_col_widths[0], 10_000)
    _, accolades_cell_height = accolades_cell.wrap(two_col_widths[1], 10_000)
    exp_acc_cell_height = max(experience_cell_height, accolades_cell_height)
    stretch_section_cell_to_height(experience_cell, two_col_widths[0], exp_acc_cell_height)
    stretch_section_cell_to_height(accolades_cell, two_col_widths[1], exp_acc_cell_height)
    exp_acc_table = Table(
        [[experience_cell, accolades_cell]],
        colWidths=[3.25 * inch, 3.25 * inch],
        rowHeights=[exp_acc_cell_height],
    )
    exp_acc_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(exp_acc_table)
    story.append(Spacer(1, 5))

    # 4. Coaching Philosophy
    philosophy_table = Table(
        [[Paragraph('"Work Hard. Be Memorable."', quote_style)]],
        colWidths=[full_width],
    )
    philosophy_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 13),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 13),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(philosophy_table)
    story.append(Spacer(1, 5))

    # 5. Training Options (two columns)
    in_person_para = Paragraph(
        "&bull; Private lesson: $60/hr<br/>"
        "&bull; Two players: $75/hr<br/>"
        "&bull; Group (3+): $100/hr<br/>"
        "&bull; 30 or 60 minute sessions<br/>"
        "&bull; Palatine facility, local fields and your local facilities (we can train at your place, mine, or meet in the middle)",
        list_style,
    )
    online_para = Paragraph(
        "&bull; Free - 1 free swing or mental game submission<br/>"
        "&bull; Basic ($5/mo) - full video drill library + workout programs<br/>"
        "&bull; Pro ($9/mo) - unlimited swing analysis + mental game support<br/>"
        "&bull; Elite ($14/mo) - priority feedback + monthly group coaching call",
        list_style,
    )
    in_person_cell = build_section_cell(
        "In-Person Training",
        in_person_para,
        two_col_widths[0],
        section_header_style,
    )
    online_cell = build_section_cell(
        "Online Membership",
        online_para,
        two_col_widths[1],
        section_header_style,
    )
    _, in_person_cell_height = in_person_cell.wrap(two_col_widths[0], 10_000)
    _, online_cell_height = online_cell.wrap(two_col_widths[1], 10_000)
    training_cell_height = max(in_person_cell_height, online_cell_height)
    stretch_section_cell_to_height(in_person_cell, two_col_widths[0], training_cell_height)
    stretch_section_cell_to_height(online_cell, two_col_widths[1], training_cell_height)
    training_table = Table(
        [[in_person_cell, online_cell]],
        colWidths=[3.25 * inch, 3.25 * inch],
        rowHeights=[training_cell_height],
    )
    training_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(training_table)
    story.append(Spacer(1, 3))

    # 6. Contact footer
    left_contact = Paragraph(
        "Email: chrisbroc05@gmail.com<br/>Phone: 847-208-9661",
        contact_style,
    )
    right_contact = Paragraph(
        "Instagram: @lcbtraining | TikTok: @cbroc05<br/>Website: lcbtraining.com",
        contact_style,
    )
    contact_table = Table([[left_contact, right_contact]], colWidths=two_col_widths)
    contact_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(contact_table)

    doc.build(story)
    print(f"Created {output_path}")


if __name__ == "__main__":
    main()
