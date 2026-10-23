#!/usr/bin/env python3

from __future__ import annotations

import json
import sys
from pathlib import Path

from create_player_eval import PlayerEvaluation, build_player_eval_pdf


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: render_player_eval_json.py <input.json>")

    input_path = Path(sys.argv[1]).resolve()
    payload = json.loads(input_path.read_text(encoding="utf-8"))

    evaluation = PlayerEvaluation(
        first_name=str(payload["evaluation"]["first_name"]),
        last_name=str(payload["evaluation"]["last_name"]),
        team=str(payload["evaluation"]["team"]),
        eval_date=str(payload["evaluation"]["eval_date"]),
        strengths=[str(item) for item in payload["evaluation"]["strengths"]],
        areas_to_improve=[str(item) for item in payload["evaluation"]["areas_to_improve"]],
        recommended_drills=[str(item) for item in payload["evaluation"]["recommended_drills"]],
        closing_note=str(payload["evaluation"]["closing_note"]),
    )

    output_path = Path(payload["outputPath"]).resolve()
    platform_note_html = str(payload.get("platformNoteHtml") or "")
    project_root = Path(__file__).resolve().parent.parent

    build_player_eval_pdf(
        project_root,
        evaluation,
        output_path,
        platform_note_html=platform_note_html or None,
    )


if __name__ == "__main__":
    main()
