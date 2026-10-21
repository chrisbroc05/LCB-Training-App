#!/usr/bin/env python3
"""Build 4-week starter PDFs into private/resources/starters/."""

from __future__ import annotations

import json
import os
import sys
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

ROOT = Path(__file__).resolve().parents[1]
WORKOUTS = ROOT / "private" / "workouts"
STARTERS = ROOT / "private" / "resources" / "starters"
PROGRAMS_JSON = ROOT / "tmp" / "workout-programs.json"

NAVY = colors.HexColor("#0A1628")
GREEN = colors.HexColor("#2D6A4F")
LIGHT_GREEN = colors.HexColor("#52B788")


def build_appendix_pdf(title: str) -> bytes:
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
        Paragraph(f"{title} - Week 4 Check-In", title_style),
        Paragraph(
            "Test yourself: complete this week with honest reps, full effort, and clean form. "
            "Note one win and one fix for next week.",
            body_style,
        ),
        Spacer(1, 0.2 * inch),
        Paragraph("Weeks 5-12 are waiting", accent_style),
        Paragraph(
            "Keep building in the LCB app: your daily plan, video feedback from me, and the full program.",
            body_style,
        ),
        Paragraph(
            'Visit <font color="#2D6A4F">https://www.lcbtraining.com/program</font> to join the 12-Week Program.',
            body_style,
        ),
        Spacer(1, 0.15 * inch),
        Paragraph("Use code <b>STARTER25</b> for $25 off the 12-Week Program.", accent_style),
    ]
    doc.build(story)
    return buffer.getvalue()


def merge_with_appendix(source_pdf: Path, title: str, output_pdf: Path) -> None:
    writer = PdfWriter()
    reader = PdfReader(str(source_pdf))
    for page in reader.pages:
        writer.add_page(page)
    appendix_reader = PdfReader(BytesIO(build_appendix_pdf(title)))
    for page in appendix_reader.pages:
        writer.add_page(page)
    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    with output_pdf.open("wb") as handle:
        writer.write(handle)


def build_strength_speed_starters() -> None:
    mapping = [
        ("LCB_Strength", "Strength"),
        ("LCB_Speed-Agility", "Speed and Agility"),
    ]
    for prefix, title in mapping:
        for age in ("8-11", "12-15", "16-18"):
            phase1 = WORKOUTS / f"{prefix}_{age}_Phase1.pdf"
            if not phase1.exists():
                print(f"Missing {phase1}", file=sys.stderr)
                continue
            out = STARTERS / f"{prefix}_{age}_4Week_Starter.pdf"
            merge_with_appendix(phase1, title, out)
            print(f"Built {out.relative_to(ROOT)}")


def render_mobility_week_pages(program: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch,
    )
    title_style = ParagraphStyle(
        "mt",
        fontName="Helvetica-Bold",
        fontSize=16,
        textColor=NAVY,
        spaceAfter=8,
    )
    week_style = ParagraphStyle(
        "wk",
        fontName="Helvetica-Bold",
        fontSize=13,
        textColor=GREEN,
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "bd",
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        textColor=NAVY,
        spaceAfter=4,
    )
    story = [
        Paragraph("LCB Training - Mobility 4-Week Starter", title_style),
        Paragraph(f"Ages {program['ageGroup']}", body_style),
    ]
    weeks = [week for week in program["weeks"] if week["weekNumber"] <= 4]
    for week in weeks:
        story.append(Paragraph(f"Week {week['weekNumber']}", week_style))
        workout = week["workouts"].get("A")
        if not workout:
            continue
        for section in workout.get("sections", []):
            story.append(Paragraph(section.get("name", "Work"), body_style))
            for exercise in section.get("exercises", []):
                line = (
                    f"{exercise.get('name', '')} - "
                    f"{exercise.get('sets', '')} x {exercise.get('repsOrTime', '')}"
                )
                story.append(Paragraph(line, body_style))
    doc.build(story)
    return buffer.getvalue()


def build_mobility_starters() -> None:
    if not PROGRAMS_JSON.exists():
        print("Run export-workout-programs-json.ts first.", file=sys.stderr)
        return
    programs = json.loads(PROGRAMS_JSON.read_text(encoding="utf8"))
    for program in programs:
        if program.get("category") != "mobility":
            continue
        age = program["ageGroup"]
        body = render_mobility_week_pages(program)
        appendix = build_appendix_pdf("Mobility")
        writer = PdfWriter()
        main_reader = PdfReader(BytesIO(body))
        for page in main_reader.pages:
            writer.add_page(page)
        appendix_reader = PdfReader(BytesIO(appendix))
        for page in appendix_reader.pages:
            writer.add_page(page)
        out = STARTERS / f"LCB_Mobility_{age}_4Week_Starter.pdf"
        out.parent.mkdir(parents=True, exist_ok=True)
        with out.open("wb") as handle:
            writer.write(handle)
        print(f"Built {out.relative_to(ROOT)}")


def build_program_guide_starters() -> None:
    import subprocess

    for script in ("make-back-arm-starter-pdf.py", "make-arm-care-starter-pdf.py"):
        path = ROOT / "scripts" / script
        if not path.exists():
            print(f"Missing {path}", file=sys.stderr)
            continue
        subprocess.run([sys.executable, str(path)], check=True, cwd=str(ROOT))


def main() -> int:
    build_strength_speed_starters()
    build_mobility_starters()
    build_program_guide_starters()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
