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


def get_logo_or_fallback(project_root: Path, target_w: float = 2.25 * inch, target_h: float = 0.92 * inch):
    logo_path = find_logo_path(project_root)
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
                ("TOPPADDING", (0, 0), (0, 0), 8),
                ("BOTTOMPADDING", (0, 0), (0, 0), 8),
                ("LEFTPADDING", (0, 0), (0, 0), 10),
                ("RIGHTPADDING", (0, 0), (0, 0), 10),
                ("TOPPADDING", (0, 1), (0, 1), 10),
                ("BOTTOMPADDING", (0, 1), (0, 1), 10),
                ("LEFTPADDING", (0, 1), (0, 1), 10),
                ("RIGHTPADDING", (0, 1), (0, 1), 10),
            ]
        )
    )
    return section_table


def build_aligned_row(
    left_cell: Table,
    right_cell: Table,
    col_widths: list[float],
) -> Table:
    left_width, right_width = col_widths
    _, left_height = left_cell.wrap(left_width, 10_000)
    _, right_height = right_cell.wrap(right_width, 10_000)
    row_height = max(left_height, right_height)
    stretch_section_cell_to_height(left_cell, left_width, row_height)
    stretch_section_cell_to_height(right_cell, right_width, row_height)
    row_table = Table(
        [[left_cell, right_cell]],
        colWidths=col_widths,
        rowHeights=[row_height],
    )
    row_table.setStyle(
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
    return row_table


def stretch_section_cell_to_height(section_table: Table, width: float, target_height: float) -> None:
    """Increase body-row padding so a section cell reaches a fixed total height."""
    _, current_height = section_table.wrap(width, 10_000)
    if current_height >= target_height:
        return
    extra_padding = target_height - current_height
    section_table.setStyle(
        TableStyle(
            [
                ("BOTTOMPADDING", (0, 1), (0, 1), 10 + extra_padding),
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
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch,
        title="LCB Coach Bio - Chris Broccolino",
        author="LCB Training",
    )

    full_width = 6.8 * inch
    two_col_widths = [3.4 * inch, 3.4 * inch]
    about_col_widths = [5.0 * inch, 1.8 * inch]
    section_body_inset = 20

    name_style = ParagraphStyle(
        "name",
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=27,
        alignment=TA_CENTER,
        textColor=NAVY,
    )
    title_style = ParagraphStyle(
        "title",
        fontName="Helvetica",
        fontSize=12,
        leading=14,
        alignment=TA_CENTER,
        textColor=GREEN,
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
        fontSize=10.5,
        leading=13,
        textColor=NAVY,
    )
    list_style = ParagraphStyle(
        "list",
        fontName="Helvetica",
        fontSize=9.5,
        leading=12,
        textColor=NAVY,
    )
    section_item_style = ParagraphStyle(
        "section-item",
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        textColor=NAVY,
    )
    callout_style = ParagraphStyle(
        "callout",
        fontName="Helvetica-BoldOblique",
        fontSize=12,
        leading=14,
        alignment=TA_CENTER,
        textColor=NAVY,
    )
    quote_style = ParagraphStyle(
        "quote",
        fontName="Helvetica-BoldOblique",
        fontSize=15,
        leading=18,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    contact_style = ParagraphStyle(
        "contact",
        fontName="Helvetica",
        fontSize=9.5,
        leading=12,
        textColor=WHITE,
    )

    story = []

    # 1. Header: centered logo and name
    story.append(get_logo_or_fallback(project_root))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Chris Broccolino", name_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("Player Development Coach | LCB Training", title_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.1, color=LIGHT_GREEN, lineCap="round"))
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
        about_col_widths[0],
        section_header_style,
    )
    program_details_table = build_section_cell(
        "Program Details",
        Paragraph(
            "<b>Hitting</b><br/>"
            "<b>Fielding</b><br/>"
            "<b>Speed &amp; agility</b><br/>"
            "<b>Strength &amp; mobility</b><br/>"
            "<b>Online training program</b>",
            section_item_style,
        ),
        about_col_widths[1],
        section_header_style,
    )
    story.append(build_aligned_row(about_table, program_details_table, about_col_widths))
    story.append(Spacer(1, 5))

    # 3. Experience & Accolades (two columns)
    experience_bullets_para = Paragraph(
        "<b>12+ years as a Player Development Coach</b><br/>"
        "<b>Current High School Varsity Coach</b>",
        section_item_style,
    )
    experience_callout_para = Paragraph("Trained 100+ athletes", callout_style)
    experience_para = Table(
        [[experience_bullets_para], [experience_callout_para]],
        colWidths=[two_col_widths[0] - section_body_inset],
    )
    experience_para.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 1), (0, 1), 16),
            ]
        )
    )
    accolades_para = Paragraph(
        "<b>2x All-Conference College Athlete</b><br/>"
        "<b>Gold Glove Award</b><br/>"
        "<b>Academic All-American</b><br/>"
        "<b>NJCAA National Champion - Oakton CC</b><br/>"
        "<b>World Series All-Tournament Team</b>",
        section_item_style,
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
    story.append(build_aligned_row(experience_cell, accolades_cell, two_col_widths))
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
                ("TOPPADDING", (0, 0), (-1, -1), 11),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(philosophy_table)
    story.append(Spacer(1, 5))

    # 5. Training Options (two columns)
    in_person_para = Paragraph(
        "<b>Private lesson ($60/hr)</b><br/>"
        "One-on-one skill development<br/><br/>"
        "<b>Two players ($75/hr)</b><br/>"
        "Shared session for two athletes<br/><br/>"
        "<b>Group (3+, $100/hr)</b><br/>"
        "Small group training<br/><br/>"
        "<b>30 or 60 minute sessions</b><br/><br/>"
        "<b>Training locations</b><br/>"
        "Palatine facility, local fields and your local facilities (we can train at your place, mine, or meet in the middle)",
        section_item_style,
    )
    online_para = Paragraph(
        "<b>Free</b><br/>"
        "1 free coaching submission plus free 20-minute Player Assessment Call with Coach Broc<br/>"
        "<b>Basic ($59 one-time)</b><br/>"
        "Lifetime access to the full video drill library plus 8 downloadable workout programs<br/>"
        "<b>Memorable ($149/mo or $1,490/yr)</b><br/>"
        "Everything in Basic plus 2 coaching submissions per month with 48-hour feedback, weekly check-ins, and goal setting<br/>"
        "<b>Elite ($249/mo or $2,490/yr)</b><br/>"
        "Everything in Memorable plus 4 submissions per month with rollover, priority 24-hour response, monthly group coaching call, and personalized development plan",
        section_item_style,
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
    story.append(build_aligned_row(in_person_cell, online_cell, two_col_widths))
    story.append(Spacer(1, 5))

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
