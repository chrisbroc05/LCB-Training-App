import { runProgramPushCopySelfTests } from "../lib/program-push-copy";

try {
  const passed = runProgramPushCopySelfTests();
  console.log(`Program push copy self-tests passed (${passed} cases).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
