#!/usr/bin/env python3

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "social-graphics-pdf")

PAGE_W, PAGE_H = letter
MARGIN = 36
HEADER_H = 34
HEADER_GAP = 32
FOOTER_H = 38
FOOTER_GAP = 22
INNER_W = PAGE_W - MARGIN * 2

PHONE_W = 255
PHONE_H = 450
TEXT_COL_W = 420

NAVY = colors.HexColor("#0A1628")
NAVY_DEEP = colors.HexColor("#050B16")
NAVY_MID = colors.HexColor("#0F1D34")
GREEN = colors.HexColor("#52B788")
GREEN_BRIGHT = colors.HexColor("#22C55E")
GREEN_SOFT = colors.HexColor("#9DF3BD")
BORDER = colors.HexColor("#18243A")
BORDER_SOFT = colors.HexColor("#2B3650")
CARD = colors.HexColor("#0B1324")
TEXT = colors.HexColor("#F4F4F5")
MUTED = colors.HexColor("#A1A1AA")
ZINC_300 = colors.HexColor("#D4D4D8")

PILLAR_COLORS = [GREEN_BRIGHT, GREEN, GREEN_SOFT]

def register_fonts():
    for path in (
        "/System/Library/Fonts/Supplemental/Impact.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ):
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont("Display", path))
                return "Display"
            except Exception:
                continue
    return "Helvetica-Bold"


DISPLAY = register_fonts()
BODY = "Helvetica"
BODY_BOLD = "Helvetica-Bold"


def layout_zones():
    header_bottom = PAGE_H - MARGIN - HEADER_H - HEADER_GAP
    footer_top = MARGIN + FOOTER_H + FOOTER_GAP + 8
    usable = header_bottom - footer_top
    phone_top = min(
        footer_top + (usable + PHONE_H) / 2,
        header_bottom - 6,
    )
    return header_bottom, footer_top, phone_top


