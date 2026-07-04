#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.pdfgen import canvas


NAVY = colors.HexColor("#0A1628")
LIGHT_CARD = colors.HexColor("#F2F2F2")
BORDER = colors.HexColor("#1A1A1A")
HANDLE_TEXT = colors.HexColor("#111111")
WHITE = colors.white


def find_logo_path(project_root: Path) -> Path | None:
    candidates = [
        project_root / "public" / "logo" / "lcb-training-logo.png",
        project_root / "lcb training logo.png",
        project_root.parent / "lcb training logo.png",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def main() -> None:
    project_root = Path(__file__).resolve().parent
    output_path = project_root / "public" / "LCB_Social_Template.pdf"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Square social format (1080x1080).
    page_size = (1080, 1080)
    pdf = canvas.Canvas(str(output_path), pagesize=page_size)
    pdf.setTitle("LCB Social Visual Template")
    pdf.setAuthor("LCB Training")

    page_w, page_h = page_size

    # Navy background.
    pdf.setFillColor(NAVY)
    pdf.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    # Main light card (styled like the second reference image).
    card_margin_x = 75
    card_margin_y = 105
    card_x = card_margin_x
    card_y = card_margin_y
    card_w = page_w - (card_margin_x * 2)
    card_h = page_h - (card_margin_y * 2)

    pdf.setFillColor(LIGHT_CARD)
    pdf.setStrokeColor(BORDER)
    pdf.setLineWidth(2)
    pdf.rect(card_x, card_y, card_w, card_h, fill=1, stroke=1)

    # Header row: avatar + name + handle.
    avatar_size = 118
    avatar_x = card_x + 105
    avatar_y = card_y + card_h - 165

    # Draw the logo avatar without circular outline.
    logo_path = find_logo_path(project_root)
    if logo_path is not None:
        inset = 4
        pdf.drawImage(
            str(logo_path),
            avatar_x - (avatar_size / 2) + inset,
            avatar_y - (avatar_size / 2) + inset,
            width=avatar_size - (inset * 2),
            height=avatar_size - (inset * 2),
            preserveAspectRatio=True,
            anchor="c",
            mask="auto",
        )
    else:
        pdf.setFillColor(NAVY)
        pdf.setFont("Helvetica-Bold", 24)
        pdf.drawCentredString(avatar_x, avatar_y - 9, "LCB")

    # Name text.
    handle_x = avatar_x + 85
    handle_y = avatar_y + 18
    pdf.setFillColor(HANDLE_TEXT)
    pdf.setFont("Helvetica-Bold", 54)
    pdf.drawString(handle_x, handle_y, "Coach Broc")

    # Handle below the name, smaller and gray.
    pdf.setFillColor(colors.HexColor("#7A7A7A"))
    pdf.setFont("Helvetica", 40)
    pdf.drawString(handle_x, handle_y - 56, "@lcbtraining")

    pdf.showPage()
    pdf.save()
    print(f"Created {output_path}")


if __name__ == "__main__":
    main()
