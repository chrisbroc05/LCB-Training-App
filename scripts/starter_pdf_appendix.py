"""Shared ReportLab appendix pages for 4-week starter PDFs."""

from __future__ import annotations

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

NAVY = colors.HexColor("#0A1628")
GREEN = colors.HexColor("#2D6A4F")


def build_starter_appendix_pdf(
    program_label: str,
    *,
    weeks_waiting_title: str = "Weeks 5-12 are waiting",
    weeks_waiting_body: str = (
        "Keep building in the LCB app: your daily plan, video feedback from me, and the full program."
    ),
) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )
    title_style = ParagraphStyle(
        "title",
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=NAVY,
        spaceAfter=12,
    )
    body_style = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=NAVY,
        spaceAfter=10,
    )
    accent_style = ParagraphStyle(
        "accent",
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=GREEN,
        spaceAfter=10,
    )
    story = [
        Paragraph(f"{program_label} - Week 4 Check-In", title_style),
        Paragraph(
            "Test yourself: complete this week with honest reps, full effort, and clean form. "
            "Note one win and one fix for next week.",
            body_style,
        ),
        Spacer(1, 0.2 * inch),
        Paragraph(weeks_waiting_title, accent_style),
        Paragraph(weeks_waiting_body, body_style),
        Paragraph(
            'Visit <font color="#2D6A4F">https://www.lcbtraining.com/program</font> to join the 12-Week Program.',
            body_style,
        ),
        Spacer(1, 0.15 * inch),
        Paragraph("Use code <b>STARTER25</b> for $25 off the 12-Week Program.", accent_style),
    ]
    doc.build(story)
    return buffer.getvalue()
