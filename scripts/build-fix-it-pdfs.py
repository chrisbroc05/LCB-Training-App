#!/usr/bin/env python3
"""Parse content/fix-it-plans.md, generate lib/fix-it-plans-data.generated.ts, and build PDFs."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import sys
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(SCRIPTS_DIR))

from create_bio import GREEN, LIGHT_GREEN, NAVY, WHITE, get_logo_or_fallback  # noqa: E402
from fix_it_week_text import apply_composed_weeks_to_plans, write_week_verify_json  # noqa: E402

CONTENT_PATH = ROOT / "content" / "fix-it-plans.md"
GENERATED_TS = ROOT / "lib" / "fix-it-plans-data.generated.ts"
OUTPUT_DIR = ROOT / "private" / "resources" / "fix-it"
PREVIEW_DIR = ROOT / "exports" / "fix-it-pdf-previews"
STARTER_PDF = ROOT / "private" / "resources" / "starters" / "LCB_Back_and_Arm_4Week_Starter.pdf"
PLAN_PAGE_BASE = "https://www.lcbtraining.com/fix-it"
COVER_SCHEDULE = "3 weeks | 5 days a week | 20-30 minutes | Tee or flips"

LIGHT_GRAY = colors.HexColor("#F5F5F5")
TEXT_DARK = colors.HexColor("#0A1628")

WEEK_LABELS = {
    1: "Week 1: FEEL IT",
    2: "Week 2: BUILD IT",
    3: "Week 3: COMPETE WITH IT",
}


def _load_back_arm_starter_module():
    path = SCRIPTS_DIR / "make-back-arm-starter-pdf.py"
    spec = importlib.util.spec_from_file_location("lcb_back_arm_starter_pdf", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_BAA = _load_back_arm_starter_module()
esc = _BAA.esc
p = _BAA.p
draw_cover_background = _BAA.draw_cover_background
draw_content_page_frame = _BAA.draw_content_page_frame


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _parse_key_value_block(lines: list[str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in lines:
        if ":" in line:
            key, val = line.split(":", 1)
            out[key.strip()] = val.strip()
    return out


def parse_markdown(text: str) -> dict:
    meta: dict[str, str] = {}
    plans: list[dict] = []
    current_plan: dict | None = None
    section_key: str | None = None
    section_lines: list[str] = []

    def flush_section() -> None:
        nonlocal section_key, section_lines
        if current_plan is None or section_key is None:
            section_lines = []
            section_key = None
            return
        body = "\n".join(section_lines).strip()
        if section_key == "fixed":
            current_plan["fixedLooksLike"] = [
                line[2:].strip() for line in section_lines if line.strip().startswith("- ")
            ]
        elif section_key == "drill":
            block = "\n".join(section_lines).strip()
            drill: dict[str, str | int] = {}
            for line in block.splitlines():
                if ":" in line:
                    key, val = line.split(":", 1)
                    drill[key.strip()] = val.strip()
            if "order" in drill:
                drill["order"] = int(str(drill["order"]))
            current_plan.setdefault("drills", []).append(drill)
        elif section_key == "bonus_video":
            current_plan.setdefault("bonusVideos", []).append(body)
        elif section_key == "intro_video":
            current_plan["introVideoTitle"] = body
        elif section_key == "mindset_week3":
            current_plan["mindsetWeek3Title"] = body
        elif section_key == "problem":
            current_plan["problem"] = body
        elif section_key == "fix":
            current_plan["fix"] = body
        elif section_key == "baseline":
            current_plan["baselineTest"] = body
        elif section_key == "whats_next":
            current_plan["whatsNext"] = body
        elif m := re.fullmatch(r"week([1-3])_(goal|checkpoint|upgrade)", section_key):
            week_num = int(m.group(1))
            field = m.group(2)
            current_plan.setdefault("weekMeta", {}).setdefault(week_num, {})[field] = body
        elif m := re.fullmatch(r"week([1-3])_row", section_key):
            week_num = int(m.group(1))
            row = _parse_key_value_block(section_lines)
            current_plan.setdefault("weekRows", {}).setdefault(week_num, []).append(row)
        section_lines = []
        section_key = None

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if line.startswith("## meta"):
            flush_section()
            current_plan = None
            section_key = None
            continue
        if line.startswith("## plan "):
            flush_section()
            slug = line.replace("## plan ", "").strip()
            current_plan = {
                "slug": slug,
                "drills": [],
                "bonusVideos": [],
                "fixedLooksLike": [],
                "weekMeta": {},
                "weekRows": {},
            }
            plans.append(current_plan)
            section_key = None
            section_lines = []
            continue
        if current_plan is None and line.startswith("## "):
            continue
        if current_plan is None:
            if ":" in line and not line.startswith("#"):
                key, val = line.split(":", 1)
                meta[key.strip()] = val.strip()
            continue
        if line.startswith("### "):
            flush_section()
            section_key = line.replace("### ", "").strip()
            section_lines = []
            continue
        if section_key is not None:
            section_lines.append(line)
            continue
        if ":" in line and not line.startswith("#"):
            key, val = line.split(":", 1)
            k = key.strip()
            v = val.strip()
            if k.startswith("symptom_"):
                current_plan.setdefault("symptoms", []).append(v)
            else:
                current_plan[k] = v

    flush_section()
    return {"meta": meta, "plans": plans}


def json_to_ts(value) -> str:
    return json.dumps(value, indent=2, ensure_ascii=True)


def write_generated_ts(content_hash: str, data: dict) -> None:
    meta = data["meta"]
    plans = []
    for plan in data["plans"]:
        plans.append(
            {
                "slug": plan.get("slug") or plan.get("resource_slug"),
                "resourceSlug": plan.get("resource_slug") or plan.get("slug"),
                "pdfFilename": plan.get("pdf_filename"),
                "title": plan.get("title"),
                "subtitle": plan.get("subtitle"),
                "priceLabel": plan.get("price_label"),
                "buttonLabel": plan.get("button_label"),
                "symptoms": plan.get("symptoms", []),
                "problem": plan.get("problem", ""),
                "fix": plan.get("fix", ""),
                "fixedLooksLike": plan.get("fixedLooksLike", []),
                "introVideoTitle": plan.get("introVideoTitle"),
                "drills": [
                    {
                        "order": d.get("order"),
                        "name": d.get("name", ""),
                        "videoTitle": d.get("video_title") or None,
                        "description": d.get("description", ""),
                    }
                    for d in plan.get("drills", [])
                ],
                "bonusVideos": plan.get("bonusVideos", []),
                "mindsetWeek3Title": plan.get("mindsetWeek3Title"),
                "baselineTest": plan.get("baselineTest", ""),
                "week1": plan.get("week1", ""),
                "week2": plan.get("week2", ""),
                "week3": plan.get("week3", ""),
                "whatsNext": plan.get("whatsNext", ""),
            }
        )

    ts = f"""/* AUTO-GENERATED by scripts/build-fix-it-pdfs.py. Edit content/fix-it-plans.md and run npm run build:fix-it-pdfs */

