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


def _bullets_plain(items: list[str]) -> str:
    return "<br/>".join(f"&bull; {esc_html(item)}" for item in items)


def _build_offerings_section_cell(
    offerings: list[dict],
    width: float,
    header_style: ParagraphStyle,
    item_gap: float,
) -> Table:
    title_style = ParagraphStyle(
        "offering_title",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=NAVY,
        spaceAfter=2,
    )
    body_style = ParagraphStyle(
        "offering_body",
        fontName="Helvetica",
        fontSize=9.5,
        leading=12.5,
        textColor=NAVY,
    )
    inset = 20
    inner_width = width - inset
    rows: list[list] = []
    for idx, item in enumerate(offerings, start=1):
        title = esc_html(item["title"])
        desc = esc_html(item.get("description") or item.get("summary", "")).strip()
        rows.append([Paragraph(f"{idx}. {title}", title_style)])
        if desc:
            rows.append([Paragraph(desc, body_style)])
        rows.append([Spacer(1, item_gap)])

    if rows:
        rows.pop()

    inner = Table(rows, colWidths=[inner_width])
    inner.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return build_section_cell("What I Offer Teams and Programs", inner, width, header_style)


def _training_focus_html(items: list[str]) -> str:
    chips = " &nbsp;&nbsp;|&nbsp;&nbsp; ".join(f"<b>{esc_html(item)}</b>" for item in items)
    return chips


def _stack_section_cells(cells: list[Table], width: float) -> Table:
    stack = Table([[cell] for cell in cells], colWidths=[width])
    stack.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 1), (-1, -1), 5),
            ]
        )
    )
    return stack


def _philosophy_offerings_row(
    philosophy_cell: Table,
    experience_cell: Table,
    accolades_cell: Table,
    offerings: list[dict],
    section_header_style: ParagraphStyle,
    left_width: float,
    right_width: float,
) -> Table:
    base_gap = 6
    offerings_cell = _build_offerings_section_cell(
        offerings, right_width, section_header_style, base_gap
    )
    left_stack = _stack_section_cells([philosophy_cell, experience_cell, accolades_cell], left_width)
    _, left_height = left_stack.wrap(left_width, 10_000)
    _, right_height = offerings_cell.wrap(right_width, 10_000)
    target_height = max(left_height, right_height)
    if right_height < target_height:
        extra = target_height - right_height
        extra_gap = base_gap + (extra / max(len(offerings), 1))
        offerings_cell = _build_offerings_section_cell(
            offerings, right_width, section_header_style, extra_gap
        )
        _, right_height = offerings_cell.wrap(right_width, 10_000)
        if right_height < target_height:
            stretch_section_cell_to_height(offerings_cell, right_width, target_height)
    elif left_height < target_height:
        _, accolades_height = accolades_cell.wrap(left_width, 10_000)
        stretch_section_cell_to_height(
            accolades_cell, left_width, accolades_height + (target_height - left_height)
        )
        left_stack = _stack_section_cells(
            [philosophy_cell, experience_cell, accolades_cell], left_width
        )
    row = Table([[left_stack, offerings_cell]], colWidths=[left_width, right_width])
    row.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, 0), 6),
            ]
        )
    )
    return row


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
        topMargin=0.28 * inch,
        bottomMargin=0.28 * inch,
        title="LCB Coach Bio - Chris Broccolino",
        author="LCB Training",
    )

    full_width = 7.0 * inch
    left_col_width = 2.95 * inch
    right_col_width = 4.05 * inch
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
    section_header_style = ParagraphStyle(
        "section-header",
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=12,
        textColor=WHITE,
    )
    body_style = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=9,
        leading=11.5,
        textColor=NAVY,
    )
    section_item_style = ParagraphStyle(
        "section-item",
        fontName="Helvetica",
        fontSize=8,
        leading=9.8,
        textColor=NAVY,
    )
    contact_style = ParagraphStyle(
        "contact",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
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
                ("TOPPADDING", (0, 0), (0, 0), 9),
                ("BOTTOMPADDING", (0, -1), (0, -1), 10),
                ("TOPPADDING", (0, 1), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 1), (-1, -2), 3),
            ]
        )
    )
    story.append(hero_table)
    story.append(Spacer(1, 5))

    about_text = "<br/><br/>".join(esc_html(p) for p in bio["aboutParagraphs"])
    story.append(
        build_section_cell(
            "About",
            Paragraph(about_text, body_style),
            full_width,
            section_header_style,
        )
    )
    story.append(Spacer(1, 6))

    training_focus = bio.get("trainingFocus") or []
    if training_focus:
        focus_title = ParagraphStyle(
            "focus_title",
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=GREEN,
        )
        focus_table = Table(
            [
                [Paragraph("WHAT I TRAIN", focus_title)],
                [Paragraph(_training_focus_html(training_focus), section_item_style)],
            ],
            colWidths=[full_width],
        )
        focus_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E8F5EE")),
                    ("BOX", (0, 0), (-1, -1), 1, LIGHT_GREEN),
                    ("TOPPADDING", (0, 0), (0, 0), 6),
                    ("BOTTOMPADDING", (0, -1), (0, -1), 7),
                    ("TOPPADDING", (0, 1), (0, 1), 2),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        )
        story.append(focus_table)
        story.append(Spacer(1, 5))

    philosophy_cell = build_section_cell(
        "My Philosophy",
        Paragraph(esc_html(bio["philosophy"]), body_style),
        left_col_width,
        section_header_style,
    )
    experience_cell = build_section_cell(
        "Experience",
        Paragraph(_bullets_plain(bio["experience"]), section_item_style),
        left_col_width,
        section_header_style,
    )
    accolades_cell = build_section_cell(
        "Accolades",
        Paragraph(_bullets_plain(bio["accolades"]), section_item_style),
        left_col_width,
        section_header_style,
    )
    offerings = bio["offerings"]
    story.append(
        _philosophy_offerings_row(
            philosophy_cell,
            experience_cell,
            accolades_cell,
            offerings,
            section_header_style,
            left_col_width,
            right_col_width,
        )
    )
    story.append(Spacer(1, 5))

    contact = bio["contact"]
    contact_line = Paragraph(
        f"<b>Book a call with Coach Broc</b><br/>{esc_html(contact['calendlyUrl'])}<br/>"
        f"Email: {esc_html(contact['email'])} | Website: {esc_html(contact['website'])} | "
        f"Instagram: {esc_html(contact['instagramHandle'])}",
        contact_style,
    )
    contact_table = Table([[contact_line]], colWidths=[full_width])
    contact_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 11),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
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
