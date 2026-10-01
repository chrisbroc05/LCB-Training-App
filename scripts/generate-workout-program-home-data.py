#!/usr/bin/env python3
"""Generate lib/workout-program-home-data.ts from the LCB Home Strength Workouts spec."""

from __future__ import annotations

import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = os.path.join(ROOT, ".tmp-home-strength-spec.txt")
OUT = os.path.join(ROOT, "lib", "workout-program-home-data.ts")

HOME_STRENGTH_SAFETY_NOTE = (
    "Clear some space and wear shoes. Stair work only on dry stairs with a rail, "
    "and only from the bottom step. Land soft on every jump. Stop any exercise that "
    "hurts (a burn is fine, pain is not). Ages 12-15: have an adult home for weights "
    "and stair work."
)

WARMUP = [
    ("Jog in place", "1", "60 sec"),
    ("Leg swings, front to back and side to side", "1", "10 each direction"),
    ("Walking lunge with overhead reach", "1", "6 each leg"),
    ("Arm circles, small to big", "1", "10 each direction"),
    ("Inchworm", "1", "5 reps"),
    ("Pogo hops", "1", "15 reps"),
]

COOLDOWN = [
    ("Half-kneeling hip flexor stretch (each side)", "30 sec"),
    ("Seated hamstring stretch (each side)", "30 sec"),
    ("Figure-4 glute stretch (each side)", "30 sec"),
    ("Cross-body shoulder stretch (each side)", "30 sec"),
    ("Doorway chest stretch", "30 sec"),
    ("Child's pose", "30 sec"),
]


def parse_glossary(spec_text: str) -> dict[str, str]:
    glossary: dict[str, str] = {}
    in_glossary = False
    for line in spec_text.splitlines():
        if line.strip() == "### Form cue glossary":
            in_glossary = True
            continue
        if in_glossary:
            if line.startswith("---"):
                break
            if line.startswith("- "):
                match = re.match(r"([^:]+): (.+)$", line[2:])
                if match:
                    glossary[match.group(1).strip()] = match.group(2).strip()
    return glossary


def parse_alt(name: str) -> tuple[str, str | None]:
    if " / alt: " in name:
        primary, alt = name.split(" / alt: ", 1)
        return primary.strip(), alt.strip()
    return name.strip(), None


def ts_string(value: str) -> str:
    return json.dumps(value)


def ex_obj(
    name: str,
    reps: str,
    *,
    sets: str | None = None,
    rest: str = "-",
    alt_reps: str | None = None,
) -> dict:
    primary, alt_name = parse_alt(name)
    obj: dict = {"name": primary, "repsOrTime": reps, "rest": rest}
    if sets is not None:
        obj["sets"] = sets
    if alt_name:
        obj["alternativeName"] = alt_name
    if alt_reps:
        obj["alternativeRepsOrTime"] = alt_reps
    return obj


def render_exercise(obj: dict, indent: str = "          ") -> str:
    lines = [f'{indent}{{']
    lines.append(f'{indent}  name: {ts_string(obj["name"])},')
    if "sets" in obj:
        lines.append(f'{indent}  sets: {ts_string(obj["sets"])},')
    lines.append(f'{indent}  repsOrTime: {ts_string(obj["repsOrTime"])},')
    lines.append(f'{indent}  rest: {ts_string(obj["rest"])},')
    if "alternativeName" in obj:
        lines.append(f'{indent}  alternativeName: {ts_string(obj["alternativeName"])},')
    if "alternativeRepsOrTime" in obj:
        lines.append(f'{indent}  alternativeRepsOrTime: {ts_string(obj["alternativeRepsOrTime"])},')
    lines.append(f'{indent}}},')
    return "\n".join(lines)


def render_section(section: dict) -> str:
    lines = [f'      {{']
    lines.append(f'        name: {ts_string(section["name"])},')
    if "rounds" in section:
        lines.append(f'        rounds: {section["rounds"]},')
    if "rest" in section:
        lines.append(f'        rest: {ts_string(section["rest"])},')
    lines.append(f'        exercises: [')
    for ex in section["exercises"]:
        lines.append(render_exercise(ex, "          "))
    lines.append(f'        ],')
    lines.append(f'      }},')
    return "\n".join(lines)


def sa(name: str, sets: str, reps: str, rest: str) -> dict:
    return ex_obj(name, reps, sets=sets, rest=rest)


def cex(name: str, reps: str, alt_reps: str | None = None) -> dict:
    return ex_obj(name, reps, alt_reps=alt_reps)


def ss(name: str, sets: str, reps: str, rest: str, alt_reps: str | None = None) -> dict:
    return ex_obj(name, reps, sets=sets, rest=rest, alt_reps=alt_reps)


