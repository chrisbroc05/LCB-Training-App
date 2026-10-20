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


def esc_html(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def load_coach_bio_json(project_root: Path) -> dict:
    import json

    json_path = project_root / "content" / "coach-bio.json"
    with json_path.open(encoding="utf-8") as handle:
        return json.load(handle)


def get_coach_photo_flowable(project_root: Path, target_h: float = 1.15 * inch):
    """Optional headshot from public/images/coach-broc.jpg (skipped if missing)."""
    photo_path = project_root / "public" / "images" / "coach-broc.jpg"
    if not photo_path.exists():
        return None
    try:
        image = ImageReader(str(photo_path))
        src_w, src_h = image.getSize()
        ratio = target_h / float(src_h)
        flowable = Image(str(photo_path), width=src_w * ratio, height=target_h)
        flowable.hAlign = "CENTER"
        return flowable
    except Exception:
        return None


def _bullets_html(items: list[str]) -> str:
    return "<br/>".join(f"<b>{esc_html(item)}</b>" for item in items)


def _offerings_html(offerings: list[dict], start_index: int = 1) -> str:
    parts: list[str] = []
    for idx, item in enumerate(offerings, start=start_index):
        title = esc_html(item["title"])
        desc = esc_html(item["description"])
        parts.append(f"<b>{idx}. {title}</b><br/>{desc}")
    return "<br/><br/>".join(parts)


def main() -> None:
    project_root = Path(__file__).resolve().parent
    bio = load_coach_bio_json(project_root)
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

    name_style = ParagraphStyle(
        "name",
        fontName="Helvetica-Bold",
        fontSize=21,
        leading=24,
        alignment=TA_CENTER,
        textColor=NAVY,
    )
    title_style = ParagraphStyle(
        "title",
        fontName="Helvetica",
        fontSize=11,
        leading=13,
        alignment=TA_CENTER,
        textColor=GREEN,
    )
    location_style = ParagraphStyle(
        "location",
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
        fontSize=9.5,
        leading=12,
        textColor=NAVY,
    )
    section_item_style = ParagraphStyle(
        "section-item",
        fontName="Helvetica",
        fontSize=8.5,
        leading=10.5,
        textColor=NAVY,
    )
    quote_style = ParagraphStyle(
        "quote",
        fontName="Helvetica-BoldOblique",
        fontSize=14,
        leading=17,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    contact_style = ParagraphStyle(
        "contact",
        fontName="Helvetica",
        fontSize=9,
        leading=11.5,
        textColor=WHITE,
    )

    story = []

    story.append(get_logo_or_fallback(project_root))
    coach_photo = get_coach_photo_flowable(project_root)
    if coach_photo is not None:
        story.append(Spacer(1, 4))
        story.append(coach_photo)
    story.append(Spacer(1, 6))
    story.append(Paragraph(bio["displayName"], name_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph(bio["titleLine"], title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph(bio["location"], location_style))
    story.append(Spacer(1, 4))
    slogan = bio["slogan"]
    story.append(Paragraph(f'"{slogan}"', title_style))
    story.append(Spacer(1, 5))
    story.append(HRFlowable(width="100%", thickness=1.1, color=LIGHT_GREEN, lineCap="round"))
    story.append(Spacer(1, 5))

    about_text = "<br/><br/>".join(esc_html(para) for para in bio["aboutParagraphs"])
    about_cell = build_section_cell(
        "About",
        Paragraph(about_text, body_style),
        full_width,
        section_header_style,
    )
    story.append(about_cell)
    story.append(Spacer(1, 5))

    experience_para = Paragraph(_bullets_html(bio["experience"]), section_item_style)
    accolades_para = Paragraph(_bullets_html(bio["accolades"]), section_item_style)
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

    philosophy_cell = build_section_cell(
        "My Philosophy",
        Paragraph(esc_html(bio["philosophy"]), body_style),
        full_width,
        section_header_style,
    )
    story.append(philosophy_cell)
    story.append(Spacer(1, 5))

    quote_table = Table(
        [[Paragraph(f'"{slogan}"', quote_style)]],
        colWidths=[full_width],
    )
    quote_table.setStyle(
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
    story.append(quote_table)
    story.append(Spacer(1, 5))

    offerings = bio["offerings"]
    offerings_cell = build_section_cell(
        "What I Offer Teams and Programs",
        Paragraph(_offerings_html(offerings, 1), section_item_style),
        full_width,
        section_header_style,
    )
    story.append(offerings_cell)
    story.append(Spacer(1, 5))

    contact = bio["contact"]
    left_contact = Paragraph(
        f"Book a call:<br/>{contact['calendlyUrl']}<br/>Email: {contact['email']}",
        contact_style,
    )
    right_contact = Paragraph(
        f"Website: {contact['website']}<br/>Instagram: {contact['instagramHandle']}",
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
