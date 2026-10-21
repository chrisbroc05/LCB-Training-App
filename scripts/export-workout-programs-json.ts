import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { WORKOUT_PROGRAMS } from "../lib/workout-program-data.generated";

const outDir = path.join(process.cwd(), "tmp");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "workout-programs.json");
writeFileSync(outPath, JSON.stringify(WORKOUT_PROGRAMS, null, 2), "utf8");
console.log(`Wrote ${outPath}`);
