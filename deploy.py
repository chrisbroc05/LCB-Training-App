#!/usr/bin/env python3

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from collections import Counter


def load_local_env(path: str = ".env") -> None:
    if not os.path.exists(path):
        return

    with open(path, "r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key:
                os.environ.setdefault(key, value)


def run_command(command: list[str], description: str, capture_output: bool = False) -> str:
    print(f"-> {description}")
    result = subprocess.run(
        command,
        check=True,
        text=True,
        capture_output=capture_output,
    )
    return result.stdout.strip() if capture_output else ""


def build_commit_message() -> str:
    staged = run_command(
        ["git", "diff", "--cached", "--name-status"],
        "Analyzing staged changes",
        capture_output=True,
    )

    if not staged:
        raise RuntimeError("No staged changes found after git add .")

    lines = [line for line in staged.splitlines() if line.strip()]
    counters = Counter()
    files: list[str] = []

    for line in lines:
        parts = line.split("\t")
        if len(parts) < 2:
            continue

        status = parts[0]
        file_name = parts[-1]
        files.append(file_name)

        if status.startswith("A"):
            counters["added"] += 1
        elif status.startswith("M"):
            counters["updated"] += 1
        elif status.startswith("D"):
            counters["deleted"] += 1
        elif status.startswith("R"):
            counters["renamed"] += 1
        else:
            counters["changed"] += 1

    summary_parts = []
    for key in ("added", "updated", "deleted", "renamed", "changed"):
        if counters[key]:
            summary_parts.append(f"{counters[key]} {key}")

    headline = f"Update project files ({', '.join(summary_parts)})"
    preview = ", ".join(files[:6])
    if len(files) > 6:
        preview += ", ..."

    return f"{headline}\n\nFiles: {preview}"


def has_staged_changes() -> bool:
    staged = run_command(
        ["git", "diff", "--cached", "--name-status"],
        "Checking for staged changes",
        capture_output=True,
    )
    return bool(staged.strip())


def trigger_render_deploy() -> None:
    deploy_hook = os.getenv("RENDER_DEPLOY_HOOK")
    if not deploy_hook:
        raise RuntimeError("RENDER_DEPLOY_HOOK is not set.")

    print("-> Triggering Render deploy hook")
    request = urllib.request.Request(
        deploy_hook,
        method="POST",
        data=b"",
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8", errors="ignore")
            if response.status < 200 or response.status >= 300:
                raise RuntimeError(
                    f"Deploy hook returned status {response.status}: {body[:300]}"
                )

            if body:
                try:
                    payload = json.loads(body)
                    print(f"  Render response: {payload}")
                except json.JSONDecodeError:
                    print(f"  Render response: {body[:300]}")
    except urllib.error.URLError as error:
        raise RuntimeError(f"Failed to call Render deploy hook: {error}") from error


def main() -> int:
    try:
        load_local_env(".env")
        run_command(["git", "add", "."], "Running git add .")

        if has_staged_changes():
            commit_message = build_commit_message()
            print(f"-> Commit message summary:\n{commit_message}")
            run_command(["git", "commit", "-m", commit_message], "Committing changes")
        else:
            print("-> No staged changes found. Skipping commit and continuing to deploy.")

        run_command(["git", "push", "origin", "main"], "Pushing to origin main")

        trigger_render_deploy()
        print("Deployment workflow completed successfully.")
        return 0
    except subprocess.CalledProcessError as error:
        print(f"Command failed with exit code {error.returncode}: {' '.join(error.cmd)}")
        return error.returncode
    except Exception as error:
        print(f"{error}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
