#!/usr/bin/env python3
"""Generate lib/workout-program-data.generated.ts from private/workouts PDFs."""

from __future__ import annotations

import json
import os
import re
import sys

from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "private", "workouts")
OUT_TS = os.path.join(ROOT, "lib", "workout-program-data.generated.ts")

PHASE_MAP = {1: "foundation", 2: "build", 3: "compete"}
WEEK_PHASE = {
    **{w: "foundation" for w in range(1, 5)},
    **{w: "build" for w in range(5, 9)},
    **{w: "compete" for w in range(9, 13)},
}

SECTION_NAMES = (
    "Warm-Up",
    "Strength Work",
    "Conditioning",
    "Cluster 1",
    "Cluster 2",
    "Cluster 3",
    "Power Work",
    "Speed Work",
    "Agility Work",
    "Main Work",
    "Skill Work",
)


def clean(text: str) -> str:
    return (
        text.replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u00a0", " ")
        .replace("\u2022", "-")
        .replace("&#8211;", "-")
        .replace("&#8212;", "-")
    )


def clean_value(value):
    if isinstance(value, str):
        return clean(value)
    if isinstance(value, list):
        return [clean_value(item) for item in value]
    if isinstance(value, dict):
        return {clean_value(key): clean_value(item) for key, item in value.items()}
    return value


def is_valid_exercise_name(name: str) -> bool:
    if not name or len(name) > 60:
        return False
    lower = name.lower()
    sentence_markers = (
        " are the ones ",
        " check in with ",
        " treat mobility like ",
        " your year-round ",
        " program complete",
    )
    return not any(marker in lower for marker in sentence_markers)


MOBILITY_SUBSECTIONS = (
    "Mobility Work",
    "Mobility Flow",
    "Mobility Warm-Up",
    "Cool-Down",
    "Performance Flow",
)


def parse_glossary(text: str) -> dict[str, str]:
    glossary: dict[str, str] = {}
    match = re.search(r"Exercise Glossary.*?\n(.*?)(?=\nWEEK 1\n)", text, re.S)
    if not match:
        return glossary

    entry_pattern = re.compile(r"^([^:]+):\s*(.*)$")
    current_name: str | None = None
    current_cue_parts: list[str] = []

    for raw_line in match.group(1).splitlines():
        line = raw_line.strip()
        if not line or line.startswith("Quick "):
            continue

        entry_match = entry_pattern.match(line)
        if entry_match and entry_match.group(1).strip():
            if current_name:
                glossary[current_name] = " ".join(current_cue_parts).strip()

            current_name = entry_match.group(1).strip()
            cue_start = entry_match.group(2).strip()
            current_cue_parts = [cue_start] if cue_start else []
            continue

        if current_name:
            current_cue_parts.append(line)

    if current_name:
        glossary[current_name] = " ".join(current_cue_parts).strip()

    return glossary


def parse_exercises_from_lines(lines: list[str]) -> list[dict]:
    exercises: list[dict] = []
    skip = {"Exercise", "Sets", "Reps / Time", "Rest", "Reps/Time"}
    idx = 0
    while idx < len(lines):
        line = lines[idx].strip()
        if (
            not line
            or line.startswith("Complete ")
            or line.startswith("Coach's Note")
            or line.startswith("Coach's")
            or line in skip
        ):
            if line.startswith("Coach's"):
                break
            idx += 1
            continue
        if line.startswith("Cluster ") or line.startswith("WEEK ") or line.startswith("WORKOUT "):
            break
        if line in SECTION_NAMES or line in MOBILITY_SUBSECTIONS:
            break

        if idx + 1 < len(lines):
            second = lines[idx + 1].strip()
            if second and second not in skip and not second.startswith("Complete "):
                if idx + 3 < len(lines):
                    first, sets, reps, rest = [lines[idx + offset].strip() for offset in range(4)]
                    if re.match(r"^\d+$", sets) and reps and is_valid_exercise_name(first):
                        exercises.append(
                            {
                                "name": clean(first),
                                "sets": sets,
                                "repsOrTime": reps,
                                "rest": rest or "-",
                            }
                        )
                        idx += 4
                        continue
                if not re.match(r"^\d+$", second) and is_valid_exercise_name(line):
                    exercises.append(
                        {
                            "name": clean(line),
                            "repsOrTime": second,
                            "rest": "-",
                        }
                    )
                    idx += 2
                    continue
        idx += 1
    return exercises