def wrap_lines(text, font_name, font_size, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        if pdfmetrics.stringWidth(test, font_name, font_size) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_page_background(c):
    c.setFillColor(NAVY_DEEP)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(colors.Color(0.32, 0.72, 0.53, alpha=0.12))
    c.circle(PAGE_W - 40, PAGE_H - 70, 120, fill=1, stroke=0)
    c.setFillColor(colors.Color(0.13, 0.77, 0.37, alpha=0.07))
    c.circle(55, MARGIN + 120, 95, fill=1, stroke=0)


def draw_page_header(c, label):
    top = PAGE_H - MARGIN
    c.setFillColor(NAVY)
    c.roundRect(MARGIN, top - HEADER_H, INNER_W, HEADER_H, 8, fill=1, stroke=0)
    c.setFillColor(GREEN_BRIGHT)
    c.setFont(DISPLAY, 14)
    c.drawString(MARGIN + 14, top - 23, "LCB TRAINING")
    c.setFillColor(GREEN_SOFT)
    c.setFont(BODY_BOLD, 8)
    label_text = label.upper()
    if pdfmetrics.stringWidth(label_text, BODY_BOLD, 8) > INNER_W * 0.45:
        c.setFont(BODY_BOLD, 7)
    c.drawRightString(PAGE_W - MARGIN - 14, top - 21, label_text)


def draw_footer_banner(c, cta_text, url):
    bar_bottom = MARGIN + 6
    c.setStrokeColor(BORDER_SOFT)
    c.setLineWidth(0.75)
    c.line(MARGIN, bar_bottom + FOOTER_H + 10, PAGE_W - MARGIN, bar_bottom + FOOTER_H + 10)
    c.setFillColor(GREEN)
    c.roundRect(MARGIN, bar_bottom, INNER_W, FOOTER_H, 8, fill=1, stroke=0)
    c.setFillColor(NAVY_DEEP)
    c.setFont(DISPLAY, 13)
    c.drawString(MARGIN + 16, bar_bottom + 13, cta_text.upper())
    c.setFont(BODY_BOLD, 9)
    c.drawRightString(PAGE_W - MARGIN - 16, bar_bottom + 14, url)


def measure_headline_height(max_width, lines):
    total = 0
    for text, _color, size in lines:
        wrapped = wrap_lines(text.upper(), DISPLAY, size, max_width)
        total += len(wrapped) * (size + 3) + 8
    return total


def draw_big_headline(c, x, y, max_width, lines):
    current_y = y
    for text, color, size in lines:
        c.setFont(DISPLAY, size)
        c.setFillColor(color)
        for line in wrap_lines(text.upper(), DISPLAY, size, max_width):
            c.drawString(x, current_y, line)
            current_y -= size + 3
        current_y -= 8
    return current_y


def draw_big_headline_centered(c, cx, y, max_width, lines):
    current_y = y
    for text, color, size in lines:
        c.setFont(DISPLAY, size)
        c.setFillColor(color)
        for line in wrap_lines(text.upper(), DISPLAY, size, max_width):
            line_w = pdfmetrics.stringWidth(line, DISPLAY, size)
            c.drawString(cx - line_w / 2, current_y, line)
            current_y -= size + 3
        current_y -= 8
    return current_y


def measure_pillar_block(pillars, font_size=17, line_step=24):
    pad_top = 16
    pad_bottom = 16
    content = len(pillars) * line_step
    return pad_top + content + pad_bottom


def draw_pillar_block(c, x, y, max_width, pillars, centered=False):
    font_size = 17
    line_step = 24
    pad_top = 16
    pad_bottom = 16
    cx = x + max_width / 2

    c.setStrokeColor(GREEN)
    c.setLineWidth(2.5)
    c.line(x, y, x + max_width, y)

    current_y = y - pad_top
    for index, pillar in enumerate(pillars):
        c.setFillColor(PILLAR_COLORS[index % len(PILLAR_COLORS)])
        c.setFont(DISPLAY, font_size)
        label = pillar.upper()
        if centered:
            line_w = pdfmetrics.stringWidth(label, DISPLAY, font_size)
            c.drawString(cx - line_w / 2, current_y - font_size + 4, label)
        else:
            c.drawString(x, current_y - font_size + 4, label)
        current_y -= line_step

    bottom_line_y = current_y - pad_bottom + 8
    c.setStrokeColor(GREEN_BRIGHT)
    c.setLineWidth(2)
    c.line(x, bottom_line_y, x + max_width, bottom_line_y)
    return bottom_line_y


INTRO_TOP_GAP = 18


def draw_intro(c, x, y, max_width, text, centered=False):
    current_y = y - INTRO_TOP_GAP
    cx = x + max_width / 2
    c.setFont(BODY, 11)
    c.setFillColor(ZINC_300)
    for line in wrap_lines(text, BODY, 11, max_width):
        if centered:
            line_w = pdfmetrics.stringWidth(line, BODY, 11)
            c.drawString(cx - line_w / 2, current_y, line)
        else:
            c.drawString(x, current_y, line)
        current_y -= 14
    return current_y


def draw_dm_cta(c, x, y, text, centered=False, block_width=None):
    gap_above = 20
    pill_h = 28
    pad_x = 12
    font_size = 13
    label = text.upper()
    c.setFont(DISPLAY, font_size)
    pill_w = pdfmetrics.stringWidth(label, DISPLAY, font_size) + pad_x * 2
    pill_top = y - gap_above
    pill_bottom = pill_top - pill_h
    pill_x = x
    if centered and block_width:
        pill_x = x + (block_width - pill_w) / 2

    c.setFillColor(NAVY_MID)
    c.roundRect(pill_x, pill_bottom, pill_w, pill_h, 6, fill=1, stroke=0)
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.5)
    c.roundRect(pill_x, pill_bottom, pill_w, pill_h, 6, fill=0, stroke=1)

    ascent = pdfmetrics.getAscent(DISPLAY) * font_size / 1000.0
    descent = pdfmetrics.getDescent(DISPLAY) * font_size / 1000.0
    text_y = pill_bottom + (pill_h - ascent - descent) / 2 + descent
    c.setFillColor(GREEN_BRIGHT)
    c.drawString(pill_x + pad_x, text_y, label)
    return pill_bottom - 8


