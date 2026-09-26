import { runProgramScheduleSelfTests } from "../lib/program-schedule";

try {
  const passed = runProgramScheduleSelfTests();
  console.log(`Program schedule self-tests passed (${passed} cases).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