def parse_workout_block(workout_text: str) -> tuple[list[dict], str | None]:
    sections: list[dict] = []
    coach_note = None
    note_match = re.search(
        r"Coach's Note:\s*(.+?)(?=\nWEEK |\nWORKOUT |$)",
        workout_text,
        re.S,
    )
    if note_match:
        coach_note = " ".join(note_match.group(1).split())

    section_pattern = r"(" + "|".join(re.escape(name) for name in SECTION_NAMES) + r")\n"
    parts = re.split(section_pattern, workout_text)
    if len(parts) > 1:
        for index in range(1, len(parts), 2):
            section_name = parts[index].strip()
            section_body = parts[index + 1] if index + 1 < len(parts) else ""
            rounds = None
            rest = None
            if section_name.startswith("Cluster"):
                round_match = re.search(r"Complete (\d+) Rounds.*?Rest (\d+ sec)", section_body)
                if round_match:
                    rounds = int(round_match.group(1))
                    rest = round_match.group(2)
            exercises = parse_exercises_from_lines(section_body.splitlines())
            if exercises:
                section: dict = {"name": section_name, "exercises": exercises}
                if rounds is not None:
                    section["rounds"] = rounds
                if rest:
                    section["rest"] = rest
                sections.append(section)
    return sections, coach_note


def parse_strength_speed_phase(
    pdf_path: str,
    category: str,
    age_group: str,
    phase_num: int,
) -> dict:
    reader = PdfReader(pdf_path)
    text = clean("\n".join(page.extract_text() or "" for page in reader.pages))
    glossary = parse_glossary(text)
    weeks: dict[int, dict] = {}

    for week_match in re.finditer(r"WEEK (\d+)\n([A-Z ]+ PHASE)\n", text):
        week_number = int(week_match.group(1))
        start = week_match.end()
        next_week = re.search(r"\nWEEK \d+\n", text[start:])
        week_text = text[start : start + (next_week.start() if next_week else len(text))]
        workouts: dict[str, dict] = {}

        for workout_match in re.finditer(r"WORKOUT ([AB]) - ([^\n]+)\n", week_text):
            workout_id = workout_match.group(1)
            title = workout_match.group(2).strip()
            workout_start = workout_match.end()
            next_workout = re.search(r"\nWORKOUT [AB] -|\nWEEK \d+\n", week_text[workout_start:])
            workout_text = week_text[
                workout_start : workout_start + (next_workout.start() if next_workout else len(week_text))
            ]
            sections, coach_note = parse_workout_block(workout_text)
            workout = {"id": workout_id, "title": title, "sections": sections}
            if coach_note:
                workout["coachNote"] = coach_note
            workouts[workout_id] = workout

        weeks[week_number] = {
            "weekNumber": week_number,
            "phase": WEEK_PHASE[week_number],
            "workouts": workouts,
        }

    return {
        "category": category,
        "ageGroup": age_group,
        "phase": PHASE_MAP[phase_num],
        "glossary": glossary,
        "weeks": weeks,
    }


def parse_mobility_sections(flow_title: str, week_text: str) -> list[dict]:
    sections: list[dict] = []
    subsection_pattern = re.compile(
        r"\n(" + "|".join(re.escape(name) for name in MOBILITY_SUBSECTIONS) + r")\nExercise\n",
    )
    matches = list(subsection_pattern.finditer(week_text))

    if week_text.strip().startswith("Exercise"):
        first_end = matches[0].start() if matches else len(week_text)
        exercises = parse_exercises_from_lines(week_text[:first_end].splitlines())
        if exercises:
            sections.append({"name": flow_title, "exercises": exercises})

    for index, match in enumerate(matches):
        section_name = match.group(1).strip()
        section_start = match.end()
        section_end = matches[index + 1].start() if index + 1 < len(matches) else len(week_text)
        exercises = parse_exercises_from_lines(week_text[section_start:section_end].splitlines())
        if exercises:
            sections.append({"name": section_name, "exercises": exercises})

    if not sections:
        exercises = parse_exercises_from_lines(week_text.splitlines())
        if exercises:
            sections.append({"name": flow_title, "exercises": exercises})

    return sections


def parse_mobility(pdf_path: str, age_group: str) -> dict:
    reader = PdfReader(pdf_path)
    text = clean("\n".join(page.extract_text() or "" for page in reader.pages))
    glossary = parse_glossary(text)
    weeks: dict[int, dict] = {}

    for week_match in re.finditer(r"WEEK (\d+)\n([A-Z ]+ PHASE)\n([^\n]+)\n", text):
        week_number = int(week_match.group(1))
        flow_title = week_match.group(3).strip()
        start = week_match.end()
        next_week = re.search(r"\nWEEK \d+\n", text[start:])
        week_text = text[start : start + (next_week.start() if next_week else len(text))]
        coach_note = None
        note_match = re.search(r"Coach's Note:\s*(.+)", week_text, re.S)
        if note_match:
            coach_note = clean(" ".join(note_match.group(1).split()))
            week_text = week_text[: note_match.start()]

        sections = parse_mobility_sections(flow_title, week_text)
        workout = {
            "id": "A",
            "title": flow_title,
            "sections": sections,
        }
        if coach_note:
            workout["coachNote"] = coach_note
        weeks[week_number] = {
            "weekNumber": week_number,
            "phase": WEEK_PHASE[week_number],
            "workouts": {"A": workout},
        }

    return {"category": "mobility", "ageGroup": age_group, "glossary": glossary, "weeks": weeks}