def fin(name: str, sets: str, reps: str, rest: str) -> dict:
    return ex_obj(name, reps, sets=sets, rest=rest)


def pc(name: str, sets: str, reps: str) -> dict:
    return ex_obj(name, reps, sets=sets, rest="-")


def pow_ex(name: str, sets: str, reps: str, rest: str) -> dict:
    return ex_obj(name, reps, sets=sets, rest=rest)


def wu_section() -> dict:
    return {
        "name": "Warm-Up",
        "exercises": [ex_obj(n, r, sets=s) for n, s, r in WARMUP],
    }


def cd_section() -> dict:
    return {
        "name": "Cooldown",
        "exercises": [ex_obj(n, t) for n, t in COOLDOWN],
    }


def circuit(rounds: int, rest: str, exercises: list[dict]) -> dict:
    return {"name": "Circuit", "rounds": rounds, "rest": rest, "exercises": exercises}


def strength_section(exercises: list[dict]) -> dict:
    return {"name": "Strength (straight sets)", "exercises": exercises}


def sa_section(exercises: list[dict]) -> dict:
    return {"name": "Speed and Agility", "exercises": exercises}


def power_section(exercises: list[dict]) -> dict:
    return {"name": "Power", "exercises": exercises}


def pilates_section(exercises: list[dict]) -> dict:
    return {"name": "Pilates Core", "exercises": exercises}


def finisher_section(exercises: list[dict]) -> dict:
    return {"name": "Finisher", "exercises": exercises}


def template(
    variant: str,
    age_group: str,
    phase: str,
    workout_id: str,
    title: str,
    sections: list[dict],
) -> dict:
    return {
        "variant": variant,
        "ageGroup": age_group,
        "phase": phase,
        "workoutId": workout_id,
        "title": title,
        "sections": sections,
    }


# --- BODYWEIGHT 12-15 ---

