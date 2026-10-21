"""Compose Fix-It plan week prose from weekN_row schedule data (single source of truth)."""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "content" / "fix-it-plans.md"
VERIFY_JSON = ROOT / "lib" / "fix-it-plans-week-verify.generated.json"


def compose_week_text(meta: dict[str, str], rows: list[dict[str, str]]) -> str:
    lines: list[str] = []
    goal = meta.get("goal", "").strip()
    if goal:
        lines.append(f"Goal: {goal}")
    for row in rows:
        days = row.get("days", "").strip()
        drill = row.get("drill", "").strip()
        sets_reps = row.get("sets_reps", "").strip()
        focus = row.get("focus", "").strip()
        if not days:
            continue
        segment = f"{days}: {drill}"
        if sets_reps:
            segment += f", {sets_reps}"
        if focus:
            segment += f" ({focus})"
        lines.append(segment)
    upgrade = meta.get("upgrade", "").strip()
    if upgrade:
        lines.append(f"Upgrade: {upgrade}")
    checkpoint = meta.get("checkpoint", "").strip()
    if checkpoint:
        lines.append(f"Checkpoint: {checkpoint}")
    return "\n".join(lines)


def week_text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def apply_composed_weeks_to_plans(plans: list[dict]) -> None:
    for plan in plans:
        week_meta = plan.get("weekMeta") or {}
        week_rows = plan.get("weekRows") or {}
        for week_num in (1, 2, 3):
            composed = compose_week_text(
                week_meta.get(week_num, {}),
                week_rows.get(week_num, []),
            )
            plan[f"week{week_num}"] = composed


def build_week_verify_payload(plans: list[dict]) -> dict[str, dict[str, str]]:
    out: dict[str, dict[str, str]] = {}
    for plan in plans:
        slug = plan.get("resource_slug") or plan.get("slug") or ""
        if not slug:
            continue
        out[slug] = {}
        for week_num in (1, 2, 3):
            text = plan.get(f"week{week_num}", "")
            out[slug][str(week_num)] = week_text_hash(text)
    return out


def write_week_verify_json(plans: list[dict]) -> None:
    payload = build_week_verify_payload(plans)
    VERIFY_JSON.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def verify_against_generated_ts(plans: list[dict], generated_ts_path: Path) -> list[str]:
    """Ensure week1/2/3 strings embedded in generated TS match row-derived text."""
    errors: list[str] = []
    if not generated_ts_path.is_file():
        return ["Missing generated TS file"]
    ts_text = generated_ts_path.read_text(encoding="utf-8")
    for plan in plans:
        slug = plan.get("resource_slug") or plan.get("slug") or ""
        for week_num in (1, 2, 3):
            field = f"week{week_num}"
            composed = plan.get(field, "")
            pattern = rf'"resourceSlug": "{re.escape(slug)}"[\s\S]*?"{field}": '
            match = re.search(pattern, ts_text)
            if not match:
                errors.append(f"{slug}: missing {field} in generated TS")
                continue
            rest = ts_text[match.end() :]
            ts_value_match = re.match(r'"((?:\\.|[^"\\])*)"', rest)
            if not ts_value_match:
                errors.append(f"{slug}: could not parse {field} in generated TS")
                continue
            ts_value = json.loads(f'"{ts_value_match.group(1)}"')
            if ts_value != composed:
                errors.append(
                    f"{slug} {field}: generated TS week text does not match weekN_row schedule "
                    "(run npm run build:fix-it-pdfs)"
                )
    return errors


def verify_against_verify_json(plans: list[dict]) -> list[str]:
    errors: list[str] = []
    if not VERIFY_JSON.is_file():
        return ["Missing lib/fix-it-plans-week-verify.generated.json - run npm run build:fix-it-pdfs"]
    expected = json.loads(VERIFY_JSON.read_text(encoding="utf-8"))
    actual = build_week_verify_payload(plans)
    for slug, weeks in expected.items():
        for week_num, digest in weeks.items():
            if actual.get(slug, {}).get(week_num) != digest:
                errors.append(
                    f"{slug} week {week_num}: week schedule digest mismatch "
                    "(run npm run build:fix-it-pdfs)"
                )
    for slug in actual:
        if slug not in expected:
            errors.append(f"{slug}: missing from week verify JSON")
    return errors


def _parse_plans_from_build_script() -> list[dict]:
    import importlib.util

    build_path = Path(__file__).resolve().parent / "build-fix-it-pdfs.py"
    spec = importlib.util.spec_from_file_location("build_fix_it_pdfs", build_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load build-fix-it-pdfs.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    text = CONTENT_PATH.read_text(encoding="utf-8")
    data = mod.parse_markdown(text)
    apply_composed_weeks_to_plans(data["plans"])
    return data["plans"]


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    plans = _parse_plans_from_build_script()
    if args and args[0] == "--verify":
        errors = verify_against_verify_json(plans)
        generated = ROOT / "lib" / "fix-it-plans-data.generated.ts"
        errors.extend(verify_against_generated_ts(plans, generated))
        if errors:
            for err in errors:
                print(err, file=sys.stderr)
            return 1
        print("fix-it week text verify: ok")
        return 0
    for plan in plans:
        slug = plan.get("resource_slug")
        for n in (1, 2, 3):
            print(f"--- {slug} week{n} ---")
            print(plan.get(f"week{n}", ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