def merge_programs(programs: list[dict]) -> list[dict]:
    merged: dict[tuple[str, str], dict] = {}
    phase_order = ["foundation", "build", "compete"]

    for program in programs:
        key = (program["category"], program["ageGroup"])
        if key not in merged:
            merged[key] = {
                "category": program["category"],
                "ageGroup": program["ageGroup"],
                "glossary": {},
                "phases": [],
                "weeks": [],
            }
        merged[key]["glossary"].update(program.get("glossary", {}))
        if "phase" in program and program["phase"] not in merged[key]["phases"]:
            merged[key]["phases"].append(program["phase"])
        for week_number, week_data in program.get("weeks", {}).items():
            existing = next(
                (week for week in merged[key]["weeks"] if week["weekNumber"] == week_number),
                None,
            )
            if existing:
                existing["workouts"].update(week_data["workouts"])
            else:
                merged[key]["weeks"].append(week_data)

    output = []
    for program in merged.values():
        program["phases"] = sorted(set(program["phases"]), key=phase_order.index)
        program["weeks"] = sorted(program["weeks"], key=lambda week: week["weekNumber"])
        output.append(program)
    return output


def validate_programs(programs: list[dict]) -> list[str]:
    issues: list[str] = []
    for program in programs:
        missing_weeks = [
            week
            for week in range(1, 13)
            if not any(entry["weekNumber"] == week for entry in program["weeks"])
        ]
        if missing_weeks:
            issues.append(
                f"{program['category']} {program['ageGroup']}: missing weeks {missing_weeks}"
            )
        for week in program["weeks"]:
            if program["category"] != "mobility":
                for workout_id in ("A", "B"):
                    if workout_id not in week["workouts"]:
                        issues.append(
                            f"{program['category']} {program['ageGroup']} week {week['weekNumber']}: missing workout {workout_id}"
                        )
            elif "A" not in week["workouts"]:
                issues.append(
                    f"mobility {program['ageGroup']} week {week['weekNumber']}: missing workout A"
                )

            for workout in week["workouts"].values():
                for section in workout.get("sections", []):
                    for exercise in section.get("exercises", []):
                        name = exercise.get("name", "")
                        if len(name) > 60:
                            issues.append(
                                f"{program['category']} {program['ageGroup']} week {week['weekNumber']}: exercise name longer than 60 chars"
                            )
                        elif not is_valid_exercise_name(name):
                            issues.append(
                                f"{program['category']} {program['ageGroup']} week {week['weekNumber']}: suspicious exercise name '{name}'"
                            )
    return issues


def main() -> int:
    programs: list[dict] = []
    for age_group in ("8-11", "12-15", "16-18"):
        for phase in (1, 2, 3):
            for category, prefix in (("strength", "Strength"), ("speed_agility", "Speed-Agility")):
                pdf_path = os.path.join(BASE, f"LCB_{prefix}_{age_group}_Phase{phase}.pdf")
                if os.path.exists(pdf_path):
                    programs.append(parse_strength_speed_phase(pdf_path, category, age_group, phase))
        mobility_path = os.path.join(BASE, f"LCB_Mobility_{age_group}.pdf")
        if os.path.exists(mobility_path):
            programs.append(parse_mobility(mobility_path, age_group))

    merged = clean_value(merge_programs(programs))
    issues = validate_programs(merged)
    if issues:
        for issue in issues:
            print(issue, file=sys.stderr)
        return 1

    content = (
        "// AUTO-GENERATED from private/workouts PDFs. Do not edit by hand.\n"
        "// Regenerate: python3 scripts/generate-workout-program-data.py\n\n"
        'import type { WorkoutProgram } from "./workout-program-types";\n\n'
        f"export const WORKOUT_PROGRAMS: WorkoutProgram[] = {json.dumps(merged, indent=2, ensure_ascii=True)};\n"
    )
    with open(OUT_TS, "w", encoding="ascii") as handle:
        handle.write(content)

    print(f"Generated {OUT_TS} ({len(merged)} programs)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