BW_12_15 = [
    # Phase 1
    template("bodyweight", "12-15", "foundation", "A", "Lower Body and Power", [
        sa_section([
            sa("Pogo hops", "2", "15", "30 sec"),
            sa("Skater jumps", "2", "5 each side", "30 sec"),
            sa("Line hops", "2", "10 sec", "30 sec"),
        ]),
        circuit(3, "60 sec rest between rounds", [
            cex("Bodyweight squat", "15"),
            cex("Reverse lunge", "8 each leg"),
            cex("Glute bridge", "15"),
            cex("Stair step-up", "10 each leg"),
            cex("Plank", "30 sec"),
        ]),
        power_section([
            pow_ex("Stair drop to vertical jump", "3", "4", "60 sec"),
            pow_ex("Broad jump", "3", "4", "60 sec"),
        ]),
        finisher_section([fin("Stair runs", "1", "5 trips up", "walk down")]),
        pilates_section([
            pc("Dead bug", "2", "8 each side"),
            pc("Single-leg stretch", "2", "10"),
        ]),
    ]),
    template("bodyweight", "12-15", "foundation", "B", "Upper Body and Rotation", [
        sa_section([
            sa("Quick feet", "3", "10 sec", "30 sec"),
            sa("Hurdle hops (forward and back)", "2", "8", "30 sec"),
        ]),
        circuit(3, "60 sec rest", [
            cex("Push-up", "8-10"),
            cex("Pull-up negatives / alt: Backpack row", "3", "12"),
            cex("Rotational lunge", "6 each side"),
            cex("Side plank", "20 sec each side"),
            cex("Y-T-W raises", "6 each letter"),
        ]),
        pilates_section([
            pc("Pilates push-up", "2", "5"),
            pc("Swimming", "2", "20 sec"),
            pc("The hundred (knees bent)", "1", "50 count"),
        ]),
        finisher_section([fin("Bear crawl", "2", "20 feet", "-")]),
    ]),
    # Phase 2
    template("bodyweight", "12-15", "build", "A", "Lower Body and Power", [
        sa_section([
            sa("Pogo hops", "3", "20", "30 sec"),
            sa("Single-leg hops", "2", "5 each leg", "45 sec"),
            sa("Skater jumps", "3", "6 each side", "30 sec"),
        ]),
        circuit(3, "45 sec rest", [
            cex("Jump squat", "10"),
            cex("Walking lunges", "10 each leg"),
            cex("Single-leg glute bridge", "10 each leg"),
            cex("Stair step-up with knee drive", "10 each leg"),
            cex("Plank shoulder taps", "20"),
        ]),
        power_section([
            pow_ex("Stair drop to broad jump", "3", "4", "60 sec"),
            pow_ex("Lateral hurdle hops", "3", "6", "45 sec"),
        ]),
        finisher_section([fin("Stair skips", "2", "5 trips up", "walk down, 60 sec between sets")]),
        pilates_section([
            pc("Single-leg stretch", "2", "12"),
            pc("Criss-cross", "2", "10 each side"),
        ]),
    ]),
    template("bodyweight", "12-15", "build", "B", "Upper Body and Rotation", [
        sa_section([
            sa("Lateral shuffle", "3", "5 steps each way, 2 times", "30 sec"),
            sa("Hurdle hops (forward and back)", "3", "8", "30 sec"),
        ]),
        circuit(3, "45 sec rest", [
            cex("Decline push-up", "10-12"),
            cex("Pull-up / alt: Backpack row", "3-6", "15"),
            cex("Backpack woodchop", "8 each side"),
            cex("Side plank with hip dips", "10 each side"),
            cex("Y-T-W raises", "8 each letter"),
        ]),
        pilates_section([
            pc("Pilates push-up", "3", "6"),
            pc("Swimming", "3", "20 sec"),
            pc("Teaser prep", "2", "6"),
        ]),
        finisher_section([
            fin("Bear crawl", "2", "20 feet", "-"),
            fin("Crab walk", "2", "20 feet", "-"),
        ]),
    ]),
    # Phase 3
    template("bodyweight", "12-15", "compete", "A", "Lower Body and Power", [
        sa_section([
            sa("Pogo hops (as fast as possible)", "3", "20", "30 sec"),
            sa("Lateral single-leg hops", "3", "5 each leg", "45 sec"),
            sa("Hurdle hops (continuous, no pause)", "3", "5", "45 sec"),
        ]),
        circuit(4, "45 sec rest", [
            cex("Jump squat", "12"),
            cex("Bulgarian split squat", "8 each leg"),
            cex("Single-leg glute bridge", "12 each leg"),
            cex("Skater jumps", "8 each side"),
            cex("Plank", "45 sec"),
        ]),
        power_section([
            pow_ex("Stair drop to vertical jump (max height)", "3", "5", "60 sec"),
            pow_ex("Broad jump to sprint", "4", "1", "45 sec"),
        ]),
        finisher_section([fin("Stair sprints", "2", "6 trips up", "walk down, 90 sec between sets")]),
        pilates_section([
            pc("The hundred", "1", "100 count"),
            pc("Criss-cross", "2", "12 each side"),
        ]),
    ]),
    template("bodyweight", "12-15", "compete", "B", "Upper Body and Rotation", [
        sa_section([
            sa("Quick feet", "3", "15 sec", "30 sec"),
            sa("Lateral hurdle hops", "3", "8", "30 sec"),
        ]),
        circuit(4, "45 sec rest", [
            cex("Plyo push-up (knees allowed)", "6-8"),
            cex("Pull-up / alt: Backpack row", "max minus 1", "15"),
            cex("Rotational lunge", "8 each side"),
            cex("Side plank", "40 sec each side"),
            cex("Y-T-W raises", "10 each letter"),
        ]),
        pilates_section([
            pc("Pilates push-up", "3", "8"),
            pc("Swimming", "3", "30 sec"),
            pc("Teaser", "2", "6"),
        ]),
        finisher_section([fin("Burpee broad jump", "3", "5", "60 sec")]),
    ]),
]

# --- BODYWEIGHT 16-18 ---