def draw_phone_shell(c, x, top_y, w, h):
    bottom = top_y - h
    c.setFillColor(colors.black)
    c.setStrokeColor(colors.HexColor("#444444"))
    c.setLineWidth(4)
    c.roundRect(x, bottom, w, h, 26, fill=1, stroke=1)
    c.setFillColor(NAVY_DEEP)
    c.roundRect(x + 7, bottom + 7, w - 14, h - 14, 20, fill=1, stroke=0)
    c.setFillColor(colors.black)
    c.roundRect(x + (w - 58) / 2, top_y - 16, 58, 9, 4, fill=1, stroke=0)
    return x + 14, top_y - 32, bottom + 12


def draw_phone_status(c, x, y, w):
    c.setFillColor(MUTED)
    c.setFont(BODY_BOLD, 6.5)
    c.drawString(x + 4, y, "9:41")
    c.drawRightString(x + w - 4, y, "5G")


def draw_phone_header(c, x, y, w, screen_title):
    c.setFillColor(NAVY_MID)
    c.roundRect(x, y - 18, w, 20, 6, fill=1, stroke=0)
    c.setFillColor(TEXT)
    c.setFont(BODY_BOLD, 7.5)
    c.drawString(x + 8, y - 4, "LCB")
    lcb_w = c.stringWidth("LCB", BODY_BOLD, 7.5)
    c.setFillColor(GREEN_BRIGHT)
    c.drawString(x + 8 + lcb_w + 4, y - 4, "Training")
    c.setFillColor(GREEN_SOFT)
    c.setFont(BODY_BOLD, 7)
    c.drawRightString(x + w - 28, y - 4, screen_title)
    c.setFillColor(GREEN_BRIGHT)
    c.circle(x + w - 10, y - 6, 4, fill=1, stroke=0)
    c.setFillColor(NAVY_DEEP)
    c.setFont(BODY_BOLD, 5)
    c.drawCentredString(x + w - 10, y - 7.5, "1")


def draw_phone_nav(c, x, bottom_y, w, active_index=0):
    nav_h = 28
    c.setFillColor(NAVY)
    c.rect(x, bottom_y, w, nav_h, fill=1, stroke=0)
    c.setStrokeColor(BORDER)
    c.line(x, bottom_y + nav_h, x + w, bottom_y + nav_h)
    tabs = ["Home", "Playbook", "Train", "Resources", "Account"]
    slot = w / len(tabs)
    for i, label in enumerate(tabs):
        cx = x + slot * i + slot / 2
        active = i == active_index
        c.setFillColor(GREEN_BRIGHT if active else MUTED)
        c.circle(cx, bottom_y + nav_h - 10, 2.5, fill=1, stroke=0)
        c.setFont(BODY_BOLD if active else BODY, 5.5)
        c.drawCentredString(cx, bottom_y + 4, label)


def draw_alert_banner(c, x, y, w, text):
    h = 17
    bottom = y - h
    c.setFillColor(colors.Color(0.13, 0.77, 0.37, alpha=0.22))
    c.setStrokeColor(GREEN_BRIGHT)
    c.roundRect(x, bottom, w, h, 5, fill=1, stroke=1)
    c.setFillColor(GREEN_SOFT)
    c.setFont(BODY_BOLD, 6.5)
    c.drawString(x + 8, bottom + 5, text)
    return y - h


def compact_card_height(button=False, progress=False):
    if button:
        return 56
    if progress:
        return 38
    return 30