export const FIX_IT_PLANS_CONTENT_HASH = "{content_hash}";

export type FixItPlanDrillGenerated = {{
  order: number;
  name: string;
  videoTitle: string | null;
  description: string;
}};

export type FixItPlanGenerated = {{
  slug: string;
  resourceSlug: string;
  pdfFilename: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  buttonLabel: string;
  symptoms: string[];
  problem: string;
  fix: string;
  fixedLooksLike: string[];
  introVideoTitle: string | null;
  drills: FixItPlanDrillGenerated[];
  bonusVideos: string[];
  mindsetWeek3Title: string | null;
  baselineTest: string;
  week1: string;
  week2: string;
  week3: string;
  whatsNext: string;
}};

export type FixItPlansMetaGenerated = {{
  salesLabel: string;
  salesTitle: string;
  salesSubtitle: string;
  whyTheseWork: string;
  scheduleNote: string;
  freeSwingCta: string;
  priceDisplay: string;
}};

export const FIX_IT_PLANS_META: FixItPlansMetaGenerated = {json_to_ts({
        "salesLabel": meta.get("sales_label", ""),
        "salesTitle": meta.get("sales_title", ""),
        "salesSubtitle": meta.get("sales_subtitle", ""),
        "whyTheseWork": meta.get("why_these_work", ""),
        "scheduleNote": meta.get("schedule_note", ""),
        "freeSwingCta": meta.get("free_swing_cta", ""),
        "priceDisplay": meta.get("price_display", ""),
    })};