BW_16_18 = [
    template("bodyweight", "16-18", "foundation", "A", "Lower Body and Power", [
        sa_section([
            sa("Pogo hops", "3", "20", "30 sec"),
            sa("Skater jumps", "3", "6 each side", "30 sec"),
            sa("Single-leg hops", "2", "5 each leg", "45 sec"),
        ]),
        circuit(3, "60 sec rest", [
            cex("Jump squat", "10"),
            cex("Bulgarian split squat", "8 each leg"),
            cex("Single-leg glute bridge", "10 each leg"),
            cex("Stair step-up with knee drive", "10 each leg"),
            cex("Plank", "45 sec"),
        ]),
        power_section([
            pow_ex("Stair drop to vertical jump", "3", "5", "60 sec"),
            pow_ex("Broad jump", "3", "5", "60 sec"),
        ]),
        finisher_section([fin("Stair runs", "2", "5 trips up", "walk down, 60 sec between sets")]),
        pilates_section([
            pc("Dead bug", "2", "10 each side"),
            pc("Criss-cross", "2", "10 each side"),
        ]),
    ]),
    template("bodyweight", "16-18", "foundation", "B", "Upper Body and Rotation", [
        sa_section([
            sa("Lateral shuffle", "3", "5 steps each way, 2 times", "30 sec"),
            sa("Hurdle hops (forward and back)", "3", "8", "30 sec"),
        ]),
        circuit(3, "60 sec rest", [
            cex("Push-up", "15"),
            cex("Pull-up / alt: Backpack row", "5-8", "15"),
            cex("Backpack woodchop", "8 each side"),
            cex("Side plank with hip dips", "10 each side"),
            cex("Y-T-W raises", "8 each letter"),
        ]),
        pilates_section([
            pc("Pilates push-up", "3", "6"),
            pc("Swimming", "3", "30 sec"),
            pc("Teaser prep", "2", "8"),
        ]),
        finisher_section([fin("Bear crawl", "3", "20 feet", "-")]),
    ]),
    template("bodyweight", "16-18", "build", "A", "Lower Body and Power", [
        sa_section([
            sa("Pogo hops", "3", "25", "30 sec"),
            sa("Lateral single-leg hops", "3", "5 each leg", "45 sec"),
            sa("Lateral hurdle hops", "3", "8", "30 sec"),
        ]),
        circuit(4, "45 sec rest", [
            cex("Single-leg squat to stair", "6 each leg"),
            cex("Walking lunges", "12 each leg"),
            cex("Single-leg glute bridge", "12 each leg"),
            cex("Skater jumps", "8 each side"),
            cex("Plank shoulder taps", "24"),
        ]),
        power_section([
            pow_ex("Stair drop to broad jump", "4", "4", "60 sec"),
            pow_ex("Nordic hamstring lowers", "3", "4", "90 sec"),
        ]),
        finisher_section([fin("Stair skips", "3", "5 trips up", "walk down, 60 sec between sets")]),
        pilates_section([
            pc("The hundred", "1", "100 count"),
            pc("Single-leg stretch", "2", "15"),
        ]),
    ]),
    template("bodyweight", "16-18", "build", "B", "Upper Body and Rotation", [
        sa_section([
            sa("Quick feet", "3", "15 sec", "30 sec"),
            sa("Hurdle hops (continuous)", "3", "6", "45 sec"),
        ]),
        circuit(4, "45 sec rest", [
            cex("Decline push-up", "15"),
            cex("Pull-up / alt: Backpack row", "6-10", "20"),
            cex("Rotational lunge", "8 each side"),
            cex("Side plank", "45 sec each side"),
            cex("Y-T-W raises", "10 each letter"),
        ]),
        pilates_section([
            pc("Plyo push-up", "3", "6"),
            pc("Swimming", "3", "30 sec"),
            pc("Teaser", "2", "6"),
        ]),
        finisher_section([
            fin("Bear crawl", "2", "30 feet", "-"),
            fin("Crab walk", "2", "30 feet", "-"),
        ]),
    ]),
    template("bodyweight", "16-18", "compete", "A", "Lower Body and Power", [
        sa_section([
            sa("Pogo hops (as fast as possible)", "3", "25", "30 sec"),
            sa("Single-leg hops", "3", "6 each leg", "45 sec"),
            sa("Hurdle hops (continuous)", "3", "8", "45 sec"),
        ]),
        circuit(4, "45 sec rest", [
            cex("Jump squat", "15"),
            cex("Bulgarian split squat", "10 each leg"),
            cex("Single-leg glute bridge", "15 each leg"),
            cex("Skater jumps (stick 1 second)", "10 each side"),
            cex("Plank", "60 sec"),
        ]),
        power_section([
            pow_ex("Stair drop to vertical jump (max height)", "4", "5", "60 sec"),
            pow_ex("Broad jump to sprint", "5", "1", "45 sec"),
            pow_ex("Nordic hamstring lowers", "3", "5", "90 sec"),
        ]),
        finisher_section([fin("Stair sprints", "3", "6 trips up", "walk down, 90 sec between sets")]),
        pilates_section([
            pc("The hundred", "1", "100 count"),
            pc("Criss-cross", "3", "12 each side"),
        ]),
    ]),
    template("bodyweight", "16-18", "compete", "B", "Upper Body and Rotation", [
        sa_section([
            sa("Lateral shuffle", "4", "5 steps each way, 2 times", "30 sec"),
            sa("Lateral hurdle hops", "3", "10", "30 sec"),
        ]),
        circuit(4, "45 sec rest", [
            cex("Plyo push-up", "8-10"),
            cex("Pull-up / alt: Backpack row", "max minus 1", "20"),
            cex("Backpack woodchop", "10 each side"),
            cex("Side plank with hip dips", "15 each side"),
            cex("Y-T-W raises", "10 each letter"),
        ]),
        pilates_section([
            pc("Pilates push-up", "3", "10"),
            pc("Swimming", "3", "40 sec"),
            pc("Teaser", "3", "6"),
        ]),
        finisher_section([fin("Burpee broad jump", "4", "5", "60 sec")]),
    ]),
]

