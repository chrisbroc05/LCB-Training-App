#!/usr/bin/env python3

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
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


@dataclass(frozen=True)
class ClientProposal:
    first_name: str
    last_name: str
    players_description: str
    focus_areas: list[str]
    session_format: str
    rate_per_session: int
    schedule_days: str
    schedule_time: str
    session_duration: str
    program_weeks: int
    total_sessions: int
    total_cost: int
    start_note: str


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
        colWidths=[6.8 * inch],
    )
    fallback_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
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
    section_table = Table([[Paragraph(title, header_style)], [body]], colWidths=[width])
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


def build_aligned_row(left_cell: Table, right_cell: Table, col_widths: list[float]) -> Table:
    left_width, right_width = col_widths
    _, left_height = left_cell.wrap(left_width, 10_000)
    _, right_height = right_cell.wrap(right_width, 10_000)
    row_height = max(left_height, right_height)
    extra_padding = max(row_height - min(left_height, right_height), 0)
    shorter_cell = left_cell if left_height < right_height else right_cell
    shorter_cell.setStyle(TableStyle([("BOTTOMPADDING", (0, 1), (0, 1), 10 + extra_padding)]))
    row_table = Table([[left_cell, right_cell]], colWidths=col_widths, rowHeights=[row_height])
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


def format_currency(amount: int) -> str:
    return f"${amount:,}"


def build_proposal_pdf(project_root: Path, proposal: ClientProposal, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    generated_on = date.today().strftime("%B %d, %Y")

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch,
        title=f"LCB Training Proposal - {proposal.first_name} {proposal.last_name}",
        author="LCB Training",
    )

    full_width = 6.8 * inch
    two_col_widths = [3.4 * inch, 3.4 * inch]

    title_style = ParagraphStyle(
        "title",
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=25,
        alignment=TA_CENTER,
        textColor=NAVY,
    )
    tagline_style = ParagraphStyle(
        "tagline",
        fontName="Helvetica-BoldOblique",
        fontSize=13,
        leading=16,
        alignment=TA_CENTER,
        textColor=GREEN,
    )
    meta_style = ParagraphStyle(
        "meta",
        fontName="Helvetica",
        fontSize=10.5,
        leading=13,
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
    item_style = ParagraphStyle(
        "item",
        fontName="Helvetica",
        fontSize=9.5,
        leading=12,
        textColor=NAVY,
    )
    closing_style = ParagraphStyle(
        "closing",
        fontName="Helvetica-Oblique",
        fontSize=10.5,
        leading=14,
        alignment=TA_LEFT,
        textColor=NAVY,
    )
    contact_style = ParagraphStyle(
        "contact",
        fontName="Helvetica",
        fontSize=9.5,
        leading=12,
        textColor=WHITE,
    )

    focus_lines = "<br/>".join(f"<b>{area}</b>" for area in proposal.focus_areas)
    schedule_body = Paragraph(
        f"<b>Days:</b> {proposal.schedule_days}<br/>"
        f"<b>Time:</b> {proposal.schedule_time}<br/>"
        f"<b>Duration:</b> {proposal.session_duration} per session<br/>"
        f"<b>Program length:</b> {proposal.program_weeks} weeks<br/>"
        f"<b>Total sessions:</b> {proposal.total_sessions}<br/>"
        f"<b>Format:</b> {proposal.session_format}<br/>"
        f"<b>Athletes:</b> {proposal.players_description}<br/><br/>"
        f"{proposal.start_note}",
        item_style,
    )
    pricing_body = Paragraph(
        f"<b>Session rate:</b> {format_currency(proposal.rate_per_session)}/hr<br/>"
        f"<b>Sessions:</b> {proposal.total_sessions}<br/>"
        f"<b>Total program cost:</b> {format_currency(proposal.total_cost)}<br/><br/>"
        "All pricing above reflects in-person training only.",
        item_style,
    )
    online_body = Paragraph(
        "Between sessions, the LCB Training online membership at <b>lcbtraining.com</b> is a helpful "
        "in-season and off-season resource to keep development going on their own schedule. The "
        "platform includes a full video drill library (hitting, fielding, mindset), 8 downloadable "
        "workout programs, bonus guides, and optional remote 1 on 1 coaching with personal feedback "
        "from Coach Broc. Online membership is separate from this in-person proposal and "
        "can be added at any time.",
        item_style,
    )
    closing_body = Paragraph(
        f"{proposal.first_name}, I am looking forward to working with your players and helping them grow "
        f"as hitters and athletes. Thank you for trusting LCB Training with their development. If you "
        f"have any questions before we get started, please reach out anytime.<br/><br/>"
        f"- Coach Broc",
        closing_style,
    )

    story = [
        get_logo_or_fallback(project_root),
        Spacer(1, 5),
        Paragraph("Training Proposal", title_style),
        Spacer(1, 3),
        Paragraph('"Work Hard. Be Memorable."', tagline_style),
        Spacer(1, 5),
        HRFlowable(width="100%", thickness=1.1, color=LIGHT_GREEN, lineCap="round"),
        Spacer(1, 4),
        Paragraph(
            f"<b>Prepared for:</b> {proposal.first_name} {proposal.last_name}<br/>"
            f"<b>Date:</b> {generated_on}",
            meta_style,
        ),
        Spacer(1, 5),
        build_section_cell("Session Schedule", schedule_body, full_width, section_header_style),
        Spacer(1, 4),
        build_aligned_row(
            build_section_cell(
                "Focus Areas",
                Paragraph(focus_lines, item_style),
                two_col_widths[0],
                section_header_style,
            ),
            build_section_cell(
                "Pricing",
                pricing_body,
                two_col_widths[1],
                section_header_style,
            ),
            two_col_widths,
        ),
        Spacer(1, 4),
        build_section_cell(
            "Online Training (Optional)",
            online_body,
            full_width,
            section_header_style,
        ),
        Spacer(1, 4),
        build_section_cell("A Note From Coach Broc", closing_body, full_width, section_header_style),
        Spacer(1, 4),
    ]

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


def main() -> None:
    project_root = Path(__file__).resolve().parent
    proposal = ClientProposal(
        first_name="Brian",
        last_name="Paruch",
        players_description="Alex (13U) and Kyle (15U)",
        focus_areas=["Hitting", "Speed & Agility", "Strength"],
        session_format="2:1 (two players, one coach)",
        rate_per_session=75,
        schedule_days="Mondays and Wednesdays",
        schedule_time="4:00 - 5:00 PM",
        session_duration="1 hour",
        program_weeks=4,
        total_sessions=8,
        total_cost=600,
        start_note="First session tentatively scheduled for Wednesday, August 19.",
    )
    output_path = project_root / "public" / "proposals" / f"LCB_Proposal_{proposal.last_name}.pdf"
    build_proposal_pdf(project_root, proposal, output_path)

    try:
        from pypdf import PdfReader

        page_count = len(PdfReader(str(output_path)).pages)
        print(f"Created {output_path} ({page_count} page{'s' if page_count != 1 else ''})")
    except Exception:
        print(f"Created {output_path}")


if __name__ == "__main__":
    main()
