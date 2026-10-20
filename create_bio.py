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


def _bullets_html(items: list[str]) -> str:
    return "<br/>".join(f"<b>{esc_html(item)}</b>" for item in items)


def _offerings_html(offerings: list[dict]) -> str:
    parts: list[str] = []
    for item in offerings:
        title = esc_html(item["title"])
        summary = esc_html(item.get("summary") or item.get("description", "")).strip()
        if summary:
            parts.append(f"<font color='#2D6A4F'><b>{title}</b></font> - {summary}")
        else:
            parts.append(f"<font color='#2D6A4F'><b>{title}</b></font>")
    return "<br/>".join(parts)


def _modern_section_label(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(esc_html(text).upper(), style)


def _modern_panel(body: Paragraph, width: float) -> Table:
    panel = Table([[body]], colWidths=[width])
    panel.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                ("LINEBEFORE", (0, 0), (0, -1), 3, LIGHT_GREEN),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return panel


def main() -> None:
    project_root = Path(__file__).resolve().parent
    bio = load_coach_bio_json(project_root)
    output_path = project_root / "public" / "LCB_Coach_Bio.pdf"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.32 * inch,
        bottomMargin=0.32 * inch,
        title="LCB Coach Bio - Chris Broccolino",
        author="LCB Training",
    )

    full_width = 7.0 * inch
    two_col_widths = [3.5 * inch, 3.5 * inch]
    slogan = bio["slogan"]

    hero_name_style = ParagraphStyle(
        "hero_name",
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=21,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    hero_sub_style = ParagraphStyle(
        "hero_sub",
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        alignment=TA_CENTER,
        textColor=LIGHT_GREEN,
    )
    hero_meta_style = ParagraphStyle(
        "hero_meta",
        fontName="Helvetica",
        fontSize=8.5,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#E5E7EB"),
    )
    label_style = ParagraphStyle(
        "label",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=GREEN,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=9,
        leading=11.5,
        textColor=NAVY,
    )
    list_style = ParagraphStyle(
        "list",
        fontName="Helvetica",
        fontSize=8.5,
        leading=10.5,
        textColor=NAVY,
        leftIndent=0,
    )
    offerings_style = ParagraphStyle(
        "offerings",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=NAVY,
    )
    contact_style = ParagraphStyle(
        "contact",
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=WHITE,
        alignment=TA_CENTER,
    )

    story = []

    logo = get_logo_or_fallback(project_root, target_w=1.55 * inch, target_h=0.64 * inch)
    hero_rows = [
        [logo],
        [Paragraph(bio["displayName"], hero_name_style)],
        [Paragraph(bio["titleLine"], hero_sub_style)],
        [Paragraph(f'"{esc_html(slogan)}"', hero_sub_style)],
    ]
    location = (bio.get("location") or "").strip()
    if location:
        hero_rows.insert(3, [Paragraph(location, hero_meta_style)])
    hero_table = Table(hero_rows, colWidths=[full_width])
    hero_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (0, 0), 10),
                ("BOTTOMPADDING", (0, -1), (0, -1), 12),
                ("TOPPADDING", (0, 1), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 1), (-1, -2), 2),
            ]
        )
    )
    story.append(hero_table)
    story.append(Spacer(1, 10))

    about_summary = esc_html(bio.get("aboutSummary") or " ".join(bio["aboutParagraphs"]))
    story.append(_modern_section_label("About", label_style))
    story.append(_modern_panel(Paragraph(about_summary, body_style), full_width))
    story.append(Spacer(1, 8))

    philosophy_summary = esc_html(bio.get("philosophySummary") or bio["philosophy"])
    story.append(_modern_section_label("My Philosophy", label_style))
    story.append(_modern_panel(Paragraph(philosophy_summary, body_style), full_width))
    story.append(Spacer(1, 8))

    exp_label = _modern_section_label("Experience", label_style)
    acc_label = _modern_section_label("Accolades", label_style)
    exp_body = Paragraph(
        "<br/>".join(f"&bull; {esc_html(item)}" for item in bio["experience"]),
        list_style,
    )
    acc_body = Paragraph(
        "<br/>".join(f"&bull; {esc_html(item)}" for item in bio["accolades"]),
        list_style,
    )
    exp_col = Table([[exp_label], [exp_body]], colWidths=[two_col_widths[0]])
    acc_col = Table([[acc_label], [acc_body]], colWidths=[two_col_widths[1]])
    cred_row = Table([[exp_col, acc_col]], colWidths=two_col_widths)
    cred_row.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(cred_row)
    story.append(Spacer(1, 8))

    story.append(_modern_section_label("What I Offer Teams and Programs", label_style))
    story.append(
        _modern_panel(Paragraph(_offerings_html(bio["offerings"]), offerings_style), full_width)
    )
    story.append(Spacer(1, 10))

    contact = bio["contact"]
    contact_line = Paragraph(
        f"Book a call: {esc_html(contact['calendlyUrl'])}<br/>"
        f"Email: {esc_html(contact['email'])} | "
        f"Website: {esc_html(contact['website'])} | "
        f"Instagram: {esc_html(contact['instagramHandle'])}",
        contact_style,
    )
    contact_table = Table([[contact_line]], colWidths=[full_width])
    contact_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
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