# --- HOME WEIGHTS 12-15 ---

HW_12_15 = [
    template("home_weights", "12-15", "foundation", "A", "Lower Body and Power", [
        sa_section([
            sa("Pogo hops", "2", "15", "30 sec"),
            sa("Skater jumps", "2", "5 each side", "30 sec"),
        ]),
        strength_section([
            ss("Goblet squat", "3", "10", "75 sec"),
            ss("Dumbbell RDL", "3", "10", "75 sec"),
            ss("Weighted reverse lunge", "2", "8 each leg", "60 sec"),
            ss("Glute bridge", "2", "15", "45 sec"),
        ]),
        power_section([pow_ex("Broad jump", "3", "4", "60 sec")]),
        pilates_section([
            pc("Dead bug", "2", "8 each side"),
            pc("Single-leg stretch", "2", "10"),
        ]),
    ]),
    template("home_weights", "12-15", "foundation", "B", "Upper Body and Rotation", [
        sa_section([sa("Hurdle hops (forward and back)", "2", "8", "30 sec")]),
        strength_section([
            ss("Single-arm row", "3", "10 each arm", "60 sec"),
            ss("Floor press", "3", "10", "60 sec"),
            ss("Half-kneeling single-arm press", "2", "8 each arm", "60 sec"),
            ss("Halo", "2", "5 each direction", "45 sec"),
            ss("Suitcase carry", "2", "30 feet each side", "45 sec"),
        ]),
        pilates_section([
            pc("Pilates push-up", "2", "5"),
            pc("Swimming", "2", "20 sec"),
        ]),
    ]),
    template("home_weights", "12-15", "build", "A", "Lower Body and Power", [
        sa_section([
            sa("Pogo hops", "3", "20", "30 sec"),
            sa("Single-leg hops", "2", "5 each leg", "45 sec"),
        ]),
        circuit(3, "60 sec rest", [
            cex("Goblet squat", "12"),
            cex("Kettlebell swing", "12"),
            cex("Weighted step-up", "8 each leg"),
            cex("Single-leg RDL (holding the weight)", "8 each leg"),
            cex("Plank", "40 sec"),
        ]),
        power_section([pow_ex("Stair drop to vertical jump", "3", "4", "60 sec")]),
        pilates_section([
            pc("Criss-cross", "2", "10 each side"),
            pc("The hundred (knees bent)", "1", "100 count"),
        ]),
    ]),
    template("home_weights", "12-15", "build", "B", "Upper Body and Rotation", [
        sa_section([sa("Lateral shuffle", "3", "5 steps each way, 2 times", "30 sec")]),
        circuit(3, "60 sec rest", [
            cex("Single-arm row", "12 each arm"),
            cex("Push-up", "12"),
            cex("Push press", "8 each arm (or both together)"),
            cex("Halo", "6 each direction"),
            cex("Side plank", "30 sec each side"),
            cex("Y-T-W raises", "8 each letter"),
        ]),
        pilates_section([
            pc("Pilates push-up", "3", "6"),
            pc("Teaser prep", "2", "6"),
        ]),
    ]),
    template("home_weights", "12-15", "compete", "A", "Lower Body and Power", [
        sa_section([
            sa("Pogo hops (as fast as possible)", "3", "20", "30 sec"),
            sa("Hurdle hops (continuous)", "3", "5", "45 sec"),
        ]),
        circuit(4, "60 sec rest", [
            cex("Kettlebell swing (explosive)", "15"),
            cex("Goblet squat", "12"),
            cex("Dumbbell jump squat (light)", "6"),
            cex("Weighted reverse lunge", "8 each leg"),
            cex("Plank", "45 sec"),
        ]),
        power_section([pow_ex("Broad jump to sprint", "4", "1", "45 sec")]),
        finisher_section([fin("Stair sprints", "2", "5 trips up", "walk down, 90 sec between sets")]),
        pilates_section([pc("Criss-cross", "2", "12 each side")]),
    ]),
    template("home_weights", "12-15", "compete", "B", "Upper Body and Rotation", [
        sa_section([sa("Quick feet", "3", "15 sec", "30 sec")]),
        circuit(4, "60 sec rest", [
            cex("Renegade row", "6 each arm"),
            cex("Floor press", "12"),
            cex("Push press", "8 each arm"),
            cex("Backpack woodchop (use the dumbbell)", "8 each side"),
            cex("Suitcase carry", "40 feet each side"),
        ]),
        pilates_section([
            pc("Swimming", "3", "30 sec"),
            pc("Teaser", "2", "6"),
        ]),
        finisher_section([fin("Burpee broad jump", "3", "5", "60 sec")]),
    ]),
]