def draw_compact_card(c, x, y, w, title, subtitle, accent=False, button=None, badge=None, progress=False, progress_pct=0.5):
    h = compact_card_height(button=bool(button), progress=progress)
    bottom = y - h
    if accent:
        c.setFillColor(colors.Color(0.13, 0.77, 0.37, alpha=0.12))
        c.setStrokeColor(GREEN_BRIGHT)
    else:
        c.setFillColor(CARD)
        c.setStrokeColor(BORDER_SOFT)
    c.setLineWidth(0.75)
    c.roundRect(x, bottom, w, h, 7, fill=1, stroke=1)

    c.setFillColor(TEXT)
    c.setFont(BODY_BOLD, 7)
    c.drawString(x + 7, y - 12, title)
    if badge:
        c.setFillColor(GREEN)
        c.setFont(BODY_BOLD, 5.5)
        c.drawRightString(x + w - 7, y - 11, badge)

    c.setFillColor(MUTED)
    c.setFont(BODY, 6)
    sub_y = y - 23 if button else y - 22
    c.drawString(x + 7, sub_y, subtitle)

    if button:
        btn_h = 14
        c.setFillColor(GREEN_BRIGHT)
        c.roundRect(x + 7, bottom + 7, w - 14, btn_h, 6, fill=1, stroke=0)
        c.setFillColor(NAVY_DEEP)
        c.setFont(BODY_BOLD, 6)
        c.drawCentredString(x + w / 2, bottom + 10, button)
    elif progress:
        bar_y = bottom + 9
        c.setFillColor(NAVY)
        c.roundRect(x + 7, bar_y, w - 14, 3, 1.5, fill=1, stroke=0)
        c.setFillColor(GREEN)
        c.roundRect(x + 7, bar_y, (w - 14) * progress_pct, 3, 1.5, fill=1, stroke=0)

    return y - h


def draw_phone(c, x, top_y, screen_fn, screen_title="Dashboard", nav_active=0):
    header_bottom, footer_top, _ = layout_zones()
    if top_y > header_bottom - 4:
        top_y = header_bottom - 4
    if top_y - PHONE_H < footer_top:
        top_y = footer_top + PHONE_H
    inner_x, header_y, nav_bottom = draw_phone_shell(c, x, top_y, PHONE_W, PHONE_H)
    inner_w = PHONE_W - 28
    draw_phone_nav(c, inner_x, nav_bottom, inner_w, nav_active)
    draw_phone_status(c, inner_x, header_y + 2, inner_w)
    draw_phone_header(c, inner_x, header_y - 20, inner_w, screen_title)
    screen_top = header_y - 48
    screen_bottom = nav_bottom + 30
    screen_fn(c, inner_x, screen_top, inner_w, screen_bottom)


def screen_dashboard(c, x, top_y, w, bottom_y):
    gap = 8
    y = top_y - 4
    y = draw_alert_banner(c, x, y, w, "New coach response ready!")
    y -= gap

    features = [
        {"title": "Coaching Submissions", "subtitle": "Swing video + mindset support",
         "accent": True, "button": "Submit Now"},
        {"title": "Playbook Progress", "subtitle": "Ch 2: The Physical Game",
         "badge": "1/4", "progress": True, "progress_pct": 0.25},
        {"title": "Monthly Goals", "subtitle": "2 of 3 goals on track",
         "progress": True, "progress_pct": 0.66},
        {"title": "Drill Library", "subtitle": "Hitting, fielding, mindset videos", "badge": "Train"},
        {"title": "Workout Programs", "subtitle": "Programs for ages 8-18", "badge": "Resources"},
        {"title": "Remote Session", "subtitle": "Live 60 min with Coach Broc",
         "accent": True, "button": "Book $60", "badge": "1-on-1"},
    ]

    for feat in features:
        card_h = compact_card_height(
            button=bool(feat.get("button")),
            progress=feat.get("progress", False),
        )
        if y - card_h < bottom_y:
            break
        y = draw_compact_card(
            c, x, y, w,
            feat["title"], feat["subtitle"],
            accent=feat.get("accent", False),
            button=feat.get("button"),
            badge=feat.get("badge"),
            progress=feat.get("progress", False),
            progress_pct=feat.get("progress_pct", 0.5),
        )
        y -= gap


