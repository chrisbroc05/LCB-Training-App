#!/usr/bin/env python3
"""Parse content/fix-it-plans.md, generate lib/fix-it-plans-data.generated.ts, and build PDFs."""

from __future__ import annotations

import hashlib
import json
import re
import sys
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from create_bio import GREEN, LIGHT_GREEN, NAVY, WHITE, get_logo_or_fallback  # noqa: E402

CONTENT_PATH = ROOT / "content" / "fix-it-plans.md"
GENERATED_TS = ROOT / "lib" / "fix-it-plans-data.generated.ts"
OUTPUT_DIR = ROOT / "private" / "resources" / "fix-it"
PLAN_PAGE_BASE = "https://lcbtraining.com/fix-it"


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


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
        elif section_key == "week1":
            current_plan["week1"] = body
        elif section_key == "week2":
            current_plan["week2"] = body
        elif section_key == "week3":
            current_plan["week3"] = body
        elif section_key == "whats_next":
            current_plan["whatsNext"] = body
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
            current_plan = {"slug": slug, "drills": [], "bonusVideos": [], "fixedLooksLike": []}
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
    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=WHITE,
            alignment=1,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            fontName="Helvetica",
            fontSize=12,
            leading=16,
            textColor=LIGHT_GREEN,
            alignment=1,
        ),
        "h1": ParagraphStyle(
            "h1",
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=NAVY,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=GREEN,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=NAVY,
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=NAVY,
            leftIndent=14,
            bulletIndent=6,
            spaceAfter=4,
        ),
    }


def build_plan_pdf(plan: dict, meta: dict[str, str], st: dict[str, ParagraphStyle]) -> bytes:
    slug = plan.get("resource_slug") or plan.get("slug")
    plan_url = f"{PLAN_PAGE_BASE}/{slug}"
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch,
        title=plan.get("title", "Fix-It Plan"),
        author="LCB Training",
    )
    story: list = []
    story.append(get_logo_or_fallback(ROOT, target_w=2.0 * inch, target_h=0.85 * inch))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(esc(plan.get("title", "")), st["h1"]))
    story.append(Spacer(1, 0.08 * inch))
    story.append(Paragraph(esc(plan.get("subtitle", "")), st["body"]))
    story.append(PageBreak())

    def add_section(title: str, body: str) -> None:
        if not body.strip():
            return
        story.append(Paragraph(esc(title), st["h1"]))
        for para in body.split("\n\n"):
            para = para.strip()
            if not para:
                continue
            story.append(Paragraph(esc(para).replace("\n", "<br/>"), st["body"]))

    add_section("The problem", plan.get("problem", ""))
    add_section("The fix", plan.get("fix", ""))
    story.append(Paragraph("What fixed looks like", st["h1"]))
    for item in plan.get("fixedLooksLike", []):
        story.append(Paragraph(f"&bull; {esc(item)}", st["bullet"]))

    story.append(Paragraph("Drills", st["h1"]))
    for drill in sorted(plan.get("drills", []), key=lambda d: int(d.get("order", 0))):
        name = drill.get("name", "")
        desc = drill.get("description", "")
        story.append(Paragraph(f"<b>{esc(str(name))}</b>", st["body"]))
        story.append(Paragraph(esc(desc), st["body"]))
        if drill.get("video_title"):
            story.append(
                Paragraph(
                    f"Watch the video on your plan page: {esc(plan_url)}",
                    st["body"],
                )
            )
        story.append(Spacer(1, 0.08 * inch))

    add_section("Baseline test", plan.get("baselineTest", ""))
    add_section("Week 1: FEEL IT", plan.get("week1", ""))
    add_section("Week 2: BUILD IT", plan.get("week2", ""))
    add_section("Week 3: COMPETE WITH IT", plan.get("week3", ""))
    add_section("What's next", plan.get("whatsNext", ""))
    story.append(Spacer(1, 0.12 * inch))
    story.append(Paragraph(esc(meta.get("schedule_note", "")), st["body"]))

    doc.build(story)
    return buffer.getvalue()


def main() -> int:
    if not CONTENT_PATH.is_file():
        print(f"Missing {CONTENT_PATH}", file=sys.stderr)
        return 1

    content_hash = sha256_file(CONTENT_PATH)
    text = CONTENT_PATH.read_text(encoding="utf-8")
    data = parse_markdown(text)
    write_generated_ts(content_hash, data)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    st = styles()
    for plan in data["plans"]:
        filename = plan.get("pdf_filename")
        if not filename:
            print(f"Plan missing pdf_filename: {plan.get('slug')}", file=sys.stderr)
            return 1
        pdf_bytes = build_plan_pdf(plan, data["meta"], st)
        out_path = OUTPUT_DIR / filename
        out_path.write_bytes(pdf_bytes)
        print(f"Wrote {out_path}")

    print(f"Wrote {GENERATED_TS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