# --- HOME WEIGHTS 16-18 ---

HW_16_18 = [
    template("home_weights", "16-18", "foundation", "A", "Lower Body and Power", [
        sa_section([
            sa("Pogo hops", "3", "20", "30 sec"),
            sa("Skater jumps", "3", "6 each side", "30 sec"),
        ]),
        strength_section([
            ss("Goblet squat", "4", "10", "75 sec"),
            ss("Dumbbell RDL", "4", "10", "75 sec"),
            ss("Bulgarian split squat (holding the weight)", "3", "8 each leg", "75 sec"),
            ss("Single-leg glute bridge", "3", "10 each leg", "45 sec"),
        ]),
        power_section([pow_ex("Stair drop to vertical jump", "3", "5", "60 sec")]),
        pilates_section([
            pc("Dead bug", "2", "10 each side"),
            pc("Criss-cross", "2", "10 each side"),
        ]),
    ]),
    template("home_weights", "16-18", "foundation", "B", "Upper Body and Rotation", [
        sa_section([sa("Hurdle hops (forward and back)", "3", "8", "30 sec")]),
        strength_section([
            ss("Single-arm row", "4", "10 each arm", "60 sec"),
            ss("Floor press", "4", "10", "60 sec"),
            ss("Pull-up / alt: Renegade row", "3", "5-8", "75 sec", "6 each arm"),
            ss("Half-kneeling single-arm press", "3", "8 each arm", "60 sec"),
            ss("Halo", "2", "6 each direction", "45 sec"),
        ]),
        pilates_section([
            pc("Pilates push-up", "3", "6"),
            pc("Swimming", "3", "30 sec"),
        ]),
    ]),
    template("home_weights", "16-18", "build", "A", "Lower Body and Power", [
        sa_section([
            sa("Pogo hops", "3", "25", "30 sec"),
            sa("Lateral single-leg hops", "3", "5 each leg", "45 sec"),
        ]),
        circuit(4, "60 sec rest", [
            cex("Goblet squat", "12"),
            cex("Kettlebell swing", "15"),
            cex("Bulgarian split squat (holding the weight)", "8 each leg"),
            cex("Single-leg RDL (holding the weight)", "8 each leg"),
            cex("Plank shoulder taps", "24"),
        ]),
        power_section([
            pow_ex("Stair drop to broad jump", "4", "4", "60 sec"),
            pow_ex("Nordic hamstring lowers", "3", "4", "90 sec"),
        ]),
        pilates_section([pc("The hundred", "1", "100 count")]),
    ]),
    template("home_weights", "16-18", "build", "B", "Upper Body and Rotation", [
        sa_section([sa("Lateral shuffle", "3", "5 steps each way, 2 times", "30 sec")]),
        circuit(4, "60 sec rest", [
            cex("Pull-up / alt: Single-arm row", "6-10", "12 each arm"),
            cex("Floor press", "12"),
            cex("Push press", "8 each arm"),
            cex("Renegade row", "6 each arm"),
            cex("Halo", "8 each direction"),
            cex("Y-T-W raises", "10 each letter"),
        ]),
        pilates_section([
            pc("Plyo push-up", "3", "6"),
            pc("Teaser", "2", "6"),
        ]),
    ]),
    template("home_weights", "16-18", "compete", "A", "Lower Body and Power", [
        sa_section([
            sa("Single-leg hops", "3", "6 each leg", "45 sec"),
            sa("Hurdle hops (continuous)", "3", "8", "45 sec"),
        ]),
        circuit(4, "60 sec rest", [
            cex("Kettlebell swing (explosive)", "20"),
            cex("Dumbbell jump squat (light)", "8"),
            cex("Bulgarian split squat (holding the weight)", "10 each leg"),
            cex("Weighted step-up", "8 each leg"),
            cex("Plank", "60 sec"),
        ]),
        power_section([
            pow_ex("Broad jump to sprint", "5", "1", "45 sec"),
            pow_ex("Nordic hamstring lowers", "3", "5", "90 sec"),
        ]),
        finisher_section([fin("Stair sprints", "3", "6 trips up", "walk down, 90 sec between sets")]),
    ]),
    template("home_weights", "16-18", "compete", "B", "Upper Body and Rotation", [
        sa_section([sa("Quick feet", "3", "15 sec", "30 sec")]),
        circuit(4, "60 sec rest", [
            cex("Push press (explosive)", "8 each arm"),
            cex("Renegade row", "8 each arm"),
            cex("Plyo push-up", "8"),
            cex("Backpack woodchop (use the dumbbell)", "10 each side"),
            cex("Suitcase carry", "50 feet each side"),
        ]),
        pilates_section([
            pc("Swimming", "3", "40 sec"),
            pc("Teaser", "3", "6"),
        ]),
        finisher_section([fin("Burpee broad jump", "4", "5", "60 sec")]),
    ]),
]