def draw_promo_page(
    c,
    header_label,
    headline_lines,
    pillars,
    intro,
    phone_fn,
    screen_title,
    cta,
    url,
    nav_active=0,
    dm_cta=None,
):
    draw_page_background(c)
    draw_page_header(c, header_label)

    header_bottom, footer_top, phone_top = layout_zones()
    gap = 16
    phone_x = MARGIN
    copy_x = MARGIN + PHONE_W + gap
    copy_w = PAGE_W - copy_x - MARGIN

    headline_h = measure_headline_height(copy_w, headline_lines)
    pillar_h = measure_pillar_block(pillars) + 10
    intro_h = INTRO_TOP_GAP + len(wrap_lines(intro, BODY, 11, copy_w)) * 14
    dm_h = 54 if dm_cta else 0
    copy_h = headline_h + pillar_h + intro_h + dm_h
    phone_bottom = phone_top - PHONE_H
    content_bottom = footer_top + 10
    content_top = header_bottom - 10
    phone_mid = phone_bottom + PHONE_H / 2
    zone_mid = content_bottom + (content_top - content_bottom) / 2
    align_mid = (phone_mid + zone_mid) / 2
    copy_start = align_mid + copy_h / 2 - 18

    y = draw_big_headline(c, copy_x, copy_start, copy_w, headline_lines)
    y = draw_pillar_block(c, copy_x, y, copy_w, pillars)
    y = draw_intro(c, copy_x, y, copy_w, intro)
    if dm_cta:
        draw_dm_cta(c, copy_x, y, dm_cta)

    draw_phone(c, phone_x, phone_top, phone_fn, screen_title, nav_active)
    draw_footer_banner(c, cta, url)


def draw_text_only_page(
    c,
    header_label,
    headline_lines,
    pillars,
    intro,
    cta,
    url,
    dm_cta=None,
):
    draw_page_background(c)
    draw_page_header(c, header_label)

    header_bottom, footer_top, _ = layout_zones()
    copy_w = min(TEXT_COL_W, INNER_W - 20)
    copy_x = (PAGE_W - copy_w) / 2
    cx = PAGE_W / 2

    headline_h = measure_headline_height(copy_w, headline_lines)
    pillar_h = measure_pillar_block(pillars) + 10
    intro_h = INTRO_TOP_GAP + len(wrap_lines(intro, BODY, 11, copy_w)) * 14
    dm_h = 54 if dm_cta else 0
    copy_h = headline_h + pillar_h + intro_h + dm_h

    content_bottom = footer_top + 12
    content_top = header_bottom - 12
    copy_start = content_bottom + (content_top - content_bottom + copy_h) / 2

    y = draw_big_headline_centered(c, cx, copy_start, copy_w, headline_lines)
    y = draw_pillar_block(c, copy_x, y, copy_w, pillars, centered=True)
    y = draw_intro(c, copy_x, y, copy_w, intro, centered=True)
    if dm_cta:
        draw_dm_cta(c, copy_x, y, dm_cta, centered=True, block_width=copy_w)

    draw_footer_banner(c, cta, url)


def graphic_01(c):
    draw_promo_page(
        c, "App Overview",
        [("Become the", TEXT, 44), ("Player they", TEXT, 44), ("Remember.", GREEN_BRIGHT, 54)],
        ["Train smarter", "Think tougher", "Own your development"],
        "Your complete player development platform. Coaching, playbook, drills, workouts, and live sessions with Coach Broc.",
        screen_dashboard, "Dashboard",
        "Start your development", "www.lcbtraining.com",
        nav_active=0,
    )


def graphic_02(c):
    draw_text_only_page(
        c, "Swing Analysis",
        [("Submit your", TEXT, 46), ("Swing.", GREEN_BRIGHT, 56), ("Get coach", TEXT, 44), ("Feedback.", GREEN, 50)],
        ["Upload from your phone", "Response in 48 hours", "Start today"],
        "Upload your swing video and get personal written or video feedback from Coach Broc in your profile.",
        "Submit my swing", "www.lcbtraining.com",
        dm_cta="DM SWING",
    )


