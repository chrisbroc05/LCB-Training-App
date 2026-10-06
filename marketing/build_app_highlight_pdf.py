#!/usr/bin/env python3

import glob
import os

from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(SCRIPT_DIR, "social-graphics-pdf")
OUTPUT_PDF = os.path.join(INPUT_DIR, "OUR-APP-highlight.pdf")

STORY_W = 1080
STORY_H = 1520


def main():
    png_paths = sorted(glob.glob(os.path.join(INPUT_DIR, "[0-9][0-9].png")))
    if len(png_paths) != 11:
        raise SystemExit(f"Expected 11 PNG slides, found {len(png_paths)} in {INPUT_DIR}")

    pdf = canvas.Canvas(OUTPUT_PDF, pagesize=(STORY_W, STORY_H))
    for png_path in png_paths:
        pdf.drawImage(ImageReader(png_path), 0, 0, width=STORY_W, height=STORY_H)
        pdf.showPage()
    pdf.save()
    print(f"Saved {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