export const FIX_IT_PLANS: FixItPlanGenerated[] = {json_to_ts(plans)};
"""
    GENERATED_TS.write_text(ts, encoding="utf-8")


def styles() -> dict[str, ParagraphStyle]:
    st = _BAA.styles()
    st["section_head"] = ParagraphStyle(
        "section_head",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=WHITE,
    )
    st["cover_tagline"] = ParagraphStyle(
        "cover_tagline",
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#E5E7EB"),
        spaceBefore=4,
        spaceAfter=8,
    )
    st["cover_fixes_label"] = ParagraphStyle(
        "cover_fixes_label",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=LIGHT_GREEN,
        spaceBefore=10,
        spaceAfter=4,
    )
    st["cta_title"] = ParagraphStyle(
        "cta_title",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        alignment=TA_CENTER,
        textColor=WHITE,
    )
    st["cta_url"] = ParagraphStyle(
        "cta_url",
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=LIGHT_GREEN,
    )
    st["drill_name"] = ParagraphStyle(
        "drill_name",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=NAVY,
    )
    st["drill_meta"] = ParagraphStyle(
        "drill_meta",
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=10,
        textColor=GREEN,
    )
    st["callout"] = ParagraphStyle(
        "callout",
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=TEXT_DARK,
    )
    st["callout_label"] = ParagraphStyle(
        "callout_label",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=NAVY,
    )
    st["accent"] = ParagraphStyle(
        "accent",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=GREEN,
        spaceAfter=8,
    )
    st["upgrade"] = ParagraphStyle(
        "upgrade",
        fontName="Helvetica-Oblique",
        fontSize=9,
        leading=12,
        textColor=TEXT_DARK,
    )
    return st


def on_page(canvas, doc) -> None:
    if doc.page == 1:
        draw_cover_background(canvas, doc)
    else:
        draw_content_page_frame(canvas, doc)
        canvas.saveState()
        canvas.setFillColor(GREEN)
        canvas.setFont("Helvetica", 9)
        canvas.drawString(0.55 * inch, 0.42 * inch, "lcbtraining.com")
        canvas.setFillColor(NAVY)
        canvas.drawRightString(letter[0] - 0.55 * inch, 0.42 * inch, f"Page {doc.page}")
        canvas.restoreState()


def section_bar(title: str, st: dict[str, ParagraphStyle], width: float) -> Table:
    table = Table([[p(title, st["section_head"])]], colWidths=[width])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), GREEN),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def body_paragraphs(text: str, st: dict[str, ParagraphStyle]) -> list:
    flow: list = []
    for para in text.split("\n\n"):
        para = para.strip()
        if not para:
            continue
        flow.append(Paragraph(esc(para).replace("\n", "<br/>"), st["body"]))
    return flow


def plan_page_cta(plan_url: str, st: dict[str, ParagraphStyle], width: float) -> Table:
    inner = Table(
        [
            [Paragraph("Watch every drill video on your plan page", st["cta_title"])],
            [
                Paragraph(
                    f'<link href="{esc(plan_url)}" color="#52B788">{esc(plan_url)}</link>',
                    st["cta_url"],
                )
            ],
        ],
        colWidths=[width - 24],
    )
    inner.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    outer = Table([[inner]], colWidths=[width])
    outer.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("BOX", (0, 0), (-1, -1), 1.5, GREEN),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    return outer


def drill_card(
    drill: dict,
    st: dict[str, ParagraphStyle],
    width: float,
) -> Table:
    name = str(drill.get("name", ""))
    desc = str(drill.get("description", ""))
    video_title = drill.get("video_title")
    if video_title:
        meta_line = "Video on your plan page"
    else:
        meta_line = "Written drill"
    rows = [
        [Paragraph(esc(name), st["drill_name"])],
        [Paragraph(esc(desc), st["table_cell"])],
        [Paragraph(esc(meta_line), st["drill_meta"])],
    ]
    inner = Table(rows, colWidths=[width - 16])
    inner.setStyle(
        TableStyle(
            [
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    outer = Table([[inner]], colWidths=[width])
    outer.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WHITE),
                ("BOX", (0, 0), (-1, -1), 0.6, LIGHT_GREEN),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return outer


def baseline_tracker_table(st: dict[str, ParagraphStyle], width: float) -> Table:
    cell = ParagraphStyle(
        "baseline_cell",
        parent=st["table_cell"],
        fontSize=8,
        leading=10,
        alignment=TA_CENTER,
    )
    cell_left = ParagraphStyle("baseline_left", parent=cell, alignment=TA_LEFT)
    header = [
        p("", st["table_head"]),
        p("Day 1", st["table_head"]),
        p("Day 21", st["table_head"]),
    ]
    data = [
        header,
        [
            p("Hard line drives (out of 10)", cell_left),
            p("____", cell),
            p("____", cell),
        ],
        [
            p("Notes from video", cell_left),
            p("", cell),
            p("", cell),
        ],
    ]
    col_w = [width * 0.44, width * 0.28, width * 0.28]
    table = Table(data, colWidths=col_w, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_GREEN),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("MINHEIGHT", (0, 2), (-1, 2), 48),
            ]
        )
    )
    return table


def callout_box(label: str, text: str, st: dict[str, ParagraphStyle], width: float) -> Table:
    inner = Table(
        [
            [Paragraph(f"<b>{esc(label)}</b> {esc(text)}", st["callout"])],
        ],
        colWidths=[width - 16],
    )
    outer = Table([[inner]], colWidths=[width])
    outer.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 1, GREEN),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return outer


def week_schedule_table(
    rows: list[dict[str, str]],
    st: dict[str, ParagraphStyle],
    width: float,
) -> Table:
    header = [
        p("Day(s)", st["table_head"]),
        p("Drill", st["table_head"]),
        p("Sets x Reps", st["table_head"]),
        p("Focus", st["table_head"]),
    ]
    data: list[list] = [header]
    for row in rows:
        data.append(
            [
                p(row.get("days", ""), st["table_cell"]),
                p(row.get("drill", ""), st["table_cell"]),
                p(row.get("sets_reps", ""), st["table_cell"]),
                p(row.get("focus", ""), st["table_cell"]),
            ]
        )
    col_widths = [width * 0.14, width * 0.38, width * 0.16, width * 0.32]
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, LIGHT_GREEN),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def add_section(story: list, title: str, st: dict[str, ParagraphStyle], width: float) -> None:
    story.append(section_bar(title, st, width))
    story.append(Spacer(1, 6))


def ready_for_more_box(st: dict[str, ParagraphStyle], width: float) -> Table:
    line1 = (
        "Have Coach Broc check your Week 3 swing with your free swing analysis"
    )
    line2 = (
        "Want a plan built just for you? The 12-Week Program. Use code STARTER25 for $25 off."
    )
    program_url = "https://www.lcbtraining.com/program"
    inner = Table(
        [
            [Paragraph("Ready for More?", st["cta_title"])],
            [Paragraph(esc(line1), st["cta_url"])],
            [Paragraph(esc(line2), st["cta_url"])],
            [
                Paragraph(
                    f'<link href="{esc(program_url)}" color="#52B788">{esc(program_url)}</link>',
                    st["cta_url"],
                )
            ],
        ],
        colWidths=[width - 24],
    )
    inner.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    outer = Table([[inner]], colWidths=[width])
    outer.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("BOX", (0, 0), (-1, -1), 1.5, GREEN),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    return outer


def append_whats_next(story: list, st: dict[str, ParagraphStyle], width: float) -> None:
    story.append(Spacer(1, 0.1 * inch))
    story.append(ready_for_more_box(st, width))


def build_plan_pdf(plan: dict, meta: dict[str, str], st: dict[str, ParagraphStyle]) -> bytes:
    slug = plan.get("resource_slug") or plan.get("slug")
    plan_url = f"{PLAN_PAGE_BASE}/{slug}"
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.65 * inch,
        title=plan.get("title", "Fix-It Plan"),
        author="LCB Training",
    )
    width = doc.width
    story: list = []

    # Cover
    story.append(Spacer(1, 0.5 * inch))
    story.append(get_logo_or_fallback(ROOT, target_w=2.4 * inch, target_h=1.0 * inch))
    story.append(Spacer(1, 0.35 * inch))
    story.append(p(plan.get("title", ""), st["cover_title"]))
    story.append(Spacer(1, 0.1 * inch))
    story.append(
        HRFlowable(width="36%", thickness=2, color=LIGHT_GREEN, hAlign="CENTER", spaceBefore=4, spaceAfter=4)
    )
    story.append(Spacer(1, 0.06 * inch))
    story.append(p(plan.get("subtitle", "3-Week Fix-It Plan"), st["cover_sub"]))
    story.append(Spacer(1, 0.22 * inch))
    story.append(p("What this plan fixes", st["cover_fixes_label"]))
    cover_fixes = plan.get("cover_fixes") or plan.get("problem", "")[:120]
    story.append(p(cover_fixes, st["cover_tagline"]))
    story.append(Spacer(1, 0.18 * inch))
    story.append(p(COVER_SCHEDULE, st["cover_meta"]))
    story.append(Spacer(1, 0.2 * inch))
    story.append(p("Prepared by Coach Broc - LCB Training", st["cover_meta"]))
    story.append(PageBreak())

    # The Problem
    add_section(story, "The Problem", st, width)
    story.extend(body_paragraphs(plan.get("problem", ""), st))
    story.append(Spacer(1, 0.1 * inch))

    # The Fix
    add_section(story, "The Fix", st, width)
    story.extend(body_paragraphs(plan.get("fix", ""), st))
    story.append(Spacer(1, 0.1 * inch))

    # What Fixed Looks Like
    add_section(story, "What Fixed Looks Like", st, width)
    story.extend(_BAA.bullet_block(plan.get("fixedLooksLike", []), st["bullet"]))
    story.append(Spacer(1, 0.1 * inch))

    # The Drills
    add_section(story, "The Drills", st, width)
    story.append(plan_page_cta(plan_url, st, width))
    story.append(Spacer(1, 0.12 * inch))
    for drill in sorted(plan.get("drills", []), key=lambda d: int(d.get("order", 0))):
        story.append(drill_card(drill, st, width))
        story.append(Spacer(1, 0.08 * inch))

    story.append(PageBreak())

    # Baseline Test
    add_section(story, "Baseline Test", st, width)
    story.extend(body_paragraphs(plan.get("baselineTest", ""), st))
    story.append(Spacer(1, 0.1 * inch))
    story.append(baseline_tracker_table(st, width))
    story.append(Spacer(1, 0.14 * inch))

    week_meta = plan.get("weekMeta") or {}
    week_rows = plan.get("weekRows") or {}
    for week_num in (1, 2, 3):
        label = WEEK_LABELS[week_num]
        meta_w = week_meta.get(week_num, {})
        goal = meta_w.get("goal", "")
        checkpoint = meta_w.get("checkpoint", "")
        upgrade = meta_w.get("upgrade", "")
        rows = week_rows.get(week_num, [])

        add_section(story, label, st, width)
        if goal:
            story.append(callout_box("Goal:", goal, st, width))
            story.append(Spacer(1, 0.08 * inch))
        if rows:
            story.append(week_schedule_table(rows, st, width))
            story.append(Spacer(1, 0.08 * inch))
        if upgrade:
            story.append(callout_box("Upgrade:", upgrade, st, width))
            story.append(Spacer(1, 0.06 * inch))
        if checkpoint:
            story.append(callout_box("Checkpoint:", checkpoint, st, width))
        story.append(Spacer(1, 0.12 * inch))

    append_whats_next(story, st, width)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    return buffer.getvalue()


def _find_page_with_text(pdf_path: Path, needle: str) -> int | None:
    try:
        import fitz  # type: ignore[import-untyped]
    except ImportError:
        return None
    doc = fitz.open(str(pdf_path))
    try:
        for i in range(len(doc)):
            if needle in doc[i].get_text():
                return i + 1
    finally:
        doc.close()
    return None


def _render_pdf_page_png(pdf_path: Path, page_num: int, out_path: Path, zoom: float = 2.0) -> bool:
    try:
        import fitz  # type: ignore[import-untyped]
    except ImportError:
        return False
    doc = fitz.open(str(pdf_path))
    try:
        if page_num < 1 or page_num > len(doc):
            return False
        page = doc[page_num - 1]
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        pix.save(str(out_path))
        return True
    finally:
        doc.close()


def write_preview_pngs(pdf_paths: dict[str, Path]) -> list[Path]:
    written: list[Path] = []
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

    if STARTER_PDF.is_file():
        p1 = PREVIEW_DIR / "starter_back_arm_page1.png"
        if _render_pdf_page_png(STARTER_PDF, 1, p1):
            written.append(p1)
        week_page = _find_page_with_text(STARTER_PDF, "Day A: Back") or 4
        pw = PREVIEW_DIR / "starter_back_arm_workout_page.png"
        if _render_pdf_page_png(STARTER_PDF, week_page, pw):
            written.append(pw)

    for key, pdf_path in pdf_paths.items():
        if not pdf_path.is_file():
            continue
        cover = PREVIEW_DIR / f"{key}_page1.png"
        if _render_pdf_page_png(pdf_path, 1, cover):
            written.append(cover)
        week_page = _find_page_with_text(pdf_path, "Week 1: FEEL IT") or 3
        week_png = PREVIEW_DIR / f"{key}_week1.png"
        if _render_pdf_page_png(pdf_path, week_page, week_png):
            written.append(week_png)

    return written


def main() -> int:
    if not CONTENT_PATH.is_file():
        print(f"Missing {CONTENT_PATH}", file=sys.stderr)
        return 1

    content_hash = sha256_file(CONTENT_PATH)
    text = CONTENT_PATH.read_text(encoding="utf-8")
    data = parse_markdown(text)
    apply_composed_weeks_to_plans(data["plans"])
    write_generated_ts(content_hash, data)
    write_week_verify_json(data["plans"])
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    st = styles()
    built: dict[str, Path] = {}
    for plan in data["plans"]:
        filename = plan.get("pdf_filename")
        if not filename:
            print(f"Plan missing pdf_filename: {plan.get('slug')}", file=sys.stderr)
            return 1
        pdf_bytes = build_plan_pdf(plan, data["meta"], st)
        out_path = OUTPUT_DIR / filename
        out_path.write_bytes(pdf_bytes)
        print(f"Wrote {out_path}")
        slug = plan.get("resource_slug") or plan.get("slug") or filename
        built[str(slug).replace("fixit-", "fixit_")] = out_path

    print(f"Wrote {GENERATED_TS}")

    previews = write_preview_pngs(
        {
            "fixit_stay_closed": OUTPUT_DIR / "LCB_FixIt_Stay_Closed.pdf",
            "fixit_hit_the_brakes": OUTPUT_DIR / "LCB_FixIt_Hit_the_Brakes.pdf",
        }
    )
    for path in previews:
        print(f"Preview {path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
