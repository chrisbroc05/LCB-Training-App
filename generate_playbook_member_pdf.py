#!/usr/bin/env python3

from __future__ import annotations

import json
import sys
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


def escape_text(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def build_styles():
    return {
        "title": ParagraphStyle(
            "title",
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            textColor=WHITE,
            alignment=TA_CENTER,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            fontName="Helvetica",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#D1D5DB"),
            alignment=TA_CENTER,
        ),
        "chapter_title": ParagraphStyle(
            "chapter_title",
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=LIGHT_GREEN,
            spaceBefore=12,
            spaceAfter=8,
        ),
        "section_title": ParagraphStyle(
            "section_title",
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=LIGHT_GREEN,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#F3F4F6"),
            spaceAfter=8,
        ),
        "quote": ParagraphStyle(
            "quote",
            fontName="Helvetica-Oblique",
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#E5E7EB"),
            leftIndent=12,
            spaceBefore=6,
            spaceAfter=8,
        ),
        "question": ParagraphStyle(
            "question",
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=14,
            textColor=LIGHT_GREEN,
            spaceBefore=8,
            spaceAfter=4,
        ),
        "answer": ParagraphStyle(
            "answer",
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#E5E7EB"),
            spaceAfter=10,
        ),
    }


def add_cover(story, styles, member_name: str, logo_path: Path | None):
    if logo_path is not None:
        try:
            logo = Image(str(logo_path), width=2.2 * inch, height=0.9 * inch)
            logo.hAlign = "CENTER"
            story.append(logo)
            story.append(Spacer(1, 0.35 * inch))
        except Exception:
            pass

    story.append(Paragraph("The LCB Training Playbook", styles["title"]))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph(escape_text(member_name), styles["subtitle"]))
    story.append(Spacer(1, 0.25 * inch))
    story.append(
        Paragraph(
            "Written by Coach Broc from his own experience as a player and coach.",
            styles["subtitle"],
        )
    )
    story.append(Spacer(1, 0.5 * inch))


def add_chapter(story, styles, chapter: dict):
    story.append(Paragraph(f"Chapter {chapter['number']}: {escape_text(chapter['title'])}", styles["chapter_title"]))
    story.append(Paragraph(escape_text(chapter["subtitle"]), styles["body"]))

    for section in chapter.get("sections", []):
        story.append(Paragraph(escape_text(section["title"]), styles["section_title"]))
        for paragraph in section.get("paragraphs", []):
            story.append(Paragraph(escape_text(paragraph), styles["body"]))
        if section.get("pullQuote"):
            story.append(Paragraph(f'"{escape_text(section["pullQuote"])}"', styles["quote"]))
        if section.get("calloutTitle") and section.get("calloutText"):
            story.append(
                Paragraph(
                    f"<b>{escape_text(section['calloutTitle'])}</b><br/>{escape_text(section['calloutText'])}",
                    styles["body"],
                )
            )
        bullet_list = section.get("bulletList") or []
        for item in bullet_list:
            story.append(Paragraph(f"- {escape_text(item)}", styles["body"]))

    reflections = chapter.get("reflections") or []
    if reflections:
        story.append(Spacer(1, 0.15 * inch))
        story.append(Paragraph("Your Reflections", styles["section_title"]))
        for reflection in reflections:
            story.append(Paragraph(escape_text(reflection["questionText"]), styles["question"]))
            answer = reflection.get("answer") or "No answer provided."
            story.append(Paragraph(escape_text(answer), styles["answer"]))

    story.append(Spacer(1, 0.2 * inch))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GREEN, spaceBefore=6, spaceAfter=12))


def add_closing(story, styles):
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("Now go do the work.", styles["chapter_title"]))
    story.append(
        Paragraph(
            '"Consistency and discipline will take you further than talent ever will." -- Coach Broc',
            styles["quote"],
        )
    )
    story.append(Spacer(1, 0.2 * inch))
    story.append(
        Paragraph(
            "Stay consistent. Stay disciplined. Keep showing up.",
            styles["body"],
        )
    )


def draw_page_background(canvas, _doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
    canvas.restoreState()


def generate_pdf(payload: dict, output_path: Path):
    project_root = Path(__file__).resolve().parent
    logo_path = find_logo_path(project_root)
    styles = build_styles()

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    story = []
    add_cover(story, styles, payload.get("memberName") or "Member", logo_path)

    for chapter in payload.get("chapters", []):
        story.append(Spacer(1, 0.2 * inch))
        add_chapter(story, styles, chapter)

    add_closing(story, styles)
    doc.build(story, onFirstPage=draw_page_background, onLaterPages=draw_page_background)


def main():
    if len(sys.argv) > 1:
        input_path = Path(sys.argv[1])
        payload = json.loads(input_path.read_text(encoding="utf-8"))
    else:
        payload = json.load(sys.stdin)
    output_path = Path(payload["outputPath"])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    generate_pdf(payload, output_path)
    print(str(output_path))


if __name__ == "__main__":
    main()