def graphic_03(c):
    draw_text_only_page(
        c, "The Next Level Playbook",
        [("Play at the", TEXT, 50), ("Next", GREEN_BRIGHT, 58), ("Level.", GREEN, 62)],
        ["4 interactive chapters", "Drill library included", "Workout programs included"],
        "Everything Coach Broc knows about getting to the next level. Mental game, physical training, preparation, and life lessons. Lifetime access.",
        "Unlock the playbook", "www.lcbtraining.com",
        dm_cta="DM PLAYBOOK for more",
    )


def graphic_04(c):
    draw_text_only_page(
        c, "Remote Training",
        [("Train live", TEXT, 48), ("With coach", TEXT, 48), ("Broc.", GREEN_BRIGHT, 60)],
        ["60-minute live session", "Real-time feedback", "Clear action plan"],
        "Book a remote Google Meet session for swing, fielding, or mental game feedback. Limited spots weekly.",
        "Book a remote session", "www.lcbtraining.com/remote",
        dm_cta="DM REMOTE for more info",
    )


def graphic_05(c):
    draw_page_background(c)
    draw_page_header(c, "Get Started")

    header_bottom, footer_top, _ = layout_zones()
    cx = PAGE_W / 2
    max_w = INNER_W - 40
    tagline_zone = footer_top + FOOTER_H + FOOTER_GAP + 52

    y = header_bottom - 18

    c.setFillColor(GREEN_SOFT)
    c.setFont(BODY_BOLD, 11)
    c.drawCentredString(cx, y, "THE LCB TRAINING APP IS LIVE")
    y -= 44

    y = draw_big_headline_centered(
        c, cx, y, max_w,
        [("Ready to take your", TEXT, 34), ("Development", TEXT, 36), ("Seriously?", GREEN_BRIGHT, 42)],
    )

    y -= 16
    c.setFillColor(GREEN_BRIGHT)
    c.setFont(DISPLAY, 34)
    c.drawCentredString(cx, y, "VISIT LCBTRAINING.COM")
    y -= 36
    c.setFont(DISPLAY, 22)
    c.setFillColor(GREEN_SOFT)
    c.drawCentredString(cx, y, "TO GET STARTED")

    y -= 24
    c.setStrokeColor(GREEN)
    c.setLineWidth(2)
    c.line(cx - 70, y, cx - 18, y)
    c.line(cx + 18, y, cx + 70, y)
    c.setFillColor(MUTED)
    c.setFont(BODY_BOLD, 10)
    c.drawCentredString(cx, y - 4, "OR")
    y -= 24

    c.setFillColor(GREEN)
    c.setFont(DISPLAY, 20)
    c.drawCentredString(cx, y, "SUBMIT YOUR SWING")
    y -= 30

    c.setFillColor(ZINC_300)
    c.setFont(BODY, 11)
    for item in [
        "The Next Level Playbook",
        "Drill library and workouts",
        "Live remote sessions",
        "Monthly coaching memberships",
    ]:
        c.drawCentredString(cx, y, item)
        y -= 14

    c.setFillColor(GREEN)
    c.setFont(DISPLAY, 32)
    c.drawCentredString(cx, tagline_zone + 28, "WORK HARD.")
    c.setFillColor(GREEN_BRIGHT)
    c.drawCentredString(cx, tagline_zone - 6, "BE MEMORABLE.")

    draw_footer_banner(c, "Start your development", "www.lcbtraining.com")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for name, fn in [
        ("01-app-overview.pdf", graphic_01),
        ("02-free-swing-analysis.pdf", graphic_02),
        ("03-next-level-playbook.pdf", graphic_03),
        ("04-remote-training.pdf", graphic_04),
        ("05-get-started-cta.pdf", graphic_05),
    ]:
        path = os.path.join(OUTPUT_DIR, name)
        pdf = canvas.Canvas(path, pagesize=letter)
        fn(pdf)
        pdf.showPage()
        pdf.save()
        print(f"Created {path}")
    print(f"\nAll graphics saved to:\n{OUTPUT_DIR}")


if __name__ == "__main__":
    main()
