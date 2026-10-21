import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SCAN_DIRS = ["app", "lib", "components", "scripts", "content"] as const;
const EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".md",
  ".css",
]);
const SKIP_NAMES = new Set([".DS_Store"]);

type Issue = { file: string; kind: "invalid_utf8" | "non_ascii"; detail: string };

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (SKIP_NAMES.has(name)) {
      continue;
    }
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (st.isFile()) {
      out.push(full);
    }
  }
}

function checkFile(absPath: string): Issue[] {
  const rel = relative(ROOT, absPath);
  const ext = absPath.includes(".") ? absPath.slice(absPath.lastIndexOf(".")) : "";
  if (!EXTENSIONS.has(ext)) {
    return [];
  }

  let raw: Buffer;
  try {
    raw = readFileSync(absPath);
  } catch {
    return [{ file: rel, kind: "invalid_utf8", detail: "could not read file" }];
  }

  let text: string;
  try {
    text = raw.toString("utf8");
  } catch {
    return [{ file: rel, kind: "invalid_utf8", detail: "invalid UTF-8" }];
  }

  if (raw.includes(0)) {
    return [{ file: rel, kind: "invalid_utf8", detail: "contains null bytes" }];
  }

  try {
    Buffer.from(text, "utf8").toString("utf8");
  } catch {
    return [{ file: rel, kind: "invalid_utf8", detail: "invalid UTF-8" }];
  }

  const decoded = new TextDecoder("utf-8", { fatal: true });
  try {
    decoded.decode(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return [{ file: rel, kind: "invalid_utf8", detail: msg }];
  }

  const nonAscii: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code > 127) {
      nonAscii.push(i);
    }
  }

  if (nonAscii.length > 0) {
    const first = nonAscii[0];
    const snippet = text.slice(Math.max(0, first - 20), first + 20).replace(/\n/g, "\\n");
    return [
      {
        file: rel,
        kind: "non_ascii",
        detail: `${nonAscii.length} non-ASCII character(s); first at index ${first} near: ${JSON.stringify(snippet)}`,
      },
    ];
  }

  return [];
}

function main() {
  const files: string[] = [];
  for (const dir of SCAN_DIRS) {
    const abs = join(ROOT, dir);
    try {
      walk(abs, files);
    } catch {
      // directory may not exist (e.g. components at repo root)
    }
  }

  const issues: Issue[] = [];
  for (const file of files) {
    issues.push(...checkFile(file));
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`${issue.file}: ${issue.kind} - ${issue.detail}`);
    }
    process.exit(1);
  }

  console.log(`check-ascii: ok (${files.length} files scanned)`);
}

main();
