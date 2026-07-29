#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


NAVY = colors.HexColor("#0A1628")
LIGHT_NAVY = colors.HexColor("#122238")
GREEN = colors.HexColor("#2D6A4F")
LIGHT_GREEN = colors.HexColor("#52B788")
WHITE = colors.white

PAGE_SIZE = (8 * inch, 8 * inch)
MARGIN = 0.25 * inch
CONTENT_WIDTH = 7.5 * inch


def paint_navy_background(canvas, _doc) -> None:
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_SIZE[0], PAGE_SIZE[1], fill=1, stroke=0)
    canvas.restoreState()


def build_table(
    rows: list[list],
    col_widths: list[float],
    style_commands: list[tuple],
) -> Table:
    table = Table(rows, colWidths=col_widths)
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                *style_commands,
            ]
        )
    )
    return table


def build_pill(text: str, pill_style: ParagraphStyle, width: float) -> Table:
    return build_table(
        [[Paragraph(text, pill_style)]],
        [width],
        [
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREEN),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ],
    )


def build_training_box(
    title: str,
    description: str,
    width: float,
    header_style: ParagraphStyle,
    body_style: ParagraphStyle,
) -> Table:
    return build_table(
        [
            [Paragraph(title, header_style)],
            [Paragraph(description, body_style)],
        ],
        [width],
        [
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BOX", (0, 0), (-1, -1), 1.2, LIGHT_GREEN),
            ("TOPPADDING", (0, 0), (0, 0), 8),
            ("BOTTOMPADDING", (0, 0), (0, 0), 4),
            ("TOPPADDING", (0, 1), (0, 1), 0),
            ("BOTTOMPADDING", (0, 1), (0, 1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ],
    )


def build_cta_column(
    title: str,
    subtitle: str,
    url: str,
    width: float,
    title_style: ParagraphStyle,
    subtitle_style: ParagraphStyle,
    url_style: ParagraphStyle,
) -> Table:
    return build_table(
        [
            [Paragraph(title, title_style)],
            [Paragraph(subtitle, subtitle_style)],
            [Paragraph(url, url_style)],
        ],
        [width],
        [
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (0, 0), 0),
            ("BOTTOMPADDING", (0, 2), (0, 2), 0),
            ("TOPPADDING", (0, 1), (0, 1), 4),
            ("BOTTOMPADDING", (0, 1), (0, 1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ],
    )


def main() -> None:
    project_root = Path(__file__).resolve().parent
    output_path = project_root / "public" / "LCB_Social_Graphic.pdf"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=PAGE_SIZE,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title="LCB Social Graphic",
        author="LCB Training",
    )

    brand_style = ParagraphStyle(
        "brand",
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=30,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    tagline_style = ParagraphStyle(
        "tagline",
        fontName="Helvetica-BoldOblique",
        fontSize=13,
        leading=15,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    coach_name_style = ParagraphStyle(
        "coach-name",
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=24,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    coach_title_style = ParagraphStyle(
        "coach-title",
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=16,
        alignment=TA_CENTER,
        textColor=LIGHT_GREEN,
    )
    pill_style = ParagraphStyle(
        "pill",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=10,
        alignment=TA_CENTER,
        textColor=NAVY,
    )
    mission_style = ParagraphStyle(
        "mission",
        fontName="Helvetica-BoldOblique",
        fontSize=14,
        leading=18,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    section_label_style = ParagraphStyle(
        "section-label",
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=18,
        alignment=TA_CENTER,
        textColor=LIGHT_GREEN,
    )
    grid_header_style = ParagraphStyle(
        "grid-header",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=13,
        alignment=TA_CENTER,
        textColor=LIGHT_GREEN,
    )
    grid_body_style = ParagraphStyle(
        "grid-body",
        fontName="Helvetica",
        fontSize=9.5,
        leading=12,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    cta_title_style = ParagraphStyle(
        "cta-title",
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=16,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    cta_subtitle_style = ParagraphStyle(
        "cta-subtitle",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        alignment=TA_CENTER,
        textColor=LIGHT_GREEN,
    )
    cta_url_style = ParagraphStyle(
        "cta-url",
        fontName="Helvetica",
        fontSize=10,
        leading=12,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    bottom_main_style = ParagraphStyle(
        "bottom-main",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=13,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    bottom_sub_style = ParagraphStyle(
        "bottom-sub",
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        alignment=TA_CENTER,
        textColor=WHITE,
    )

    empty_style = ParagraphStyle(
        "empty",
        fontName="Helvetica",
        fontSize=1,
        leading=1,
        textColor=NAVY,
    )
    empty_cell = Paragraph(" ", empty_style)

    story: list = []

    top_bar = build_table(
        [
            [Paragraph("LCB TRAINING", brand_style)],
            [Paragraph('"Work Hard. Be Memorable."', tagline_style)],
        ],
        [CONTENT_WIDTH],
        [
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BACKGROUND", (0, 0), (-1, -1), GREEN),
            ("TOPPADDING", (0, 0), (0, 0), 10),
            ("BOTTOMPADDING", (0, 1), (0, 1), 10),
            ("TOPPADDING", (0, 1), (0, 1), 2),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ],
    )
    story.append(top_bar)
    story.append(Spacer(1, 10))

    coach_intro = build_table(
        [
            [Paragraph("Coach Chris Broccolino", coach_name_style)],
            [Paragraph("Player Development Coach", coach_title_style)],
        ],
        [CONTENT_WIDTH],
        [
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ],
    )
    story.append(coach_intro)
    story.append(Spacer(1, 8))

    pill_gap = 0.1 * inch
    pill_width = (CONTENT_WIDTH - (2 * pill_gap)) / 3
    pill_col_widths = [pill_width, pill_gap, pill_width, pill_gap, pill_width]
    pill_rows = [
        [
            "NJCAA National Champion",
            "Gold Glove Award",
            "2x All-Conference Athlete",
        ],
        [
            "Academic All-American",
            "12+ Years Player Development",
            "Current HS Varsity Coach",
        ],
    ]
    pill_table_rows = []
    for row_labels in pill_rows:
        pill_table_rows.append(
            [
                build_pill(row_labels[0], pill_style, pill_width),
                empty_cell,
                build_pill(row_labels[1], pill_style, pill_width),
                empty_cell,
                build_pill(row_labels[2], pill_style, pill_width),
            ]
        )

    pills = build_table(
        pill_table_rows,
        pill_col_widths,
        [
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("BACKGROUND", (1, 0), (1, -1), NAVY),
            ("BACKGROUND", (3, 0), (3, -1), NAVY),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ],
    )
    story.append(pills)
    story.append(Spacer(1, 8))

    mission_box = build_table(
        [[Paragraph(
            "Helping players build confidence on and off the field, develop their skills and<br/>"
            "be able to play this game for as long as they want",
            mission_style,
        )]],
        [CONTENT_WIDTH],
        [
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_NAVY),
            ("BOX", (0, 0), (-1, -1), 1, LIGHT_GREEN),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ],
    )
    story.append(mission_box)
    story.append(Spacer(1, 8))

    story.append(Paragraph("WHAT I TRAIN", section_label_style))
    story.append(Spacer(1, 6))

    grid_gap = 0.2 * inch
    grid_col_width = (CONTENT_WIDTH - grid_gap) / 2
    grid_col_widths = [grid_col_width, grid_gap, grid_col_width]
    training_grid = build_table(
        [
            [
                build_training_box(
                    "Hitting",
                    "Swing mechanics, plate approach, and timing",
                    grid_col_width,
                    grid_header_style,
                    grid_body_style,
                ),
                empty_cell,
                build_training_box(
                    "Fielding",
                    "Fundamentals, footwork, and game instincts",
                    grid_col_width,
                    grid_header_style,
                    grid_body_style,
                ),
            ],
            [
                build_training_box(
                    "Speed and Agility",
                    "First step quickness and athletic movement",
                    grid_col_width,
                    grid_header_style,
                    grid_body_style,
                ),
                empty_cell,
                build_training_box(
                    "Strength and Mobility",
                    "Power, durability, and injury prevention",
                    grid_col_width,
                    grid_header_style,
                    grid_body_style,
                ),
            ],
        ],
        grid_col_widths,
        [
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (1, 0), (1, -1), NAVY),
            ("TOPPADDING", (0, 0), (-1, 0), 0),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
            ("TOPPADDING", (0, 1), (-1, 1), 0),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 0),
        ],
    )
    story.append(training_grid)
    story.append(Spacer(1, 8))

    cta_gap = 0.2 * inch
    cta_col_width = (CONTENT_WIDTH - cta_gap) / 2
    cta_col_widths = [cta_col_width, cta_gap, cta_col_width]
    cta_section = build_table(
        [
            [
                build_cta_column(
                    "Train In-Person",
                    "Northwest suburban Chicago",
                    "lcbtraining.com/details",
                    cta_col_width,
                    cta_title_style,
                    cta_subtitle_style,
                    cta_url_style,
                ),
                empty_cell,
                build_cta_column(
                    "Train Remotely",
                    "Anywhere. Anytime.",
                    "lcbtraining.com",
                    cta_col_width,
                    cta_title_style,
                    cta_subtitle_style,
                    cta_url_style,
                ),
            ],
        ],
        cta_col_widths,
        [
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBEFORE", (2, 0), (2, 0), 1.2, LIGHT_GREEN),
            ("BACKGROUND", (1, 0), (1, 0), NAVY),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("BOX", (0, 0), (-1, -1), 1, LIGHT_GREEN),
        ],
    )
    story.append(cta_section)
    story.append(Spacer(1, 8))

    bottom_bar = build_table(
        [
            [Paragraph("@lcbtraining&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;lcbtraining.com", bottom_main_style)],
            [Paragraph("Links in bio for more information", bottom_sub_style)],
            [Paragraph("DM to get started", bottom_sub_style)],
        ],
        [CONTENT_WIDTH],
        [
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BACKGROUND", (0, 0), (-1, -1), GREEN),
            ("TOPPADDING", (0, 0), (0, 0), 8),
            ("BOTTOMPADDING", (0, 2), (0, 2), 8),
            ("TOPPADDING", (0, 1), (0, 1), 3),
            ("BOTTOMPADDING", (0, 1), (0, 1), 0),
            ("TOPPADDING", (0, 2), (0, 2), 3),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ],
    )
    story.append(bottom_bar)

    doc.build(story, onFirstPage=paint_navy_background, onLaterPages=paint_navy_background)

    try:
        from pypdf import PdfReader

        page_count = len(PdfReader(str(output_path)).pages)
        print(f"Created {output_path} ({page_count} page{'s' if page_count != 1 else ''})")
    except Exception:
        print(f"Created {output_path}")


if __name__ == "__main__":
    main()
