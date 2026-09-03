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
class PricingTier:
    label: str
    rate_per_hour: int
    total_cost: int


@dataclass(frozen=True)
class ClientProposal:
    first_name: str
    last_name: str
    proposal_date: str
    focus_areas: list[str]
    session_duration: str
    total_sessions: int
    session_dates: list[str]
    schedule_note: str
    pricing_tiers: list[PricingTier]
    pricing_note: str
    online_note: str
    closing_note: str


def format_currency(amount: int) -> str:
    return f"${amount:,}"


def build_schedule_body(
    session_dates: list[str],
    schedule_note: str,
    item_style: ParagraphStyle,
    note_style: ParagraphStyle,
) -> Table:
    midpoint = (len(session_dates) + 1) // 2
    left_dates = session_dates[:midpoint]
    right_dates = session_dates[midpoint:]

    def date_list(dates: list[str]) -> Paragraph:
        lines = "<br/>".join(date_line for date_line in dates)
        return Paragraph(lines, item_style)

    if right_dates:
        schedule_table = Table(
            [[date_list(left_dates), date_list(right_dates)]],
            colWidths=[3.2 * inch, 3.2 * inch],
        )
    else:
        schedule_table = Table([[date_list(left_dates)]], colWidths=[6.4 * inch])

    schedule_table.setStyle(
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

    note = Paragraph(f"<br/>{schedule_note}", note_style)
    outer = Table([[schedule_table], [note]], colWidths=[6.4 * inch])
    outer.setStyle(
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
    return outer


def build_pricing_body(
    tiers: list[PricingTier],
    total_sessions: int,
    pricing_note: str,
    item_style: ParagraphStyle,
    note_style: ParagraphStyle,
) -> Table:
    tier_lines = "<br/>".join(
        f"<b>{tier.label}:</b> {format_currency(tier.rate_per_hour)}/hr -- "
        f"{total_sessions} sessions = {format_currency(tier.total_cost)} total"
        for tier in tiers
    )
    pricing_para = Paragraph(tier_lines, item_style)
    note_para = Paragraph(f"<br/>{pricing_note}", note_style)
    outer = Table([[pricing_para], [note_para]], colWidths=[6.4 * inch])
    outer.setStyle(
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
    return outer


def build_proposal_pdf(project_root: Path, proposal: ClientProposal, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.38 * inch,
        bottomMargin=0.38 * inch,
        title=f"LCB Training Proposal - {proposal.first_name} {proposal.last_name}",
        author="LCB Training",
    )

    full_width = 6.8 * inch
    two_col_widths = [3.4 * inch, 3.4 * inch]

    title_style = ParagraphStyle(
        "title",
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
        fontSize=11,
        leading=13,
        textColor=WHITE,
    )
    item_style = ParagraphStyle(
        "item",
        fontName="Helvetica",
        fontSize=9,
        leading=11.5,
        textColor=NAVY,
        leftIndent=2,
    )
    note_style = ParagraphStyle(
        "note",
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=11,
        textColor=NAVY,
    )
    closing_style = ParagraphStyle(
        "closing",
        fontName="Helvetica-Oblique",
        fontSize=9.5,
        leading=12.5,
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
        fontSize=9,
        leading=11,
        alignment=TA_CENTER,
        textColor=WHITE,
    )

    focus_text = ", ".join(proposal.focus_areas)
    schedule_body = build_schedule_body(
        proposal.session_dates,
        proposal.schedule_note,
        item_style,
        note_style,
    )
    pricing_body = build_pricing_body(
        proposal.pricing_tiers,
        proposal.total_sessions,
        proposal.pricing_note,
        item_style,
        note_style,
    )

    story = [
        get_logo_or_fallback(project_root),
        Spacer(1, 3),
        Paragraph("Training Proposal", title_style),
        Spacer(1, 2),
        Paragraph('"Work Hard. Be Memorable."', tagline_style),
        Spacer(1, 4),
        Paragraph(
            f"<b>{proposal.first_name} {proposal.last_name}</b> &nbsp;|&nbsp; {proposal.proposal_date}",
            meta_style,
        ),
        Spacer(1, 4),
        HRFlowable(width="100%", thickness=1.1, color=LIGHT_GREEN, lineCap="round"),
        Spacer(1, 4),
        Paragraph(
            f"<b>Training Focus:</b> {focus_text} &nbsp;|&nbsp; "
            f"<b>Session Length:</b> {proposal.session_duration} &nbsp;|&nbsp; "
            f"<b>Total Sessions:</b> {proposal.total_sessions}",
            meta_style,
        ),
        Spacer(1, 14),
        build_section_cell("Session Schedule", schedule_body, full_width, section_header_style),
        Spacer(1, 4),
        build_section_cell("Pricing", pricing_body, full_width, section_header_style),
        Spacer(1, 4),
    ]

    platform_table = Table(
        [[Paragraph(proposal.online_note, callout_style)]],
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
    story.extend(
        [
            platform_table,
            Spacer(1, 4),
            build_section_cell(
                "A Note From Coach Broc",
                Paragraph(proposal.closing_note, closing_style),
                full_width,
                section_header_style,
            ),
            Spacer(1, 4),
        ]
    )

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
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
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
        first_name="Adam",
        last_name="Jones",
        proposal_date="August 28, 2026",
        focus_areas=["Hitting", "Fielding", "Speed & Agility"],
        session_duration="60 minutes",
        total_sessions=8,
        session_dates=[
            "Monday, August 31 @ 5:00-6:00pm",
            "Saturday, September 5 @ 5:00-6:00pm",
            "Friday, September 11 @ 4:00-5:00pm",
            "Sunday, September 13 @ 9:30-10:30am",
            "Monday, September 21 @ 4:00-5:00pm",
            "Saturday, September 26 @ 11:00am-12:00pm",
            "Monday, September 28 @ 4:00-5:00pm",
            "Friday, October 2 @ 4:00-5:00pm",
        ],
        schedule_note=(
            "Please note this schedule is tentative and subject to change. If any dates or times "
            "don't work, don't hesitate to reach out and we can find something that works for everyone."
        ),
        pricing_tiers=[
            PricingTier("1 Player (1:1)", 60, 480),
            PricingTier("2 Players (2:1)", 75, 600),
            PricingTier("3+ Players (3:1)", 100, 800),
        ],
        pricing_note="Pricing is per session and based on the number of players attending.",
        online_note=(
            "Between sessions, your players can keep developing with <b>The Next Level Playbook</b> and the full "
            "LCB Training online platform -- video drills, workout programs, and coaching tools built to "
            "support their progress.<br/><br/>Visit <b>lcbtraining.com</b> to learn more."
        ),
        closing_note=(
            "Adam, please reach out with any questions and let me know which option works best for "
            "your group. I am looking forward to working with you and helping your players grow. "
            "Thank you for trusting LCB Training.<br/><br/>- Coach Broc"
        ),
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
