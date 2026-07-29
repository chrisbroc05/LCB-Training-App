#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
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


def find_qr_path(project_root: Path) -> Path | None:
    candidates = [
        project_root / "public" / "LCB Training In Person QR code.png",
        project_root / "public" / "LCB_Training_In_Person_Site.png",
        project_root / "public" / "LCB_Training_In_Person_QR_code.png",
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
        colWidths=[6.8 * inch],
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
    body,
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
                ("TOPPADDING", (0, 1), (0, 1), 8),
                ("BOTTOMPADDING", (0, 1), (0, 1), 8),
                ("LEFTPADDING", (0, 1), (0, 1), 10),
                ("RIGHTPADDING", (0, 1), (0, 1), 10),
            ]
        )
    )
    return section_table


def stretch_section_cell_to_height(section_table: Table, width: float, target_height: float) -> None:
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


def build_online_membership_body(
    width: float,
    tier_name_style: ParagraphStyle,
    tier_desc_style: ParagraphStyle,
) -> Table:
    tiers = [
        (
            "Free",
            "1 free coaching submission + free 20-minute Player Assessment Call with Coach Broc",
        ),
        (
            "Basic ($59 one-time)",
            "Full video drill library + 8 downloadable workout programs",
        ),
        (
            "Memorable ($149/mo or $1,490/yr)",
            "Everything in Basic + 2 submissions/mo, 48-hour feedback, weekly check-ins, goal setting",
        ),
        (
            "Elite ($249/mo or $2,490/yr)",
            "Everything in Memorable + 4 submissions/mo with rollover, priority 24-hour response, "
            "monthly group coaching call, personalized development plan",
        ),
    ]
    rows = []
    for tier_name, tier_desc in tiers:
        rows.append([Paragraph(f"<b>{tier_name}</b>", tier_name_style)])
        rows.append([Paragraph(tier_desc, tier_desc_style)])

    tier_table = Table(rows, colWidths=[width])
    tier_style_commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]
    for row_index in range(1, len(rows), 2):
        if row_index < len(rows) - 1:
            tier_style_commands.append(("BOTTOMPADDING", (0, row_index), (0, row_index), 4))
    tier_table.setStyle(TableStyle(tier_style_commands))
    return tier_table


def build_in_person_body(
    width: float,
    item_title_style: ParagraphStyle,
    item_desc_style: ParagraphStyle,
) -> Table:
    items = [
        ("Private lesson ($60/hr)", "One-on-one skill development"),
        ("Two players ($75/hr)", "Shared session for two athletes"),
        ("Group (3+, $100/hr)", "Small group training"),
        ("Team Training", "Reach out and we can talk through details for your program"),
        (
            "Training locations",
            "Palatine facility, local fields, and your facilities "
            "(we can train at your place, mine, or meet in the middle)",
        ),
    ]
    rows = []
    for item_title, item_desc in items:
        rows.append([Paragraph(f"<b>{item_title}</b>", item_title_style)])
        rows.append([Paragraph(item_desc, item_desc_style)])

    item_table = Table(rows, colWidths=[width])
    item_style_commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]
    for row_index in range(1, len(rows), 2):
        item_style_commands.append(("BOTTOMPADDING", (0, row_index), (0, row_index), 8))
    item_table.setStyle(TableStyle(item_style_commands))
    return item_table


def build_modern_contact_block(
    width: float,
    contact_line_style: ParagraphStyle,
) -> Table:
    def contact_line(label: str, value: str) -> Paragraph:
        return Paragraph(
            f'<font color="#52B788"><b>{label}</b></font>&nbsp;&nbsp;{value}',
            contact_line_style,
        )

    direct_col_width = width * 0.52
    social_col_width = 1.72 * inch
    spacer_col_width = max(width - social_col_width - direct_col_width, 0)
    social_items = [
        contact_line("INSTAGRAM", "@lcbtraining"),
        contact_line("TIKTOK", "@cbroc05"),
        contact_line("WEB", "lcbtraining.com"),
    ]
    direct_items = [
        contact_line("EMAIL", "chrisbroc05@gmail.com"),
        contact_line("PHONE", "847-208-9661"),
    ]
    row_count = max(len(social_items), len(direct_items))
    rows = []
    for row_index in range(row_count):
        spacer = Paragraph("", contact_line_style)
        left_item = social_items[row_index] if row_index < len(social_items) else Paragraph("", contact_line_style)
        right_item = direct_items[row_index] if row_index < len(direct_items) else Paragraph("", contact_line_style)
        rows.append([spacer, left_item, right_item])

    contact_block = Table(rows, colWidths=[spacer_col_width, social_col_width, direct_col_width])
    contact_block.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("ALIGN", (2, 0), (2, -1), "LEFT"),
                ("LINEBEFORE", (2, 0), (2, -1), 1.2, LIGHT_GREEN),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (0, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, -1), 0),
                ("LEFTPADDING", (1, 0), (1, -1), 0),
                ("RIGHTPADDING", (1, 0), (1, -1), 2),
                ("LEFTPADDING", (2, 0), (2, -1), 16),
                ("RIGHTPADDING", (2, 0), (2, -1), 4),
            ]
        )
    )
    return contact_block