ALL_TEMPLATES = BW_12_15 + BW_16_18 + HW_12_15 + HW_16_18


def render_ts(glossary: dict[str, str]) -> str:
    lines: list[str] = []
    lines.append('import type { WorkoutExercise, WorkoutId, WorkoutPhase, WorkoutSection } from "@/lib/workout-program-types";')
    lines.append('import type { StrengthVariant } from "@/lib/strength-variant-shared";')
    lines.append("")
    lines.append("export type HomeStrengthTemplate = {")
    lines.append('  variant: StrengthVariant;')
    lines.append('  ageGroup: "12-15" | "16-18";')
    lines.append("  phase: WorkoutPhase;")
    lines.append("  workoutId: WorkoutId;")
    lines.append("  title: string;")
    lines.append("  sections: WorkoutSection[];")
    lines.append("};")
    lines.append("")
    lines.append(f"export const HOME_STRENGTH_SAFETY_NOTE = {ts_string(HOME_STRENGTH_SAFETY_NOTE)};")
    lines.append("")
    lines.append("export const HOME_STRENGTH_GLOSSARY: Record<string, string> = {")
    for key, value in glossary.items():
        lines.append(f"  {ts_string(key)}: {ts_string(value)},")
    lines.append("};")
    lines.append("")
    lines.append("function wu(): WorkoutSection {")
    lines.append('  return {')
    lines.append('    name: "Warm-Up",')
    lines.append("    exercises: [")
    for name, sets, reps in WARMUP:
        lines.append(f"      sa({ts_string(name)}, {ts_string(sets)}, {ts_string(reps)}, {ts_string('-')}),")
    lines.append("    ],")
    lines.append("  };")
    lines.append("}")
    lines.append("")
    lines.append("function cd(): WorkoutSection {")
    lines.append('  return {')
    lines.append('    name: "Cooldown",')
    lines.append("    exercises: [")
    for name, time in COOLDOWN:
        lines.append(f"      {{ name: {ts_string(name)}, repsOrTime: {ts_string(time)}, rest: {ts_string('-')} }},")
    lines.append("    ],")
    lines.append("  };")
    lines.append("}")
    lines.append("")
    lines.append("function sa(name: string, sets: string, repsOrTime: string, rest: string): WorkoutExercise {")
    lines.append("  const exercise: WorkoutExercise = { name, sets, repsOrTime, rest };")
    lines.append("  return exercise;")
    lines.append("}")
    lines.append("")
    lines.append("function cex(name: string, repsOrTime: string, alternativeRepsOrTime?: string): WorkoutExercise {")
    lines.append('  const altMatch = name.match(/^(.+?) \\/ alt: (.+)$/);')
    lines.append("  if (altMatch) {")
    lines.append("    const exercise: WorkoutExercise = {")
    lines.append("      name: altMatch[1],")
    lines.append("      repsOrTime,")
    lines.append('      rest: "-",')
    lines.append("      alternativeName: altMatch[2],")
    lines.append("    };")
    lines.append("    if (alternativeRepsOrTime) {")
    lines.append("      exercise.alternativeRepsOrTime = alternativeRepsOrTime;")
    lines.append("    }")
    lines.append("    return exercise;")
    lines.append("  }")
    lines.append('  return { name, repsOrTime, rest: "-" };')
    lines.append("}")
    lines.append("")
    lines.append(
        "function ss(name: string, sets: string, repsOrTime: string, rest: string, alternativeRepsOrTime?: string): WorkoutExercise {"
    )
    lines.append('  const altMatch = name.match(/^(.+?) \\/ alt: (.+)$/);')
    lines.append("  if (altMatch) {")
    lines.append("    const exercise: WorkoutExercise = {")
    lines.append("      name: altMatch[1],")
    lines.append("      sets,")
    lines.append("      repsOrTime,")
    lines.append("      rest,")
    lines.append("      alternativeName: altMatch[2],")
    lines.append("    };")
    lines.append("    if (alternativeRepsOrTime) {")
    lines.append("      exercise.alternativeRepsOrTime = alternativeRepsOrTime;")
    lines.append("    }")
    lines.append("    return exercise;")
    lines.append("  }")
    lines.append("  return { name, sets, repsOrTime, rest };")
    lines.append("}")
    lines.append("")
    lines.append("function fin(name: string, sets: string, repsOrTime: string, rest: string): WorkoutExercise {")
    lines.append("  return { name, sets, repsOrTime, rest };")
    lines.append("}")
    lines.append("")
    lines.append("export const HOME_STRENGTH_TEMPLATES: HomeStrengthTemplate[] = [")

    for tmpl in ALL_TEMPLATES:
        lines.append("  {")
        lines.append(f'    variant: {ts_string(tmpl["variant"])},')
        lines.append(f'    ageGroup: {ts_string(tmpl["ageGroup"])},')
        lines.append(f'    phase: {ts_string(tmpl["phase"])},')
        lines.append(f'    workoutId: {ts_string(tmpl["workoutId"])},')
        lines.append(f'    title: {ts_string(tmpl["title"])},')
        lines.append("    sections: [")
        lines.append("      wu(),")
        for section in tmpl["sections"]:
            lines.append(f'      {{')
            lines.append(f'        name: {ts_string(section["name"])},')
            if "rounds" in section:
                lines.append(f'        rounds: {section["rounds"]},')
            if "rest" in section and section["name"] == "Circuit":
                lines.append(f'        rest: {ts_string(section["rest"])},')
            lines.append("        exercises: [")
            for ex in section["exercises"]:
                if section["name"] == "Speed and Agility":
                    lines.append(
                        f"          sa({ts_string(ex['name'])}, {ts_string(ex['sets'])}, {ts_string(ex['repsOrTime'])}, {ts_string(ex['rest'])}),"
                    )
                elif section["name"] == "Circuit":
                    if "alternativeName" in ex:
                        alt_reps = ex.get("alternativeRepsOrTime")
                        if alt_reps:
                            lines.append(
                                f"          cex({ts_string(ex['name'] + ' / alt: ' + ex['alternativeName'])}, {ts_string(ex['repsOrTime'])}, {ts_string(alt_reps)}),"
                            )
                        else:
                            lines.append(
                                f"          cex({ts_string(ex['name'] + ' / alt: ' + ex['alternativeName'])}, {ts_string(ex['repsOrTime'])}),"
                            )
                    else:
                        lines.append(
                            f"          cex({ts_string(ex['name'])}, {ts_string(ex['repsOrTime'])}),"
                        )
                elif section["name"] == "Strength (straight sets)":
                    if "alternativeName" in ex:
                        alt_reps = ex.get("alternativeRepsOrTime")
                        alt_arg = f", {ts_string(alt_reps)}" if alt_reps else ""
                        lines.append(
                            f"          ss({ts_string(ex['name'] + ' / alt: ' + ex['alternativeName'])}, {ts_string(ex['sets'])}, {ts_string(ex['repsOrTime'])}, {ts_string(ex['rest'])}{alt_arg}),"
                        )
                    else:
                        lines.append(
                            f"          ss({ts_string(ex['name'])}, {ts_string(ex['sets'])}, {ts_string(ex['repsOrTime'])}, {ts_string(ex['rest'])}),"
                        )
                elif section["name"] == "Power":
                    lines.append(
                        f"          sa({ts_string(ex['name'])}, {ts_string(ex['sets'])}, {ts_string(ex['repsOrTime'])}, {ts_string(ex['rest'])}),"
                    )
                elif section["name"] == "Finisher":
                    lines.append(
                        f"          fin({ts_string(ex['name'])}, {ts_string(ex['sets'])}, {ts_string(ex['repsOrTime'])}, {ts_string(ex['rest'])}),"
                    )
                elif section["name"] == "Pilates Core":
                    lines.append(
                        f"          fin({ts_string(ex['name'])}, {ts_string(ex['sets'])}, {ts_string(ex['repsOrTime'])}, {ts_string(ex['rest'])}),"
                    )
            lines.append("        ],")
            lines.append("      },")
        lines.append("      cd(),")
        lines.append("    ],")
        lines.append("  },")

    lines.append("];")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    with open(SPEC, encoding="utf-8") as f:
        spec_text = f.read()
    glossary = parse_glossary(spec_text)
    ts = render_ts(glossary)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(ts)
    print(f"Wrote {OUT} ({len(ts.splitlines())} lines, {len(ALL_TEMPLATES)} templates, {len(glossary)} glossary entries)")


if __name__ == "__main__":
    main()
