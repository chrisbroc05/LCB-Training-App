import { runProgramSendWindowSelfTests } from "../lib/program-schedule-windows";

try {
  const passed = runProgramSendWindowSelfTests();
  console.log(`Program send window self-tests passed (${passed} cases).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