def build_qr_footer_cell(
    project_root: Path,
    qr_col_width: float,
    qr_caption_style: ParagraphStyle,
    placeholder_style: ParagraphStyle,
) -> Table:
    qr_size = 0.72 * inch
    qr_path = find_qr_path(project_root)
    if qr_path is not None:
        try:
            image = ImageReader(str(qr_path))
            src_w, src_h = image.getSize()
            ratio = min(qr_size / float(src_w), qr_size / float(src_h))
            qr_image = Image(
                str(qr_path),
                width=src_w * ratio,
                height=src_h * ratio,
            )
            qr_image.hAlign = "CENTER"
        except Exception:
            qr_image = Paragraph("QR unavailable", placeholder_style)
    else:
        qr_image = Paragraph("QR unavailable", placeholder_style)

    caption = Paragraph(
        "Scan to book a lesson or explore remote training",
        qr_caption_style,
    )
    qr_table = Table([[qr_image], [caption]], colWidths=[qr_col_width])
    qr_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 1), (0, 1), 4),
            ]
        )
    )
    return qr_table


def main() -> None:
    project_root = Path(__file__).resolve().parent
    output_path = project_root / "public" / "LCB_Coaches_Handout.pdf"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch,
        title="LCB Coaches Handout - Chris Broccolino",
        author="LCB Training",
    )

    full_width = 6.8 * inch
    two_col_widths = [3.4 * inch, 3.4 * inch]
    about_col_widths = [5.0 * inch, 1.8 * inch]
    footer_col_widths = [1.05 * inch, 5.75 * inch]
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
    contact_line_style = ParagraphStyle(
        "contact-line",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        alignment=TA_LEFT,
        textColor=WHITE,
    )
    in_person_title_style = ParagraphStyle(
        "in-person-title",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=NAVY,
    )
    in_person_desc_style = ParagraphStyle(
        "in-person-desc",
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        textColor=NAVY,
    )
    tier_name_style = ParagraphStyle(
        "tier-name",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=11.5,
        textColor=NAVY,
    )
    tier_desc_style = ParagraphStyle(
        "tier-desc",
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        textColor=NAVY,
    )
    qr_caption_style = ParagraphStyle(
        "qr-caption",
        fontName="Helvetica",
        fontSize=7.5,
        leading=9,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    placeholder_style = ParagraphStyle(
        "placeholder",
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        alignment=TA_CENTER,
        textColor=WHITE,
    )

    story = []

    story.append(get_logo_or_fallback(project_root))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Chris Broccolino", name_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("Player Development Coach | LCB Training", title_style))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.1, color=LIGHT_GREEN, lineCap="round"))
    story.append(Spacer(1, 4))

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
    story.append(Spacer(1, 4))

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
    story.append(Spacer(1, 4))

    philosophy_table = Table(
        [[Paragraph('"Work Hard. Be Memorable."', quote_style)]],
        colWidths=[full_width],
    )
    philosophy_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(philosophy_table)
    story.append(Spacer(1, 4))

    in_person_body = build_in_person_body(
        two_col_widths[0] - section_body_inset,
        in_person_title_style,
        in_person_desc_style,
    )
    online_body = build_online_membership_body(
        two_col_widths[1] - section_body_inset,
        tier_name_style,
        tier_desc_style,
    )
    in_person_cell = build_section_cell(
        "In-Person Training",
        in_person_body,
        two_col_widths[0],
        section_header_style,
    )
    online_cell = build_section_cell(
        "Online Membership",
        online_body,
        two_col_widths[1],
        section_header_style,
    )
    story.append(build_aligned_row(in_person_cell, online_cell, two_col_widths))
    story.append(Spacer(1, 4))

    qr_cell = build_qr_footer_cell(project_root, footer_col_widths[0], qr_caption_style, placeholder_style)
    contact_details = build_modern_contact_block(
        footer_col_widths[1] - 28,
        contact_line_style,
    )
    contact_table = Table(
        [[qr_cell, contact_details]],
        colWidths=footer_col_widths,
    )
    contact_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (0, -1), 12),
                ("RIGHTPADDING", (0, 0), (0, -1), 10),
                ("LEFTPADDING", (1, 0), (1, -1), 8),
                ("RIGHTPADDING", (1, 0), (1, -1), 14),
            ]
        )
    )
    story.append(contact_table)

    doc.build(story)

    qr_path = find_qr_path(project_root)
    if qr_path is None:
        print(
            "Warning: QR code image not found at public/LCB Training In Person QR code.png. "
            "Add the image and rerun to include the QR code."
        )

    try:
        from pypdf import PdfReader

        page_count = len(PdfReader(str(output_path)).pages)
        print(f"Created {output_path} ({page_count} page{'s' if page_count != 1 else ''})")
    except Exception:
        print(f"Created {output_path}")


if __name__ == "__main__":
    main()
